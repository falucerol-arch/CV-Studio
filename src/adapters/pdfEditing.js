import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

const fontMap={Helvetica:StandardFonts.Helvetica,'Helvetica-Bold':StandardFonts.HelveticaBold,'Times-Roman':StandardFonts.TimesRoman,Courier:StandardFonts.Courier};
const hexRgb=value=>{const hex=(value||'#202020').replace('#','');return rgb(parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255)};
const decodeDataUrl=dataUrl=>Uint8Array.from(atob(dataUrl.split(',')[1]),char=>char.charCodeAt(0));

export function reorderPages(pages,from,to){if(from<0||from>=pages.length||to<0||to>=pages.length)return pages;const result=[...pages], [moved]=result.splice(from,1);result.splice(to,0,moved);return result}
export function duplicatePage(pages,index,id){const page=pages[index];if(!page)return pages;const clone=structuredClone(page);clone.id=id;return [...pages.slice(0,index+1),clone,...pages.slice(index+1)]}
export function insertBlankPage(pages,index,reference,id){const blank={id,sourcePage:null,width:reference?.width||595,height:reference?.height||842,rotation:0,overlays:[]};const result=[...pages];result.splice(Math.max(0,Math.min(index,result.length)),0,blank);return result}

export async function exportPdfProject(project){
  const source=await PDFDocument.load(new Uint8Array(project.sourceBytes)),descriptors=project.pages||[],copies=[];
  for(const descriptor of descriptors)copies.push(descriptor.sourcePage===null?null:(await source.copyPages(source,[descriptor.sourcePage]))[0]);
  for(let index=source.getPageCount()-1;index>=0;index-=1)source.removePage(index);
  for(let index=0;index<descriptors.length;index+=1){
    const descriptor=descriptors[index],page=copies[index]?source.addPage(copies[index]):source.addPage([descriptor.width||595,descriptor.height||842]);
    const baseRotation=descriptor.sourcePage===null?0:project.originalRotations?.[descriptor.sourcePage]||0;
    page.setRotation(degrees((baseRotation+(descriptor.rotation||0)+360)%360));
    const width=page.getWidth(),height=page.getHeight();
    for(const overlay of descriptor.overlays||[]){
      const x=(overlay.x||0)*width, w=(overlay.w||0)*width;
      const y=height-((overlay.y||0)+(overlay.h||0))*height, h=(overlay.h||0)*height;
      if(overlay.type==='text'||overlay.type==='annotation'){
        const font=await source.embedFont(fontMap[overlay.font]||StandardFonts.Helvetica);
        page.drawText(overlay.text||'',{x,y:y+h*.15,size:overlay.fontSize||18,font,color:hexRgb(overlay.color),maxWidth:w||undefined,lineHeight:(overlay.fontSize||18)*1.25});
      } else if(overlay.type==='image'&&overlay.dataUrl){
        const bytes=decodeDataUrl(overlay.dataUrl),image=overlay.dataUrl.startsWith('data:image/png')?await source.embedPng(bytes):await source.embedJpg(bytes);
        page.drawImage(image,{x,y,width:w,height:h});
      } else if(overlay.type==='rectangle') {
        page.drawRectangle({x,y,width:w,height:h,borderColor:hexRgb(overlay.color),borderWidth:overlay.strokeWidth||2,color:overlay.fill?hexRgb(overlay.fill):undefined,opacity:overlay.fill?0.18:undefined});
      } else if(overlay.type==='redaction') {
        page.drawRectangle({x,y,width:w,height:h,color:hexRgb(overlay.color||'#ffffff')});
      } else if(overlay.type==='line') {
        page.drawLine({start:{x,y:y+h/2},end:{x:x+w,y:y+h/2},thickness:overlay.strokeWidth||2,color:hexRgb(overlay.color)});
      }
    }
  }
  return source.save();
}

export async function downloadPdfProject(project){
  const bytes=await exportPdfProject(project),blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=project.name.replace(/\.pdf$/i,'')+'-editado.pdf';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return bytes;
}
