import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,Download,FileWarning} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {loadDocumentProject,saveDocumentProject} from '../adapters/documentProjects.js';

function htmlToDocx(html,api){
  const {Document,Paragraph,TextRun,Packer,HeadingLevel}=api;
  const parser=new DOMParser(),doc=parser.parseFromString(html||'<p></p>','text/html');
  const nodes=[...doc.body.querySelectorAll('p,h1,h2,h3,li,blockquote')];
  const paragraphs=nodes.map(node=>{
    const runs=[];
    const walk=(element,format={})=>{for(const child of element.childNodes){if(child.nodeType===Node.TEXT_NODE){if(child.textContent)runs.push(new TextRun({text:child.textContent,bold:format.bold,italics:format.italics,underline:format.underline}))}else if(child.nodeType===Node.ELEMENT_NODE){const tag=child.tagName.toLowerCase();walk(child,{bold:format.bold||tag==='b'||tag==='strong',italics:format.italics||tag==='i'||tag==='em',underline:format.underline||tag==='u'})}}};
    walk(node);const heading={h1:HeadingLevel.HEADING_1,h2:HeadingLevel.HEADING_2,h3:HeadingLevel.HEADING_3}[node.tagName.toLowerCase()];
    return new Paragraph({children:runs.length?runs:[new TextRun('')],heading,bullet:node.tagName.toLowerCase()==='li'?{indent:360}:undefined,spacing:{after:100}});
  });
  return Packer.toBlob(new Document({sections:[{children:paragraphs.length?paragraphs:[new Paragraph('')]}]}));
}

export function DocxDocumentEditor({projectId,onBack,onToast}){
  const [project,setProject]=useState(null),[saving,setSaving]=useState(false),[html,setHtml]=useState(''),timer=useRef(null);
  useEffect(()=>{let cancelled=false;loadDocumentProject(projectId).then(saved=>{if(!saved||saved.type!=='docx')throw new Error('No se encontró el documento Word guardado');if(!cancelled){setProject(saved);setHtml(saved.html||'<p></p>')}}).catch(error=>onToast(error.message||'No se pudo abrir el DOCX'));return()=>{cancelled=true;clearTimeout(timer.current)}},[projectId,onToast]);
  const changeHtml=value=>{setHtml(value);setSaving(true);clearTimeout(timer.current);timer.current=setTimeout(()=>{const next={...project,html:value};setProject(next);saveDocumentProject(next).then(()=>setSaving(false)).catch(()=>{setSaving(false);onToast('No se pudo guardar el documento')})},350)};
  const download=async()=>{try{const docx=await import('docx'),blob=await htmlToDocx(html,docx),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=`${project.name.replace(/\.docx$/i,'')}-editado.docx`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);onToast('Se descargó una copia DOCX; el original permanece guardado')}catch(error){onToast(error.message||'No se pudo generar el DOCX')}};
  if(!project)return <main className="pdf-editor-loading"><button onClick={onBack}><ArrowLeft size={16}/> Documentos</button><p>Abriendo documento Word…</p></main>;
  return <main className="docx-document-editor"><header className="pdf-editor-topbar"><button onClick={onBack}><ArrowLeft size={16}/> Documentos</button><div><b>{project.name}</b><small>{saving?'Guardando…':'Guardado en este navegador'}</small></div><Button className="button-primary" onClick={download}><Download size={15}/> Descargar DOCX</Button></header><div className="docx-format-warning"><FileWarning size={18}/><span><b>El archivo original se conserva sin cambios.</b> La importación de Word muestra y edita el contenido en un formato web. Columnas, cuadros de texto, encabezados, imágenes y algunos estilos complejos pueden simplificarse o no pasar a la copia exportada. La descarga crea un DOCX nuevo; revisa el resultado antes de compartirlo.</span></div>{project.conversionWarnings?.length>0&&<p className="docx-import-notes">Avisos al importar: {project.conversionWarnings.slice(0,4).join(' · ')}</p>}<section className="docx-editor-paper"><div className="docx-editor-toolbar"><span>Editor DOCX · cambios guardados localmente</span></div><article className="docx-editable-content" contentEditable suppressContentEditableWarning role="textbox" aria-label="Contenido editable del documento" onInput={event=>changeHtml(event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:html}}/></section></main>;
}
