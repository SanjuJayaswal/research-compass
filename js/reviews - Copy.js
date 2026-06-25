/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== REVIEWS ===================== */
let reviewMode='weekly', reviewAnchor=todayStr();
function weekRange(anchor){ const d=parseD(anchor); const dow=d.getDay(); const back=dow===0?6:dow-1; const start=addDays(anchor,-back); return [start,addDays(start,6)]; }
function monthRange(anchor){ const d=parseD(anchor); const start=dstr(new Date(d.getFullYear(),d.getMonth(),1)); const end=dstr(new Date(d.getFullYear(),d.getMonth()+1,0)); return [start,end]; }
function rollup(start,end){ const days=[]; let c=start; while(c<=end){ days.push(c); c=addDays(c,1); }
  let doneT=0,totT=0,focus=0; const comps=[]; const learn=[],res=[];
  days.forEach(d=>{ const dd=state.logs[d]; if(dd){ Object.entries(dd.byProject).forEach(([pid,l])=>{ doneT+=l.tasks.filter(x=>x.done).length; totT+=l.tasks.length;
    if(l.learnings) learn.push({d,pid,t:l.learnings}); if(l.results) res.push({d,pid,t:l.results}); }); }
    const oc=overallCompletion(d); if(oc!==null)comps.push(oc); });
  focus=state.timeSessions.filter(s=>s.date>=start&&s.date<=end).reduce((a,b)=>a+b.minutes,0);
  const papers=state.papers.filter(p=>p.readAt&&p.readAt>=start&&p.readAt<=end);
  const trackedDays=days.filter(d=>isTrackedWorkday(d)); const loggedDays=trackedDays.filter(d=>hasAnyLog(d));
  const dueDeadlines=state.deadlines.filter(x=>x.date>=start&&x.date<=end);
  return {start,end,doneT,totT,focus,papers,learn,res,avg:comps.length?Math.round(comps.reduce((a,b)=>a+b,0)/comps.length):null,
    loggedDays:loggedDays.length,trackedDays:trackedDays.length,dueDone:dueDeadlines.filter(d=>d.done).length,dueMiss:dueDeadlines.filter(d=>!d.done).length}; }
function renderReviews(){ const el=$('#page-reviews'); const [start,end]=reviewMode==='weekly'?weekRange(reviewAnchor):monthRange(reviewAnchor);
  const r=rollup(start,end); const key=reviewMode+':'+start; const saved=(state.reviews[reviewMode]||[]).find(x=>x.key===key)||{};
  let html=`<div class="between mb12"><div class="seg">${['weekly','monthly'].map(m=>`<button class="${reviewMode===m?'on':''}" onclick="reviewMode='${m}';reviewAnchor=todayStr();renderReviews()">${m[0].toUpperCase()+m.slice(1)}</button>`).join('')}</div>
    <div class="flex" style="gap:6px"><button class="btn ghost sm" onclick="shiftReview(-1)">← Prev</button><span class="pill">${fmtShort(start)} – ${fmtShort(end)}</span><button class="btn ghost sm" onclick="shiftReview(1)">Next →</button></div></div>`;
  html+=`<div class="row mb12">
    <div class="card pad kpi"><div class="lab">Avg completion</div><div class="val">${r.avg==null?'—':r.avg+'<small>%</small>'}</div></div>
    <div class="card pad kpi"><div class="lab">Days logged</div><div class="val">${r.loggedDays}<small>/${r.trackedDays}</small></div></div>
    <div class="card pad kpi"><div class="lab">Tasks done</div><div class="val">${r.doneT}<small>/${r.totT}</small></div></div>
    <div class="card pad kpi"><div class="lab">Focus</div><div class="val">${(r.focus/60).toFixed(1)}<small>h</small></div></div>
    <div class="card pad kpi"><div class="lab">Papers read</div><div class="val">${r.papers.length}</div></div></div>`;
  // auto summary
  html+=`<div class="card pad mb12"><div class="sec-title">📋 Auto summary</div>
    <div class="banner ${r.avg==null?'tip':r.avg>=70?'good':'warn'}"><span class="bic">${r.avg==null?'🧭':r.avg>=70?'✅':'📈'}</span><div>You logged <b>${r.loggedDays} of ${r.trackedDays}</b> tracked days${r.avg!=null?` at an average of <b>${r.avg}%</b> completion`:''}, completed <b>${r.doneT}</b> tasks, focused <b>${(r.focus/60).toFixed(1)}h</b>, and read <b>${r.papers.length}</b> paper${r.papers.length===1?'':'s'}.${r.dueMiss?` <b>${r.dueMiss}</b> dated item(s) in this period are still open.`:''}</div></div>`;
  if(r.learn.length){ html+=`<div class="sec-title mt14">💡 Key learnings this ${reviewMode==='weekly'?'week':'month'}</div>`+r.learn.slice(0,8).map(x=>`<div class="task"><span style="color:var(--teal)">•</span><div class="tx"><span class="mut3" style="font-size:11px">${fmtShort(x.d)} · ${esc((getProj(x.pid)||{}).name||'')}</span><br>${esc(x.t)}</div></div>`).join(''); }
  if(r.res.length){ html+=`<div class="sec-title mt14">🔬 Results & outcomes</div>`+r.res.slice(0,8).map(x=>`<div class="task"><span style="color:var(--accent)">•</span><div class="tx"><span class="mut3" style="font-size:11px">${fmtShort(x.d)}</span><br>${esc(x.t)}</div></div>`).join(''); }
  html+=`</div>`;
  // reflection
  html+=`<div class="card pad"><div class="sec-title">✍️ Your reflection</div>
    <div class="field"><label>What went well</label><textarea id="rvWell" placeholder="Wins, momentum, breakthroughs…">${esc(saved.well||'')}</textarea></div>
    <div class="field"><label>What got in the way</label><textarea id="rvBlock" placeholder="Blockers, distractions, what to change…">${esc(saved.block||'')}</textarea></div>
    <div class="field"><label>Plan for next ${reviewMode==='weekly'?'week':'month'}</label><textarea id="rvPlan" placeholder="Top 3 priorities…">${esc(saved.plan||'')}</textarea></div>
    <button class="btn" onclick="saveReview('${key}')">Save review</button> <span class="mut3" style="font-size:12px">${saved.savedAt?'Last saved '+new Date(saved.savedAt).toLocaleDateString():''}</span></div>`;
  el.innerHTML=html;
}
function shiftReview(n){ reviewAnchor=addDays(reviewAnchor,reviewMode==='weekly'?7*n:30*n); renderReviews(); }
function saveReview(key){ const arr=state.reviews[reviewMode]; const data={key,start:key.split(':')[1],well:$('#rvWell').value,block:$('#rvBlock').value,plan:$('#rvPlan').value,savedAt:Date.now()};
  const i=arr.findIndex(x=>x.key===key); if(i>=0)arr[i]=data; else arr.push(data); save(); renderReviews(); toast('Review saved'); }

