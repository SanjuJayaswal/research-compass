/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== STREAK / CATEGORIES ===================== */
const CATS={'Reading':'#0d9488','Experiment':'#2563eb','Analysis':'#9333ea','Writing':'#d97706','Admin':'#64748b','Other':'#16a34a'};
const LVLS=["Master's","PhD","Undergraduate","Postdoc"];
function levelOptions(cur){ const std=LVLS.map(l=>`<option ${cur===l?'selected':''}>${l}</option>`).join(''); return std+`<option value="__custom__" ${LVLS.includes(cur)?'':'selected'}>Other / custom…</option>`; }
function catColor(c){ return CATS[c]||'#928c7d'; }
function isTrackedWorkday(date){ if(isWeekend(date)&&state.settings.weekendMode!=='active') return false; return true; }
function renderStreak(){ let s=0,d=todayStr();
  for(let i=0;i<400;i++){ const day=addDays(d,-i);
    if(!isTrackedWorkday(day)){ continue; } // rest days don't break streak
    if(hasAnyLog(day)){ s++; } else { if(i===0) continue; break; } }
  $('#streakNum').textContent=s+(s===1?' day':' days'); }

/* ===================== WARNINGS ===================== */
function computeWarnings(){ const w=[]; const t=todayStr();
  // yesterday tracked workday incomplete / unlogged
  let y=addDays(t,-1),guard=0; while(!isTrackedWorkday(y)&&guard<7){ y=addDays(y,-1); guard++; }
  if(isTrackedWorkday(y)){ const yc=overallCompletion(y);
    if(yc===null && !hasAnyLog(y)) w.push({lvl:'warn',ic:'🌙',html:`You didn't log <b>${fmtNice(y)}</b>. A quick retro keeps your streak and trends honest.`});
    else if(yc!==null && yc<state.settings.warnThreshold) w.push({lvl:'danger',ic:'⚠️',html:`<b>${fmtNice(y)}</b> finished at <b>${yc}%</b> (below your ${state.settings.warnThreshold}% line). Consider carrying the unfinished items into today.`});
  }
  // today low if late in day
  const tc=overallCompletion(t); const hr=new Date().getHours();
  if(isTrackedWorkday(t)&&tc!==null&&tc<100&&hr>=18) w.push({lvl:'warn',ic:'⏰',html:`Today is at <b>${tc}%</b> with the evening here. Close out what you can or replan it for tomorrow.`});
  // stale carried tasks
  const stale=staleTasks(); if(stale.length) w.push({lvl:'warn',ic:'🪨',html:`<b>${stale.length}</b> task${stale.length>1?'s have':' has'} been open for 3+ days (e.g. "${esc(stale[0].text)}"). Break ${stale.length>1?'them':'it'} into smaller steps or reschedule.`});
  // approaching deadlines
  const soon=state.deadlines.filter(d=>!d.done&&d.date).map(d=>({...d,days:daysBetween(t,d.date)})).filter(d=>d.days>=0&&d.days<=7).sort((a,b)=>a.days-b.days);
  soon.forEach(d=>w.push({lvl:d.days<=2?'danger':'warn',ic:'⏳',html:`<b>${esc(d.title)}</b> ${d.days===0?'is due today':d.days===1?'is due tomorrow':'in '+d.days+' days'}.`}));
  const overdue=state.deadlines.filter(d=>!d.done&&d.date&&daysBetween(t,d.date)<0);
  overdue.forEach(d=>w.push({lvl:'danger',ic:'🔴',html:`<b>${esc(d.title)}</b> is overdue (${fmtShort(d.date)}). Mark done or move the date.`}));
  return w;
}
function staleTasks(){ const out=[]; const t=todayStr();
  activeProjects().forEach(p=>{ const counts={};
    for(let i=0;i<6;i++){ const l=getLog(addDays(t,-i),p.id); if(!l)continue; l.tasks.forEach(tk=>{ if(!tk.done){ const k=tk.text.trim().toLowerCase(); counts[k]=(counts[k]||{n:0,text:tk.text}); counts[k].n++; counts[k].text=tk.text; } }); }
    Object.values(counts).forEach(c=>{ if(c.n>=3) out.push({text:c.text,project:p.name}); }); });
  return out; }

