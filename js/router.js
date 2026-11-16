/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== NAV / ROUTER ===================== */
const TITLES={today:['Today','Your daily check-in'],analytics:['Analytics','Progress, trends & consistency'],
  workflow:['Workflow','Your research stages & milestones'],projects:['Projects','Run work in parallel'],
  deadlines:['Deadlines & Goals','Stay ahead of what matters'],papers:['Papers','Literature reading tracker'],
  habits:['Daily Rhythm','Your daily habits & weekly anchors'],focus:['Focus & Time','Deep-work sessions & hours'],reviews:['Reviews','Weekly & monthly reflection'],
  settings:['Settings','Profile, weekends & data'],guide:['Research Guide','How to do great research']};
let curTab='today';
function go(tab){ curTab=tab;
  $$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  $$('.page').forEach(p=>p.classList.remove('active'));
  $('#page-'+tab).classList.add('active');
  $('#pageTitle').textContent=TITLES[tab][0]; $('#pageSub').textContent=TITLES[tab][1];
  toggleNav(false);
  renderActive(); window.scrollTo(0,0);
}
function renderActive(){ const f={today:renderToday,analytics:renderAnalytics,workflow:renderWorkflow,
  projects:renderProjects,deadlines:renderDeadlines,papers:renderPapers,habits:renderHabits,focus:renderFocus,
  reviews:renderReviews,settings:renderSettings,guide:renderGuide}[curTab]; if(f) f(); renderStreak(); }

/* ===================== MODAL ===================== */
function openModal(html,wide){ const m=$('#modal'); m.className='modal'+(wide?' wide':''); m.innerHTML=html; $('#scrim').classList.add('on'); }
function closeModal(){ $('#scrim').classList.remove('on'); }
function modalShell(title,body,footer){ return `<div class="mh"><h3>${esc(title)}</h3><button class="iconbtn" onclick="closeModal()">✕</button></div><div class="mb">${body}</div><div class="mf">${footer}</div>`; }

/* ===================== PROJECT SWITCHER ===================== */
function renderProjSwitch(){ const sel=$('#projSwitch'); const cur=state.activeProjectId||'__all__';
  let opts='<option value="__all__">All projects (overview)</option>';
  state.projects.forEach(p=>opts+=`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)}${p.isPrimary?' ★':''}${p.trackingMode==='adhoc'?' · ad-hoc':''}</option>`);
  if(cur==='__all__') sel.value='__all__';
  sel.innerHTML=opts; sel.value=cur;
  $('#projDot').style.background=cur==='__all__'?'var(--ink-3)':projColor(cur);
  if(state.profile){ const fn=(state.profile.name||'').trim().split(/\s+/)[0];
    const appName=(fn?fn+"'s ":'')+'Research Compass'; const bn=$('#brandName'); if(bn)bn.textContent=appName;
    const fld=(state.profile.field||'').split(' / ')[0]; $('#brandSub').textContent=(state.profile.level||'')+(fld?' · '+fld:'');
    try{document.title=appName;}catch(e){} }
}


/* ===================== THEME (light / dark) ===================== */
function applyTheme(t){ var d=document.documentElement; if(t==='dark') d.classList.add('dark'); else d.classList.remove('dark'); var b=document.getElementById('themeBtn'); if(b) b.textContent=(t==='dark')?'☀️':'🌙'; }
function toggleTheme(){ state.settings.theme=(state.settings.theme==='dark')?'light':'dark'; applyTheme(state.settings.theme); save(); if(typeof renderActive==='function') renderActive(); }
function chAxis(){ return document.documentElement.classList.contains('dark')?'#d7c6bc':'#78716c'; }
function chSplit(){ return document.documentElement.classList.contains('dark')?'#463a41':'#ffe0d6'; }
