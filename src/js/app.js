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
    const paths = new Set(['home', ...Object.keys(locales.en.pages), ...locales.en.programs.map(p => p.id)]);
    let language = site.defaultLanguage;
    let page = 'home';
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
      return `<figure class="core-figure ${className}">${image(id, {eager, decorative: contain, className: contain ? 'core-media-contain' : ''})}${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`;
    }
    function gallery(ids) {
      return `<div class="core-photo-grid">${ids.map(id => figure(id)).join('')}</div>`;
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
      if (document.body.dataset.coreStandalone === 'true') document.documentElement.lang = language;
      try { localStorage.setItem('core-language', language); } catch { /* Optional preference. */ }
      root.querySelector('[data-core-banner]').textContent = t.preview;
      const other = language === 'en' ? 'es' : 'en';
      const logo = image(bindings.logo, {className: 'core-logo', eager: true, sizes: '(max-width: 48rem) 260px, 300px'});
      header.innerHTML = `<div class="core-wrap core-header-top" data-core-ready>
        <a class="core-brand" href="${href('home')}">${logo}</a>
        <button type="button" class="core-button core-button-secondary core-menu" aria-controls="core-nav" aria-expanded="false" data-core-menu>${escape(t.menu)}</button>
        <div class="core-utilities"><a class="core-language" lang="${other}" hreflang="${other}" href="${href(page === '__not-found' ? 'home' : page, other)}">${other === 'es' ? 'Espa\u00f1ol' : 'English'}</a>${integration(t.login, site.integrations.portalUrl)}${site.integrations.donationUrl ? integration(t.donate, site.integrations.donationUrl) : route('donate',t.donate,'core-button')}</div></div>
        <nav id="core-nav" class="core-wrap core-nav" aria-label="${escape(t.navLabel)}">${Object.entries(t.nav).map(([id,label]) => `<a href="${href(id)}"${page === id ? ' aria-current="page"' : ''}>${escape(label)}</a>`).join('')}</nav>`;
      const cards = `<div class="core-grid">${t.programs.map(p => `<article class="core-card" data-program="${p.id}">${image(bindings.programs[p.id].icon, {className:'core-program-icon', decorative:true, sizes:'72px'})}<h3>${escape(p.title)}</h3><p>${escape(p.intro)}</p>${route(p.id,p.action)}</article>`).join('')}</div>`;
      let title;
      if (page === 'home') {
        title = t.home.title;
        view.innerHTML = `<section class="core-hero"><div class="core-wrap core-split"><div class="core-hero-copy"><p class="core-eyebrow">${escape(t.home.eyebrow)}</p><h1 tabindex="-1">${escape(title)}</h1><p class="core-lead"><strong>${escape(t.home.intro)}</strong></p><p>${escape(t.home.support)}</p><div class="core-actions">${route('programs',t.home.primary,'core-button core-button-ink')}${route('families',t.home.secondary,'core-button core-button-secondary')}</div></div><div class="core-hero-visual">${figure(bindings.homeHero,'core-hero-photo',true)}${image(bindings.decoration,{className:'core-hero-decoration',decorative:true,sizes:'100px'})}</div></div></section>
        <section class="core-section core-wrap"><p class="core-eyebrow">${escape(t.home.programEyebrow)}</p><h2>${escape(t.home.programTitle)}</h2><p>${escape(t.home.programIntro)}</p>${cards}</section>
        <section class="core-section core-soft"><div class="core-wrap"><h2>${escape(t.home.galleryTitle)}</h2><p>${escape(t.home.galleryIntro)}</p>${gallery(bindings.homeGallery)}</div></section>
        <section class="core-section core-wrap"><h2>${escape(t.home.nextTitle)}</h2><p>${escape(t.home.nextIntro)}</p><div class="core-grid core-audience-grid">${['families','partners','get-involved'].map(id => `<article class="core-audience-card"><h3>${escape(t.nav[id])}</h3><p>${escape(t.pages[id].intro)}</p>${route(id,t.audienceActions[id])}</article>`).join('')}</div></section>`;
        view.insertAdjacentHTML('beforeend', rich.home(t,route,figure));
      } else {
        const program = t.programs.find(p => p.id === page);
        const entry = t.pages[page] || (program ? {...program, detail:t.draftNote} : {title:t.notFoundTitle,intro:t.notFoundIntro,detail:t.draftNote});
        title = entry.title;
        const heroId = entry.heroMedia || (program ? bindings.programs[page].hero : bindings.pages[page]);
        const actions = `<div class="core-actions">${route('contact',t.contactLabel,'core-button')}${route('home',t.homeLink,'core-button core-button-secondary')}</div>`;
        view.innerHTML = `<section class="core-section core-page-top"${program ? ` data-program="${page}"` : ''}><div class="core-wrap ${heroId ? 'core-split' : ''}"><div><p class="core-eyebrow">${escape(entry.eyebrow || 'CORE')}</p>${entry.status ? `<span class="core-status">${escape(entry.status)}</span>` : ''}<h1 tabindex="-1">${escape(title)}</h1><p class="core-lead">${escape(entry.intro)}</p><p>${escape(entry.detail)}</p>${actions}</div>${heroId ? figure(heroId,'core-page-photo',true) : ''}</div></section>${page === 'programs' ? `<section class="core-section core-wrap"><h2>${escape(t.home.programTitle)}</h2>${cards}</section>` : ''}`;
        if (page === 'families') {
          view.insertAdjacentHTML('beforeend', `<section class="core-section core-wrap"><h2>${escape(t.schoolsTitle)}</h2><p>${escape(t.schoolYearNote)}</p><div class="core-school-grid">${bindings.schools.map((id,i) => `<article>${figure(id)}<h3>${escape(t.schoolNames[i])}</h3></article>`).join('')}</div></section>`);
        }
        if (page === 'resources') {
          view.insertAdjacentHTML('beforeend', `<section class="core-section core-wrap core-resource-feature">${figure(bindings.reportCover)}<div><h2>${escape(t.reportTitle)}</h2><p>${escape(t.reportIntro)}</p><a class="core-button" href="https://corewecan.org/resources/">${escape(t.currentResources)}</a></div></section>`);
        }
        if (program && page !== 'financial-literacy') {
          const ids = page === 'character-development' ? ['character-development-photo','community-service-photo','creative-learning-photo'] : ['career-exploration-photo','partner-visit-photo','creative-learning-photo'];
          view.insertAdjacentHTML('beforeend', `<section class="core-section core-wrap"><h2>${escape(t.home.galleryTitle)}</h2><p>${escape(t.archiveNote)}</p>${gallery(ids)}</section>`);
        }
        view.insertAdjacentHTML('beforeend', rich.page(entry,page,t,{route,figure,gallery}));
      }
      document.title = `${title} | CORE`;
      root.querySelector('[data-core-footer]').innerHTML = `<div class="core-wrap core-footer-grid"><div><a class="core-brand" href="${href('home')}">${image(bindings.logo,{className:'core-logo core-footer-logo',sizes:'280px'})}</a><p>${escape(t.footerNote)}</p>${rich.footer(t,route)}</div><div><h2>${escape(t.contactLabel)}</h2><p><a href="mailto:${escape(site.contact.email)}">${escape(site.contact.email)}</a></p><p><a href="${escape(site.contact.phoneHref)}">${escape(site.contact.phoneLabel)}</a></p><p>${escape(site.contact.address)}</p></div></div>`;
      status.textContent = '';
      if (moveFocus) { view.querySelector('h1').focus({preventScroll:true}); view.scrollIntoView({block:'start'}); status.textContent = `${t.pageChanged} ${title}`; }
    }
    // A failed GHL asset falls back to its original host once, never to a private GitHub URL.
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
      holder.classList.add('core-media-unavailable');
      const fallback = holder.querySelector('.core-media-fallback');
      fallback.hidden = false;
      if (img.alt) fallback.textContent = `${locales[language].mediaUnavailable} ${img.alt}`;
    }, {capture:true, signal});
    root.addEventListener('click', event => {
      const target = event.target.closest('button, a');
      if (!target || !root.contains(target)) return;
      if (target.matches('[data-core-menu]')) {
        const open = target.getAttribute('aria-expanded') !== 'true';
        target.setAttribute('aria-expanded', String(open)); root.querySelector('#core-nav').dataset.open = String(open);
      }
      if (target.matches('[data-core-pending]')) status.textContent = locales[language].integrationPending;
      if (target.matches('.core-skip')) { event.preventDefault(); view.focus(); view.scrollIntoView({block:'start'}); }
      if (target.tagName === 'A' && target.getAttribute('href') === location.hash) { event.preventDefault(); render(true); }
    }, {signal});
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const nav = root.querySelector('#core-nav');
      if (nav.dataset.open !== 'true') return;
      nav.dataset.open = 'false'; const menu = root.querySelector('[data-core-menu]'); menu.setAttribute('aria-expanded','false'); menu.focus();
    }, {signal});
    window.addEventListener('hashchange', () => render(true), {signal});
    render();
  }
  window.__coreWorkspaceBoot = boot;
  document.addEventListener('DOMContentLoaded', boot, {once:true});
  document.addEventListener('hydrationDone', boot);
  if (document.readyState !== 'loading') boot();
})();
