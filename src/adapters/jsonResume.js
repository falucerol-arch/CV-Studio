// Maps CV Studio's single editor model to/from the JSON Resume 1.x data shape.
// CV Studio-only fields are namespaced under `custom.cvStudio` so other tools
// can safely ignore them without losing data on a round trip.
const list = value => Array.isArray(value) ? value : [];
const date = value => value || undefined;
const itemId = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function toJsonResume(cv) {
  const p = cv.personal || {};
  const custom = {
    cvStudio: {
      title: cv.title,
      template: cv.template,
      customization: cv.customization || {},
      skills: cv.skills || { technical: [], soft: [], tools: [] },
      additional: cv.additional || '',
      volunteering: list(cv.volunteering),
      projects: list(cv.projects).map(x => ({ ...x })),
    },
  };
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: p.name || '', label: p.role || '', image: p.photo || '', email: p.email || '', phone: p.phone || '',
      url: p.website || '', summary: p.summary || '', location: { address: p.address || '', city: p.location || '' },
      profiles: [p.linkedin && { network: 'LinkedIn', url: p.linkedin }, p.github && { network: 'GitHub', url: p.github }].filter(Boolean),
    },
    work: list(cv.experience).map(x => ({ name: x.company || '', position: x.position || '', startDate: date(x.start), endDate: x.current ? undefined : date(x.end), summary: x.description || '', highlights: x.achievements ? x.achievements.split('\n').map(y => y.trim()).filter(Boolean) : [] })),
    education: list(cv.education).map(x => ({ institution: x.institution || '', studyType: x.degree || '', startDate: date(x.start), endDate: date(x.end), area: x.status || '', courses: x.description ? [x.description] : [] })),
    skills: [
      ['technical', 'Técnicas'], ['soft', 'Blandas'], ['tools', 'Herramientas'],
    ].flatMap(([key, name]) => (cv.skills?.[key] || []).length ? [{ name, keywords: cv.skills[key] }] : []),
    certificates: list(cv.certifications).map(x => ({ name: x.name || '', issuer: x.issuer || '', date: date(x.date), url: x.url || '' })),
    languages: list(cv.languages).map(x => ({ language: x.name || '', fluency: x.level || '' })),
    projects: list(cv.projects).map(x => ({ name: x.name || '', description: x.description || '', summary: x.description || '', keywords: (x.technologies || '').split(',').map(y => y.trim()).filter(Boolean), url: x.url || '', highlights: x.results ? [x.results] : [] })),
    awards: list(cv.awards).map(x => ({ title: x.name || '', awarder: x.organization || '', summary: x.description || '' })),
    volunteer: list(cv.volunteering).map(x => ({ position: x.name || '', organization: x.organization || '', summary: x.description || '' })),
    references: list(cv.references).map(x => ({ name: x.name || '', reference: x.contact || '', relationship: x.description || '', organization: x.organization || '' })),
    meta: { version: 'v1.0.0', lastModified: cv.updated || new Date().toISOString(), theme: 'cv-studio' },
    custom,
  };
}

export function fromJsonResume(resume) {
  if (!resume || typeof resume !== 'object' || Array.isArray(resume)) throw new Error('El archivo debe contener un objeto JSON Resume.');
  const b = resume.basics || {};
  const cvCustom = resume.custom?.cvStudio || {};
  const profile = name => (b.profiles || []).find(x => (x.network || '').toLowerCase() === name.toLowerCase())?.url || '';
  const cv = {
    id: globalThis.crypto?.randomUUID?.() || itemId(),
    title: cvCustom.title || b.name || 'CV importado', updated: new Date().toISOString(), template: cvCustom.template || 'professional',
    customization: cvCustom.customization || {},
    personal: { name: b.name || '', role: b.label || '', email: b.email || '', phone: b.phone || '', address: b.location?.address || '', location: b.location?.city || b.location?.region || '', linkedin: profile('LinkedIn'), github: profile('GitHub'), website: b.url || '', summary: b.summary || '', photo: b.image || '' },
    experience: list(resume.work).map(x => ({ id:itemId(), company:x.name || '', position:x.position || '', start:x.startDate || '', end:x.endDate || '', current:!x.endDate && !!x.startDate, description:x.summary || '', achievements:list(x.highlights).join('\n') })),
    education: list(resume.education).map(x => ({ id:itemId(), institution:x.institution || '', degree:x.studyType || x.area || '', start:x.startDate || '', end:x.endDate || '', status:x.endDate ? 'Graduado' : '', description:list(x.courses).join(', ') })),
    skills: cvCustom.skills || { technical:[], soft:[], tools:[] },
    certifications: list(resume.certificates).map(x => ({ id:itemId(), name:x.name || '', issuer:x.issuer || '', date:x.date || '', url:x.url || '' })),
    languages: list(resume.languages).map(x => ({ id:itemId(), name:x.language || '', level:x.fluency || '' })),
    projects: cvCustom.projects || list(resume.projects).map(x => ({ id:itemId(), name:x.name || '', description:x.description || x.summary || '', technologies:list(x.keywords).join(', '), url:x.url || '', results:list(x.highlights).join('\n') })),
    awards: list(resume.awards).map(x => ({ id:itemId(), name:x.title || '', organization:x.awarder || '', description:x.summary || '' })),
    volunteering: cvCustom.volunteering || list(resume.volunteer).map(x => ({ id:itemId(), name:x.position || '', organization:x.organization || '', description:x.summary || '' })),
    references: list(resume.references).map(x => ({ id:itemId(), name:x.name || '', organization:x.organization || '', description:x.relationship || '', contact:x.reference || '' })),
    additional: cvCustom.additional || '',
  };
  const skills = list(resume.skills);
  for (const skill of skills) {
    const key = ({ 'técnicas':'technical', 'blandas':'soft', 'herramientas':'tools' })[String(skill.name || '').toLowerCase()];
    if (key) cv.skills[key] = [...new Set([...(cv.skills[key] || []), ...list(skill.keywords)])];
    else cv.skills.technical = [...new Set([...(cv.skills.technical || []), ...(skill.name ? [skill.name] : []), ...list(skill.keywords)])];
  }
  return cv;
}

export function validateJsonResume(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['La raíz del documento debe ser un objeto JSON.'];
  for (const key of ['work','education','skills','certificates','languages','projects','awards','volunteer','references']) {
    if (value[key] !== undefined && !Array.isArray(value[key])) errors.push(`"${key}" debe ser una lista según JSON Resume.`);
  }
  if (value.basics !== undefined && (typeof value.basics !== 'object' || Array.isArray(value.basics))) errors.push('"basics" debe ser un objeto.');
  return errors;
}
