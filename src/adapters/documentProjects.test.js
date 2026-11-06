import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {Document,Packer,Paragraph,TextRun} from 'docx';
import {createDocxProject,loadDocumentProject} from './documentProjects.js';

test('importa DOCX como proyecto independiente conservando los bytes fuente',async()=>{
  const original=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph({children:[new TextRun({text:'Perfil editable',bold:true})]}),new Paragraph('Experiencia')]}]}));
  const file=new File([original],'perfil.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const project=await createDocxProject(file),reloaded=await loadDocumentProject(project.id);
  assert.equal(reloaded.type,'docx');
  assert.match(reloaded.html,/Perfil editable/);
  assert.match(reloaded.html,/Experiencia/);
  assert.deepEqual(new Uint8Array(reloaded.sourceBytes),new Uint8Array(original));
});
