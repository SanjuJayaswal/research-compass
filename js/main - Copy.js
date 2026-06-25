/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== INIT ===================== */
function startApp(){
  if(window.__appStarted) return; window.__appStarted=true;
  applyTheme((state.settings&&state.settings.theme)||'light');
  $$('#nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
  renderProjSwitch();
  if(!state.settings.onboarded){ renderToday(); openOnboarding(); }
  else { go('today'); }
  startReminderEngine();
}
/* Boot behind Supabase auth when available; fall back to local-only if cloud is unreachable. */
if(typeof initCloudAndBoot==='function'){ initCloudAndBoot(); } else { startApp(); }
