import test from 'node:test';
import assert from 'node:assert/strict';
import { fromJsonResume, toJsonResume, validateJsonResume } from './jsonResume.js';
import { TEMPLATE_REGISTRY } from '../templates/registry.js';
import { renderJsonResumeHtml } from './jsonResumeTheme.js';

test('exports an editor resume to the JSON Resume 1.x sections', () => {
  const result=toJsonResume({personal:{name:'Ada Example',role:'Engineer',email:'ada@example.com',location:'Guatemala',linkedin:'https://linkedin.com/in/ada',summary:'Profile'},experience:[{company:'Analytical Engines',position:'Engineer',start:'2020-01',current:true,description:'Built systems',achievements:'Reduced time'}],education:[{institution:'University',degree:'BSc',start:'2016-01',end:'2020-01'}],skills:{technical:['JavaScript'],soft:['Leadership'],tools:['Git']},certifications:[{name:'Cloud',issuer:'Provider',date:'2024-01',url:'https://example.com'}],languages:[{name:'English',level:'Advanced'}],projects:[{name:'Project',description:'A project',technologies:'React, Node',url:'https://example.com',results:'100 users'}],awards:[],volunteering:[],references:[],customization:{color:'#123456'},template:'tech'});
  assert.equal(result.basics.name,'Ada Example');
  assert.equal(result.work[0].endDate,undefined);
  assert.deepEqual(result.skills.map(x=>x.name),['Técnicas','Blandas','Herramientas']);
  assert.equal(result.custom.cvStudio.template,'tech');
  assert.deepEqual(validateJsonResume(result),[]);
});

test('imports JSON Resume and preserves standard plus CV Studio extension data', () => {
  const result=fromJsonResume({basics:{name:'Grace Hopper',label:'Computer Scientist',email:'grace@example.com',location:{city:'New York'},profiles:[{network:'GitHub',url:'https://github.com/grace'}]},work:[{name:'Navy',position:'Rear Admiral',startDate:'1944-01',summary:'Led teams',highlights:['Compiler']}],skills:[{name:'Técnicas',keywords:['COBOL']},{name:'Blandas',keywords:['Leadership']}],custom:{cvStudio:{skills:{technical:['COBOL'],soft:['Leadership'],tools:[]},additional:'Eligible'}}});
  assert.equal(result.personal.name,'Grace Hopper');
  assert.equal(result.experience[0].achievements,'Compiler');
  assert.equal(result.experience[0].current,true);
  assert.deepEqual(result.skills.technical,['COBOL']);
  assert.equal(result.additional,'Eligible');
  assert.equal(result.personal.github,'https://github.com/grace');
});

test('reports malformed JSON Resume sections and registers original local templates', () => {
  assert.deepEqual(validateJsonResume({work:{}}),['"work" debe ser una lista según JSON Resume.']);
  assert.equal(TEMPLATE_REGISTRY.filter(x=>x.provider==='cv-studio-local').length,6);
  assert.ok(TEMPLATE_REGISTRY.every(x=>x.source&&x.license));
});

test('renders safe standalone HTML from JSON Resume data', () => {
  const html=renderJsonResumeHtml({basics:{name:'<Ada & Co>',label:'Engineer'},work:[{name:'Company',position:'Developer',startDate:'2020-01',summary:'Built tools'}]});
  assert.match(html,/&lt;Ada &amp; Co&gt;/);
  assert.match(html,/Built tools/);
  assert.match(html,/<!doctype html>/i);
  assert.doesNotMatch(html,/<script|https?:\/\//i);
});
