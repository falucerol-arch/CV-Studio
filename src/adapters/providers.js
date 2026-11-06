import { toJsonResume, fromJsonResume } from './jsonResume.js';
import { renderJsonResumeHtml } from './jsonResumeTheme.js';

// Provider boundary: each provider can later bring its own renderer/exporter.
export const templateProviders = {
  'cv-studio-local': {
    id:'cv-studio-local', name:'Plantillas locales CV Studio', format:'react-html',
    render: (cv, template, ReactPreview) => ReactPreview({ cv, template }),
    exportFormat:'pdf-react-pdf',
  },
  'reactive-resume-adapted': {
    id:'reactive-resume-adapted', name:'Adaptaciones Reactive Resume', format:'react-html',
    render:(cv,template,ReactPreview)=>ReactPreview({cv,template}),
    exportFormat:'pdf-react-pdf',
  },
  'json-resume': {
    id:'json-resume', name:'JSON Resume', format:'json-resume-1.x',
    encode:toJsonResume, decode:fromJsonResume, render:renderJsonResumeHtml, renderFormat:'standalone-html', exportFormat:'pdf-react-pdf',
  },
};

const reactiveResumeTemplates=['azurill','bronzor','chikorita','ditgar','ditto','gengar','glalie','kakuna','lapras','leafish','meowth','onyx','persian','pikachu','porygon','rhyhorn','scizor','smeargle'];
export const getTemplateProvider = templateId => templateId === 'jsonresume-class' ? templateProviders['json-resume'] : reactiveResumeTemplates.includes(templateId) ? templateProviders['reactive-resume-adapted'] : templateProviders['cv-studio-local'];
