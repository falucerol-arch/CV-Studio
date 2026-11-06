export const TEMPLATE_REGISTRY = [
  { id:'professional', name:'Profesional', category:'profesional', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'modern', name:'Moderno', category:'moderno', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'minimal', name:'Minimalista', category:'moderno', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'tech', name:'Tecnológico', category:'tecnológico', engine:'react-html + react-pdf', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'executive', name:'Ejecutivo', category:'ejecutivo', engine:'react-html + react-pdf', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'ats', name:'ATS', category:'ats', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'azurill', name:'Azurill', category:'reactive resume', engine:'react-html + react-pdf', provider:'reactive-resume-adapted', license:'MIT', source:'Adaptación visual basada en Reactive Resume · Amruth Pillai', customizable:true },
  { id:'bronzor', name:'Bronzor', category:'reactive resume', engine:'react-html + react-pdf', provider:'reactive-resume-adapted', license:'MIT', source:'Adaptación visual basada en Reactive Resume · Amruth Pillai', customizable:true },
  { id:'chikorita', name:'Chikorita', category:'reactive resume', engine:'react-html + react-pdf', provider:'reactive-resume-adapted', license:'MIT', source:'Adaptación visual basada en Reactive Resume · Amruth Pillai', customizable:true },
  ...['ditgar','ditto','gengar','glalie','leafish','pikachu','kakuna','lapras','meowth','onyx','persian','porygon','rhyhorn','scizor','smeargle'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1),category:'reactive resume',engine:'react-html + react-pdf',provider:'reactive-resume-adapted',license:'MIT',source:'Adaptación visual basada en Reactive Resume · Amruth Pillai',customizable:true})),
  { id:'corporate', name:'Corporativo', category:'corporativo', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'creative', name:'Creativo', category:'creativo', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'elegant', name:'Elegante', category:'elegante', engine:'react-html + react-pdf', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'editorial', name:'Editorial', category:'editorial', engine:'react-html + react-pdf', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'chronological', name:'Cronológico', category:'cronológico', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'compact', name:'Compacto', category:'compacto', engine:'react-html', provider:'cv-studio-local', license:'MIT (original CV Studio)', source:'Diseño original CV Studio', customizable:true },
  { id:'jsonresume-class', name:'JSON Resume · Class', category:'moderno', engine:'react-html', provider:'json-resume', license:'MIT (adaptación original CV Studio)', source:'Compatible con JSON Resume; inspirado en las guías de temas y en jsonresume-theme-class. No se distribuye código externo.', customizable:true },
];

export const TEMPLATE_FILTERS = ['Todas','Moderno','Profesional','Tecnológico','Ejecutivo','Editorial','Cronológico','ATS','Corporativo','Creativo','Elegante','Compacto','Reactive Resume'];
