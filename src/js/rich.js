/* Source-content rendering helpers layered onto the lightweight CORE SPA. */
(() => {
  'use strict';
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = value => { try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
  const aliases = Object.freeze({
    'student-parent-portal':'families','teacher-admin-portal':'partners','empower':'character-development','enrichment':'career-awareness','educate':'financial-literacy',
    'character-education-leadership-development':'leadership-development','community-service-service-learning':'community-service','our-history':'history','core-events':'events','jingle-in-july-2026':'jingle-in-july'
  });
  const ext = (label,url,cls='core-text-link') => { const href=safe(url); return href ? `<a class="${e(cls)}" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(label)}</a>` : ''; };
  function links(items=[],route){ return items.length ? `<div class="core-inline-links">${items.map(x=>x.route?route(x.route,x.label,'core-text-link'):ext(x.label,x.url)).join('')}</div>` : ''; }
  function sections(items=[],route){ return items.length ? `<section class="core-section core-wrap"><div class="core-rich">${items.map(s=>`<section class="core-content-section"><h2>${e(s.heading)}</h2>${(s.body||[]).map(p=>`<p>${e(p)}</p>`).join('')}${s.bullets?.length?`<ul class="core-bullets">${s.bullets.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`:''}${s.quote?`<p class="core-quote-attribution">${e(s.quote)}</p>`:''}${links(s.links,route)}</section>`).join('')}</div></section>` : ''; }
  function related(ids=[],t,route){ const rows=ids.map(id=>({id,p:t.pages[id]})).filter(x=>x.p); return rows.length?`<section class="core-section core-soft"><div class="core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.exploreMore)}</h2><div class="core-related-grid">${rows.map(({id,p})=>`<article class="core-link-card">${p.status?`<span class="core-mini-status">${e(p.status)}</span>`:''}<h3>${e(p.title)}</h3><p>${e(p.intro)}</p>${route(id,t.audienceActions?.[id]||t.explorePage,'core-text-link')}</article>`).join('')}</div></div></section>`:''; }
  function news(items=[],t,route){ return `<div class="core-news-grid">${items.map(item=>`<article class="core-news-card"><p class="core-meta">${e(item.category)} · ${e(item.date)}</p><h3>${e(item.title)}</h3><p>${e(item.excerpt)}</p>${route(item.id,t.newsRead,'core-text-link')}</article>`).join('')}</div>`; }
  function home(t,route,figure){ return `<section class="core-section core-soft"><div class="core-wrap core-split"><div><p class="core-eyebrow">CORE</p><h2>${e(t.home.missionTitle)}</h2><p class="core-lead">${e(t.home.mission)}</p><h3>${e(t.home.aboutTitle)}</h3><p>${e(t.home.about)}</p>${route('about',t.nav.about,'core-text-link')}</div>${figure('family-support-photo','core-page-photo')}</div></section><section class="core-section core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.home.newsTitle)}</h2><p>${e(t.home.newsIntro)}</p>${news(t.news,t,route)}<div class="core-actions">${route('news',t.pages.news.title,'core-button core-button-secondary')}</div></section>`; }
  function page(entry,page,t,{route,figure}){
    if (!entry || page==='__not-found') return '';
    let out=page==='programs'?'':sections(entry.sections,route);
    if(page==='programs'){
      const ids=['leadership-development','community-service','career-we-can','social-emotional-learning','two-generational','sprat','house-of-straus','score'];
      out+=`<section class="core-section core-soft"><div class="core-wrap"><h2>${e(t.exploreMore)}</h2><div class="core-related-grid">${ids.map(id=>{const p=t.pages[id];return `<article class="core-link-card">${p.status?`<span class="core-mini-status">${e(p.status)}</span>`:''}<h3>${e(p.title)}</h3><p>${e(p.intro)}</p>${route(id,t.explorePage,'core-text-link')}</article>`;}).join('')}</div></div></section>`;
    }
    if(entry.timeline?.length) out+=`<section class="core-section core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.timelineTitle)}</h2><div class="core-timeline">${entry.timeline.map(x=>`<article class="core-timeline-item"><p class="core-timeline-date">${e(x.date)}</p><p>${e(x.text)}</p></article>`).join('')}</div></section>`;
    if(entry.people?.length) out+=`<section class="core-section core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.peopleTitle)}</h2><div class="core-people-grid">${entry.people.map(x=>`<article class="core-person-card"><h3>${e(x.name)}</h3><p>${e(x.role)}</p></article>`).join('')}</div></section>`;
    if(entry.board?.length) out+=`<section class="core-section core-soft"><div class="core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.boardTitle)}</h2><div class="core-board">${entry.board.map(x=>`<article><h3>${e(x.name)}</h3><p>${e(x.role)}</p></article>`).join('')}</div></div></section>`;
    if(entry.resourceGroups?.length) out+=`<section class="core-section core-soft"><div class="core-wrap"><p class="core-eyebrow">CORE</p><h2>${e(t.resourcesLabel)}</h2><div class="core-resource-groups">${entry.resourceGroups.map(g=>`<section class="core-resource-group"><h3>${e(g.title)}</h3><ul>${g.items.map(x=>`<li>${ext(x.label,x.url)}</li>`).join('')}</ul></section>`).join('')}</div></div></section>`;
    if(entry.faqs?.length) out+=`<section class="core-section core-wrap"><h2>${e(entry.title)}</h2><div class="core-faq">${entry.faqs.map((x,i)=>`<details${i===0?' open':''}><summary>${e(x.q)}</summary><div><p>${e(x.a)}</p></div></details>`).join('')}</div></section>`;
    if(page==='news') out+=`<section class="core-section core-wrap">${news(t.news,t,route)}</section>`;
    if(page!=='news') out+=related(entry.related,t,route);
    const source=safe(entry.sourcePath); if(source) out+=`<div class="core-wrap core-source-link"><span>${e(t.sourceLabel)}</span> ${ext(entry.title,source)}</div>`;
    return out;
  }
  function footer(t,route){ return `<div class="core-footer-links">${route('programs',t.nav.programs)}${route('faq',t.pages.faq.title)}${route('news',t.pages.news.title)}${route('history',t.pages.history.title)}${route('donate',t.donate)}</div>`; }
  globalThis.CORERich=Object.freeze({alias:id=>aliases[id]||id,home,page,footer});
})();
