/* Browser-native SPA. No authentication, CRM API calls, or public secrets. */
(() => {
  'use strict';
  if (window.__coreWorkspaceBoot) {
    document.addEventListener('hydrationDone', window.__coreWorkspaceBoot);
    window.__coreWorkspaceBoot();
    return;
  }
  let currentRoot;
  let teardown = () => {};
  const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeHttps = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
  function boot() {
    const root = document.getElementById('core-app');
    if (!root) return;
    if (root === currentRoot && root.querySelector('[data-core-ready]')) return;
    teardown();
    let data;
    try { data = JSON.parse(root.querySelector('[data-core-payload]').textContent); }
    catch (error) { console.error('CORE preview configuration could not be read.', error); return; }
    const {site, locales} = data;
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
    function render(moveFocus = false) {
      const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      let preferred = site.defaultLanguage;
      try { preferred = localStorage.getItem('core-language') || preferred; } catch { /* Storage may be blocked. */ }
      language = site.languages.includes(parts[0]) ? parts[0] : (site.languages.includes(preferred) ? preferred : site.defaultLanguage);
      page = parts.length === 0 ? 'home' : (site.languages.includes(parts[0]) && parts.length <= 2 ? parts[1] || 'home' : '__not-found');
      if (!paths.has(page)) page = '__not-found';
      const t = locales[language];
      root.lang = language;
      if (document.body.dataset.coreStandalone === 'true') document.documentElement.lang = language;
      try { localStorage.setItem('core-language', language); } catch { /* Optional preference only. */ }
      root.querySelector('[data-core-banner]').textContent = t.preview;
      const other = language === 'en' ? 'es' : 'en';
      header.innerHTML = `<div class="core-wrap core-header-top" data-core-ready>
        ${route('home', 'CORE', 'core-site-name')}<small>${escape(t.workspace)}</small>
        <button type="button" class="core-button core-button-secondary core-menu" aria-controls="core-nav" aria-expanded="false" data-core-menu>${escape(t.menu)}</button>
        <div class="core-utilities"><a class="core-language" lang="${other}" hreflang="${other}" href="${href(page === '__not-found' ? 'home' : page, other)}">${other === 'es' ? 'Español' : 'English'}</a>${integration(t.login, site.integrations.portalUrl)}${integration(t.donate, site.integrations.donationUrl)}</div></div>
        <nav id="core-nav" class="core-wrap core-nav" aria-label="${escape(t.navLabel)}">${Object.entries(t.nav).map(([id,label]) => `<a href="${href(id)}"${page === id ? ' aria-current="page"' : ''}>${escape(label)}</a>`).join('')}</nav>`;
      const cards = `<div class="core-grid">${t.programs.map(p => `<article class="core-card" data-program="${p.id}"><h3>${escape(p.title)}</h3><p>${escape(p.intro)}</p>${route(p.id,p.action)}</article>`).join('')}</div>`;
      let title;
      if (page === 'home') {
        title = t.home.title;
        view.innerHTML = `<section class="core-hero"><div class="core-wrap"><p class="core-eyebrow">${escape(t.home.eyebrow)}</p><h1 tabindex="-1">${escape(title)}</h1><p><strong>${escape(t.home.intro)}</strong></p><p>${escape(t.home.support)}</p><div class="core-actions">${route('programs',t.home.primary,'core-button core-button-secondary')}${route('families',t.home.secondary,'core-button core-button-secondary')}</div></div></section><section class="core-section core-wrap"><h2>${escape(t.home.programTitle)}</h2><p>${escape(t.home.programIntro)}</p>${cards}</section><section class="core-section core-soft"><div class="core-wrap"><h2>${escape(t.home.nextTitle)}</h2><p>${escape(t.home.nextIntro)}</p><p>${escape(t.draftNote)}</p></div></section>`;
      } else {
        const program = t.programs.find(p => p.id === page);
        const entry = t.pages[page] || (program ? {...program, detail:t.draftNote} : {title:t.notFoundTitle,intro:t.notFoundIntro,detail:t.draftNote});
        title = entry.title;
        view.innerHTML = `<section class="core-section core-wrap"><p class="core-eyebrow">CORE</p><h1 tabindex="-1">${escape(title)}</h1><p>${escape(entry.intro)}</p><p>${escape(entry.detail)}</p>${page === 'programs' ? cards : ''}<div class="core-actions">${route('contact',t.contactLabel,'core-button')}${route('home',t.homeLink,'core-button core-button-secondary')}</div></section>`;
      }
      document.title = `${title} | CORE`;
      root.querySelector('[data-core-footer]').innerHTML = `<div class="core-wrap"><p><strong>CORE</strong></p><p>${escape(t.footerNote)}</p><p><a href="mailto:${escape(site.contact.email)}">${escape(site.contact.email)}</a> / <a href="${escape(site.contact.phoneHref)}">${escape(site.contact.phoneLabel)}</a></p><p>${escape(site.contact.address)}</p></div>`;
      status.textContent = '';
      if (moveFocus) { view.querySelector('h1').focus({preventScroll:true}); view.scrollIntoView({block:'start'}); status.textContent = `${t.pageChanged} ${title}`; }
    }
    root.addEventListener('click', event => {
      const target = event.target.closest('button, a');
      if (!target || !root.contains(target)) return;
      if (target.matches('[data-core-menu]')) {
        const open = target.getAttribute('aria-expanded') !== 'true';
        target.setAttribute('aria-expanded', String(open));
        root.querySelector('#core-nav').dataset.open = String(open);
      }
      if (target.matches('[data-core-pending]')) status.textContent = locales[language].integrationPending;
      if (target.matches('.core-skip')) { event.preventDefault(); view.focus(); view.scrollIntoView({block:'start'}); }
      if (target.tagName === 'A' && target.getAttribute('href') === location.hash) { event.preventDefault(); render(true); }
    }, {signal});
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const nav = root.querySelector('#core-nav');
      if (nav.dataset.open !== 'true') return;
      nav.dataset.open = 'false';
      const menu = root.querySelector('[data-core-menu]');
      menu.setAttribute('aria-expanded','false'); menu.focus();
    }, {signal});
    window.addEventListener('hashchange', () => render(true), {signal});
    render();
  }
  window.__coreWorkspaceBoot = boot;
  document.addEventListener('DOMContentLoaded', boot, {once:true});
  document.addEventListener('hydrationDone', boot);
  if (document.readyState !== 'loading') boot();
})();