/* ===================== SETTINGS ===================== */
function renderSettings(){ const el=$('#page-settings'); const p=state.profile,s=state.settings;
  const dayChips=DOW.map((d,i)=>`<span class="chip ${(s.weekendDays||[]).includes(i)?'on':''}" onclick="toggleWeekendDay(${i})">${d}</span>`).join('');
  let html=`${typeof cloudAccountCard==='function'?cloudAccountCard():''}<div class="card pad mb12"><div class="h2 mb12">👤 Profile & context <span class="mut3" style="font-size:12px;font-weight:500">— so the dashboard knows what you're into</span></div>
    <div class="two"><div class="field"><label>Your name <span class="mut3" style="font-weight:500">— first name shows in the app title</span></label><input id="sName" value="${esc(p.name)}" placeholder="First name"></div>
    <div class="field"><label>Field</label><input id="sField" value="${esc(p.field)}"></div></div>
    <div class="field"><label>Program / level <span class="mut3" style="font-weight:500">— shown under the app name</span></label>
      <select id="sLevel" onchange="document.getElementById('sLevelCustomWrap').style.display=this.value==='__custom__'?'block':'none'">${levelOptions(p.level)}</select>
      <div id="sLevelCustomWrap" style="${LVLS.includes(p.level)?'display:none':'display:block'}"><input id="sLevelCustom" style="margin-top:8px" placeholder="Type your program / level (e.g. MTech, MPhil)" value="${LVLS.includes(p.level)?'':esc(p.level)}"></div></div>
    <div class="field"><label>Research topic</label><input id="sTopic" value="${esc(p.topic)}" placeholder="e.g. Perovskite thin films for tandem solar cells"></div>
    <div class="field"><label>Objectives</label><textarea id="sObj" placeholder="What are you trying to achieve in your thesis?">${esc(p.objectives)}</textarea></div>
    <div class="three"><div class="field"><label>Advisor meeting day</label><select id="sAdv">${['','0','1','2','3','4','5','6'].map(v=>`<option value="${v}" ${String(p.advisorDay)===v?'selected':''}>${v===''?'— none —':DOW[v]}</option>`).join('')}</select></div>
    <div class="field"><label>Work start</label><input id="sWS" type="time" value="${p.workStart}"></div>
    <div class="field"><label>Work end</label><input id="sWE" type="time" value="${p.workEnd}"></div></div>
    <button class="btn" onclick="saveProfile()">Save profile</button></div>`;
  html+=`<div class="card pad mb12"><div class="h2 mb12">🌿 Weekends</div>
    <div class="field"><label>Which days are your weekend?</label><div class="chips">${dayChips}</div></div>
    <div class="field"><label>Weekend mode</label><select id="sWkMode" onchange="state.settings.weekendMode=this.value;save();toast('Saved')">
      <option value="off" ${s.weekendMode==='off'?'selected':''}>Off — no logging, no reminders, no warnings</option>
      <option value="light" ${s.weekendMode==='light'?'selected':''}>Optional & light — log if you want, no pressure</option>
      <option value="active" ${s.weekendMode==='active'?'selected':''}>Active — treat like a workday</option></select></div>
    <div class="field"><label>Weekend intentions (comma separated)</label><input id="sWkInt" value="${esc((s.weekendIntentions||[]).join(', '))}" onchange="state.settings.weekendIntentions=this.value.split(',').map(x=>x.trim()).filter(Boolean);save();toast('Saved')" placeholder="Reading, Rest, Planning"></div></div>`;
  const tzList=[...new Set([s.timezone,'Asia/Kolkata','Asia/Dubai','Asia/Karachi','Asia/Dhaka','Asia/Singapore','Asia/Tokyo','Asia/Shanghai','Asia/Hong_Kong','Australia/Sydney','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Africa/Cairo','Africa/Johannesburg','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Sao_Paulo','Pacific/Auckland','UTC'].filter(Boolean))];
  html+=`<div class="card pad mb12"><div class="h2 mb12">🔔 Reminders & thresholds</div>
    <div class="field"><label>Warning threshold — days below this completion get a strong warning: <b id="thVal">${s.warnThreshold}%</b></label>
      <input type="range" min="0" max="100" step="5" value="${s.warnThreshold}" style="width:100%" oninput="document.getElementById('thVal').textContent=this.value+'%'" onchange="state.settings.warnThreshold=+this.value;save();toast('Saved')"></div>
    <div class="field"><label>Timezone <span class="mut3" style="font-weight:500">— reminders fire at your local time</span></label><select id="sTz" onchange="state.settings.timezone=this.value;save();checkReminders();toast('Timezone updated')">${tzList.map(z=>`<option value="${z}" ${s.timezone===z?'selected':''}>${z.replace(/_/g,' ')}</option>`).join('')}</select></div>
    <div class="two"><div class="field"><label>Morning nudge</label><input id="sRM" type="time" value="${s.reminderMorning}" onchange="state.settings.reminderMorning=this.value;save();checkReminders();toast('Saved')"></div>
    <div class="field"><label>Evening check-in</label><input id="sRE" type="time" value="${s.reminderEvening}" onchange="state.settings.reminderEvening=this.value;save();checkReminders();toast('Saved')"></div></div>
    <label class="flex" style="gap:8px;font-size:13px;cursor:pointer;margin-bottom:10px"><input type="checkbox" id="sNotify" ${s.notify!==false?'checked':''} style="width:auto" onchange="state.settings.notify=this.checked;save();checkReminders();toast(this.checked?'Pop-up reminders on':'Pop-up reminders off')"> Show pop-up reminders on the dashboard</label>
    <button class="btn ghost sm" onclick="enableBrowserNotif()">🔔 Enable browser pop-ups (for background alerts)</button>
    <div class="mut3" style="font-size:12px;margin-top:10px">Pop-ups appear on the dashboard at these times in your timezone, skipping weekends unless weekend mode is Active. In-app pop-ups show while the dashboard is open; browser pop-ups (if your browser permits) can alert you when the tab is in the background.</div></div>`;
  html+=`<div class="card pad"><div class="h2 mb12">💾 Your data</div>
    <div class="banner ${usingMem?'warn':'good'}"><span class="bic">${usingMem?'⚠️':'✅'}</span><div>${usingMem?'This browser is blocking local storage, so data lives only in memory for this session. <b>Export now</b> to keep it.':'Saved automatically in this browser. Export regularly to back up or move to another device.'}</div></div>
    <div class="flex wrap mt14" style="gap:8px"><button class="btn" onclick="exportData()">⬇ Export (JSON)</button>
      <button class="btn ghost" onclick="document.getElementById('importFile').click()">⬆ Import</button>
      <input type="file" id="importFile" accept="application/json" class="hide" onchange="importData(this)">
      <button class="btn danger" style="margin-left:auto" onclick="resetData()">Reset all data</button></div></div>`;
  el.innerHTML=html;
}
function saveProfile(){ const p=state.profile; p.name=$('#sName').value; p.field=$('#sField').value;
  let lvl=$('#sLevel').value; if(lvl==='__custom__') lvl=($('#sLevelCustom').value||'').trim()||p.level; p.level=lvl;
  p.topic=$('#sTopic').value; p.objectives=$('#sObj').value; p.advisorDay=$('#sAdv').value; p.workStart=$('#sWS').value; p.workEnd=$('#sWE').value; save(); renderProjSwitch(); toast('Profile saved'); }
