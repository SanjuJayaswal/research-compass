/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== STORAGE ===================== */
const KEY='research_compass_v1';
let memFallback=null, usingMem=false;
function rawGet(){ try{ const v=localStorage.getItem(KEY); return v; }catch(e){ usingMem=true; return memFallback; } }
function rawSet(v){ try{ localStorage.setItem(KEY,v); }catch(e){ usingMem=true; memFallback=v; } }
function save(){ state.meta.updatedAt=Date.now(); rawSet(JSON.stringify(state)); }
function load(){ const v=rawGet(); if(v){ try{ return JSON.parse(v); }catch(e){} } return null; }

/* ===================== HELPERS ===================== */
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const uid=(p='id')=>p+Math.random().toString(36).slice(2,9);
const esc=s=>(s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
function dstr(d=new Date()){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function parseD(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(s,n){ const d=parseD(s); d.setDate(d.getDate()+n); return dstr(d); }
function tzNow(){ const tz=(state&&state.settings&&state.settings.timezone)||(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){return null}})();
  try{ const parts=new Intl.DateTimeFormat('en-GB',{timeZone:tz||undefined,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date());
    const g=t=>parts.find(x=>x.type===t).value; return {date:g('year')+'-'+g('month')+'-'+g('day'),hour:(+g('hour'))%24,minute:+g('minute')}; }
  catch(e){ const d=new Date(); return {date:dstr(d),hour:d.getHours(),minute:d.getMinutes()}; } }
function todayStr(){ return tzNow().date; }
function dowOf(s){ return parseD(s).getDay(); } // 0 Sun .. 6 Sat
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtNice(s){ const d=parseD(s); return DOW[d.getDay()]+', '+MON[d.getMonth()]+' '+d.getDate(); }
function fmtShort(s){ const d=parseD(s); return MON[d.getMonth()]+' '+d.getDate(); }
function daysBetween(a,b){ return Math.round((parseD(b)-parseD(a))/86400000); }
function isWeekend(s){ return (state.settings.weekendDays||[0,6]).includes(dowOf(s)); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('on'),2200); }

/* ===================== STARTER TEMPLATE ===================== */
function starterStages(){ return [
  'Literature Review & Gap Analysis','Research Question & Objectives','Experimental / Simulation Design',
  'Synthesis / Fabrication / Modeling','Characterization / Testing','Data Analysis & Interpretation',
  'Documentation & Lab Notebook','Writing (thesis / paper)','Dissemination & Defense'
].map((n,i)=>({id:uid('st'),name:n})); }
function starterMilestones(stages){ const find=t=>(stages.find(s=>s.name.includes(t))||{}).id;
  return [
    {id:uid('ms'),name:'Finalise research topic',targetDate:'',status:'todo',stageId:find('Research Question')},
    {id:uid('ms'),name:'Complete literature survey',targetDate:'',status:'todo',stageId:find('Literature')},
    {id:uid('ms'),name:'Objectives approved by advisor',targetDate:'',status:'todo',stageId:find('Research Question')},
    {id:uid('ms'),name:'First experiments / runs complete',targetDate:'',status:'todo',stageId:find('Characterization')},
    {id:uid('ms'),name:'Mid-thesis progress review',targetDate:'',status:'todo',stageId:find('Data Analysis')},
    {id:uid('ms'),name:'Draft first thesis chapter',targetDate:'',status:'todo',stageId:find('Writing')},
    {id:uid('ms'),name:'Submit thesis',targetDate:'',status:'todo',stageId:find('Dissemination')}
  ]; }
function defaultRoutine(){ return {
  nonNegotiables:['Read at least one paper or section','Update lab notebook / log results','Back up data & code',
    'One deep-work block on the main objective','Write a few lines (thesis or notes)','Plan tomorrow before stopping'],
  weeklyCadence:['Weekly literature scan (new papers in your area)','Prepare for and meet your advisor',
    'Weekly review & plan the week ahead','Tidy reference manager & data folders'],
  notes:'Edit these freely — they are guidance, not rules. Adapt them as your research evolves.'
};}
const PALETTE=['#ff7e5f','#feb47b','#ce6a57','#3f8f86','#e9a766','#9d5b7a','#ffad8f','#c25b43'];

/* ===================== STATE ===================== */
let state=load();
let firstRun=!state;
if(!state){
  state={
    meta:{version:1,createdAt:Date.now(),updatedAt:Date.now()},
    profile:{name:'',field:'Materials / Engineering',level:"Master's",topic:'',objectives:'',advisorDay:5,workStart:'09:00',workEnd:'18:00'},
    settings:{weekendDays:[0,6],weekendMode:'light',weekendIntentions:['Reading','Rest'],warnThreshold:70,reminderMorning:'08:30',reminderEvening:'20:00',theme:'light',onboarded:false},
    projects:[], routine:defaultRoutine(),
    logs:{}, papers:[], deadlines:[], timeSessions:[], reviews:{weekly:[],monthly:[]},
    activeProjectId:null
  };
}
// migrate safety
state.settings=Object.assign({weekendDays:[0,6],weekendMode:'light',weekendIntentions:['Reading','Rest'],warnThreshold:70,reminderMorning:'08:30',reminderEvening:'20:00',theme:'light',onboarded:false},state.settings||{});
state.settings.timezone=state.settings.timezone||(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){return 'Asia/Kolkata'}})();
if(state.settings.notify===undefined)state.settings.notify=true;
if(!state.settings.theme)state.settings.theme='light';
state.routine=state.routine||defaultRoutine();
state.reviews=state.reviews||{weekly:[],monthly:[]};
['projects','papers','deadlines','timeSessions'].forEach(k=>state[k]=state[k]||[]);
state.logs=state.logs||{};

