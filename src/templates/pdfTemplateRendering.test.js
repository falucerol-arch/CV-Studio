import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createServer} from 'vite';
import {pdf} from '@react-pdf/renderer';
import {openPdfDocument} from '../adapters/pdfImportCore.js';

let server,PDFDoc;
test.before(async()=>{
  server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
  ({PDFDoc}=await server.ssrLoadModule('/src/App.jsx'));
});
test.after(async()=>{await server?.close()});

async function render(cv){const stream=await pdf(React.createElement(PDFDoc,{cv})).toBuffer(),chunks=[];for await(const chunk of stream)chunks.push(chunk);return new Uint8Array(Buffer.concat(chunks))}
async function readPdf(bytes){const doc=await openPdfDocument(bytes),pages=[];for(let index=1;index<=doc.numPages;index+=1)pages.push((await(await doc.getPage(index)).getTextContent()).items.map(item=>item.str).join(' '));await doc.destroy();return pages}
function resume(template,customization={}){
  return{id:'template-test',template,title:'Prueba',customization:{font:'Arial',color:'#34466d',...customization},personal:{name:'Ana Martínez',role:'Diseñadora de producto',email:'ana@example.com',summary:'Perfil profesional de prueba.'},skills:{technical:['Diseño de sistemas','Investigación']},languages:[{name:'Español',level:'Nativo'}],experience:Array.from({length:16},(_,index)=>({id:`job-${index}`,position:`Cargo ${index+1}`,company:`Empresa ${index+1}`,start:'2020',end:'2022',description:'Responsabilidades profesionales con información detallada para comprobar el salto entre páginas y la integridad del texto.'})),education:[{id:'edu',degree:'Diseño',institution:'Universidad de prueba',start:'2016',end:'2020'}],certifications:[{id:'cert',name:'Certificación técnica',issuer:'Academia'}],projects:[{id:'project',name:'Proyecto Alfa',description:'Proyecto de demostración',technologies:'React'}],badges:[],awards:[],volunteering:[],references:[],additional:'Disponibilidad inmediata'};
}

test('Ejecutivo, Tecnológico y Editorial generan PDFs distintos y conservan el contenido al paginar',async()=>{
  const renders=[];
  for(const template of ['executive','tech','editorial','modern','minimal','creative','chronological','ats'])renders.push({template,bytes:await render(resume(template,{pageSize:'LETTER'}))});
  assert.notDeepEqual(renders[0].bytes,renders[1].bytes);
  assert.notDeepEqual(renders[1].bytes,renders[2].bytes);
  for(const result of renders){
    const pages=await readPdf(result.bytes),text=pages.join(' ');
    assert.ok(pages.length>1,`${result.template} debe paginar un CV extenso`);
    for(const expected of ['Ana Martínez','Perfil profesional de prueba.','Cargo 1','Cargo 16','Universidad de prueba','Certificación técnica','Proyecto Alfa','Disponibilidad inmediata'])assert.ok(text.includes(expected),`${result.template} perdió: ${expected}`);
  }
});

test('el diseño ATS mantiene lectura lineal y permite exportar A4 o Carta',async()=>{
  for(const pageSize of ['A4','LETTER']){
    const bytes=await render(resume('ats',{pageSize})),doc=await openPdfDocument(bytes);
    assert.equal(doc.numPages>0,true);
    const firstPage=await doc.getPage(1);assert.ok(Math.abs(firstPage.view[2]-(pageSize==='A4'?595:612))<3);
    const text=(await readPdf(bytes)).join(' ');assert.ok(text.includes('Cargo 16'));
    await doc.destroy();
  }
});
