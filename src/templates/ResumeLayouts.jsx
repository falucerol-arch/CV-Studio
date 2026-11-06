import React from 'react';

const mapBlocks=blocks=>Object.fromEntries(blocks.map(block=>[block.props['data-section'],block]));

export function ModernLayout({blocks,ordered,zoneProps,zoneOf,thumbnail=false,wrapperProps={}}){
  const side=ordered(blocks.filter(block=>zoneOf(block)==='side'&&block.props['data-section']!=='photo'),'side'),main=ordered(blocks.filter(block=>zoneOf(block)==='main'),'main'),item=mapBlocks(blocks);
  return <div className={`resume-paper resume-modern-layout ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}><header className="modern-banner" {...zoneProps('main')}><div>{item.name}{item.role}</div>{item.photo&&<div className="modern-photo">{item.photo}</div>}</header><div className="modern-columns"><aside {...zoneProps('side')}>{side}</aside><main {...zoneProps('main')}>{main.filter(block=>!['name','role','photo'].includes(block.props['data-section']))}</main></div></div>;
}

export function ExecutiveLayout({blocks,ordered,zoneProps,thumbnail=false,wrapperProps={}}){
  const item=mapBlocks(blocks),body=ordered(blocks.filter(block=>!['name','role','photo','contact'].includes(block.props['data-section'])),'main');
  return <div className={`resume-paper resume-executive ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}>
    <header className="executive-masthead" {...zoneProps('main')}>
      <div className="executive-identity">{item.name}{item.role}<div className="executive-contact">{item.contact}</div></div>
      {item.photo&&<div className="executive-portrait">{item.photo}</div>}
      <span className="executive-rule"/>
    </header>
    <main className="executive-content" {...zoneProps('main')}>{body}</main>
  </div>;
}

export function TechnologyLayout({blocks,ordered,zoneProps,zoneOf,thumbnail=false,wrapperProps={}}){
  const side=ordered(blocks.filter(block=>zoneOf(block)==='side'),'side'),main=ordered(blocks.filter(block=>zoneOf(block)==='main'),'main');
  return <div className={`resume-paper resume-technology ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}>
    <aside className="technology-rail" {...zoneProps('side')}>
      {side.filter(block=>['photo','contact','skills','languages','badges'].includes(block.props['data-section']))}
      <div className="technology-rail-extra">{side.filter(block=>!['photo','contact','skills','languages','badges'].includes(block.props['data-section']))}</div>
    </aside>
    <main className="technology-main" {...zoneProps('main')}>
      <header className="technology-heading">{main.filter(block=>['name','role','photo'].includes(block.props['data-section']))}</header>
      <div className="technology-content">{main.filter(block=>!['name','role','photo'].includes(block.props['data-section']))}</div>
    </main>
  </div>;
}

export function EditorialLayout({blocks,ordered,zoneProps,zoneOf,thumbnail=false,wrapperProps={}}){
  const item=mapBlocks(blocks),side=ordered(blocks.filter(block=>zoneOf(block)==='side'&&!['name','role','photo','contact'].includes(block.props['data-section'])),'side'),main=ordered(blocks.filter(block=>zoneOf(block)==='main'&&!['name','role','photo','contact'].includes(block.props['data-section'])),'main');
  return <div className={`resume-paper resume-editorial ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}>
    <header className="editorial-cover" {...zoneProps('main')}>
      <div className="editorial-index">CURRICULUM VITAE <span>—</span> PERFIL PROFESIONAL</div>
      <div className="editorial-cover-line">{item.name}{item.photo&&<div className="editorial-portrait">{item.photo}</div>}</div>
      {item.role}<div className="editorial-contact">{item.contact}</div>
    </header>
    <div className="editorial-columns">
      <aside className="editorial-margin" {...zoneProps('side')}>{side}</aside>
      <main className="editorial-story" {...zoneProps('main')}>
        {main.length?main:side}
      </main>
    </div>
  </div>;
}

export function MinimalLayout({blocks,ordered,zoneProps,thumbnail=false,wrapperProps={}}){
  const item=mapBlocks(blocks),body=ordered(blocks.filter(block=>!['name','role','photo','contact'].includes(block.props['data-section'])),'main');
  return <div className={`resume-paper resume-minimal ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}><header className="minimal-header" {...zoneProps('main')}><div>{item.name}{item.role}</div>{item.photo&&<div className="minimal-photo">{item.photo}</div>}{item.contact}</header><main className="minimal-content" {...zoneProps('main')}>{body}</main></div>;
}

export function CreativeLayout({blocks,ordered,zoneProps,thumbnail=false,wrapperProps={}}){
  const item=mapBlocks(blocks),body=ordered(blocks.filter(block=>!['name','role','photo','contact'].includes(block.props['data-section'])),'main');
  return <div className={`resume-paper resume-creative-layout ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}><header className="creative-splash" {...zoneProps('main')}><div className="creative-splash-copy">{item.name}{item.role}{item.contact}</div>{item.photo&&<div className="creative-cutout">{item.photo}</div>}<i className="creative-orbit orbit-a"/><i className="creative-orbit orbit-b"/></header><main className="creative-content" {...zoneProps('main')}>{body}</main></div>;
}

export function ChronologicalLayout({blocks,ordered,zoneProps,thumbnail=false,wrapperProps={}}){
  const item=mapBlocks(blocks),body=ordered(blocks.filter(block=>!['name','role','photo','contact','skills','languages'].includes(block.props['data-section'])),'main');
  const rail=ordered(blocks.filter(block=>['skills','languages','contact'].includes(block.props['data-section'])),'side');
  return <div className={`resume-paper resume-chronological ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}><header className="chronological-header" {...zoneProps('main')}>{item.name}{item.role}{item.photo&&<div className="chronological-photo">{item.photo}</div>}{!rail.some(block=>block.props['data-section']==='contact')&&item.contact}</header><div className="chronological-layout"><aside {...zoneProps('side')}>{rail}</aside><main {...zoneProps('main')}>{body}</main></div></div>;
}

export function AtsLayout({blocks,ordered,zoneProps,thumbnail=false,wrapperProps={}}){
  const item=mapBlocks(blocks),body=ordered(blocks.filter(block=>!['name','role','photo'].includes(block.props['data-section'])),'main');
  return <div className={`resume-paper resume-ats-layout ${thumbnail?'is-thumbnail':''} ${wrapperProps.className||''}`} style={wrapperProps.style}><header className="ats-heading" {...zoneProps('main')}>{item.name}{item.role}{item.photo&&<div className="ats-photo">{item.photo}</div>}</header><main className="ats-content" {...zoneProps('main')}>{body}</main></div>;
}
