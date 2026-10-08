/* Source-content rendering helpers for the richer CORE SPA experience. */
(() => {
  'use strict';
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = value => { try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
  const aliases = Object.freeze({
    'student-parent-portal':'families','teacher-admin-portal':'partners','empower':'character-development','enrichment':'career-awareness','educate':'financial-literacy',
    'character-education-leadership-development':'leadership-development','community-service-service-learning':'community-service','our-history':'history','core-events':'events','jingle-in-july-2026':'jingle-in-july'
  });
  const ext = (label,url,cls='core-text-link') => {
    const href=safe(url);
    return href ? `<a class="${e(cls)}" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(label)}</a>` : '';
  };
  const sectionId = index => `core-section-${index + 1}`;
  function links(items=[],route){
    return items.length ? `<div class="core-inline-links">${items.map(x=>x.route?route(x.route,x.label,'core-text-link core-arrow-link'):ext(x.label,x.url,'core-text-link core-arrow-link')).join('')}</div>` : '';
  }
  function sectionNav(entry,t){
    const items=(entry.sections||[]).map((s,index)=>({id:sectionId(index),label:s.heading}));
    if(entry.timeline?.length) items.push({id:'core-history',label:t.timelineTitle});
    if(entry.people?.length) items.push({id:'core-team',label:t.peopleTitle});
    if(entry.board?.length) items.push({id:'core-board',label:t.boardTitle});
    if(entry.resourceGroups?.length) items.push({id:'core-resource-links',label:t.resourcesLabel});
    if(entry.faqs?.length) items.push({id:'core-faq-list',label:entry.title});
    if(items.length < 2) return '';
    return `<nav class="core-section-nav core-wrap" aria-label="${e(t.exploreMore)}"><div class="core-section-nav-track">${items.map((item,index)=>`<button type="button" data-core-scroll="${e(item.id)}"${index===0?' aria-current="true"':''}>${e(item.label)}</button>`).join('')}</div></nav>`;
  }
  function sections(items=[],route){
    return items.length ? `<section class="core-section core-wrap core-rich"><div class="core-rich-grid">${items.map((s,index)=>`
      <section id="${sectionId(index)}" class="core-content-section" data-core-section-anchor>
        <div class="core-section-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</div>
        <div class="core-content-copy">
          <h2>${e(s.heading)}</h2>
          ${(s.body||[]).map(p=>`<p>${e(p)}</p>`).join('')}
          ${s.bullets?.length?`<ul class="core-bullets">${s.bullets.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`:''}
          ${s.quote?`<p class="core-quote-attribution">${e(s.quote)}</p>`:''}
          ${links(s.links,route)}
        </div>
      </section>`).join('')}</div></section>` : '';
  }
  function related(ids=[],t,route){
    const rows=ids.map(id=>({id,p:t.pages[id]})).filter(x=>x.p);
    return rows.length?`<section class="core-section core-soft core-related"><div class="core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">CORE</p><h2>${e(t.exploreMore)}</h2></div></div><div class="core-related-grid">${rows.map(({id,p},index)=>`<article class="core-link-card"><span class="core-card-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>${p.status?`<span class="core-mini-status">${e(p.status)}</span>`:''}<h3>${e(p.title)}</h3><p>${e(p.intro)}</p>${route(id,t.audienceActions?.[id]||t.explorePage,'core-text-link core-arrow-link')}</article>`).join('')}</div></div></section>`:'';
  }
  function news(items=[],t,route){
    return `<div class="core-news-grid">${items.map((item,index)=>`<article class="core-news-card"><div class="core-news-thumb core-news-thumb-${index+1}" aria-hidden="true"><span>${String(index+1).padStart(2,'0')}</span></div><div class="core-news-body"><p class="core-meta">${e(item.category)} · ${e(item.date)}</p><h3>${e(item.title)}</h3><p>${e(item.excerpt)}</p>${route(item.id,t.newsRead,'core-text-link core-arrow-link')}</div></article>`).join('')}</div>`;
  }
  function journey(t,route){
    const ids=['character-development','career-awareness','financial-literacy'];
    return `<section class="core-section core-journey"><div class="core-wrap"><p class="core-eyebrow">${e(t.home.programEyebrow)}</p><h2>${e(t.home.programTitle)}</h2><div class="core-journey-line">${ids.map((id,index)=>{const p=t.pages[id];return `<article><span aria-hidden="true">0${index+1}</span><h3>${e(p.title)}</h3><p>${e(p.intro)}</p>${route(id,t.explorePage,'core-text-link core-arrow-link')}</article>`;}).join('')}</div></div></section>`;
  }
  function home(t,route,figure){
    return `${journey(t,route)}
    <section class="core-section core-soft"><div class="core-wrap core-split core-mission-split"><div><p class="core-eyebrow">CORE</p><h2>${e(t.home.missionTitle)}</h2><p class="core-lead">${e(t.home.mission)}</p><h3>${e(t.home.aboutTitle)}</h3><p>${e(t.home.about)}</p>${route('about',t.nav.about,'core-text-link core-arrow-link')}</div>${figure('family-support-photo','core-page-photo')}</div></section>
    <section class="core-section core-news-stage"><div class="core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">CORE</p><h2>${e(t.home.newsTitle)}</h2><p>${e(t.home.newsIntro)}</p></div>${route('news',t.pages.news.title,'core-button core-button-light')}</div>${news(t.news,t,route)}</div></section>
    <section class="core-champion-band"><div class="core-wrap core-champion-grid"><div><p class="core-eyebrow">${e(t.home.championEyebrow)}</p><h2>${e(t.home.championTitle)}</h2><p>${e(t.home.championIntro)}</p></div><div class="core-champion-actions">${route('news',t.home.championPrimary,'core-button core-button-light')}${route('get-involved',t.home.championSecondary,'core-button core-button-outline-light')}</div></div></section>
    <section class="core-section core-wrap"><div class="core-cta-band"><div><p class="core-eyebrow">CORE</p><h2>${e(t.home.nextTitle)}</h2><p>${e(t.home.nextIntro)}</p></div><div class="core-actions">${route('families',t.nav.families,'core-button core-button-ink')}${route('get-involved',t.nav['get-involved'],'core-button core-button-secondary')}</div></div></section>`;
  }
  function facts(entry,page,t,route,language){
    const es=language==='es';
    const facts=[];
    if(page==='about'){ facts.push({value:String(entry.people?.length||0),label:es?'perfiles del equipo':'team profiles'}); facts.push({value:String(entry.board?.length||0),label:es?'miembros de la junta':'board members'}); }
    if(page==='faq') facts.push({value:String(entry.faqs?.length||0),label:es?'preguntas frecuentes':'frequently asked questions'});
    if(page==='history') facts.push({value:String(entry.timeline?.length||0),label:es?'hitos históricos':'history milestones'});
    if(page==='families') facts.push({value:'2',label:es?'escuelas asociadas 2026–27':'partner schools for 2026–27'});
    if(page==='character-development') facts.push({value:'50',label:es?'horas anuales de servicio citadas en la fuente':'annual service hours cited by the source'});
    if(!facts.length) return '';
    return `<section class="core-fact-strip"><div class="core-wrap core-fact-grid">${facts.map(f=>`<div><strong>${e(f.value)}</strong><span>${e(f.label)}</span></div>`).join('')}<div class="core-fact-action">${route('contact',t.contactLabel,'core-text-link core-arrow-link')}</div></div></section>`;
  }
  function endCta(page,t,route,language){
    const es=language==='es';
    const primary = page==='donate' ? 'volunteer' : page==='volunteer' ? 'get-involved' : page==='resources' ? 'families' : page==='partners' ? 'career-we-can' : page==='families' ? 'faq' : page==='about' ? 'history' : (t.pages[page]?.related?.[0] || 'contact');
    const primaryPage=t.pages[primary];
    const heading=es?'¿Listo para dar el siguiente paso?':'Ready for the next step?';
    const body=es?'Explore una ruta relacionada o comuníquese con CORE para obtener ayuda.':'Explore a related pathway or contact CORE for help.';
    return `<section class="core-section core-wrap"><div class="core-cta-band core-cta-band-final"><div><p class="core-eyebrow">CORE</p><h2>${e(heading)}</h2><p>${e(body)}</p></div><div class="core-actions">${primaryPage?route(primary,primaryPage.title,'core-button core-button-ink'):''}${route('contact',t.contactLabel,'core-button core-button-secondary')}</div></div></section>`;
  }
  function page(entry,page,t,{route,language}){
    if (!entry || page==='__not-found') return '';
    let out=sectionNav(entry,t);
    out+=facts(entry,page,t,route,language);
    out+=page==='programs'?'':sections(entry.sections,route);
    if(page==='programs'){
      const ids=['leadership-development','community-service','career-we-can','social-emotional-learning','two-generational','sprat','house-of-straus','score'];
      out+=`<section class="core-section core-soft"><div class="core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">CORE</p><h2>${e(t.exploreMore)}</h2></div></div><div class="core-related-grid">${ids.map((id,index)=>{const p=t.pages[id];return `<article class="core-link-card"><span class="core-card-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>${p.status?`<span class="core-mini-status">${e(p.status)}</span>`:''}<h3>${e(p.title)}</h3><p>${e(p.intro)}</p>${route(id,t.explorePage,'core-text-link core-arrow-link')}</article>`;}).join('')}</div></div></section>`;
    }
    if(entry.timeline?.length) out+=`<section id="core-history" class="core-section core-wrap" data-core-section-anchor><p class="core-eyebrow">CORE</p><h2>${e(t.timelineTitle)}</h2><div class="core-timeline">${entry.timeline.map(x=>`<article class="core-timeline-item"><p class="core-timeline-date">${e(x.date)}</p><p>${e(x.text)}</p></article>`).join('')}</div></section>`;
    if(entry.people?.length) out+=`<section id="core-team" class="core-section core-wrap" data-core-section-anchor><p class="core-eyebrow">CORE</p><h2>${e(t.peopleTitle)}</h2><div class="core-people-grid">${entry.people.map(x=>`<article class="core-person-card"><span class="core-avatar" aria-hidden="true">${e(x.name.charAt(0))}</span><h3>${e(x.name)}</h3><p>${e(x.role)}</p></article>`).join('')}</div></section>`;
    if(entry.board?.length) out+=`<section id="core-board" class="core-section core-soft" data-core-section-anchor><div class="core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.boardTitle)}</h2><div class="core-board">${entry.board.map(x=>`<article><h3>${e(x.name)}</h3><p>${e(x.role)}</p></article>`).join('')}</div></div></section>`;
    if(entry.resourceGroups?.length) out+=`<section id="core-resource-links" class="core-section core-soft" data-core-section-anchor><div class="core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.resourcesLabel)}</h2><div class="core-resource-groups">${entry.resourceGroups.map(g=>`<section class="core-resource-group"><h3>${e(g.title)}</h3><ul>${g.items.map(x=>`<li>${ext(x.label,x.url,'core-arrow-link')}</li>`).join('')}</ul></section>`).join('')}</div></div></section>`;
    if(entry.faqs?.length) out+=`<section id="core-faq-list" class="core-section core-wrap" data-core-section-anchor><p class="core-eyebrow">CORE</p><h2>${e(entry.title)}</h2><div class="core-faq">${entry.faqs.map((x,i)=>`<details${i===0?' open':''}><summary><span>${String(i+1).padStart(2,'0')}</span>${e(x.q)}</summary><div><p>${e(x.a)}</p></div></details>`).join('')}</div></section>`;
    if(page==='news') out+=`<section class="core-section core-wrap">${news(t.news,t,route)}</section>`;
    if(page!=='news') out+=related(entry.related,t,route);
    out+=endCta(page,t,route,language);
    const source=safe(entry.sourcePath);
    if(source) out+=`<div class="core-wrap core-source-link"><span>${e(t.sourceLabel)}</span> ${ext(entry.title,source,'core-text-link')}</div>`;
    return out;
  }
  function footer(t,route){
    return `<div class="core-footer-links">${route('programs',t.nav.programs)}${route('families',t.nav.families)}${route('partners',t.nav.partners)}${route('get-involved',t.nav['get-involved'])}${route('faq',t.pages.faq.title)}${route('history',t.pages.history.title)}${route('news',t.pages.news.title)}${route('donate',t.donate)}</div>`;
  }
  globalThis.CORERich=Object.freeze({alias:id=>aliases[id]||id,home,page,footer});
})();
