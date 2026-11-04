import { toJsonResume, fromJsonResume } from './jsonResume.js';
import { renderJsonResumeHtml } from './jsonResumeTheme.js';

// Provider boundary: each provider can later bring its own renderer/exporter.
export const templateProviders = {
  'cv-studio-local': {
    id:'cv-studio-local', name:'Plantillas locales CV Studio', format:'react-html',
    render: (cv, template, ReactPreview) => ReactPreview({ cv, template }),
    exportFormat:'pdf-react-pdf',
  },
  'json-resume': {
    id:'json-resume', name:'JSON Resume', format:'json-resume-1.x',
    encode:toJsonResume, decode:fromJsonResume, render:renderJsonResumeHtml, renderFormat:'standalone-html', exportFormat:'pdf-react-pdf',
  },
};

export const getTemplateProvider = templateId => templateId === 'jsonresume-class' ? templateProviders['json-resume'] : templateProviders['cv-studio-local'];
