/* Progressive motion and interaction layer for the CORE SPA. */
(() => {
  'use strict';
  let activeController = null;
  const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const finePointer = () => globalThis.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;

  function enhance(root, {view, page}) {
    activeController?.abort();
    activeController = new AbortController();
    const {signal} = activeController;
    const reduce = reducedMotion();
    const header = root.querySelector('[data-core-header]');
    const progress = root.querySelector('[data-core-scroll-progress]');
    const backTop = root.querySelector('[data-core-backtop]');
    const syncHeaderHeight = () => root.style.setProperty('--core-header-height', `${Math.ceil(header?.getBoundingClientRect().height || 0)}px`);
    syncHeaderHeight();
    if (header && 'ResizeObserver' in globalThis) {
      const headerObserver = new ResizeObserver(syncHeaderHeight);
      headerObserver.observe(header);
      signal.addEventListener('abort', () => headerObserver.disconnect(), {once:true});
    }

    if (!reduce && view?.animate) {
      view.animate(
        [{opacity: .25, transform: 'translate3d(0,14px,0)'}, {opacity: 1, transform: 'translate3d(0,0,0)'}],
        {duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)'}
      );
    }

    const revealTargets = [...view.querySelectorAll([
      '.core-content-section', '.core-card', '.core-audience-card', '.core-link-card',
      '.core-news-card', '.core-person-card', '.core-board article', '.core-timeline-item',
      '.core-resource-group', '.core-school-grid article', '.core-figure'
    ].join(','))];
    revealTargets.forEach((element, index) => {
      element.classList.add('core-reveal');
      element.style.setProperty('--core-reveal-delay', `${Math.min(index % 6, 5) * 55}ms`);
    });

    if (!reduce && 'IntersectionObserver' in globalThis) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }, {rootMargin: '0px 0px -8% 0px', threshold: .08});
      revealTargets.forEach(element => observer.observe(element));
      signal.addEventListener('abort', () => observer.disconnect(), {once:true});
    } else {
      revealTargets.forEach(element => element.classList.add('is-visible'));
    }

    const counters = [...view.querySelectorAll('.core-fact-grid strong')].filter(node => /^\d+$/.test(node.textContent.trim()));
    if (!reduce && 'IntersectionObserver' in globalThis && counters.length) {
      const countObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target.dataset.coreCounted) continue;
          entry.target.dataset.coreCounted = 'true';
          const target = Number(entry.target.textContent.trim());
          const start = performance.now();
          const duration = 850;
          const tick = now => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            entry.target.textContent = String(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          countObserver.unobserve(entry.target);
        }
      }, {threshold:.4});
      counters.forEach(node => countObserver.observe(node));
      signal.addEventListener('abort', () => countObserver.disconnect(), {once:true});
    }

    const sectionTargets = [...view.querySelectorAll('[data-core-section-anchor]')];
    if ('IntersectionObserver' in globalThis && sectionTargets.length) {
      const sectionObserver = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        root.querySelectorAll('[data-core-scroll]').forEach(button => {
          const current = button.dataset.coreScroll === visible.target.id;
          if (current) button.setAttribute('aria-current','true');
          else button.removeAttribute('aria-current');
        });
      }, {rootMargin:'-22% 0px -62% 0px', threshold:[.05,.2,.45,.7]});
      sectionTargets.forEach(element => sectionObserver.observe(element));
      signal.addEventListener('abort', () => sectionObserver.disconnect(), {once:true});
    }

    const playfulPage = ['home','programs','get-involved','news'].includes(page);
    if (finePointer() && !reduce && playfulPage) {
      const tiltTargets = [...view.querySelectorAll('.core-card, .core-audience-card, .core-link-card, .core-news-card')];
      for (const card of tiltTargets) {
        card.dataset.coreTilt = 'true';
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - .5;
          const y = (event.clientY - rect.top) / rect.height - .5;
          card.style.setProperty('--core-tilt-x', `${(-y * 2.4).toFixed(2)}deg`);
          card.style.setProperty('--core-tilt-y', `${(x * 3.2).toFixed(2)}deg`);
          card.style.setProperty('--core-glow-x', `${((x + .5) * 100).toFixed(0)}%`);
          card.style.setProperty('--core-glow-y', `${((y + .5) * 100).toFixed(0)}%`);
        }, {signal});
        card.addEventListener('pointerleave', () => {
          card.style.removeProperty('--core-tilt-x');
          card.style.removeProperty('--core-tilt-y');
          card.style.removeProperty('--core-glow-x');
          card.style.removeProperty('--core-glow-y');
        }, {signal});
      }
    }

    let ticking = false;
    const updateScroll = () => {
      ticking = false;
      const y = globalThis.scrollY || 0;
      const height = Math.max(1, document.documentElement.scrollHeight - globalThis.innerHeight);
      const percent = Math.max(0, Math.min(1, y / height));
      if (progress) progress.style.transform = `scaleX(${percent})`;
      header?.classList.toggle('is-scrolled', y > 30);
      syncHeaderHeight();
      if (backTop) backTop.hidden = y < 650;
      const hero = view.querySelector('.core-hero-visual, .core-page-photo');
      if (hero && !reduce) {
        const rect = hero.getBoundingClientRect();
        const offset = Math.max(-1, Math.min(1, (rect.top - globalThis.innerHeight * .45) / globalThis.innerHeight));
        hero.style.setProperty('--core-parallax-y', `${(offset * -12).toFixed(1)}px`);
      }
    };
    const requestScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScroll);
    };
    globalThis.addEventListener('scroll', requestScroll, {passive:true, signal});
    globalThis.addEventListener('resize', requestScroll, {passive:true, signal});
    updateScroll();

    for (const details of view.querySelectorAll('.core-faq details')) {
      details.addEventListener('toggle', () => {
        if (reduce || !details.open) return;
        const body = details.querySelector('div');
        body?.animate?.(
          [{opacity:0, transform:'translate3d(0,-6px,0)'},{opacity:1, transform:'translate3d(0,0,0)'}],
          {duration:220, easing:'ease-out'}
        );
      }, {signal});
    }

    root.dataset.coreMotion = reduce ? 'reduced' : 'enhanced';
    root.dataset.corePage = page;
  }

  globalThis.COREMotion = Object.freeze({enhance});
})();
