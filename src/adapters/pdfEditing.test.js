import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {PDFDocument,StandardFonts} from 'pdf-lib';
import {OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {duplicatePage,exportPdfProject,insertBlankPage,reorderPages} from './pdfEditing.js';
import {loadDocumentProject,saveDocumentProject} from './documentProjects.js';
import {openPdfDocument} from './pdfImportCore.js';

const makeId=()=>globalThis.crypto?.randomUUID?.()||`test-${Math.random()}`;
async function sourcePdf(labels){const pdf=await PDFDocument.create();for(const label of labels){const page=pdf.addPage([300,400]),font=await pdf.embedFont(StandardFonts.Helvetica);page.drawText(label,{x:24,y:350,size:16,font})}return pdf.save()}
function projectFrom(bytes,labels){return{id:makeId(),type:'pdf',name:'sample.pdf',sourceBytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),originalRotations:labels.map(()=>0),pages:labels.map((_,index)=>({id:makeId(),sourcePage:index,width:300,height:400,rotation:0,overlays:[]}))}}
async function pageTexts(bytes){const doc=await openPdfDocument(bytes),result=[];for(let index=1;index<=doc.numPages;index+=1)result.push((await(await doc.getPage(index)).getTextContent()).items.map(item=>item.str).join(' '));await doc.destroy();return result}

test('agrega una página en blanco y mantiene intacta la página fuente',async()=>{
  const original=await sourcePdf(['Original']),project=projectFrom(original,['Original']);
  project.pages=insertBlankPage(project.pages,1,project.pages[0],makeId());
  const exported=await exportPdfProject(project),document=await PDFDocument.load(exported);
  assert.equal(document.getPageCount(),2);
  assert.equal(document.getPage(1).getWidth(),300);
  assert.deepEqual(new Uint8Array(project.sourceBytes),new Uint8Array(original));
});

test('duplica la segunda página y permite cambiar el orden antes de exportar',async()=>{
  const project=projectFrom(await sourcePdf(['Page One','Page Two']),['Page One','Page Two']);
  project.pages=duplicatePage(project.pages,1,makeId());
  project.pages=reorderPages(project.pages,2,0);
  assert.deepEqual(await pageTexts(await exportPdfProject(project)),['Page Two','Page One','Page Two']);
});

test('añade texto e imagen sobre una copia sin borrar el texto original',async()=>{
  const project=projectFrom(await sourcePdf(['Original content']),['Original content']);
  const page=project.pages[0];page.overlays=[
    {id:makeId(),type:'text',text:'Added note',x:.1,y:.1,w:.5,h:.1,fontSize:16,font:'Helvetica',color:'#cc2233'},
    {id:makeId(),type:'image',dataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l7sAAAAASUVORK5CYII=',x:.7,y:.1,w:.1,h:.1},
  ];
  const bytes=await exportPdfProject(project),texts=await pageTexts(bytes),parsed=await openPdfDocument(bytes),ops=await(await parsed.getPage(1)).getOperatorList();
  assert.match(texts[0],/Original content/);assert.match(texts[0],/Added note/);
  assert.ok(ops.fnArray.some(operator=>operator===OPS.paintImageXObject||operator===OPS.paintImageXObjectRepeat));
  await parsed.destroy();
});

test('guarda y recupera el proyecto editable en IndexedDB sin perder el original',async()=>{
  const project=projectFrom(await sourcePdf(['Persistent original']),['Persistent original']);
  project.pages=insertBlankPage(project.pages,0,project.pages[0],makeId());
  await saveDocumentProject(project);
  const reloaded=await loadDocumentProject(project.id);
  assert.equal(reloaded.pages.length,2);
  assert.deepEqual(new Uint8Array(reloaded.sourceBytes),new Uint8Array(project.sourceBytes));
  assert.deepEqual(await pageTexts(await exportPdfProject(reloaded)),['','Persistent original']);
});
