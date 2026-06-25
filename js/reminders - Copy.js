/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== REMINDER / NOTIFICATION ENGINE ===================== */
let _activeNotif=null;
function notifKey(date,type){ return date+':'+type; }
function reminderDue(){ const s=state.settings; if(s.notify===false) return [];
  const n=tzNow(); const date=n.date; const mins=n.hour*60+n.minute;
  if(isWeekend(date)&&s.weekendMode!=='active') return [];
  const out=[]; const store=s._notif||{};
  [['morning',s.reminderMorning],['evening',s.reminderEvening]].forEach(([type,tstr])=>{ if(!tstr)return;
    const [h,m]=tstr.split(':').map(Number); const rmin=h*60+m; const st=store[notifKey(date,type)];
    if(st==='dismissed') return; if(typeof st==='number'&&Date.now()<st) return;
    if(mins>=rmin) out.push(type); });
  return out; }
function checkReminders(){ const due=reminderDue(); const dot=$('#bellDot'); if(dot)dot.style.display=due.length?'block':'none';
  if(due.length){ const type=due.includes('evening')?'evening':'morning'; if(_activeNotif!==type) showNotif(type); } }
function notifContent(type){ const t=todayStr(); const dl=state.deadlines.filter(d=>!d.done&&d.date&&daysBetween(t,d.date)>=0&&daysBetween(t,d.date)<=1);
  const extra=dl.length?`<div class="mut3" style="font-size:12px;margin-top:6px">⏳ Due soon: ${dl.map(d=>esc(d.title)).join(', ')}</div>`:'';
  if(type==='morning') return {icon:'☀️',title:'Plan your day',body:"Set today's tasks and pick your top priorities tied to a milestone.",extra};
  return {icon:'🌙',title:'Evening check-in',body:"Log what you did, key learnings & results — then set tomorrow's plan.",extra}; }
function showNotif(type){ _activeNotif=type; const c=notifContent(type); const w=$('#notifWrap'); if(!w)return;
  w.innerHTML=`<div class="notif-card"><div class="flex" style="align-items:flex-start;gap:10px"><span style="font-size:22px">${c.icon}</span>
    <div style="flex:1"><b>${c.title}</b><div class="muted" style="font-size:13px;margin-top:2px">${c.body}</div>${c.extra}</div>
    <button class="iconbtn" onclick="dismissNotif('${type}')">✕</button></div>
    <div class="flex mt14" style="gap:8px"><button class="btn sm" onclick="openFromNotif('${type}')">Open check-in</button>
    <button class="btn ghost sm" onclick="snoozeNotif('${type}')">Snooze 30m</button></div></div>`;
  try{ if('Notification'in window&&Notification.permission==='granted') new Notification('Research Compass · '+c.title,{body:c.body}); }catch(e){} }
function clearNotifUI(){ _activeNotif=null; const w=$('#notifWrap'); if(w)w.innerHTML=''; }
function setNotif(type,val){ state.settings._notif=state.settings._notif||{}; state.settings._notif[notifKey(todayStr(),type)]=val; pruneNotif(); save(); }
function dismissNotif(type){ setNotif(type,'dismissed'); clearNotifUI(); checkReminders(); }
function snoozeNotif(type){ setNotif(type,Date.now()+30*60000); clearNotifUI(); checkReminders(); toast('Snoozed 30 min'); }
function openFromNotif(type){ setNotif(type,'dismissed'); clearNotifUI(); go('today'); checkReminders(); }
function pruneNotif(){ const store=state.settings._notif||{}; const keep={}; const cut=addDays(todayStr(),-3); Object.keys(store).forEach(k=>{ if(k.split(':')[0]>=cut) keep[k]=store[k]; }); state.settings._notif=keep; }
function nextReminderText(){ const s=state.settings; const n=tzNow(); const mins=n.hour*60+n.minute; const toMin=x=>{const[a,b]=x.split(':').map(Number);return a*60+b;};
  if(isWeekend(n.date)&&s.weekendMode!=='active') return 'paused for the weekend'; if(mins<toMin(s.reminderMorning)) return 'morning nudge at '+s.reminderMorning; if(mins<toMin(s.reminderEvening)) return 'evening check-in at '+s.reminderEvening; return 'morning nudge at '+s.reminderMorning+' tomorrow'; }
function showRemindersNow(){ const due=reminderDue(); if(due.length){ showNotif(due.includes('evening')?'evening':'morning'); }
  else { const w=$('#notifWrap'); if(w){ w.innerHTML=`<div class="notif-card"><div class="flex"><span style="font-size:20px">🔔</span><div style="flex:1"><b>No reminders right now</b><div class="muted" style="font-size:13px">Next: ${esc(nextReminderText())}</div></div><button class="iconbtn" onclick="clearNotifUI()">✕</button></div></div>`; setTimeout(()=>{if(_activeNotif===null)clearNotifUI();},5000); } } }
function enableBrowserNotif(){ try{ if('Notification'in window){ Notification.requestPermission().then(p=>toast(p==='granted'?'Browser pop-ups enabled':'Permission: '+p)); } else toast('Not supported in this view'); }catch(e){ toast('Not available in this view'); } }
function startReminderEngine(){ checkReminders(); setInterval(checkReminders,30000); }

/* ===================== RESPONSIVE NAV + CHART RESIZE ===================== */
function toggleNav(force){ var sb=document.getElementById('sidebar'); var ov=document.getElementById('navOverlay'); if(!sb)return;
  var open=(force===undefined)?!sb.classList.contains('open'):!!force; sb.classList.toggle('open',open); if(ov)ov.style.display=open?'block':'none'; }
var _rsz; window.addEventListener('resize',function(){ clearTimeout(_rsz); _rsz=setTimeout(function(){ try{(_charts||[]).forEach(function(c){try{c.resize()}catch(e){}});}catch(e){} },160); });
