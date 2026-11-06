import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { importPdfResume, loadPdfReference, openPdfDocument, renderPdfPage } from './pdfImportCore.js';

function makePdf(pages) {
  const objects=['<< /Type /Catalog /Pages 2 0 R >>',null],pageRefs=[];
  pages.forEach((rows,index)=>{
    const pageId=3+index*3,fontId=pageId+1,streamId=pageId+2;pageRefs.push(`${pageId} 0 R`);
    const stream=rows.map(row=>{
      if(row.kind==='rect')return `q ${row.color||'0.9 0.9 0.9'} rg ${row.x||20} ${row.y||20} ${row.width||30} ${row.height||30} re f Q`;
      if(row.kind==='image')return `q ${row.width||80} 0 0 ${row.height||80} ${row.x||20} ${row.y||20} cm BI /W 2 /H 2 /CS /RGB /BPC 8 /F /AHx ID FF000000FF00000000FFFFFFFF > EI Q`;
      const [r,g,b]=row.color||[0,0,0],text=row.text.replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)');
      return `${r} ${g} ${b} rg BT /F1 ${row.size||10} Tf ${row.x||48} ${row.y||790} Td (${text}) Tj ET`;
    }).join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  objects[1]=`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`;
  let output='%PDF-1.4\n';const offsets=[0];
  objects.forEach((object,index)=>{offsets.push(new TextEncoder().encode(output).length);output+=`${index+1} 0 obj\n${object}\nendobj\n`});
  const xref=new TextEncoder().encode(output).length;
  output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(output);
}
function fileFor(bytes,name='sample.pdf') { return {name,type:'application/pdf',arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}; }

test('reconstruye espacios según coordenadas sin separar fragmentos pegados',async()=>{
  const bytes=makePdf([[{text:'FREDY',x:50,y:790,size:18},{text:'LUCERO',x:150,y:790,size:18},{text:'Analista',x:50,y:760,size:12},{text:'de Soporte',x:110,y:760,size:12},{text:'ana@example.com',x:50,y:730},{text:'+502 5555 1212',x:50,y:710}]]);
  const cv=await importPdfResume(fileFor(bytes));
  assert.equal(cv.personal.name,'FREDY LUCERO');
  assert.equal(cv.personal.role,'Analista de Soporte');
  assert.equal(cv.personal.phone,'+502 5555 1212');
  const joined=makePdf([[{text:'FREDY',x:50,y:790,size:18},{text:'LUCERO',x:105,y:790,size:18},{text:'ana@example.com',x:50,y:760}]]);
  const joinedCv=await importPdfResume(fileFor(joined));
  assert.equal(joinedCv.personal.name,'FREDYLUCERO');
  const ambiguous=await importPdfResume(fileFor(makePdf([[{text:'AnalistadeSoporte',size:18},{text:'ana@example.com',y:760}]])));
  assert.equal(ambiguous.personal.name,'AnalistadeSoporte');
  assert.ok(ambiguous.importReview.some(item=>item.section==='Espacios del texto'));
});

test('clasifica y mantiene separados los datos de secciones reconocidas',async()=>{
  const bytes=makePdf([[{text:'Ana Rivera',size:20},{text:'Disenadora UX',y:765,size:12},{text:'ana@example.com',y:740},{text:'PERFIL PROFESIONAL',y:700,size:12},{text:'Diseno accesible para productos digitales.',y:680},{text:'EXPERIENCIA LABORAL',y:640,size:12},{text:'Disenadora UX',y:620},{text:'Acme',y:605},{text:'2021 - 2024',y:590},{text:'Mejore conversion.',y:570},{text:'Analista de soporte',y:545},{text:'Beta',y:530},{text:'2018 - 2021',y:515},{text:'EDUCACION',y:480,size:12},{text:'Diseno - Universidad 2014 - 2018',y:460},{text:'HABILIDADES',y:420,size:12},{text:'Figma, investigacion, prototipos, teamwork',y:400},{text:'CERTIFICACIONES',y:360,size:12},{text:'Google Analytics 2024',y:340},{text:'IDIOMAS',y:300,size:12},{text:'Spanish, English',y:280},{text:'EXPERIENCIA ESPECIALIZADA',y:260,size:12},{text:'Unclassified extra detail',y:245},{text:'PROYECTOS',y:220,size:12},{text:'Website redesign',y:200},{text:'REFERENCIAS',y:180,size:12},{text:'Reference contact',y:160}]]);
  const cv=await importPdfResume(fileFor(bytes));
  assert.equal(cv.experience.length,2);
  assert.equal(cv.experience[0].position,'Disenadora UX');
  assert.equal(cv.experience[0].company,'Acme');
  assert.equal(cv.experience[0].start,'2021');
  assert.equal(cv.experience[1].company,'Beta');
  assert.equal(cv.education.length,1);
  assert.equal(cv.certifications.length,1);
  assert.equal(cv.certifications[0].name,'Google Analytics');
  assert.equal(cv.certifications[0].date,'2024');
  assert.equal(cv.languages.length,2);
  assert.equal(cv.projects.length,1);
  assert.equal(cv.references.length,1);
  assert.equal(cv.skills.technical.length,2);
  assert.equal(cv.skills.tools[0],'Figma');
  assert.equal(cv.skills.soft[0],'teamwork');
  assert.equal(cv.personal.summary,'Diseno accesible para productos digitales.');
  assert.equal(cv.personal.phone,'');
  assert.match(cv.additional,/EXPERIENCIA ESPECIALIZADA/);
  assert.match(cv.additional,/Unclassified extra detail/);
  assert.ok(cv.importReview.some(item=>item.section==='Fragmentos sin clasificar'));
});

test('detecta dos columnas y conserva el lado y el ancho estimado',async()=>{
  const rows=[
    {text:'Luis Perez',x:40,y:790,size:20},{text:'CONTACTO',x:40,y:760,size:12},{text:'luis@example.com',x:40,y:740},{text:'HABILIDADES',x:40,y:700,size:12},{text:'JavaScript, React',x:40,y:680},{text:'CSS, accesibilidad',x:40,y:660},
    {text:'Desarrollador frontend',x:300,y:790,size:12},{text:'EXPERIENCIA',x:300,y:750,size:12},{text:'Frontend - Acme 2020 - 2024',x:300,y:730},{text:'EDUCACION',x:300,y:690,size:12},{text:'Ingenieria - Univ 2016 - 2020',x:300,y:670},
  ];
  const cv=await importPdfResume(fileFor(makePdf([rows])));
  assert.equal(cv.sourcePdf.layout,'two-column');
  assert.equal(cv.template,'modern');
  assert.equal(cv.customization.sidebarSide,'left');
  assert.ok(cv.customization.sidebarWidth>=20&&cv.customization.sidebarWidth<=40);
  assert.equal(cv.experience.length,1);
  assert.equal(cv.education.length,1);
  assert.ok(!cv.skills.technical.includes('Desarrollador frontend'));
});

test('recorre todas las páginas y devuelve elementos independientes',async()=>{
  const bytes=makePdf([
    [{text:'Mario Castillo',size:20},{text:'EXPERIENCIA',y:750,size:12},{text:'Analista - Empresa A 2018 - 2020',y:730}],
    [{text:'EDUCACION',y:790,size:12},{text:'Ingeniero - Universidad 2014 - 2018',y:770},{text:'IDIOMAS',y:730,size:12},{text:'Spanish, English',y:710}],
  ]);
  const cv=await importPdfResume(fileFor(bytes));
  assert.equal(cv.sourcePdf.pageCount,2);
  assert.equal(cv.education.length,1);
  assert.equal(cv.languages.length,2);
  assert.notEqual(cv.id, (await importPdfResume(fileFor(bytes))).id);
});


test('recupera un color de acento de las operaciones PDF',async()=>{
  const bytes=makePdf([[{text:'Creative Resume',size:24,color:[.65,.15,.3]},{text:'PROFILE',y:740,size:12,color:[.65,.15,.3]}]]);
  const cv=await importPdfResume(fileFor(bytes));
  assert.equal(cv.customization.color,'#a6264c');
});

test('conserva la referencia de páginas con imágenes aunque no pueda editarlas',async()=>{
  const bytes=makePdf([[{kind:'image',x:40,y:720,width:90,height:90},{text:'Creative profile',size:20},{text:'creative@example.com',y:690}]]);
  const cv=await importPdfResume(fileFor(bytes,'creative-photo.pdf'));
  const stored=await loadPdfReference(cv.sourcePdf.id);
  assert.ok(cv.sourcePdf.id);
  assert.deepEqual(new Uint8Array(stored.bytes),bytes);
  assert.equal(cv.personal.photo,'');
  assert.ok(cv.importReview.some(item=>item.section==='Fotografía e iconos'));
});

test('conserva PDF escaneado sin texto y lo marca como pendiente de OCR',async()=>{
  const bytes=makePdf([[{kind:'image',x:20,y:20,width:540,height:790}]]),cv=await importPdfResume(fileFor(bytes,'scan.pdf'));
  assert.equal(cv.sourcePdf.layout,'unresolved');
  assert.equal(cv.sourcePdf.name,'scan.pdf');
  assert.ok(cv.importReview.some(item=>item.reason.includes('necesita OCR')));
});

test('persiste el original en IndexedDB y vuelve a abrirlo con PDF.js',async()=>{
  const bytes=makePdf([[{text:'Archivo de referencia',size:16},{text:'Página dos',y:700}],[{text:'Second page content'}]]);
  const cv=await importPdfResume(fileFor(bytes,'referencia.pdf'));
  const reference=await loadPdfReference(cv.sourcePdf.id);
  assert.equal(reference.name,'referencia.pdf');
  assert.deepEqual(new Uint8Array(reference.bytes),bytes);
  const document=await openPdfDocument(reference.bytes);
  assert.equal(document.numPages,2);
  const text=(await (await document.getPage(2)).getTextContent()).items.map(item=>item.str).join(' ');
  assert.match(text,/Second page content/);
  await document.destroy();
});

test('migra referencias antiguas almacenadas como Blob a bytes legibles',async()=>{
  const key='legacy-blob-reference',blob=new Blob([new Uint8Array([37,80,68,70])],{type:'application/pdf'});
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('cv-studio-pdf-references',1);request.onupgradeneeded=()=>request.result.createObjectStore('documents');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
  await new Promise((resolve,reject)=>{const transaction=db.transaction('documents','readwrite');transaction.objectStore('documents').put({bytes:blob,type:'application/pdf'},key);transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error)});db.close();
  const reference=await loadPdfReference(key);
  assert.deepEqual(new Uint8Array(reference.bytes),new Uint8Array([37,80,68,70]));
});

test('el visualizador pide al canvas dibujar la página seleccionada con el zoom indicado',async()=>{
  let renderArgs;
  const viewport={width:400,height:600},context={};
  const document={getPage:async pageNumber=>({pageNumber,getViewport:({scale})=>({...viewport,width:viewport.width*scale,height:viewport.height*scale}),render:args=>(renderArgs=args,{promise:Promise.resolve(),cancel(){}})})};
  const canvas={getContext:()=>context,width:0,height:0};
  const {renderPdfPage}=await import('./pdfImportCore.js');
  const rendered=await renderPdfPage(document,3,canvas,125);await rendered.promise;
  assert.equal(renderArgs.canvasContext,context);
  assert.equal(renderArgs.viewport.width,500);
  assert.equal(rendered.width,500);
  assert.equal(canvas.height,750);
});