/* ===================== SUGGESTIONS ===================== */
function computeSuggestions(){ const s=[]; const t=todayStr();
  // advisor meeting tomorrow
  const tmDow=parseD(addDays(t,1)).getDay();
  if(state.profile.advisorDay!==''&&Number(state.profile.advisorDay)===tmDow) s.push('📅 Advisor meeting looks like tomorrow — jot a short progress summary and 2–3 questions tonight.');
  // writing gap
  let lastWrite=99; for(let i=0;i<14;i++){ const day=addDays(t,-i); let found=false; activeProjects().forEach(p=>{ const l=getLog(day,p.id); if(l&&l.tasks.some(tk=>tk.category==='Writing'&&tk.done)) found=true; }); if(found){lastWrite=i;break;} }
  if(lastWrite>=5) s.push('✍️ No completed writing task in 5+ days. A few lines daily compounds into chapters — add one small writing task today.');
  // reading queue large
  const queue=state.papers.filter(p=>p.status==='queue').length;
  if(queue>=10) s.push(`📚 Your reading queue has ${queue} papers. Schedule a focused reading block so it doesn't snowball.`);
  // focus low this week
  const fh=weekFocusMinutes()/60; if(fh>0&&fh<8) s.push(`⏱️ Only ${fh.toFixed(1)}h of focused time logged this week — protect one deep-work block tomorrow.`);
  // overdue milestone
  let omCount=0; state.projects.forEach(p=>(p.milestones||[]).forEach(m=>{ if(m.status!=='done'&&m.targetDate&&daysBetween(t,m.targetDate)<0) omCount++; }));
  if(omCount) s.push(`🎯 ${omCount} milestone${omCount>1?'s are':' is'} past target. Revisit the scope or push the date so your plan stays believable.`);
  // streak / momentum positive
  if(s.length<2){ const c=overallCompletion(t); if(c===100) s.push('✅ Everything planned for today is done — log a learning and set tomorrow\'s plan to lock the win.');
    else s.push('🧭 Tip: tag tasks by stage so the workflow view shows exactly where your effort is going.'); }
  return s.slice(0,3);
}
function weekFocusMinutes(){ const t=todayStr(); const start=addDays(t,-(parseD(t).getDay()===0?6:parseD(t).getDay()-1));
  return state.timeSessions.filter(s=>s.date>=start&&s.date<=t).reduce((a,b)=>a+b.minutes,0); }

/* ===================== UI BITS ===================== */
function ring(pct,color){ const c=color||'var(--accent-strong)'; const p=pct==null?0:pct;
  return `<div style="position:relative;width:96px;height:96px;flex:none">
    <div style="width:96px;height:96px;border-radius:50%;background:conic-gradient(${c} ${p*3.6}deg,var(--ring-track) 0)"></div>
    <div style="position:absolute;inset:9px;background:var(--surface);border-radius:50%;display:grid;place-items:center">
      <div style="text-align:center"><div style="font-size:22px;font-weight:800;letter-spacing:-.5px">${pct==null?'—':p+'%'}</div></div>
    </div></div>`; }
function barClass(p){ return p>=80?'green':p>=50?'amber':'red'; }

