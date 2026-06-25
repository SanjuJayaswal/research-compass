/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== PAPERS ===================== */
let paperFilter='all';
function renderPapers(){ const el=$('#page-papers'); const t=todayStr();
  const counts={all:state.papers.length,queue:0,reading:0,read:0}; state.papers.forEach(p=>counts[p.status]++);
  const wkStart=addDays(t,-(parseD(t).getDay()===0?6:parseD(t).getDay()-1));
  const readWeek=state.papers.filter(p=>p.readAt&&p.readAt>=wkStart).length;
  let html=`<div class="row mb12">
    <div class="card pad kpi"><div class="lab">📚 Total</div><div class="val">${counts.all}</div></div>
    <div class="card pad kpi"><div class="lab">🕗 In queue</div><div class="val">${counts.queue}</div></div>
    <div class="card pad kpi"><div class="lab">📖 Reading</div><div class="val">${counts.reading}</div></div>
    <div class="card pad kpi"><div class="lab">✅ Read this week</div><div class="val">${readWeek}</div></div></div>`;
  html+=`<div class="between mb12"><div class="seg">${['all','queue','reading','read'].map(f=>`<button class="${paperFilter===f?'on':''}" onclick="paperFilter='${f}';renderPapers()">${f[0].toUpperCase()+f.slice(1)}${f!=='all'?' ('+counts[f]+')':''}</button>`).join('')}</div><button class="btn" onclick="editPaper()">+ Add paper</button></div>`;
  const list=state.papers.filter(p=>paperFilter==='all'||p.status===paperFilter).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
  if(!list.length) html+='<div class="empty"><div class="big">📚</div>No papers here yet. Add ones to read, or log what you\'ve read.</div>';
  html+='<div class="card pad">'+(list.length?'':'')+list.map(p=>{ const sc={queue:'',reading:'amber',read:'green'}[p.status];
    return `<div class="lrow"><div style="width:8px;height:38px;border-radius:4px;background:${p.projectId?projColor(p.projectId):'#e3ddcd'};flex:none"></div>
      <div class="grow"><div class="ttl">${esc(p.title)}</div><div class="desc">${[p.authors,p.year].filter(Boolean).map(esc).join(' · ')}${p.tags&&p.tags.length?' · '+p.tags.map(x=>`<span class="tag">${esc(x)}</span>`).join(' '):''}</div>${p.takeaways?`<div class="desc" style="margin-top:5px;color:var(--ink-2)">💡 ${esc(p.takeaways)}</div>`:''}</div>
      <span class="pill ${sc}">${p.status}</span>
      ${p.link?`<a class="iconbtn" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer" title="Open">↗</a>`:''}
      <button class="iconbtn" title="Advance status" onclick="cyclePaper('${p.id}')">⟳</button>
      <button class="iconbtn" onclick="editPaper('${p.id}')">✎</button><button class="iconbtn" onclick="delPaper('${p.id}')">✕</button></div>`; }).join('')+'</div>';
  el.innerHTML=html;
}
function editPaper(id){ const p=id?state.papers.find(x=>x.id===id):{title:'',authors:'',year:'',link:'',status:'queue',tags:[],takeaways:'',projectId:state.activeProjectId&&state.activeProjectId!=='__all__'?state.activeProjectId:(state.projects[0]||{}).id,stageId:''};
  const projOpts='<option value="">— no project —</option>'+state.projects.map(pr=>`<option value="${pr.id}" ${p.projectId===pr.id?'selected':''}>${esc(pr.name)}</option>`).join('');
  const body=`<div class="field"><label>Title</label><input id="paTitle" value="${esc(p.title)}" placeholder="Paper title"></div>
    <div class="two"><div class="field"><label>Authors</label><input id="paAuth" value="${esc(p.authors)}" placeholder="Smith et al."></div><div class="field"><label>Year</label><input id="paYear" value="${esc(p.year)}" placeholder="2024"></div></div>
    <div class="field"><label>Link / DOI</label><input id="paLink" value="${esc(p.link)}" placeholder="https://…"></div>
    <div class="two"><div class="field"><label>Status</label><select id="paStatus">${['queue','reading','read'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Project</label><select id="paProj">${projOpts}</select></div></div>
    <div class="field"><label>Tags (comma separated)</label><input id="paTags" value="${esc((p.tags||[]).join(', '))}" placeholder="method, review, key"></div>
    <div class="field"><label>Key takeaways</label><textarea id="paTake" placeholder="Why it matters to your work…">${esc(p.takeaways)}</textarea></div>`;
  openModal(modalShell(id?'Edit paper':'Add paper',body,`<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="savePaper('${id||''}')">Save</button>`),true); }
function savePaper(id){ const title=$('#paTitle').value.trim(); if(!title){toast('Title required');return;}
  const status=$('#paStatus').value;
  const data={title,authors:$('#paAuth').value.trim(),year:$('#paYear').value.trim(),link:$('#paLink').value.trim(),status,
    tags:$('#paTags').value.split(',').map(x=>x.trim()).filter(Boolean),takeaways:$('#paTake').value.trim(),projectId:$('#paProj').value};
  if(id){ const p=state.papers.find(x=>x.id===id); const wasRead=p.status==='read'; Object.assign(p,data); if(status==='read'&&!wasRead)p.readAt=todayStr(); if(status!=='read')p.readAt=null; }
  else { const np={id:uid('pp'),addedAt:Date.now(),readAt:status==='read'?todayStr():null,...data}; state.papers.push(np); }
  save(); closeModal(); renderPapers(); toast('Paper saved'); }
function cyclePaper(id){ const p=state.papers.find(x=>x.id===id); p.status=p.status==='queue'?'reading':p.status==='reading'?'read':'queue'; p.readAt=p.status==='read'?todayStr():null; save(); renderPapers(); }
function delPaper(id){ state.papers=state.papers.filter(x=>x.id!==id); save(); renderPapers(); }

/* ===================== DEADLINES & GOALS ===================== */
function renderDeadlines(){ const el=$('#page-deadlines'); const t=todayStr();
  const items=state.deadlines.map(d=>({...d,days:d.date?daysBetween(t,d.date):null}));
  const open=items.filter(d=>!d.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  const done=items.filter(d=>d.done);
  const next=open.filter(d=>d.days!==null&&d.days>=0)[0];
  let html=`<div class="row mb12">
    <div class="card pad kpi" style="flex:2;min-width:260px"><div class="lab">⏳ Next up</div>${next?`<div class="val" style="font-size:20px">${esc(next.title)}</div><div class="mut3">${next.days===0?'Due today':next.days===1?'Due tomorrow':'in '+next.days+' days'} · ${fmtShort(next.date)}</div>`:'<div class="val" style="font-size:20px">All clear ✨</div>'}</div>
    <div class="card pad kpi"><div class="lab">Open</div><div class="val">${open.length}</div></div>
    <div class="card pad kpi"><div class="lab">Overdue</div><div class="val" style="color:${open.some(d=>d.days<0)?'var(--red)':'inherit'}">${open.filter(d=>d.days!==null&&d.days<0).length}</div></div></div>`;
  html+=`<div class="between mb12"><div class="sec-title" style="margin:0">Upcoming</div><button class="btn" onclick="editDeadline()">+ Add deadline / goal</button></div>`;
  if(!open.length) html+='<div class="empty"><div class="big">⏳</div>Nothing scheduled. Add thesis milestones, conference dates, or advisor meetings.</div>';
  html+='<div class="card pad">'+open.map(d=>{ const od=d.days!==null&&d.days<0; const soon=d.days!==null&&d.days>=0&&d.days<=7;
    const tip={deadline:'🎯',goal:'⭐',meeting:'👥',submission:'📤',exam:'📝'}[d.type]||'📌';
    return `<div class="lrow" ${od?'style=border-color:#f3c4c4;background:var(--red-soft)':soon?'style=border-color:#f3d6a4':''}><div class="cb" onclick="toggleDeadline('${d.id}')" title="mark done"></div>
      <span style="font-size:18px">${tip}</span><div class="grow"><div class="ttl">${esc(d.title)}</div><div class="desc">${d.type} ${d.projectId?'· '+esc((getProj(d.projectId)||{}).name||''):''} ${d.notes?'· '+esc(d.notes):''}</div></div>
      <div style="text-align:right"><div style="font-weight:700;color:${od?'var(--red)':soon?'var(--amber)':'var(--ink)'}">${d.date?(od?Math.abs(d.days)+'d ago':d.days===0?'Today':d.days+'d'):'—'}</div><div class="mut3" style="font-size:11px">${d.date?fmtShort(d.date):''}</div></div>
      <button class="iconbtn" onclick="editDeadline('${d.id}')">✎</button><button class="iconbtn" onclick="delDeadline('${d.id}')">✕</button></div>`; }).join('')+'</div>';
  if(done.length) html+=`<div class="sec-title mt20">Completed (${done.length})</div><div class="card pad">`+done.map(d=>`<div class="lrow" style="opacity:.6"><div class="cb on" onclick="toggleDeadline('${d.id}')">✓</div><div class="grow"><div class="ttl" style="text-decoration:line-through">${esc(d.title)}</div></div><button class="iconbtn" onclick="delDeadline('${d.id}')">✕</button></div>`).join('')+'</div>';
  el.innerHTML=html;
}
function editDeadline(id){ const d=id?state.deadlines.find(x=>x.id===id):{title:'',date:'',type:'deadline',projectId:'',notes:''};
  const projOpts='<option value="">— no project —</option>'+state.projects.map(pr=>`<option value="${pr.id}" ${d.projectId===pr.id?'selected':''}>${esc(pr.name)}</option>`).join('');
  const body=`<div class="field"><label>Title</label><input id="dlTitle" value="${esc(d.title)}" placeholder="e.g. Thesis draft to advisor"></div>
    <div class="two"><div class="field"><label>Date</label><input id="dlDate" type="date" value="${d.date||''}"></div>
    <div class="field"><label>Type</label><select id="dlType">${['deadline','goal','meeting','submission','exam'].map(x=>`<option ${d.type===x?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <div class="field"><label>Project</label><select id="dlProj">${projOpts}</select></div>
    <div class="field"><label>Notes</label><input id="dlNotes" value="${esc(d.notes)}" placeholder="optional"></div>`;
  openModal(modalShell(id?'Edit':'Add deadline / goal',body,`<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveDeadline('${id||''}')">Save</button>`)); }
function saveDeadline(id){ const title=$('#dlTitle').value.trim(); if(!title){toast('Title required');return;}
  const data={title,date:$('#dlDate').value,type:$('#dlType').value,projectId:$('#dlProj').value,notes:$('#dlNotes').value.trim()};
  if(id) Object.assign(state.deadlines.find(x=>x.id===id),data); else state.deadlines.push({id:uid('dl'),done:false,...data});
  save(); closeModal(); renderDeadlines(); toast('Saved'); }
function toggleDeadline(id){ const d=state.deadlines.find(x=>x.id===id); d.done=!d.done; save(); renderDeadlines(); }
function delDeadline(id){ state.deadlines=state.deadlines.filter(x=>x.id!==id); save(); renderDeadlines(); }

/* ===================== FOCUS & TIME ===================== */
let timer={running:false,sec:0,int:null,cat:'Reading'};
function renderFocus(){ const el=$('#page-focus'); const t=todayStr();
  const today=state.timeSessions.filter(s=>s.date===t).reduce((a,b)=>a+b.minutes,0);
  const week=weekFocusMinutes();
  const projOpts=state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  let html=`<div class="row mb12">
    <div class="card pad kpi"><div class="lab">Today</div><div class="val">${(today/60).toFixed(1)}<small>h</small></div></div>
    <div class="card pad kpi"><div class="lab">This week</div><div class="val">${(week/60).toFixed(1)}<small>h</small></div></div>
    <div class="card pad kpi"><div class="lab">Sessions today</div><div class="val">${state.timeSessions.filter(s=>s.date===t).length}</div></div></div>`;
  html+=`<div class="card pad mb12" style="text-align:center;background:linear-gradient(135deg,var(--surface-2),var(--accent-soft))">
    <div class="sec-title" style="justify-content:center">⏱️ Focus timer</div>
    <div class="timer-display" id="timerDisp">${fmtTimer(timer.sec)}</div>
    <div class="flex" style="justify-content:center;gap:8px;margin-bottom:14px">
      <select id="tProj" style="padding:8px;border:1px solid var(--line);border-radius:10px;background:#fff">${projOpts}</select>
      <select id="tCat" style="padding:8px;border:1px solid var(--line);border-radius:10px;background:#fff">${Object.keys(CATS).map(c=>`<option ${timer.cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
    <div class="flex" style="justify-content:center;gap:8px">
      <button class="btn" id="tStart" onclick="toggleTimer()">${timer.running?'⏸ Pause':'▶ Start'}</button>
      <button class="btn ghost" onclick="stopLog()">⏹ Stop & log</button>
      <button class="btn ghost" onclick="resetTimer()">↺ Reset</button>
      <button class="btn ghost sm" onclick="manualSession()">✎ Add manually</button></div></div>`;
  const recent=state.timeSessions.slice().sort((a,b)=>(b.startedAt||0)-(a.startedAt||0)).slice(0,12);
  html+=`<div class="card pad"><div class="sec-title">Recent sessions</div>`;
  if(!recent.length) html+='<div class="mut3" style="font-size:13px">No sessions yet — start the timer or add one manually.</div>';
  html+=recent.map(s=>`<div class="lrow"><span class="tag" style="color:${catColor(s.category)}">${esc(s.category)}</span><div class="grow"><div class="ttl" style="font-size:13.5px">${(s.minutes/60).toFixed(1)}h · ${esc((getProj(s.projectId)||{}).name||'—')}</div><div class="desc">${fmtShort(s.date)}${s.note?' · '+esc(s.note):''}</div></div><button class="iconbtn" onclick="delSession('${s.id}')">✕</button></div>`).join('');
  html+=`</div>`;
  el.innerHTML=html;
}
function fmtTimer(sec){ const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60; return (h?h+':':'')+pad(m)+':'+pad(s); }
function tickTimer(){ timer.sec++; const d=$('#timerDisp'); if(d)d.textContent=fmtTimer(timer.sec); }
function toggleTimer(){ if(timer.running){ clearInterval(timer.int); timer.running=false; } else { timer.running=true; timer.int=setInterval(tickTimer,1000); } const b=$('#tStart'); if(b)b.innerHTML=timer.running?'⏸ Pause':'▶ Start'; }
function resetTimer(){ clearInterval(timer.int); timer.running=false; timer.sec=0; renderFocus(); }
function stopLog(){ const proj=$('#tProj')?$('#tProj').value:(state.projects[0]||{}).id; const cat=$('#tCat')?$('#tCat').value:'Reading';
  clearInterval(timer.int); timer.running=false; const mins=Math.max(1,Math.round(timer.sec/60));
  if(timer.sec<30){ toast('Too short to log'); timer.sec=0; renderFocus(); return; }
  state.timeSessions.push({id:uid('ts'),date:todayStr(),projectId:proj,category:cat,minutes:mins,note:'',startedAt:Date.now()}); save(); timer.sec=0; renderFocus(); toast(mins+' min logged'); }
function manualSession(){ const projOpts=state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  const body=`<div class="two"><div class="field"><label>Date</label><input id="mDate" type="date" value="${todayStr()}"></div><div class="field"><label>Minutes</label><input id="mMin" type="number" value="60" min="1"></div></div>
    <div class="two"><div class="field"><label>Project</label><select id="mProj">${projOpts}</select></div><div class="field"><label>Category</label><select id="mCat">${Object.keys(CATS).map(c=>`<option>${c}</option>`).join('')}</select></div></div>
    <div class="field"><label>Note</label><input id="mNote" placeholder="optional"></div>`;
  openModal(modalShell('Add focus session',body,`<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveSession()">Save</button>`)); }
function saveSession(){ const mins=parseInt($('#mMin').value)||0; if(mins<1){toast('Enter minutes');return;}
  state.timeSessions.push({id:uid('ts'),date:$('#mDate').value,projectId:$('#mProj').value,category:$('#mCat').value,minutes:mins,note:$('#mNote').value.trim(),startedAt:Date.now()}); save(); closeModal(); renderFocus(); toast('Session added'); }
function delSession(id){ state.timeSessions=state.timeSessions.filter(x=>x.id!==id); save(); renderFocus(); }
