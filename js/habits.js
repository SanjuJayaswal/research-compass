/* Research Compass — split source.
   habits.js: "Daily Rhythm" — a personal daily habit checklist, weekly anchors and habit streak.
   Data lives in state.habits, so it saves locally and syncs to Supabase with the rest of the state.
   Loaded as a CLASSIC script after trackers.js, before cloud.js / main.js. */

/* ===================== DEFAULTS ===================== */
function defaultHabits(){ return {
  startedAt:null,
  items:[
    {id:'hb_wake',  time:'06:30',text:'Wake up, phone stays outside the bedroom',note:'No phone for the first 30 minutes.',why:'Rahu: break the morning grab',key:true},
    {id:'hb_sun',   time:'06:35',text:'Water to the Sun + 5 minutes of breathing',note:'A glass of water toward the rising sun, then slow breaths.',why:'Sun + Moon',key:false},
    {id:'hb_move',  time:'06:45',text:'Exercise for 30 minutes',note:'Run, gym, yoga or a brisk walk.',why:'Mars: burn off restlessness',key:true},
    {id:'hb_bfast', time:'07:30',text:'Bath and breakfast, no screens',note:'Eat sitting down.',why:'Taurus Moon',key:false},
    {id:'hb_study1',time:'08:00',text:'Study block 1: 25 + 5 + 25',note:'Hardest subject first. Phone in another room. Write the exact task before starting.',why:'Mercury + Jupiter',key:true},
    {id:'hb_work',  time:'09:00',text:'Classes / lab with phone in bag',note:'Check messages only at breaks.',why:'Saturn: steady effort',key:false},
    {id:'hb_lunch', time:'13:00',text:'Lunch + 15-minute walk, no scrolling',note:'',why:'',key:false},
    {id:'hb_out',   time:'17:30',text:'Outdoors, sport or friends',note:'Real people, real places.',why:'Mars in 11th: your network',key:false},
    {id:'hb_family',time:'19:00',text:'Dinner; call family a few times a week',note:'',why:'Moon in 2nd: family',key:false},
    {id:'hb_study2',time:'19:45',text:'Study block 2: 25 + 5 + 25',note:"Revise today's material or practise problems.",why:'',key:true},
    {id:'hb_phone', time:'21:00',text:'Phone window: 30 minutes, with a timer',note:'Scroll freely here. When the timer rings, stop.',why:'Rahu, contained',key:false},
    {id:'hb_plan',  time:'21:30',text:'Plan tomorrow: one concrete first task',note:"Add it to 'Plan for tomorrow' on Today.",why:'Mercury: clear tasks',key:false},
    {id:'hb_read',  time:'22:00',text:'Phone out of the room; read or reflect',note:'A book, a journal or quiet thoughts.',why:'',key:false},
    {id:'hb_sleep', time:'22:30',text:'Sleep at the same time',note:'',why:'Moon: rhythm',key:true}
  ],
  weekly:{
    0:{title:'Sun',text:'Longer walk or sport outdoors, plus one offline social plan. Water to the Sun at sunrise.'},
    1:{title:'Moon',text:'Call or visit family. Your Taurus Moon steadies through home and warmth.'},
    4:{title:'Jupiter',text:'Help a junior, thank a teacher or meet a mentor. Guru mantra or 10 quiet minutes.'},
    6:{title:'Saturn',text:'Weekly review: what got done, what slipped. Move a fixed amount into savings.'}
  },
  weeklyAny:'One creative hour this week: music, writing, drawing or a side project. Not a screen feed.',
  log:{}, anchorLog:{}
};}
function ensureHabits(s){ s=s||state; if(!s) return;
  const d=defaultHabits();
  if(!s.habits||typeof s.habits!=='object') s.habits=d;
  const h=s.habits;
  if(!Array.isArray(h.items)) h.items=d.items;
  if(!h.weekly||typeof h.weekly!=='object') h.weekly=d.weekly;
  if(typeof h.weeklyAny!=='string') h.weeklyAny=d.weeklyAny;
  if(!h.log||typeof h.log!=='object') h.log={};
  if(!h.anchorLog||typeof h.anchorLog!=='object') h.anchorLog={};
  if(!h.startedAt) h.startedAt=(typeof todayStr==='function'?todayStr():null);
  return h; }
