import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const databaseName = 'cv-studio-pdf-references';
const sectionMatchers = [
  ['contact', /^(contacto|datos de contacto|contact|contact details)$/i],
  ['summary', /^(perfil( profesional)?|sobre m[ií]|resumen|professional summary|profile|about me|objective|objetivo)$/i],
  ['experience', /^(experiencia( laboral| profesional)?|trayectoria( profesional)?|work experience|professional experience|employment history|experience)$/i],
  ['education', /^(educaci[oó]n|formaci[oó]n( acad[eé]mica)?|estudios|education|academic background)$/i],
  ['skills', /^(habilidades|competencias|aptitudes|skills|technical skills|core competencies)$/i],
  ['certifications', /^(certificaciones|certificados|certifications|certificates|licenses)$/i],
  ['languages', /^(idiomas|languages)$/i],
  ['projects', /^(proyectos|projects|portfolio)$/i],
  ['references', /^(referencias|references)$/i],
  ['additional', /^(informaci[oó]n adicional|otros datos|additional information|interests|intereses)$/i],
];
const sectionLabels = { summary:'Perfil profesional', experience:'Experiencia', education:'Educación', skills:'Habilidades', certifications:'Certificaciones', languages:'Idiomas', projects:'Proyectos', references:'Referencias', additional:'Información adicional' };
const id = () => globalThis.crypto?.randomUUID?.() || `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function openReferenceDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadPdfReference(key) {
  const db = await openReferenceDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction('documents').objectStore('documents').get(key);
    request.onsuccess = async () => {
      try {
        const value=request.result||null;
        if(value?.bytes instanceof Blob)value.bytes=await value.bytes.arrayBuffer();
        db.close();resolve(value);
      } catch(error) {db.close();reject(error)}
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function savePdfReference(key, bytes, name='curriculum.pdf') {
  const db = await openReferenceDb();
  return new Promise((resolve, reject) => {
    const buffer=bytes instanceof Uint8Array?bytes.slice().buffer:bytes.slice(0);
    const request = db.transaction('documents', 'readwrite').objectStore('documents').put({ bytes:buffer, name, type:'application/pdf', size:buffer.byteLength, savedAt:new Date().toISOString() }, key);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

function makeRows(items, pageNumber, styles={}) {
  const rows = [];
  for (const item of items) {
    const rawText = item.str?.replace(/\s+/g, ' ');
    const text = rawText?.trim();
    if (!text) continue;
    const [, , , , x, y] = item.transform || [];
    const fontSize = Math.hypot(item.transform?.[0] || 0, item.transform?.[1] || 0) || 10;
    const entry = { text, leadingSpace:/^\s/.test(rawText), trailingSpace:/\s$/.test(rawText), x:x||0, y:y||0, width:item.width||0, fontSize, fontName:styles[item.fontName]?.fontFamily||item.fontName||'', page:pageNumber };
    let row = rows.find(candidate => Math.abs(candidate.y-entry.y) < Math.max(2.5, fontSize*.22));
    if (!row) rows.push(row={ y:entry.y, items:[] });
    row.items.push(entry);
  }
  return rows.map(row => row.items.sort((a,b)=>a.x-b.x));
}

function joinRow(row) {
  let text='';
  for(let index=0;index<row.length;index+=1) {
    const item=row[index], previous=row[index-1];
    if(previous) {
      const gap=item.x-(previous.x+previous.width), threshold=Math.max(.65,Math.min(item.fontSize,previous.fontSize)*.16);
      if(previous.trailingSpace||item.leadingSpace||gap>threshold)text+=' ';
    }
    text+=item.text;
  }
  return text.replace(/\s+/g,' ').trim();
}

function detectColumns(rows, pageWidth) {
  const items = rows.flat();
  const starts = [...new Set(items.map(item => Math.round(item.x/4)*4))].sort((a,b)=>a-b);
  let best = null;
  for (let i=0;i<starts.length-1;i+=1) {
    const left=starts[i], right=starts[i+1], gap=right-left;
    if (gap < pageWidth*.07) continue;
    const midpoint=(left+right)/2;
    const leftCount=items.filter(item=>item.x+item.width<midpoint).length;
    const rightCount=items.filter(item=>item.x>midpoint).length;
    if (leftCount<4||rightCount<4) continue;
    const score=gap*Math.min(leftCount,rightCount);
    if (!best||score>best.score) {
      const averageWidth=side=>{const widths=rows.map(row=>{const column=row.filter(item=>side==='left'?item.x+item.width<midpoint:item.x>=midpoint);return column.length?Math.max(...column.map(item=>item.x+item.width))-Math.min(...column.map(item=>item.x)):0}).filter(Boolean);return widths.length?widths.reduce((sum,width)=>sum+width,0)/widths.length:0};
      const sidebarSide=averageWidth('left')<averageWidth('right')?'left':'right';
      best={split:midpoint,gap,score,sidebarSide};
    }
  }
  return best&&best.gap>pageWidth*.1?best:null;
}

function normalizeLine(line) { return line.replace(/[•▪◦]/g,' ').replace(/\s{2,}/g,' ').trim(); }
function findSection(line) {
  const cleaned=normalizeLine(line).replace(/\b(?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:19|20)\d{2}|presente|actualidad))?\b.*$/i,'').replace(/[:：|]+$/,'').trim();
  return sectionMatchers.find(([,matcher])=>matcher.test(cleaned))?.[0]||null;
}
function looksLikeUnrecognizedHeading(line,previous) {
  const text=lineText(line),letters=text.replace(/[^\p{L}]/gu,'');
  const uppercase=letters.length>=3&&letters.length<=55&&letters===letters.toLocaleUpperCase()&&!/^[A-Z]{1,3}$/.test(letters);
  const largerShortLabel=previous&&text.length<65&&line.size>previous.size*1.3&&!/[.!?]$/.test(text);
  return uppercase||largerShortLabel;
}
function findContact(text, lines) {
  const email=text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]||'';
  const phone=[...text.matchAll(/(?:\+?\d[\d ().-]{6,}\d)/g)].map(match=>match[0].trim()).find(value=>{const digits=value.replace(/\D/g,'');return digits.length>=8&&digits.length<=15&&!/\b(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}\b/.test(value)})||'';
  const linkedin=text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,;|]+/i)?.[0]||'';
  const github=text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,;|]+/i)?.[0]||'';
  const urls=[...text.matchAll(/(?:https?:\/\/|www\.)[^\s,;|]+/gi)].map(match=>match[0]);
  const website=urls.find(url=>!/(linkedin|github)\.com/i.test(url))||'';
  const location=lines.find(line=>/\b(city|ciudad|guatemala|méxico|mexico|colombia|perú|peru|argentina|chile|españa|spain)\b/i.test(line)&&line.length<70)||'';
  return {email,phone,linkedin,github,website,location};
}
function lineText(line) { return typeof line==='string'?line:line.text; }
function toItems(key, lines) {
  const chunks=[]; let current=[];
  for (const line of lines) {
    const text=lineText(line),dateLike=/\b(?:19|20)\d{2}\b/.test(text)||/\b(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\b/i.test(text);
    const bullet=/^[•▪◦\-*]/.test(text),currentHasDate=current.some(item=>/\b(?:19|20)\d{2}\b/.test(lineText(item)));
    const previous=current.at(-1),gap=previous&&typeof previous==='object'?previous.y-line.y:0;
    const recent=current.slice(-3).filter(item=>typeof item==='object').map(item=>item.size);
    const recentSize=recent.length?recent.reduce((sum,size)=>sum+size,0)/recent.length:0;
    const headingBreak=currentHasDate&&!bullet&&text.length<100&&(/[.!?]$/.test(text)===false)&&(gap>Math.max(15,(line.size||10)*1.55)||(recentSize&&(line.size||0)>recentSize*1.16));
    if(current.length&&((dateLike&&currentHasDate)||headingBreak)){chunks.push(current);current=[];}
    if(typeof line==='string')current.push(line.replace(/^[•▪◦\-*]\s*/,''));
    else current.push({...line,text:text.replace(/^[•▪◦\-*]\s*/,'')});
  }
  if(current.length)chunks.push(current);
  return chunks.map(linesInItem=>({lines:linesInItem,dateLine:linesInItem.map(lineText).find(line=>/\b(?:19|20)\d{2}\b/.test(line))||''}));
}
function dateRange(value) {
  const matches=value.match(/(?:\b(?:19|20)\d{2}\b|\b(?:presente|actualidad|current|present)\b)/gi)||[];
  return {start:matches[0]||'',end:matches[1]||'',current:matches.length>1&&/presente|actualidad|current|present/i.test(matches[1])};
}
function toHexColor(values) {
  if(!values?.length||values.length<3)return null;
  const channels=Array.from(values).slice(0,3).map(Number), alreadyBytes=Math.max(...channels)>1;
  const rgb=channels.map(value=>Math.round(Math.max(0,Math.min(alreadyBytes?255:1,value))*(alreadyBytes?1:255)));
  const [r,g,b]=rgb, max=Math.max(r,g,b), min=Math.min(r,g,b);
  if(max-min<36||max<45||min>238)return null;
  return `#${rgb.map(value=>value.toString(16).padStart(2,'0')).join('')}`;
}
function parseSections(sectionLines, review) {
  const result={experience:[],education:[],certifications:[],languages:[],projects:[],references:[],skills:{technical:[],soft:[],tools:[]},additional:''};
  const splitList=lines=>[...new Set(lines.flatMap(line=>line.split(/[,;|•]/).map(value=>value.trim()).filter(Boolean)))];
  const detectedSkills=splitList((sectionLines.skills||[]).map(lineText));
  const softSkills=/^(comunicaci[oó]n|trabajo en equipo|liderazgo|resoluci[oó]n de problemas|pensamiento cr[ií]tico|adaptabilidad|organizaci[oó]n|negociaci[oó]n|creatividad|empat[ií]a|gesti[oó]n del tiempo|communication|teamwork|leadership|problem solving|critical thinking|adaptability|organization|negotiation|creativity|empathy|time management)$/i;
  const tools=/^(figma|sketch|adobe(?: photoshop| illustrator| xd)?|excel|word|powerpoint|google workspace|office|jira|trello|slack|git|github|docker|aws|azure|salesforce|tableau|power bi)$/i;
  result.skills.soft=detectedSkills.filter(skill=>softSkills.test(skill));
  result.skills.tools=detectedSkills.filter(skill=>tools.test(skill));
  result.skills.technical=detectedSkills.filter(skill=>!softSkills.test(skill)&&!tools.test(skill));
  if(result.skills.soft.length+result.skills.tools.length<detectedSkills.length)review.push({section:sectionLabels.skills,reason:'Revisa la clasificación entre habilidades técnicas, herramientas y habilidades blandas.'});
  result.languages=splitList((sectionLines.languages||[]).map(lineText)).map(name=>({id:id(),name,level:''}));
  for(const chunk of toItems('certifications',sectionLines.certifications||[])) {
    const texts=chunk.lines.map(lineText),date=chunk.dateLine?dateRange(chunk.dateLine).start:'';
    const rawName=texts.find(line=>!/^\d{4}$/.test(line))||'';
    const name=rawName.replace(/\s+(?:19|20)\d{2}$/,'').trim();
    result.certifications.push({id:id(),name,issuer:texts.find(line=>line!==name&&line!==chunk.dateLine)||'',date,url:''});
    if(!date&&texts.some(line=>/\b(?:19|20)\d{2}\b/.test(line)))review.push({section:sectionLabels.certifications,reason:`Revisa la fecha de “${name.slice(0,60)}”; no se pudo separar con seguridad.`});
  }
  for(const [key,target] of [['experience','experience'],['education','education'],['projects','projects'],['references','references']]) {
    const lines=sectionLines[key]||[]; if(!lines.length)continue;
    const chunks=toItems(key,lines);
    if(chunks.length===1&&!chunks[0].dateLine&&lines.length>4)review.push({section:sectionLabels[key],reason:'No se detectaron límites claros entre elementos; revisar el texto agrupado.'});
    for(const chunk of chunks) {
      const texts=chunk.lines.map(lineText),joined=texts.join('\n'),range=dateRange(chunk.dateLine),primary=texts[0]||'';
      if(key==='experience') {
        result[target].push({id:id(),company:texts[1]||'',position:primary,start:range.start,end:range.end,current:range.current,description:texts.slice(2).filter(line=>line!==chunk.dateLine).join('\n'),achievements:''});
        if(!texts[1])review.push({section:sectionLabels[key],reason:`Revisa “${primary.slice(0,70)}”: la empresa no se pudo separar con seguridad.`});
      } else if(key==='education') {
        result[target].push({id:id(),institution:texts[1]||'',degree:primary,start:range.start,end:range.end,status:'',description:texts.slice(2).join('\n')});
        if(!texts[1])review.push({section:sectionLabels[key],reason:`Revisa “${primary.slice(0,70)}”: la institución no se pudo separar con seguridad.`});
      } else if(key==='projects') {
        result[target].push({id:id(),name:primary,description:texts.slice(1).join('\n'),technologies:'',url:'',results:''});
      } else result[target].push({id:id(),name:primary,organization:texts[1]||'',description:texts.slice(2).join('\n'),contact:''});
    }
  }
  result.additional=(sectionLines.additional||[]).map(lineText).join('\n');
  return result;
}

