/* Browser-native public SPA. Member authentication and private records remain in GHL. */
(() => {
  'use strict';
  if (window.__coreWorkspaceBoot) {
    document.addEventListener('hydrationDone', window.__coreWorkspaceBoot);
    window.__coreWorkspaceBoot();
    return;
  }
  let currentRoot;
  let teardown = () => {};
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeHttps = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
  const rich = window.CORERich;
  const motion = window.COREMotion;
  const siteSearch = window.CORESiteSearch;

  function boot() {
    const root = document.getElementById('core-app');
    if (!root || (root === currentRoot && root.querySelector('[data-core-ready]'))) return;
    teardown();
    let data;
    try { data = JSON.parse(root.querySelector('[data-core-payload]').textContent); }
    catch (error) { console.error('CORE preview configuration could not be read.', error); return; }

    const {site, locales, media} = data;
    const assets = new Map(media.assets.map(a => [a.id, a]));
    const bindings = media.bindings;
    const controller = new AbortController();
    const {signal} = controller;
    teardown = () => controller.abort();
    currentRoot = root;

    const header = root.querySelector('[data-core-header]');
    const view = root.querySelector('[data-core-view]');
    const status = root.querySelector('[data-core-status]');
    const searchDialog = root.querySelector('[data-core-search-dialog]');
    const lightboxDialog = root.querySelector('[data-core-lightbox-dialog]');
    const backTop = root.querySelector('[data-core-backtop]');
    const paths = new Set(['home', ...Object.keys(locales.en.pages), ...locales.en.programs.map(p => p.id)]);
    let language = site.defaultLanguage;
    let page = 'home';
    let searchController = null;
    const taxId = site.legal?.taxId || '';

    const href = (path, lang = language) => `#/${lang}/${path === 'home' ? '' : path}`;
    const route = (path, label, cls = '') => `<a class="${cls}" href="${href(path)}">${escape(label)}</a>`;
    function integration(label, url) {
      const safe = safeHttps(url);
      return safe ? `<a class="core-button" href="${escape(safe)}">${escape(label)}</a>` : `<button type="button" class="core-button" data-core-pending>${escape(label)}</button>`;
    }
    function image(id, {className = '', eager = false, decorative = false, sizes = '(max-width: 48rem) 92vw, 50vw'} = {}) {
      const m = window.COREMedia.resolve(assets.get(id), site.mediaProvider, language);
      if (!m) return '';
      return `<span class="core-media ${className}" data-media-id="${escape(m.id)}" data-media-label="${escape(m.label)}" data-media-provider="${m.provider}"><img src="${escape(m.src)}"${m.srcset ? ` srcset="${escape(m.srcset)}" sizes="${escape(sizes)}"` : ''} width="${m.width}" height="${m.height}" alt="${decorative ? '' : escape(m.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager && id === bindings.homeHero ? ' fetchpriority="high"' : ''} data-core-image data-original-src="${escape(m.original)}"><span class="core-media-fallback" hidden>${escape(locales[language].mediaUnavailable)}</span></span>`;
    }
    function figure(id, className = '', eager = false) {
      const asset = assets.get(id);
      const contain = ['icon', 'illustration', 'logo'].includes(asset?.kind);
      const caption = locales[language].mediaCaptions[id];
      return `<figure class="core-figure ${className}" data-core-figure="${escape(id)}">${image(id, {eager, decorative: contain, className: contain ? 'core-media-contain' : ''})}${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`;
    }
    function gallery(ids) {
      const ui = language === 'es' ? {open:'Ampliar imagen'} : {open:'Enlarge image'};
      return `<div class="core-photo-grid">${ids.map(id => `<button type="button" class="core-gallery-button" data-core-lightbox aria-label="${escape(ui.open)}">${figure(id)}</button>`).join('')}</div>`;
    }

    const navRoutes = {
      programs: ['programs','character-development','career-awareness','financial-literacy','leadership-development','community-service','career-we-can','social-emotional-learning','two-generational','sprat','house-of-straus','score'],
      families: ['families','resources','faq','two-generational'],
      partners: ['partners','career-we-can','two-generational','contact'],
      'get-involved': ['get-involved','donate','volunteer','advocate','wish-list','events','jingle-in-july'],
      resources: ['resources','faq','news'],
      about: ['about','history','news','contact']
    };
    const primaryGroup = {
      'character-development':'programs','career-awareness':'programs','financial-literacy':'programs','leadership-development':'programs','community-service':'programs','career-we-can':'programs','social-emotional-learning':'programs','two-generational':'programs','sprat':'programs','house-of-straus':'programs','score':'programs',
      families:'families',partners:'partners','get-involved':'get-involved',donate:'get-involved',volunteer:'get-involved',advocate:'get-involved','wish-list':'get-involved',events:'get-involved','jingle-in-july':'get-involved',
      resources:'resources',faq:'resources',about:'about',history:'about',news:'about','who-gets-a-microphone':'about','who-gets-access-first':'about','equity-at-the-holidays':'about',contact:'about'
    };

    function pageTitle(t, id) {
      if (id === 'home') return t.home.title;
      return t.pages[id]?.title || t.programs.find(p => p.id === id)?.title || id;
    }
    function megaGroup(id, label, t) {
      const routes = navRoutes[id].filter(routeId => t.pages[routeId]);
      const active = routes.includes(page);
      const overview = routes.shift();
      return `<details class="core-nav-group"${active ? ' data-current="true"' : ''}><summary>${escape(label)}<span aria-hidden="true">⌄</span></summary><div class="core-nav-panel"><div class="core-nav-panel-head">${route(overview, pageTitle(t,overview),'core-nav-overview')}</div><div class="core-nav-links">${routes.map(routeId => `<a href="${href(routeId)}"${page===routeId?' aria-current="page"':''}>${escape(pageTitle(t,routeId))}</a>`).join('')}</div></div></details>`;
    }
    function breadcrumbs(t, entry) {
      if (page === 'home') return '';
      const ui = language === 'es' ? {home:'Inicio'} : {home:'Home'};
      const group = primaryGroup[page];
      const middle = group && group !== page && t.pages[group] ? `<span aria-hidden="true">/</span>${route(group,t.nav[group] || t.pages[group].title)}` : '';
      return `<nav class="core-breadcrumbs" aria-label="Breadcrumb">${route('home',ui.home)}${middle}<span aria-hidden="true">/</span><span aria-current="page">${escape(entry.title)}</span></nav>`;
    }
    function configureSearch(t) {
      searchController = siteSearch?.mount(searchDialog,{locale:t,language,href,signal}) || null;
      backTop.setAttribute('aria-label', language === 'es' ? 'Volver arriba' : 'Back to top');
    }
    function actionLink(label,url,fallbackRoute,cls='core-button') {
      const safe=safeHttps(url);
      return safe ? `<a class="${cls}" href="${escape(safe)}">${escape(label)}</a>` : route(fallbackRoute,label,cls);
    }
    function heroActions(t,id) {
      const labels=t.actionLabels || {};
      const forms=site.integrations.forms || {};
      const formUrl=key=>forms[key]?.[language] || '';
      if(id==='families') return `<div class="core-actions">${actionLink(labels.askJoin || t.contactLabel,formUrl('family'),'contact')}${route('resources',labels.findResources || t.nav.resources,'core-button core-button-secondary')}</div>`;
      if(id==='partners') return `<div class="core-actions">${actionLink(labels.startPartnership || t.contactLabel,formUrl('partner'),'contact')}${route('career-we-can',labels.hostCareer || t.pages['career-we-can'].title,'core-button core-button-secondary')}</div>`;
      if(id==='career-we-can') return `<div class="core-actions">${actionLink(labels.becomeCareerPartner || t.contactLabel,formUrl('partner'),'contact')}${route('volunteer',labels.volunteer || t.pages.volunteer.title,'core-button core-button-secondary')}</div>`;
      if(id==='volunteer') return `<div class="core-actions">${actionLink(labels.volunteerInterest || t.contactLabel,formUrl('volunteer'),'contact')}${route('get-involved',labels.exploreInvolvement || t.nav['get-involved'],'core-button core-button-secondary')}</div>`;
      if(id==='donate') return `<div class="core-actions">${site.integrations.donationUrl?actionLink(labels.donateNow || t.donate,site.integrations.donationUrl,'contact'):route('contact',labels.askDonate || t.contactLabel,'core-button')}${route('get-involved',labels.waysToGive || t.nav['get-involved'],'core-button core-button-secondary')}</div>`;
      if(id==='resources') return `<div class="core-actions">${route('families',labels.familySupport || t.nav.families,'core-button')}${route('contact',t.contactLabel,'core-button core-button-secondary')}</div>`;
      if(id==='events') return `<div class="core-actions">${route('get-involved',labels.getInvolved || t.nav['get-involved'],'core-button')}${route('contact',t.contactLabel,'core-button core-button-secondary')}</div>`;
      if(id==='faq') return `<div class="core-actions">${route('families',labels.familySupport || t.nav.families,'core-button')}${route('contact',t.contactLabel,'core-button core-button-secondary')}</div>`;
      return `<div class="core-actions">${route('contact',t.contactLabel,'core-button')}${route('programs',labels.explorePrograms || t.nav.programs,'core-button core-button-secondary')}</div>`;
    }
    function pageExtras(t,id,program) {
      const chunks=[];
      if(id==='families') chunks.push(`<section class="core-section core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">CORE</p><h2>${escape(t.schoolsTitle)}</h2><p>${escape(t.schoolYearNote)}</p></div></div><div class="core-school-grid">${bindings.schools.map((mediaId,i) => `<article>${figure(mediaId)}<h3>${escape(t.schoolNames[i])}</h3></article>`).join('')}</div></section>`);
      if(id==='resources') chunks.push(`<section class="core-section core-wrap core-resource-feature">${figure(bindings.reportCover)}<div><p class="core-eyebrow">CORE</p><h2>${escape(t.reportTitle)}</h2><p>${escape(t.reportIntro)}</p><a class="core-button" href="https://corewecan.org/resources/" target="_blank" rel="noopener noreferrer">${escape(t.currentResources)}</a></div></section>`);
      if(program && id!=='financial-literacy'){
        const ids=id==='character-development'?['character-development-photo','community-service-photo','creative-learning-photo']:['career-exploration-photo','partner-visit-photo','creative-learning-photo'];
        chunks.push(`<section class="core-section core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">CORE</p><h2>${escape(t.home.galleryTitle)}</h2><p>${escape(t.archiveNote)}</p></div></div>${gallery(ids)}</section>`);
      }
      return chunks.join('');
    }
    function openLightbox(button) {
      const img = button.querySelector('img');
      if (!img) return;
      const close = language === 'es' ? 'Cerrar imagen' : 'Close image';
      lightboxDialog.innerHTML = `<div class="core-lightbox-shell"><button type="button" class="core-dialog-close core-lightbox-close" data-core-dialog-close aria-label="${escape(close)}">×</button><img src="${escape(img.currentSrc || img.src)}" alt="${escape(img.alt)}"><p>${escape(button.querySelector('figcaption')?.textContent || img.alt)}</p></div>`;
      lightboxDialog.showModal?.();
    }

    function render(moveFocus = false) {
      const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      let preferred = site.defaultLanguage;
      try { preferred = localStorage.getItem('core-language') || preferred; } catch { /* Optional preference. */ }
      language = site.languages.includes(parts[0]) ? parts[0] : (site.languages.includes(preferred) ? preferred : site.defaultLanguage);
      page = parts.length === 0 ? 'home' : (site.languages.includes(parts[0]) && parts.length <= 2 ? parts[1] || 'home' : '__not-found');
      page = rich.alias(page);
      if (!paths.has(page)) page = '__not-found';
      const t = locales[language];
      root.lang = language;
      root.dataset.corePage = page;
      if (document.body.dataset.coreStandalone === 'true') document.documentElement.lang = language;
      try { localStorage.setItem('core-language', language); } catch { /* Optional preference. */ }

      const banner=root.querySelector('[data-core-banner]');
      banner.textContent = t.preview;
      banner.hidden = site.stage !== 'development';
      const other = language === 'en' ? 'es' : 'en';
      const ui = language === 'es' ? {search:'Explorar',closeMenu:'Cerrar menú'} : {search:'Explore',closeMenu:'Close menu'};
      const logo = image(bindings.logo, {className: 'core-logo', eager: true, sizes: '(max-width: 48rem) 240px, 285px'});
      header.innerHTML = `<div class="core-utility-strip"><div class="core-wrap core-utility-inner"><a href="${escape(site.contact.phoneHref)}"><span aria-hidden="true">☎</span>${escape(site.contact.phoneLabel)}</a><a href="mailto:${escape(site.contact.email)}"><span aria-hidden="true">✉</span>${escape(site.contact.email)}</a>${taxId?`<span class="core-tax-id"><span aria-hidden="true">●</span>501(c)(3) Tax ID: ${escape(taxId)}</span>`:''}<span class="core-utility-spacer"></span>${route('news',t.pages.news.title)}${route('contact',t.contactLabel)}</div></div><div class="core-wrap core-header-top" data-core-ready>
        <a class="core-brand" href="${href('home')}" aria-label="CORE">${logo}</a>
        <button type="button" class="core-button core-button-secondary core-menu" aria-controls="core-nav" aria-expanded="false" data-core-menu>${escape(t.menu)}</button>
        <div class="core-utilities"><button type="button" class="core-quick-find" data-core-search-open><span aria-hidden="true">⌕</span>${escape(ui.search)}</button><a class="core-language" lang="${other}" hreflang="${other}" href="${href(page === '__not-found' ? 'home' : page, other)}">${other === 'es' ? 'Español' : 'English'}</a>${integration(t.login, site.integrations.portalUrl)}${site.integrations.donationUrl ? integration(t.donate, site.integrations.donationUrl) : route('donate',t.donate,'core-button')}</div></div>
        <nav id="core-nav" class="core-wrap core-nav" aria-label="${escape(t.navLabel)}">${Object.entries(t.nav).map(([id,label]) => megaGroup(id,label,t)).join('')}</nav>`;

      const cards = `<div class="core-grid">${t.programs.map((p,index) => `<article class="core-card" data-program="${p.id}"><span class="core-card-index" aria-hidden="true">0${index+1}</span>${image(bindings.programs[p.id].icon, {className:'core-program-icon', decorative:true, sizes:'72px'})}<h3>${escape(p.title)}</h3><p>${escape(p.intro)}</p>${route(p.id,p.action,'core-arrow-link')}</article>`).join('')}</div>`;
      let title;

      if (page === 'home') {
        title = t.home.title;
        view.innerHTML = `<section class="core-hero"><div class="core-wrap core-split"><div class="core-hero-copy"><p class="core-eyebrow">${escape(t.home.eyebrow)}</p><h1 tabindex="-1">${escape(title)}</h1><p class="core-lead"><strong>${escape(t.home.intro)}</strong></p><p>${escape(t.home.support)}</p><div class="core-actions">${route('programs',t.home.primary,'core-button core-button-ink')}${route('families',t.home.secondary,'core-button core-button-secondary')}</div></div><div class="core-hero-visual">${figure(bindings.homeHero,'core-hero-photo',true)}${image(bindings.decoration,{className:'core-hero-decoration',decorative:true,sizes:'100px'})}</div></div></section>
        <section class="core-section core-program-overlap-section"><div class="core-wrap core-program-overlap-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">${escape(t.home.programEyebrow)}</p><h2>${escape(t.home.programTitle)}</h2><p>${escape(t.home.programIntro)}</p></div>${route('programs',t.nav.programs,'core-button core-button-secondary')}</div>${cards}</div></section>
        <section class="core-section core-soft"><div class="core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">CORE</p><h2>${escape(t.home.galleryTitle)}</h2><p>${escape(t.home.galleryIntro)}</p></div></div>${gallery(bindings.homeGallery)}</div></section>
        <section class="core-section core-wrap"><h2>${escape(t.home.nextTitle)}</h2><p>${escape(t.home.nextIntro)}</p><div class="core-grid core-audience-grid">${['families','partners','get-involved'].map((id,index) => `<article class="core-audience-card"><span class="core-card-index" aria-hidden="true">0${index+1}</span><h3>${escape(t.nav[id])}</h3><p>${escape(t.pages[id].intro)}</p>${route(id,t.audienceActions[id],'core-arrow-link')}</article>`).join('')}</div></section>`;
        view.insertAdjacentHTML('beforeend', rich.home(t,route,figure));
      } else {
        const program = t.programs.find(p => p.id === page);
        const entry = t.pages[page] || (program ? {...program, detail:t.draftNote} : {title:t.notFoundTitle,intro:t.notFoundIntro,detail:t.draftNote,eyebrow:'CORE'});
        title = entry.title;
        const heroId = entry.heroMedia || (program ? bindings.programs[page].hero : bindings.pages[page]);
        const actions = heroActions(t,page);
        const visibleStatus = entry.status && (site.stage === 'development' || page === 'jingle-in-july') ? entry.status : '';
        view.innerHTML = `<section class="core-section core-page-top"${program ? ` data-program="${page}"` : ''}><div class="core-wrap">${breadcrumbs(t,entry)}<div class="${heroId ? 'core-split' : ''}"><div class="core-page-copy"><p class="core-eyebrow">${escape(entry.eyebrow || 'CORE')}</p>${visibleStatus ? `<span class="core-status">${escape(visibleStatus)}</span>` : ''}<h1 tabindex="-1">${escape(title)}</h1><p class="core-lead">${escape(entry.intro)}</p><p>${escape(entry.detail)}</p>${actions}</div>${heroId ? figure(heroId,'core-page-photo',true) : ''}</div></div></section>${page === 'programs' ? `<section class="core-section core-wrap"><div class="core-section-heading"><div><p class="core-eyebrow">${escape(t.home.programEyebrow)}</p><h2>${escape(t.home.programTitle)}</h2></div></div>${cards}</section>` : ''}`;

        view.insertAdjacentHTML('beforeend', rich.page(entry,page,t,{route,figure,gallery,language,extras:pageExtras(t,page,program),stage:site.stage}));
      }

      document.title = `${title} | CORE`;
      root.querySelector('[data-core-footer]').innerHTML = `<div class="core-wrap core-footer-grid core-footer-grid-rich"><div class="core-footer-brand"><a class="core-brand" href="${href('home')}">${image(bindings.logo,{className:'core-logo core-footer-logo',sizes:'260px'})}</a><p>${escape(site.contact.address)}</p><p><a href="${escape(site.contact.phoneHref)}">${escape(site.contact.phoneLabel)}</a></p><p><a href="mailto:${escape(site.contact.email)}">${escape(site.contact.email)}</a></p>${taxId?`<p>501(c)(3) Tax ID: ${escape(taxId)}</p>`:''}</div><div class="core-footer-col core-footer-pink"><h2>${escape(t.nav.families)}</h2>${route('character-development',t.pages['character-development'].title)}${route('career-awareness',t.pages['career-awareness'].title)}${route('financial-literacy',t.pages['financial-literacy'].title)}${route('faq',t.pages.faq.title)}</div><div class="core-footer-col core-footer-blue"><h2>${escape(t.nav.partners)}</h2>${route('partners',t.pages.partners.title)}${route('career-we-can',t.pages['career-we-can'].title)}${route('two-generational',t.pages['two-generational'].title)}${route('resources',t.pages.resources.title)}</div><div class="core-footer-col core-footer-lime"><h2>${escape(t.donate)} / ${escape(t.nav['get-involved'])}</h2>${route('donate',t.pages.donate.title)}${route('advocate',t.pages.advocate.title)}${route('volunteer',t.pages.volunteer.title)}${route('events',t.pages.events.title)}${route('wish-list',t.pages['wish-list'].title)}</div></div><div class="core-wrap core-footer-bottom">${site.stage==='development'?`<p>${escape(t.footerNote)}</p>`:''}<div>${route('about',t.nav.about)}${route('history',t.pages.history.title)}${route('news',t.pages.news.title)}${route('contact',t.contactLabel)}</div></div>`;

      configureSearch(t);
      status.textContent = '';
      motion?.enhance(root,{view,page,language});
      if (moveFocus) {
        view.querySelector('h1')?.focus({preventScroll:true});
        view.scrollIntoView({block:'start'});
        status.textContent = `${t.pageChanged} ${title}`;
      }
    }

    root.addEventListener('error', event => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.matches('[data-core-image]')) return;
      const original = safeHttps(img.dataset.originalSrc);
      if (original && !img.dataset.coreRetried) {
        img.dataset.coreRetried = 'true';
        img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = original;
        img.closest('[data-media-id]').dataset.mediaProvider = 'original-fallback';
        return;
      }
      img.hidden = true;
      const holder = img.closest('[data-media-id]');
      holder?.classList.add('core-media-unavailable');
      const fallback = holder?.querySelector('.core-media-fallback');
      if (fallback) {
        fallback.hidden = false;
        if (img.alt) fallback.textContent = `${locales[language].mediaUnavailable} ${img.alt}`;
      }
    }, {capture:true, signal});

    root.addEventListener('click', event => {
      const target = event.target.closest('button, a, summary');
      if (!target || !root.contains(target)) return;

      if (target.matches('[data-core-menu]')) {
        const open = target.getAttribute('aria-expanded') !== 'true';
        target.setAttribute('aria-expanded', String(open));
        root.querySelector('#core-nav').dataset.open = String(open);
      }
      if (target.matches('[data-core-search-open]')) {
        root.querySelectorAll('.core-nav-group[open]').forEach(details => details.removeAttribute('open'));
        searchController?.open();
      }
      if (target.matches('[data-core-dialog-close]')) {
        target.closest('dialog')?.close();
      }
      if (target.matches('[data-core-backtop]')) {
        globalThis.scrollTo({top:0,behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      }
      if (target.matches('[data-core-scroll]')) {
        root.querySelector(`#${CSS.escape(target.dataset.coreScroll)}`)?.scrollIntoView({behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      }
      if (target.matches('[data-core-lightbox]')) openLightbox(target);
      if (target.matches('[data-core-pending]')) status.textContent = locales[language].integrationPending;
      if (target.matches('.core-skip')) {
        event.preventDefault();
        view.focus();
        view.scrollIntoView({block:'start'});
      }
      if (target.tagName === 'A') {
        root.querySelector('#core-nav').dataset.open = 'false';
        root.querySelector('[data-core-menu]')?.setAttribute('aria-expanded','false');
        root.querySelectorAll('.core-nav-group[open]').forEach(details => details.removeAttribute('open'));
        searchDialog.open && searchDialog.close();
        if (target.getAttribute('href') === location.hash) {
          event.preventDefault();
          render(true);
        }
      }
      if (target.tagName === 'SUMMARY') {
        const current = target.parentElement;
        root.querySelectorAll('.core-nav-group[open]').forEach(details => {
          if (details !== current) details.removeAttribute('open');
        });
      }
    }, {signal});

    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const nav = root.querySelector('#core-nav');
      if (nav.dataset.open === 'true') {
        nav.dataset.open = 'false';
        const menu = root.querySelector('[data-core-menu]');
        menu.setAttribute('aria-expanded','false');
        menu.focus();
      }
      root.querySelectorAll('.core-nav-group[open]').forEach(details => details.removeAttribute('open'));
    }, {signal});

    window.addEventListener('keydown', event => {
      const editable=event.target instanceof HTMLElement && (event.target.matches('input,textarea,select') || event.target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k') {
        event.preventDefault();
        searchController?.open();
      } else if (event.key==='/' && !editable && !searchDialog.open) {
        event.preventDefault();
        searchController?.open();
      }
    }, {signal});

    window.addEventListener('pointerdown', event => {
      if (!header.contains(event.target)) {
        root.querySelectorAll('.core-nav-group[open]').forEach(details => details.removeAttribute('open'));
        const nav=root.querySelector('#core-nav');
        if (nav?.dataset.open==='true') {
          nav.dataset.open='false';
          root.querySelector('[data-core-menu]')?.setAttribute('aria-expanded','false');
        }
      } else if (!event.target.closest('.core-nav-group') && !event.target.closest('[data-core-menu]')) {
        root.querySelectorAll('.core-nav-group[open]').forEach(details => details.removeAttribute('open'));
      }
    }, {signal});

    searchDialog.addEventListener('click', event => {
      if (event.target === searchDialog) searchDialog.close();
    }, {signal});
    lightboxDialog.addEventListener('click', event => {
      if (event.target === lightboxDialog) lightboxDialog.close();
    }, {signal});

    window.addEventListener('hashchange', () => render(true), {signal});
    render();
  }

  window.__coreWorkspaceBoot = boot;
  document.addEventListener('DOMContentLoaded', boot, {once:true});
  document.addEventListener('hydrationDone', boot);
  if (document.readyState !== 'loading') boot();
})();