function toggleWeekendDay(i){ const w=state.settings.weekendDays; const idx=w.indexOf(i); if(idx>=0)w.splice(idx,1); else w.push(i); save(); renderSettings(); }
function exportData(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='research-compass-backup-'+todayStr()+'.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('Exported'); }
function importData(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader(); r.onload=e=>{ try{ const d=JSON.parse(e.target.result); if(!d.projects||!d.settings)throw 0; state=d; save(); renderProjSwitch(); go('today'); toast('Data imported'); }catch(err){ toast('Invalid backup file'); } }; r.readAsText(f); }
function resetData(){ promptM('Reset everything','This deletes all projects, logs, papers and reviews in this browser. Type RESET to confirm.','',v=>{ if(v==='RESET'){ try{localStorage.removeItem(KEY)}catch(e){} location.reload(); } }); }

/* ===================== ONBOARDING ===================== */
function openOnboarding(){ const s=state.settings;
  const dayChips=DOW.map((d,i)=>`<span class="chip ${(s.weekendDays||[0,6]).includes(i)?'on':''}" onclick="this.classList.toggle('on')" data-day="${i}">${d}</span>`).join('');
  const body=`<p class="muted mb12">Welcome! A couple of quick details so your dashboard knows what you're into. You can change all of this later in Settings.</p>
    <div class="field"><label>Your name (optional)</label><input id="oName" placeholder="First name — used in the app title"></div>
    <div class="field"><label>What are you doing?</label><select id="oLevel">${LVLS.map(l=>`<option ${l==="Master's"?'selected':''}>${l}</option>`).join('')}<option value="__custom__">Other / custom…</option></select></div>
    <div class="field"><label>Main research project name</label><input id="oProj" placeholder="e.g. MSc thesis — solid-state electrolytes"></div>
    <div class="field"><label>Research topic / focus</label><input id="oTopic" placeholder="One line on what you're studying"></div>
    <div class="field"><label>Objectives (optional)</label><textarea id="oObj" placeholder="What does success look like for your thesis?"></textarea></div>
    <div class="two"><div class="field"><label>Advisor meeting day</label><select id="oAdv">${['','0','1','2','3','4','5','6'].map(v=>`<option value="${v}" ${v==='5'?'selected':''}>${v===''?'— none —':DOW[v]}</option>`).join('')}</select></div>
    <div class="field"><label>Weekend mode</label><select id="oWkMode"><option value="light" selected>Optional & light</option><option value="off">Fully off</option><option value="active">Active</option></select></div></div>
    <div class="field"><label>Which days are your weekend?</label><div class="chips" id="oDays">${dayChips}</div></div>
    <div class="field"><label class="flex" style="gap:8px;cursor:pointer"><input type="checkbox" id="oStarter" checked style="width:auto"> Load the Materials/Engineering starter workflow (fully editable)</label></div>`;
  openModal(modalShell('Set up Research Compass',body,`<button class="btn" onclick="finishOnboarding()" style="width:100%">Create my dashboard →</button>`),true);
}
function finishOnboarding(){ const name=$('#oProj').value.trim()||'My Research'; const days=[...document.querySelectorAll('#oDays .chip.on')].map(c=>+c.dataset.day);
  state.profile.name=$('#oName').value.trim(); state.profile.topic=$('#oTopic').value.trim(); state.profile.objectives=$('#oObj').value.trim(); state.profile.advisorDay=$('#oAdv').value;
  state.profile.level=(()=>{const v=$('#oLevel').value;return v==='__custom__'?'Researcher':v;})();
  state.settings.weekendDays=days.length?days:[0,6]; state.settings.weekendMode=$('#oWkMode').value; state.settings.onboarded=true;
  const np=newProject({name,isPrimary:true,trackingMode:'daily',loadStarter:$('#oStarter').checked}); state.projects.push(np); state.activeProjectId=np.id;
  save(); closeModal(); renderProjSwitch(); go('today'); toast('All set — welcome aboard!');
}