export async function openPdfDocument(data) {
  // PDF.js may transfer/detach the supplied buffer to its worker. Keep a separate
  // copy so the importer can persist the original bytes after extraction.
  const bytes=data instanceof Uint8Array?data:new Uint8Array(data);
  return getDocument({data:bytes.slice(),isEvalSupported:false}).promise;
}

export async function renderPdfPage(document, pageNumber, canvas, zoom=100, rotation) {
  const page=await document.getPage(pageNumber),viewport=page.getViewport({scale:zoom/100,...(rotation===undefined?{}:{rotation})}),context=canvas.getContext('2d',{alpha:false});
  if(!context)throw new Error('El navegador no pudo crear el lienzo para mostrar el PDF.');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  const task=page.render({canvasContext:context,viewport});
  return {width:viewport.width,height:viewport.height,promise:task.promise,cancel:()=>task.cancel()};
}

export async function importPdfResume(file) {
  const data=new Uint8Array(await file.arrayBuffer());
  const document=await openPdfDocument(data);
  const pages=[], allLines=[], fontSizes=[], fontNames=[];
  let widest=0, tallest=0, sidebarSide='left', sidebarWidth=30;
  const colorFrequency=new Map();
  for(let pageNumber=1;pageNumber<=document.numPages;pageNumber+=1) {
    const page=await document.getPage(pageNumber), content=await page.getTextContent(), [x0,y0,x1,y1]=page.view;
    const operators=await page.getOperatorList();
    operators.fnArray.forEach((operator,index)=>{
      if(operator!==OPS.setFillRGBColor&&operator!==OPS.setStrokeRGBColor)return;
      const hex=toHexColor(operators.argsArray[index]);if(hex)colorFrequency.set(hex,(colorFrequency.get(hex)||0)+1);
    });
    const pageWidth=x1-x0; widest=Math.max(widest,pageWidth);tallest=Math.max(tallest,y1-y0);
    const rows=makeRows(content.items,pageNumber,content.styles), columns=detectColumns(rows,pageWidth);
    if(columns) {sidebarSide=columns.sidebarSide;const sidePercentage=columns.sidebarSide==='left'?columns.split/pageWidth*100:(pageWidth-columns.split)/pageWidth*100;sidebarWidth=Math.max(20,Math.min(40,Math.round(sidePercentage)));}
    const grouped=columns?[0,1].map(index=>rows.map(row=>row.filter(item=>index===0?item.x+item.width<columns.split:item.x>=columns.split)).filter(row=>row.length)):[rows];
    for(let column=0;column<grouped.length;column+=1) {
      for(const row of grouped[column]) {
        const line=joinRow(row.sort((a,b)=>a.x-b.x));if(!line)continue;
        allLines.push({text:line,page:pageNumber,column,x:Math.min(...row.map(item=>item.x)),y:row[0].y,size:Math.max(...row.map(item=>item.fontSize)),fonts:[...new Set(row.map(item=>item.fontName))]});
        row.forEach(item=>{fontSizes.push(item.fontSize);fontNames.push(item.fontName)});
      }
    }
    pages.push({pageNumber,width:pageWidth,height:y1-y0,columns:columns?2:1});
  }
  const byVisualOrder=allLines.sort((a,b)=>a.page-b.page||a.column-b.column||b.y-a.y||a.x-b.x);
  const sections={header:[],contact:[],summary:[],experience:[],education:[],skills:[],certifications:[],languages:[],projects:[],references:[],additional:[],unclassified:[]};
  const currentByColumn=new Map();
  for(const line of byVisualOrder) {
    let current=currentByColumn.get(line.column)||'header';
    const heading=findSection(line.text);
    if(heading){currentByColumn.set(line.column,heading);continue;}
    const previous=sections[current].at(-1);
    if(current!=='header'&&looksLikeUnrecognizedHeading(line,previous)){sections.unclassified.push(line);currentByColumn.set(line.column,'unclassified');continue;}
    sections[current].push(line);
    currentByColumn.set(line.column,current);
  }
  const headerText=sections.header.map(line=>line.text).join('\n');
  const allText=byVisualOrder.map(line=>line.text).join('\n');
  const personal=findContact(headerText+'\n'+allText,byVisualOrder.map(line=>line.text));
  const contactTokens=[personal.email,personal.phone,personal.linkedin,personal.github,personal.website].filter(Boolean);
  const headerLines=sections.header.map(line=>line.text).filter(line=>!contactTokens.some(token=>line.includes(token))&&!/@|https?:\/\//i.test(line)&&!personal.location.includes(line));
  const name=headerLines.find(line=>line.length<70&&!/\b(curriculum|resume|curr[ií]culum vitae)\b/i.test(line))||'';
  const role=headerLines.find(line=>line!==name&&line.length<100)||'';
  const review=[];
  if(byVisualOrder.some(line=>/[a-záéíóúüñ][A-ZÁÉÍÓÚÜÑ]/.test(line.text)))review.push({section:'Espacios del texto',reason:'Hay palabras que el PDF almacena sin separación clara. Se conservaron tal como aparecen para no alterar nombres; revísalas manualmente.'});
  if(!allLines.length)review.push({section:'Documento completo',reason:'No se detectó texto seleccionable. El PDF original se conserva para comparar, pero el documento escaneado necesita OCR antes de poder clasificar su contenido.'});
  if(!personal.email&&!personal.phone)review.push({section:'Datos personales',reason:'No se identificaron datos de contacto con suficiente confianza.'});
  if(sections.header.length>6)review.push({section:'Datos personales',reason:'Hay texto de encabezado que requiere clasificación manual.'});
  const parsed=parseSections(sections,review);
  const classifiedHeader=new Set([name,role,...contactTokens,personal.location].filter(Boolean));
  const reviewFragments=[...sections.unclassified.map(line=>line.text),...sections.header.map(line=>line.text).filter(line=>!classifiedHeader.has(line)&&!contactTokens.some(token=>line.includes(token))&&!/@|https?:\/\//i.test(line))];
  if(reviewFragments.length)review.push({section:'Fragmentos sin clasificar',reason:`${reviewFragments.length} línea(s) conservadas en “Información adicional” para revisión manual.`});
  parsed.additional=[parsed.additional,...reviewFragments].filter(Boolean).join('\n');
  const detectedTwoColumns=pages.some(page=>page.columns===2);
  const fontFrequency=fontNames.reduce((counts,font)=>(counts[font]=(counts[font]||0)+1,counts),{});
  const dominantFont=Object.entries(fontFrequency).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
  const averageFontSize=fontSizes.length?Math.round(fontSizes.reduce((sum,value)=>sum+value,0)/fontSizes.length*10)/10:10;
  const accentColor=[...colorFrequency].sort((a,b)=>b[1]-a[1])[0]?.[0]||'#34466d';
  if(!colorFrequency.size)review.push({section:'Diseño visual',reason:'No se pudo identificar con seguridad un color de acento; se usó el color predeterminado.'});
  review.push({section:'Fotografía e iconos',reason:'Se mantiene el PDF original para referencia. Las fotografías, iconos y fondos no se convierten automáticamente en elementos editables.'});
  const sidebarColumn=sidebarSide==='left'?0:1,sidebarLines=byVisualOrder.filter(line=>line.column===sidebarColumn).map(line=>line.text);
  const sidebarHasContent=['contact','skills','languages','certifications'].some(key=>sections[key].some(line=>line.column===sidebarColumn))||[personal.email,personal.phone,personal.linkedin,personal.github].some(value=>value&&sidebarLines.some(line=>line.includes(value)));
  const useTwoColumnTemplate=detectedTwoColumns&&sidebarHasContent;
  if(detectedTwoColumns&&!sidebarHasContent)review.push({section:'Distribución',reason:'Se detectaron dos columnas, pero no hay contenido editable suficiente en una de ellas. Se eligió una plantilla de una columna para evitar dejar una barra vacía.'});
  let referenceId=null,referenceWarning='';
  try {referenceId=id();await savePdfReference(referenceId,data,file.name);}
  catch(error) {referenceId=null;referenceWarning=`No se pudo guardar el PDF original como referencia (${error.message||'error de almacenamiento'}).`}
  if(referenceWarning)review.push({section:'Documento original',reason:referenceWarning});
  const parsedSummary=sections.summary.map(line=>line.text).join(' ');
  if(detectedTwoColumns&&sidebarSide==='left') {
    // The common sidebar-left resume layout maps to the built-in modern template.
  }
  const cv={
    id:id(),title:name||'CV importado',updated:new Date().toISOString(),template:useTwoColumnTemplate?'modern':'ats',
    customization:{color:accentColor,font:/(times|georgia|serif)/i.test(dominantFont)?'Georgia':/(courier|mono)/i.test(dominantFont)?'Courier New':'Arial',fontSize:Math.max(80,Math.min(140,Math.round(averageFontSize/10*20)*5)),sidebarSide,sidebarWidth},
    personal:{name,role,email:personal.email,phone:personal.phone,address:'',location:personal.location,linkedin:personal.linkedin,github:personal.github,website:personal.website,summary:parsedSummary,photo:'',photoShape:'circle'},
    ...parsed,importReview:review,importReviewFragments:reviewFragments,
    sourcePdf:{id:referenceId,name:file.name,pageCount:document.numPages,layout:allLines.length?(detectedTwoColumns?'two-column':'one-column'):'unresolved',pages,metrics:{pageWidth:widest,pageHeight:tallest,averageFontSize,dominantFont}},
  };
  return cv;
}
