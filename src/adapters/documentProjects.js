const dbName='cv-studio-document-projects';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`document-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(dbName,1);request.onupgradeneeded=()=>request.result.createObjectStore('projects',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function requestResult(request,db){return new Promise((resolve,reject)=>{request.onsuccess=()=>{db.close();resolve(request.result)};request.onerror=()=>{db.close();reject(request.error)}})}

export async function createPdfProject(file){
  const bytes=new Uint8Array(await file.arrayBuffer()),{openPdfDocument}=await import('./pdfImport.js'),document=await openPdfDocument(bytes);
  const pages=[],originalRotations=[];
  for(let index=0;index<document.numPages;index+=1){const page=await document.getPage(index+1),[x0,y0,x1,y1]=page.view;pages.push({id:makeId(),sourcePage:index,width:x1-x0,height:y1-y0,rotation:0,overlays:[]});originalRotations.push(page.rotate)}
  await document.destroy();
  const project={id:makeId(),type:'pdf',name:file.name||'Documento.pdf',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),sourceBytes:bytes.buffer.slice(0),originalRotations,pages};
  await saveDocumentProject(project);return project;
}
export async function createDocxProject(file){
  const bytes=new Uint8Array(await file.arrayBuffer()),mammoth=await import('mammoth');
  const conversionOptions=typeof window==='undefined'?{buffer:bytes}:{arrayBuffer:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  const conversion=await mammoth.convertToHtml(conversionOptions);
  const project={id:makeId(),type:'docx',name:file.name||'Documento.docx',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),sourceBytes:bytes.buffer.slice(0),html:conversion.value||'<p></p>',conversionWarnings:conversion.messages.map(message=>message.message)};
  await saveDocumentProject(project);return project;
}
export async function saveDocumentProject(project){const db=await openDb();return requestResult(db.transaction('projects','readwrite').objectStore('projects').put({...project,updatedAt:new Date().toISOString()}),db)}
export async function loadDocumentProject(id){const db=await openDb();return requestResult(db.transaction('projects').objectStore('projects').get(id),db)}
export async function listDocumentProjects(){const db=await openDb();const rows=await requestResult(db.transaction('projects').objectStore('projects').getAll(),db);return rows.map(({sourceBytes,...metadata})=>({...metadata,pageCount:metadata.pages?.length||0}))}
export async function deleteDocumentProject(id){const db=await openDb();return requestResult(db.transaction('projects','readwrite').objectStore('projects').delete(id),db)}
