/* Lightweight, privacy-preserving full-content search for the public CORE SPA. */
(() => {
  'use strict';

  const aliases = {
    en: {
      families: ['join','enroll','enrollment','sign up','student application','family help','school supplies','food help','housing help'],
      partners: ['school partnership','teacher','administrator','educator','refer a student','referral','community partner'],
      'get-involved': ['help core','support core','ways to help','participate'],
      'character-development': ['character','confidence','resilience','empathy','life skills'],
      'career-awareness': ['career exploration','jobs','future careers','workplace','career awareness'],
      'financial-literacy': ['money','budget','saving','financial education','finance'],
      'leadership-development': ['leadership','leaders','emerging leaders'],
      'community-service': ['service','volunteer hours','50 hours','service learning'],
      'career-we-can': ['career partner','mentor','guest speaker','host students','job shadow','workplace tour'],
      'social-emotional-learning': ['sel','social emotional','emotional learning','wellbeing','well-being'],
      'two-generational': ['2gen','2 gen','two generation','parent academy','whole family'],
      donate: ['give','giving','gift','donor','donation','legacy gift','planned giving'],
      volunteer: ['volunteer','mentor','chaperone','guest speaker'],
      advocate: ['advocacy','share the mission','equity'],
      'wish-list': ['wishlist','wish list','school supplies','snacks','gift cards','hygiene'],
      events: ['calendar','event','upcoming events','register'],
      resources: ['help','family resources','scholarship','college savings','food','housing','health','ged'],
      faq: ['questions','cost','free program','ccsd','college','501c3','2gen'],
      about: ['team','staff','board','jobs at core','careers at core','executive director','jeff jones'],
      history: ['history','founded','dreamers','rogers foundation','tomchin'],
      contact: ['email','phone','address','contact'],
      news: ['stories','articles','equity speaks','latest news']
    },
    es: {
      families: ['unirse','inscribir','inscripción','estudiante','ayuda familiar','útiles escolares','alimentos','vivienda'],
      partners: ['alianza escolar','maestro','administrador','educador','referir estudiante','referencia','aliado comunitario'],
      'get-involved': ['ayudar a core','apoyar a core','formas de ayudar','participar'],
      'character-development': ['carácter','confianza','resiliencia','empatía','habilidades para la vida'],
      'career-awareness': ['exploración profesional','empleos','carreras','lugar de trabajo'],
      'financial-literacy': ['dinero','presupuesto','ahorro','educación financiera','finanzas'],
      'leadership-development': ['liderazgo','líderes'],
      'community-service': ['servicio','horas de voluntariado','50 horas','aprendizaje mediante servicio'],
      'career-we-can': ['aliado profesional','mentor','conferencista','recibir estudiantes','observación laboral'],
      'social-emotional-learning': ['sel','socioemocional','bienestar'],
      'two-generational': ['2gen','dos generaciones','parent academy','toda la familia'],
      donate: ['donar','donación','donante','regalo','legado'],
      volunteer: ['voluntariado','mentor','acompañar','conferencista'],
      advocate: ['abogar','abogacía','equidad'],
      'wish-list': ['lista de deseos','útiles escolares','refrigerios','tarjetas de regalo','higiene'],
      events: ['calendario','evento','eventos','registro'],
      resources: ['ayuda','recursos familiares','beca','ahorro universitario','alimentos','vivienda','salud','ged'],
      faq: ['preguntas','costo','gratis','ccsd','universidad','501c3','2gen'],
      about: ['equipo','personal','junta','empleos en core','trabajar en core','director ejecutivo','jeff jones'],
      history: ['historia','fundación','dreamers','rogers foundation','tomchin'],
      contact: ['correo','teléfono','dirección','contacto'],
      news: ['historias','artículos','equity speaks','noticias']
    }
  };

  const popular = {
    en: ['families','programs','resources','career-we-can','volunteer','donate'],
    es: ['families','programs','resources','career-we-can','volunteer','donate']
  };

  const groupMap = {
    programs: 'programs','character-development':'programs','career-awareness':'programs','financial-literacy':'programs',
    'leadership-development':'programs','community-service':'programs','career-we-can':'programs','social-emotional-learning':'programs',
    'two-generational':'programs',sprat:'programs','house-of-straus':'programs',score:'programs',
    families:'families',partners:'partners','get-involved':'get-involved',donate:'get-involved',volunteer:'get-involved',
    advocate:'get-involved','wish-list':'get-involved',events:'get-involved','jingle-in-july':'get-involved',
    resources:'resources',faq:'resources',about:'about',history:'about',contact:'about',news:'about',
    'who-gets-a-microphone':'about','who-gets-access-first':'about','equity-at-the-holidays':'about'
  };

  const normalize = value => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')
    .trim();

  const words = value => normalize(value).split(/\s+/).filter(Boolean);
  const compact = (value, max=180) => {
    const text=String(value ?? '').replace(/\s+/g,' ').trim();
    return text.length <= max ? text : text.slice(0,max-1).replace(/\s+\S*$/,'')+'…';
  };
  const flattenStrings = value => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(flattenStrings);
    if (value && typeof value === 'object') return Object.values(value).flatMap(flattenStrings);
    return [];
  };
  const uniq = values => [...new Set(values.map(x=>String(x||'').trim()).filter(Boolean))];

  function editDistance(a,b,max=2){
    if (Math.abs(a.length-b.length)>max) return max+1;
    const prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      let row=[i], best=row[0];
      for(let j=1;j<=b.length;j++){
        const v=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        row[j]=v; if(v<best) best=v;
      }
      if(best>max) return max+1;
      for(let j=0;j<row.length;j++) prev[j]=row[j];
    }
    return prev[b.length];
  }

  function pageGroupLabel(locale,id){
    const group=groupMap[id];
    return locale.nav?.[group] || locale.pages?.[group]?.title || 'CORE';
  }

  function makeDoc(id,page,locale,language){
    const title=page.title || id;
    const routeAliases=aliases[language]?.[id] || [];
    const slug = (()=>{ try { return new URL(page.sourcePath || '').pathname.replace(/\//g,' '); } catch { return ''; }})();
    const headings=uniq((page.sections||[]).map(x=>x.heading).concat((page.faqs||[]).map(x=>x.q),(page.resourceGroups||[]).map(x=>x.title)));
    const names=uniq([...(page.people||[]).flatMap(x=>[x.name,x.role]),...(page.board||[]).flatMap(x=>[x.name,x.role]),...(page.resourceGroups||[]).flatMap(g=>(g.items||[]).map(x=>x.label))]);
    const bodySegments=uniq([
      ...(page.sections||[]).flatMap(section=>[...(section.body||[]),...(section.bullets||[]),section.quote]),
      ...(page.faqs||[]).flatMap(x=>[x.q,x.a]),
      ...(page.timeline||[]).flatMap(x=>[x.date,x.text]),
      ...names
    ]);
    return {
      id,title,
      eyebrow:page.eyebrow || 'CORE',
      group:groupMap[id] || 'about',
      groupLabel:pageGroupLabel(locale,id),
      intro:page.intro || '',
      detail:page.detail || '',
      aliases:uniq([...routeAliases,id.replace(/-/g,' '),slug]),
      headings,names,bodySegments,
      titleN:normalize(title),
      aliasN:normalize(routeAliases.join(' ')+' '+id.replace(/-/g,' ')+' '+slug),
      headingsN:normalize(headings.join(' ')),
      namesN:normalize(names.join(' ')),
      introN:normalize(page.intro),
      detailN:normalize(page.detail),
      bodyN:normalize(bodySegments.join(' ')),
      allN:normalize(flattenStrings(page).join(' '))
    };
  }

  function buildIndex(locale,language){
    const docs=Object.entries(locale.pages||{}).map(([id,page])=>makeDoc(id,page,locale,language));
    docs.push({
      id:'home',title:locale.home.title,eyebrow:'CORE',group:'home',groupLabel:'CORE',
      intro:locale.home.support,detail:locale.home.mission || '',
      aliases:language==='es'?['inicio','core','estudiantes familias posibilidades']:['home','core','students families possibility'],
      headings:uniq([locale.home.programTitle,locale.home.galleryTitle,locale.home.missionTitle,locale.home.newsTitle]),
      names:[],bodySegments:uniq(flattenStrings(locale.home)),
      titleN:normalize(locale.home.title),
      aliasN:normalize(language==='es'?'inicio core estudiantes familias posibilidades':'home core students families possibility'),
      headingsN:normalize([locale.home.programTitle,locale.home.galleryTitle,locale.home.missionTitle,locale.home.newsTitle].join(' ')),
      namesN:'',introN:normalize(locale.home.support),detailN:normalize(locale.home.mission),
      bodyN:normalize(flattenStrings(locale.home).join(' ')),allN:normalize(flattenStrings(locale.home).join(' '))
    });
    return docs;
  }

  function score(doc,query){
    const q=normalize(query);
    if(!q) return 0;
    const tokens=words(q);
    let score=0;
    if(doc.titleN===q) score+=160;
    else if(doc.titleN.startsWith(q)) score+=125;
    else if(doc.titleN.includes(q)) score+=95;
    if(doc.aliasN.split(' ').join(' ').includes(q)) score+=85;
    if(doc.headingsN.includes(q)) score+=65;
    if(doc.namesN.includes(q)) score+=58;
    if(doc.introN.includes(q)) score+=48;
    if(doc.detailN.includes(q)) score+=36;
    if(doc.bodyN.includes(q)) score+=24;

    const titleTokens=words(doc.titleN);
    const aliasTokens=words(doc.aliasN);
    for(const token of tokens){
      if(doc.titleN.includes(token)) score+=20;
      if(doc.aliasN.includes(token)) score+=16;
      if(doc.headingsN.includes(token)) score+=13;
      if(doc.namesN.includes(token)) score+=11;
      if(doc.introN.includes(token)) score+=9;
      if(doc.detailN.includes(token)) score+=7;
      if(doc.bodyN.includes(token)) score+=4;
      if(token.length>=4 && !doc.titleN.includes(token)){
        let best=3;
        for(const candidate of [...titleTokens,...aliasTokens]) {
          if(Math.abs(candidate.length-token.length)>2) continue;
          best=Math.min(best,editDistance(token,candidate,2));
          if(best===0) break;
        }
        if(best===1) score+=13;
        else if(best===2 && token.length>=5) score+=6;
      }
    }
    const matched=tokens.filter(token=>doc.allN.includes(token)).length;
    if(tokens.length>1 && matched===tokens.length) score+=18;
    else if(matched===0 && score<20) return 0;
    return score;
  }

  function excerpt(doc,query){
    const tokens=words(query);
    const candidates=[...doc.headings,...doc.bodySegments,doc.intro,doc.detail].filter(Boolean);
    const hit=candidates.find(text=>tokens.some(token=>normalize(text).includes(token)));
    return compact(hit || doc.intro || doc.detail || doc.eyebrow);
  }

  function results(index,query){
    return index.map(doc=>({doc,score:score(doc,query)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score || a.doc.title.localeCompare(b.doc.title))
      .slice(0,10)
      .map(x=>({...x,excerpt:excerpt(x.doc,query)}));
  }

  function mount(dialog,{locale,language,href,signal}){
    const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ui=language==='es'
      ? {title:'Explorar CORE',intro:'Busque programas, recursos, personas, preguntas frecuentes y formas de participar.',placeholder:'Buscar en CORE…',close:'Cerrar',popular:'Rutas populares',results:'Resultados',noResults:'No encontramos resultados.',try:'Pruebe con “recursos”, “mentor”, “beca” o “familias”.',count:n=>`${n} resultado${n===1?'':'s'}`}
      : {title:'Explore CORE',intro:'Search programs, resources, people, FAQs, and ways to participate.',placeholder:'Search CORE…',close:'Close',popular:'Popular paths',results:'Results',noResults:'No results found.',try:'Try “resources,” “mentor,” “scholarship,” or “families.”',count:n=>`${n} result${n===1?'':'s'}`};
    const index=buildIndex(locale,language);
    let active=-1;
    let visible=[];
    dialog.innerHTML=`<div class="core-dialog-shell core-search-shell"><div class="core-dialog-head"><div><p class="core-eyebrow">CORE</p><h2>${e(ui.title)}</h2><p>${e(ui.intro)}</p></div><button type="button" class="core-dialog-close" data-core-dialog-close aria-label="${e(ui.close)}">×</button></div><label class="core-search-label"><span class="core-sr-only">${e(ui.placeholder)}</span><span class="core-search-input-wrap"><span aria-hidden="true">⌕</span><input type="search" data-core-search-input placeholder="${e(ui.placeholder)}" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="core-search-results" aria-autocomplete="list"></span></label><div class="core-search-toolbar"><strong data-core-search-heading>${e(ui.popular)}</strong><span aria-live="polite" data-core-search-count></span></div><div id="core-search-results" class="core-search-results" role="listbox" data-core-search-results></div></div>`;
    const input=dialog.querySelector('[data-core-search-input]');
    const box=dialog.querySelector('[data-core-search-results]');
    const heading=dialog.querySelector('[data-core-search-heading]');
    const count=dialog.querySelector('[data-core-search-count]');

    const render=(query='')=>{
      active=-1;
      const clean=query.trim();
      let items;
      if(!clean){
        const ids=popular[language]||popular.en;
        items=ids.map(id=>({doc:index.find(x=>x.id===id),score:0,excerpt:index.find(x=>x.id===id)?.intro||''})).filter(x=>x.doc);
        heading.textContent=ui.popular;
        count.textContent='';
      }else{
        items=results(index,clean);
        heading.textContent=ui.results;
        count.textContent=ui.count(items.length);
      }
      visible=items;
      if(!items.length){
        box.innerHTML=`<div class="core-search-empty"><strong>${e(ui.noResults)}</strong><p>${e(ui.try)}</p></div>`;
        input.removeAttribute('aria-activedescendant');
        return;
      }
      box.innerHTML=items.map(({doc,excerpt},i)=>`<a id="core-search-result-${i}" href="${e(href(doc.id))}" role="option" aria-selected="false" data-core-search-result data-search-index="${i}" data-search-group="${e(doc.group)}"><span class="core-search-result-accent" aria-hidden="true"></span><span class="core-search-result-copy"><span class="core-search-result-top"><strong>${e(doc.title)}</strong><small>${e(doc.groupLabel)}</small></span><span class="core-search-excerpt">${e(excerpt)}</span></span><span class="core-search-arrow" aria-hidden="true">→</span></a>`).join('');
    };

    const select=indexValue=>{
      const nodes=[...box.querySelectorAll('[data-core-search-result]')];
      if(!nodes.length) return;
      active=(indexValue+nodes.length)%nodes.length;
      nodes.forEach((node,i)=>{node.dataset.active=String(i===active);node.setAttribute('aria-selected',String(i===active));});
      const selected=nodes[active];
      input.setAttribute('aria-activedescendant',selected.id);
      selected.scrollIntoView({block:'nearest'});
    };

    input.addEventListener('input',()=>render(input.value),{signal});
    input.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'){event.preventDefault();select(active+1);}
      else if(event.key==='ArrowUp'){event.preventDefault();select(active<=0?visible.length-1:active-1);}
      else if(event.key==='Enter' && active>=0){
        const selected=box.querySelector(`[data-search-index="${active}"]`);
        if(selected){event.preventDefault();selected.click();}
      }
    },{signal});
    render('');
    return {
      reset(){input.value='';render('');},
      focus(){input.focus();},
      open(){this.reset();dialog.showModal?.();requestAnimationFrame(()=>input.focus());}
    };
  }

  globalThis.CORESiteSearch=Object.freeze({normalize,buildIndex,results,mount});
})();