/* ===================== TODAY ===================== */
function renderToday(){ const el=$('#page-today'); const t=todayStr(); const scope=state.activeProjectId||'__all__';
  const weekendRest=isWeekend(t)&&state.settings.weekendMode==='off'&&state.settings._weekendOverride!==t;
  let html='';
  // banners
  if(!weekendRest){ const warns=computeWarnings(); warns.forEach(w=>html+=`<div class="banner ${w.lvl}"><span class="bic">${w.ic}</span><div>${w.html}</div></div>`); }
  // weekend rest card
  if(weekendRest){ html+=`<div class="card pad" style="text-align:center;background:linear-gradient(135deg,var(--accent-soft),var(--surface-2))">
    <div style="font-size:32px">🌿</div><div class="h2 mt8">Weekend — rest mode</div>
    <p class="muted mt8" style="max-width:460px;margin:8px auto 0">No logging expected today and your streak is safe. Your weekend intentions: ${(state.settings.weekendIntentions||[]).map(i=>`<span class="pill">${esc(i)}</span>`).join(' ')||'<span class="mut3">none set</span>'}</p>
    <button class="btn ghost mt14" onclick="weekendLogAnyway()">Log anyway</button></div>`;
    html+='<div class="mt14"></div>'+habitTodayCard(t);
    el.innerHTML=html; return; }

  // KPI row
  const oc=overallCompletion(t); const fT=todayFocusMin(); const pT=papersReadOn(t);
  html+=`<div class="row mb12">
    <div class="card pad flex" style="gap:18px;flex:1;min-width:260px">${ring(oc,scope==='__all__'?'var(--accent-strong)':projColor(scope))}
      <div style="min-width:0;flex:1"><div class="kpi"><div class="lab">${scope==='__all__'?'All active projects':esc(curProj()?curProj().name:'')} · ${fmtNice(t)}</div>
      <div class="val" style="${oc==null?'font-size:18px;line-height:1.3':''}">${oc==null?'No plan yet':oc+'% <small>complete</small>'}</div></div>
      ${isWeekend(t)?'<span class="pill amber mt8">Weekend · '+state.settings.weekendMode+'</span>':''}</div></div>
    <div class="card pad kpi"><div class="lab">⏱️ Focus today</div><div class="val">${(fT/60).toFixed(1)}<small>h</small></div></div>
    <div class="card pad kpi"><div class="lab">📚 Papers read</div><div class="val">${pT}</div></div>
    <div class="card pad kpi"><div class="lab">🔥 Streak</div><div class="val" id="kStreak">—</div></div>
  </div>`;

  // daily rhythm (personal habits)
  html+=habitTodayCard(t);

  // suggestions
  const sug=computeSuggestions();
  if(sug.length){ html+=`<div class="card pad mb12"><div class="sec-title">💡 Suggestions for you</div>${sug.map(s=>`<div class="banner tip" style="margin-bottom:8px"><span class="bic">${s.slice(0,2)}</span><div>${esc(s.slice(2).trim())}</div></div>`).join('')}</div>`; }

  if(scope==='__all__'){ html+=renderTodayAll(t); el.innerHTML=html; document.getElementById('kStreak').textContent=$('#streakNum').textContent; return; }

  const p=curProj(); if(!p){ html+='<div class="empty">No project yet. Add one in Projects.</div>'; el.innerHTML=html; return; }
  const l=ensureLog(t,p.id);
  // tasks
  html+=`<div class="card pad mb12"><div class="between mb12"><div class="sec-title" style="margin:0">✓ Today's tasks</div>
    <div class="flex">${hasYesterdayPlan(p.id)?`<button class="btn subtle sm" onclick="carryOver('${p.id}')">↪ Bring over yesterday's plan</button>`:''}</div></div>
    <div id="taskList">${renderTaskList(l.tasks,p.id)}</div>
    <div class="flex mt8" style="gap:8px">
      <input id="newTask" placeholder="Add a task for today…" style="flex:1;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)" onkeydown="if(event.key==='Enter')addTask('${p.id}')">
      <select id="newTaskCat" style="padding:9px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)">${Object.keys(CATS).map(c=>`<option>${c}</option>`).join('')}</select>
      <button class="btn sm" onclick="addTask('${p.id}')">Add</button></div></div>`;
  // log fields
  const fields=[['did','What I did today','A short narrative of the day…'],['learnings','Key learnings','What did you understand or figure out?'],['results','Results / outcomes','Data, measurements, findings, deliverables…'],['blockers','Blockers & challenges','What slowed you down or needs help?']];
  html+=`<div class="card pad mb12"><div class="sec-title">📝 Daily log</div><div class="two">`;
  fields.forEach(f=>{ html+=`<div class="field"><label>${f[1]}</label><textarea data-log="${f[0]}" data-pid="${p.id}" placeholder="${f[2]}" onchange="saveLogField(this)">${esc(l[f[0]])}</textarea></div>`; });
  html+=`</div></div>`;
  // plan tomorrow
  html+=`<div class="card pad"><div class="sec-title">➡️ Plan for tomorrow <span class="mut3" style="text-transform:none;font-weight:500">— becomes tomorrow's task list</span></div>
    <div id="planList">${renderPlanList(l.planNext,p.id)}</div>
    <div class="flex mt8" style="gap:8px"><input id="newPlan" placeholder="Add something for tomorrow…" style="flex:1;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)" onkeydown="if(event.key==='Enter')addPlan('${p.id}')"><button class="btn sm ghost" onclick="addPlan('${p.id}')">Add</button></div></div>`;
  el.innerHTML=html; const ks=document.getElementById('kStreak'); if(ks) ks.textContent=$('#streakNum').textContent;
}
function renderTodayAll(t){ const ps=state.projects; if(!ps.length) return '<div class="empty"><div class="big">🗂️</div>No projects yet. Add your main research in <b>Projects</b>.</div>';
  let h='<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">';
  ps.forEach(p=>{ const c=dayCompletion(t,p.id); const l=getLog(t,p.id);
    h+=`<div class="card pad"><div class="between"><div class="flex"><span class="dot" style="width:11px;height:11px;border-radius:50%;background:${p.color};display:inline-block"></span> <b>${esc(p.name)}</b></div>${p.trackingMode==='adhoc'?'<span class="pill">ad-hoc</span>':'<span class="pill accent">daily</span>'}</div>
      <div class="mt14 flex" style="gap:12px">${ring(c, p.color)}<div style="flex:1"><div class="mut3" style="font-size:12px">${l?l.tasks.filter(x=>x.done).length+' / '+l.tasks.length+' tasks':'no plan logged'}</div>
      <button class="btn ghost sm mt8" onclick="setActiveProject('${p.id}')">Open check-in →</button></div></div></div>`; });
  return h+'</div>';
}
function renderTaskList(tasks,pid){ if(!tasks.length) return '<div class="mut3" style="padding:6px 2px;font-size:13px">No tasks yet — add your first below, or bring over yesterday\'s plan.</div>';
  const stale=staleTasks().map(s=>s.text.trim().toLowerCase());
  return tasks.map(tk=>`<div class="task ${tk.done?'done':''} ${stale.includes(tk.text.trim().toLowerCase())&&!tk.done?'stale':''}">
    <div class="cb ${tk.done?'on':''}" onclick="toggleTask('${pid}','${tk.id}')">${tk.done?'✓':''}</div>
    <div class="tx">${esc(tk.text)}<div class="meta">${tk.category?`<span class="tag" style="color:${catColor(tk.category)}">${tk.category}</span>`:''}${tk.stageId?`<span class="tag">${esc((stageName(pid,tk.stageId)||''))}</span>`:''}</div></div>
    <button class="iconbtn" onclick="delTask('${pid}','${tk.id}')">✕</button></div>`).join(''); }
function renderPlanList(plan,pid){ if(!plan.length) return '<div class="mut3" style="padding:4px 2px;font-size:13px">Nothing planned yet.</div>';
  return plan.map(p=>`<div class="task"><span style="color:var(--accent)">›</span><div class="tx">${esc(p.text)}</div><button class="iconbtn" onclick="delPlan('${pid}','${p.id}')">✕</button></div>`).join(''); }
function stageName(pid,sid){ const p=getProj(pid); if(!p)return''; const s=(p.workflow.stages||[]).find(x=>x.id===sid); return s?s.name:''; }

/* task ops */
function addTask(pid){ const inp=$('#newTask'); const v=inp.value.trim(); if(!v)return; const cat=$('#newTaskCat').value;
  const l=ensureLog(todayStr(),pid); l.tasks.push({id:uid('tk'),text:v,done:false,category:cat,stageId:getProj(pid)?getProj(pid).workflow.currentStageId:null}); save(); inp.value=''; renderToday(); $('#newTask').focus(); }
function toggleTask(pid,tid){ const l=ensureLog(todayStr(),pid); const tk=l.tasks.find(x=>x.id===tid); if(tk){tk.done=!tk.done; save(); renderToday();} }
function delTask(pid,tid){ const l=ensureLog(todayStr(),pid); l.tasks=l.tasks.filter(x=>x.id!==tid); save(); renderToday(); }
function saveLogField(elm){ const l=ensureLog(todayStr(),elm.dataset.pid); l[elm.dataset.log]=elm.value; save(); toast('Saved'); }
function addPlan(pid){ const inp=$('#newPlan'); const v=inp.value.trim(); if(!v)return; const l=ensureLog(todayStr(),pid); l.planNext.push({id:uid('pl'),text:v}); save(); inp.value=''; renderToday(); $('#newPlan').focus(); }
function delPlan(pid,id){ const l=ensureLog(todayStr(),pid); l.planNext=l.planNext.filter(x=>x.id!==id); save(); renderToday(); }
function hasYesterdayPlan(pid){ const y=addDays(todayStr(),-1); const l=getLog(y,pid); return l&&l.planNext&&l.planNext.length; }
function carryOver(pid){ const y=addDays(todayStr(),-1); const yl=getLog(y,pid); const l=ensureLog(todayStr(),pid);
  if(yl&&yl.planNext){ yl.planNext.forEach(p=>{ if(!l.tasks.some(t=>t.text===p.text)) l.tasks.push({id:uid('tk'),text:p.text,done:false,category:'Other',stageId:getProj(pid).workflow.currentStageId}); }); }
  save(); renderToday(); toast('Brought over yesterday\'s plan'); }
function weekendLogAnyway(){ const t=todayStr(); activeProjects().forEach(p=>ensureLog(t,p.id)); save(); state.settings._weekendOverride=t; renderToday(); }
function todayFocusMin(){ return state.timeSessions.filter(s=>s.date===todayStr()).reduce((a,b)=>a+b.minutes,0); }
function papersReadOn(date){ return state.papers.filter(p=>p.readAt===date).length; }