/* ===================== PROJECT HELPERS ===================== */
function projects(){ return state.projects; }
function activeProjects(){ return state.projects.filter(p=>p.trackingMode==='daily'); }
function getProj(id){ return state.projects.find(p=>p.id===id); }
function curProj(){ return getProj(state.activeProjectId)||state.projects[0]||null; }
function setActiveProject(id){ if(id==='__all__'){ state.activeProjectId='__all__'; } else { state.activeProjectId=id; } save(); renderProjSwitch(); renderActive(); }
function projColor(id){ const p=getProj(id); return p?p.color:'#928c7d'; }
function newProject(opts={}){ const c=PALETTE[state.projects.length%PALETTE.length];
  const stages=opts.loadStarter?starterStages():[];
  return {id:uid('pr'),name:opts.name||'New Project',color:opts.color||c,isPrimary:!!opts.isPrimary,
    trackingMode:opts.trackingMode||'daily',priority:opts.priority||'normal',createdAt:Date.now(),
    workflow:{stages,currentStageId:stages[0]?stages[0].id:null},
    milestones:opts.loadStarter?starterMilestones(stages):[]}; }

/* ===================== LOG HELPERS ===================== */
function ensureLog(date,pid){ if(!state.logs[date]) state.logs[date]={byProject:{}};
  if(!state.logs[date].byProject[pid]) state.logs[date].byProject[pid]={tasks:[],did:'',learnings:'',results:'',blockers:'',planNext:[],papersRead:0,focusMinutes:0};
  return state.logs[date].byProject[pid]; }
function getLog(date,pid){ return (state.logs[date]&&state.logs[date].byProject[pid])||null; }
function dayCompletion(date,pid){ const l=getLog(date,pid); if(!l||!l.tasks.length) return null;
  const done=l.tasks.filter(t=>t.done).length; return Math.round(done/l.tasks.length*100); }
function overallCompletion(date){ const ps=activeProjects(); let done=0,total=0;
  ps.forEach(p=>{ const l=getLog(date,p.id); if(l){ done+=l.tasks.filter(t=>t.done).length; total+=l.tasks.length; } });
  return total?Math.round(done/total*100):null; }
function hasAnyLog(date){ const d=state.logs[date]; if(!d) return false;
  return Object.values(d.byProject).some(l=>l.tasks.length||l.did||l.learnings||l.results); }