ensureHabits();

/* ===================== HELPERS ===================== */
function habitItems(){ return ensureHabits().items.slice().sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')); }
function habitDay(date){ const h=ensureHabits(); return h.log[date]||{}; }
function habitDoneCount(date){ const d=habitDay(date); return habitItems().filter(i=>d[i.id]).length; }
function habitPct(date){ const n=habitItems().length; return n?Math.round(habitDoneCount(date)/n*100):0; }
function habitKeyDone(date){ const d=habitDay(date); const keys=habitItems().filter(i=>i.key); return keys.length&&keys.every(i=>d[i.id]); }
/* a day "counts" for the habit streak at 70%+ of the checklist */
const HABIT_DAY_LINE=70;
function habitStreak(){ const t=todayStr(); let s=0;
  for(let i=0;i<400;i++){ const day=addDays(t,-i); const ok=habitPct(day)>=HABIT_DAY_LINE;
    if(ok) s++; else { if(i===0) continue; break; } }
  return s; }
function habitBest(){ const h=ensureHabits(); const days=Object.keys(h.log).sort(); let best=0,run=0,prev=null;
  days.forEach(d=>{ if(habitPct(d)>=HABIT_DAY_LINE){ run=(prev&&addDays(prev,1)===d)?run+1:1; best=Math.max(best,run); prev=d; } });
  return best; }
function habitRampWeek(){ const h=ensureHabits(); if(!h.startedAt) return 1; return Math.min(4,Math.floor(daysBetween(h.startedAt,todayStr())/7)+1); }
const RAMP=[
  'Phone out of the bedroom, no phone for the first 30 minutes, one morning study block.',
  'Add daily exercise and the evening study block.',
  'Add the 9 pm phone window and the plan-tomorrow note.',
  'Full rhythm plus the weekly anchors. Missing a day is fine; missing two in a row is the thing to avoid.'];
function nowMinutes(){ const n=tzNow(); return n.hour*60+n.minute; }
function toMin(x){ const [a,b]=(x||'00:00').split(':').map(Number); return a*60+(b||0); }

/* ===================== ACTIONS ===================== */
function toggleHabit(id,date){ date=date||todayStr(); const h=ensureHabits(); h.log[date]=h.log[date]||{};
  h.log[date][id]=!h.log[date][id]; if(!h.log[date][id]) delete h.log[date][id];
  save(); if(curTab==='habits') renderHabits(); else if(curTab==='today') renderToday();
  if(habitDoneCount(date)===habitItems().length) toast('Full rhythm today. Well done.'); }
function toggleAnchor(date){ date=date||todayStr(); const h=ensureHabits(); h.anchorLog[date]=!h.anchorLog[date]; if(!h.anchorLog[date]) delete h.anchorLog[date]; save();
  if(curTab==='habits') renderHabits(); else renderToday(); }
function editHabit(id){ const h=ensureHabits(); const it=id?h.items.find(x=>x.id===id):{time:'',text:'',note:'',why:'',key:false};
  const body=`<div class="two"><div class="field"><label>Time</label><input id="hbTime" type="time" value="${esc(it.time)}"></div>
    <div class="field"><label>Key habit</label><select id="hbKey"><option value="0" ${it.key?'':'selected'}>No</option><option value="1" ${it.key?'selected':''}>Yes, a core anchor</option></select></div></div>
    <div class="field"><label>Habit</label><input id="hbText" value="${esc(it.text)}" placeholder="e.g. Study block 1"></div>
    <div class="field"><label>Detail</label><input id="hbNote" value="${esc(it.note)}" placeholder="optional"></div>
    <div class="field"><label>Why (chart link)</label><input id="hbWhy" value="${esc(it.why)}" placeholder="optional"></div>`;
  const del=id?`<button class="btn ghost" style="margin-right:auto;color:var(--red)" onclick="delHabit('${id}')">Delete</button>`:'';
  openModal(modalShell(id?'Edit habit':'Add habit',body,`${del}<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveHabit('${id||''}')">Save</button>`)); }
function saveHabit(id){ const text=$('#hbText').value.trim(); if(!text){ toast('Habit text required'); return; }
  const data={time:$('#hbTime').value,text,note:$('#hbNote').value.trim(),why:$('#hbWhy').value.trim(),key:$('#hbKey').value==='1'};
  const h=ensureHabits(); if(id) Object.assign(h.items.find(x=>x.id===id),data); else h.items.push({id:uid('hb'),...data});
  save(); closeModal(); renderHabits(); toast('Saved'); }
function delHabit(id){ const h=ensureHabits(); h.items=h.items.filter(x=>x.id!==id); save(); closeModal(); renderHabits(); toast('Habit removed'); }
function editAnchor(dow){ const h=ensureHabits(); const a=h.weekly[dow]||{title:DOW[dow],text:''};
  const body=`<div class="field"><label>Label</label><input id="anTitle" value="${esc(a.title)}"></div>
    <div class="field"><label>What to do on ${DOW[dow]}</label><textarea id="anText">${esc(a.text)}</textarea></div>`;
  const del=h.weekly[dow]?`<button class="btn ghost" style="margin-right:auto;color:var(--red)" onclick="delAnchor(${dow})">Remove</button>`:'';
  openModal(modalShell(DOW[dow]+' anchor',body,`${del}<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveAnchor(${dow})">Save</button>`)); }
function saveAnchor(dow){ const t=$('#anText').value.trim(); const h=ensureHabits(); if(!t){ delete h.weekly[dow]; } else h.weekly[dow]={title:$('#anTitle').value.trim()||DOW[dow],text:t};
  save(); closeModal(); renderHabits(); }
function delAnchor(dow){ delete ensureHabits().weekly[dow]; save(); closeModal(); renderHabits(); }
function resetHabitsToDefault(){ const h=ensureHabits(); const d=defaultHabits(); h.items=d.items; h.weekly=d.weekly; h.weeklyAny=d.weeklyAny; save(); renderHabits(); toast('Restored the original rhythm'); }

/* ===================== UI PIECES ===================== */
function habitRow(it,date,compact){ const done=!!habitDay(date)[it.id];
  const mins=toMin(it.time), now=nowMinutes(), isToday=date===todayStr();
  const due=isToday&&!done&&it.time&&mins<=now;
  return `<div class="task ${done?'done':''}" style="${due&&!compact?'border-color:color-mix(in oklch,var(--amber) 45%,var(--border))':''}">
    <div class="cb ${done?'on':''}" role="checkbox" aria-checked="${done}" tabindex="0" onclick="toggleHabit('${it.id}','${date}')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleHabit('${it.id}','${date}')}">${done?'✓':''}</div>
    <div style="font-family:var(--font-mono);font-weight:700;font-size:13px;width:44px;flex:none;color:var(--secondary-foreground);font-variant-numeric:tabular-nums;padding-top:1px">${esc(it.time||'—')}</div>
    <div class="tx">${esc(it.text)}${it.key?' <span class="pill accent" style="font-size:9.5px;padding:1px 6px">core</span>':''}
      ${!compact&&(it.note||it.why)?`<div class="meta">${it.note?`<span class="mut3" style="font-size:12.5px">${esc(it.note)}</span>`:''}${it.why?`<span class="tag" style="color:var(--amber)">${esc(it.why)}</span>`:''}</div>`:''}</div>
    ${compact?'':`<button class="iconbtn" title="Edit" onclick="editHabit('${it.id}')">✎</button>`}</div>`; }
function anchorCard(date){ const h=ensureHabits(); const a=h.weekly[dowOf(date)]; if(!a) return '';
  const done=!!h.anchorLog[date];
  return `<div class="banner ${done?'good':'tip'}" style="margin-bottom:10px"><div class="cb ${done?'on':''}" style="margin-top:2px" onclick="toggleAnchor('${date}')">${done?'✓':''}</div>
    <div><b>${DOW[dowOf(date)]} anchor · ${esc(a.title)}</b><div style="margin-top:2px">${esc(a.text)}</div></div></div>`; }

/* compact card for the Today page */
function habitTodayCard(t){ const items=habitItems(); if(!items.length) return '';
  const n=habitDoneCount(t), pct=habitPct(t), now=nowMinutes();
  const next=items.filter(i=>!habitDay(t)[i.id]&&toMin(i.time)<=now+60).slice(0,4);
  const show=next.length?next:items.filter(i=>!habitDay(t)[i.id]).slice(0,3);
  let h=`<div class="card pad mb12"><div class="between mb12"><div class="sec-title" style="margin:0">🌅 Daily rhythm</div>
    <div class="flex" style="gap:8px"><span class="pill ${pct>=HABIT_DAY_LINE?'green':pct>=40?'amber':''}">${n} / ${items.length}</span><button class="btn subtle sm" onclick="go('habits')">Open →</button></div></div>
    <div style="height:7px;border-radius:99px;background:var(--muted);overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${pct}%;background:var(--primary);transition:width .3s"></div></div>`;
  h+=anchorCard(t);
  if(show.length){ h+=`<div class="mut3" style="font-size:12px;margin-bottom:8px">${next.length?'Due by now or within the next hour':'Still open today'}</div>`+show.map(i=>habitRow(i,t,true)).join(''); }
  else h+=`<div class="banner good" style="margin:0"><span class="bic">✅</span><div>Every habit is ticked for today.</div></div>`;
  return h+'</div>'; }

/* ===================== PAGE ===================== */
let habitView=null;
function renderHabits(){ ensureHabits(); const el=$('#page-habits'); const t=todayStr(); const h=state.habits; const items=habitItems();
  const date=habitView||t; const isToday=date===t;
  const pct=habitPct(date), streak=habitStreak(), best=Math.max(habitBest(),streak);
  const week=[]; for(let i=6;i>=0;i--) week.push(addDays(t,-i));
  const avg7=Math.round(week.reduce((a,d)=>a+habitPct(d),0)/7);
  let html=`<div class="row mb12">
    <div class="card pad flex" style="gap:18px;flex:1;min-width:260px">${ring(items.length?pct:null)}
      <div style="min-width:0;flex:1"><div class="kpi"><div class="lab">${isToday?'Today':'Viewing'} · ${fmtNice(date)}</div>
      <div class="val">${habitDoneCount(date)}<small> of ${items.length} habits</small></div></div>
      ${habitKeyDone(date)?'<span class="pill green mt8">All core habits done</span>':'<span class="pill mt8">Core: '+items.filter(i=>i.key&&habitDay(date)[i.id]).length+' / '+items.filter(i=>i.key).length+'</span>'}</div></div>
    <div class="card pad kpi"><div class="lab">🔥 Rhythm streak</div><div class="val">${streak}<small> ${streak===1?'day':'days'}</small></div><div class="mut3" style="font-size:11.5px">${HABIT_DAY_LINE}%+ of the list counts</div></div>
    <div class="card pad kpi"><div class="lab">🏆 Best</div><div class="val">${best}<small> days</small></div></div>
    <div class="card pad kpi"><div class="lab">📈 7-day average</div><div class="val">${avg7}<small>%</small></div></div></div>`;

  // 7-day strip
  html+=`<div class="card pad mb12"><div class="sec-title">Last 7 days <span class="mut3" style="text-transform:none;font-weight:500;letter-spacing:0">· tap a day to view or fix it</span></div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">${week.map(d=>{ const p=habitPct(d); const on=d===date;
      const bg=p>=HABIT_DAY_LINE?'var(--green-soft)':p>=40?'var(--amber-soft)':p>0?'var(--red-soft)':'var(--muted)';
      const fg=p>=HABIT_DAY_LINE?'var(--green)':p>=40?'var(--amber)':p>0?'var(--red)':'var(--ink-3)';
      return `<button onclick="habitView='${d}';renderHabits()" style="padding:10px 4px;border-radius:var(--radius-sm);background:${bg};border:2px solid ${on?'var(--primary)':'transparent'};text-align:center">
        <div style="font-size:11px;color:var(--ink-3);font-weight:700">${DOW[dowOf(d)]}</div>
        <div style="font-family:var(--font-mono);font-weight:700;font-size:15px;color:${fg};font-variant-numeric:tabular-nums">${p}%</div></button>`; }).join('')}</div></div>`;

  // checklist
  html+=`<div class="card pad mb12"><div class="between mb12"><div class="sec-title" style="margin:0">✓ ${isToday?"Today's rhythm":'Rhythm for '+fmtNice(date)}</div>
    <div class="flex" style="gap:8px">${isToday?'':`<button class="btn subtle sm" onclick="habitView=null;renderHabits()">Back to today</button>`}<button class="btn ghost sm" onclick="editHabit()">+ Add habit</button></div></div>`;
  html+=anchorCard(date);
  html+=items.length?items.map(i=>habitRow(i,date,false)).join(''):'<div class="empty">No habits yet. Add your first one.</div>';
  html+=`</div>`;

  // weekly anchors + urge protocol
  html+=`<div class="two mb12"><div class="card pad"><div class="sec-title">📆 Weekly anchors</div>
    ${[0,1,2,3,4,5,6].map(d=>{ const a=h.weekly[d]; return `<div class="task" style="${dowOf(t)===d?'border-color:var(--primary)':''}"><div style="font-weight:700;width:38px;flex:none">${DOW[d]}</div>
      <div class="tx">${a?`<b>${esc(a.title)}</b> · ${esc(a.text)}`:'<span class="mut3">No anchor</span>'}</div><button class="iconbtn" title="Edit" onclick="editAnchor(${d})">✎</button></div>`; }).join('')}
    <div class="mut3" style="font-size:12.5px;margin-top:6px">Any evening: ${esc(h.weeklyAny)}</div></div>
    <div class="card pad"><div class="sec-title">📵 When the urge to scroll hits</div>
      <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:9px;font-size:13.5px;line-height:1.5">
        <li><b>Pause and name the feeling.</b> Bored, anxious, behind, lonely? Avoidance usually hides one of these.</li>
        <li><b>Say it once:</b> "I'm avoiding this because it feels hard. That's okay."</li>
        <li><b>Do the two-minute version.</b> Open the book and read one paragraph, or write the first line of the solution.</li>
        <li><b>Still want the phone?</b> Wait for the 9 pm window. It isn't banned, just scheduled.</li></ol>
      <div class="sec-title mt20">🪜 Four-week build-up</div>
      ${RAMP.map((r,i)=>`<div class="flex" style="align-items:flex-start;gap:10px;margin-bottom:8px;${habitRampWeek()===i+1?'':'opacity:.6'}"><span class="pill ${habitRampWeek()===i+1?'accent':''}" style="flex:none">Week ${i+1}</span><div style="font-size:13px">${r}</div></div>`).join('')}
      <div class="mut3" style="font-size:12px">You're in week ${habitRampWeek()} (started ${fmtShort(h.startedAt)}).</div></div></div>`;
  html+=`<div style="text-align:right"><button class="btn ghost sm" onclick="resetHabitsToDefault()">Restore original habit list</button></div>`;
  el.innerHTML=html;
}
