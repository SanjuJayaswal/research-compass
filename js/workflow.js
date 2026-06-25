/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== GENERIC INPUT MODAL ===================== */
let _cb=null;
function promptM(title,label,val,cb,textarea){ _cb=cb;
  const inp=textarea?`<textarea id="mInp" style="min-height:90px">${esc(val||'')}</textarea>`:`<input id="mInp" value="${esc(val||'')}">`;
  openModal(modalShell(title,`<div class="field"><label>${esc(label)}</label>${inp}</div>`,`<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="doPrompt()">Save</button>`));
  setTimeout(()=>{const e=$('#mInp');if(e){e.focus();}},50); }
function doPrompt(){ const v=$('#mInp').value.trim(); closeModal(); if(_cb)_cb(v); _cb=null; }

/* ===================== WORKFLOW ===================== */
function workflowProj(){ return curProj(); }
function renderWorkflow(){ const el=$('#page-workflow'); const p=workflowProj();
  let html='';
  if(state.activeProjectId==='__all__'&&state.projects.length>1) html+=`<div class="banner tip"><span class="bic">🧭</span><div>Showing <b>${esc(p?p.name:'—')}</b>. Use the project switcher (top-right) to edit another project's workflow.</div></div>`;
  if(!p){ el.innerHTML='<div class="empty"><div class="big">🧭</div>Create a project first to define its workflow.</div>'; return; }
  const stages=p.workflow.stages||[];
  // stages
  html+=`<div class="card pad mb12"><div class="between mb12"><div><div class="h2">Research workflow</div><div class="mut3" style="font-size:12.5px">Your stages — rename, reorder, add or remove anytime as your research evolves.</div></div>
    <div class="flex">${!stages.length?`<button class="btn ghost sm" onclick="loadStarter('${p.id}')">✨ Load starter template</button>`:''}<button class="btn sm" onclick="addStage('${p.id}')">+ Stage</button></div></div>`;
  if(!stages.length) html+='<div class="empty">No stages yet. Add your own, or load a Materials/Engineering starter you can fully edit.</div>';
  stages.forEach((s,i)=>{ const isCur=p.workflow.currentStageId===s.id;
    html+=`<div class="stage-item ${isCur?'cur':''}"><span class="gr">⋮⋮</span>
      <span style="width:24px;height:24px;border-radius:50%;background:${isCur?'var(--accent)':'#e3ddcd'};color:${isCur?'#fff':'#928c7d'};display:grid;place-items:center;font-size:12px;font-weight:700;flex:none">${i+1}</span>
      <div style="flex:1"><b>${esc(s.name)}</b> ${isCur?'<span class="pill accent" style="margin-left:6px">current</span>':''}</div>
      <button class="iconbtn" title="Move up" onclick="moveStage('${p.id}','${s.id}',-1)" ${i===0?'disabled style=opacity:.3':''}>↑</button>
      <button class="iconbtn" title="Move down" onclick="moveStage('${p.id}','${s.id}',1)" ${i===stages.length-1?'disabled style=opacity:.3':''}>↓</button>
      ${!isCur?`<button class="iconbtn" title="Set current" onclick="setCurStage('${p.id}','${s.id}')">◎</button>`:''}
      <button class="iconbtn" onclick="renameStage('${p.id}','${s.id}')">✎</button>
      <button class="iconbtn" onclick="delStage('${p.id}','${s.id}')">✕</button></div>`; });
  html+=`</div>`;
  // milestones
  const mss=p.milestones||[]; const t=todayStr();
  html+=`<div class="card pad mb12"><div class="between mb12"><div class="h2">Milestones</div><button class="btn sm" onclick="editMilestone('${p.id}')">+ Milestone</button></div>`;
  if(!mss.length) html+='<div class="mut3" style="font-size:13px">No milestones yet. Add the checkpoints that matter for your thesis.</div>';
  mss.slice().sort((a,b)=>(a.targetDate||'9999').localeCompare(b.targetDate||'9999')).forEach(m=>{ const od=m.status!=='done'&&m.targetDate&&daysBetween(t,m.targetDate)<0;
    html+=`<div class="lrow"><div class="cb ${m.status==='done'?'on':''}" onclick="cycleMs('${p.id}','${m.id}')" title="cycle status">${m.status==='done'?'✓':m.status==='doing'?'◐':''}</div>
      <div class="grow"><div class="ttl">${esc(m.name)}</div><div class="desc">${m.stageId?esc(stageName(p.id,m.stageId))+' · ':''}${m.targetDate?(od?'<span style="color:var(--red);font-weight:600">overdue '+fmtShort(m.targetDate)+'</span>':'target '+fmtShort(m.targetDate)):'no date'} · ${m.status}</div></div>
      <button class="iconbtn" onclick="editMilestone('${p.id}','${m.id}')">✎</button><button class="iconbtn" onclick="delMs('${p.id}','${m.id}')">✕</button></div>`; });
  html+=`</div>`;
  // routine
  html+=`<div class="card pad"><div class="h2 mb12">Daily routine & cadence <span class="mut3" style="font-size:12px;font-weight:500">(editable guidance, shared across projects)</span></div>
    <div class="two"><div><div class="sec-title">✔ Daily non-negotiables</div>${editList(state.routine.nonNegotiables,'nn')}<button class="btn ghost sm mt8" onclick="addRoutine('nn')">+ Add</button></div>
    <div><div class="sec-title">📆 Weekly cadence</div>${editList(state.routine.weeklyCadence,'wc')}<button class="btn ghost sm mt8" onclick="addRoutine('wc')">+ Add</button></div></div>
    <div class="field mt14"><label>Notes</label><textarea onchange="state.routine.notes=this.value;save();toast('Saved')">${esc(state.routine.notes)}</textarea></div></div>`;
  el.innerHTML=html;
}
function editList(arr,key){ return '<div>'+arr.map((x,i)=>`<div class="task"><span style="color:var(--green)">•</span><div class="tx">${esc(x)}</div><button class="iconbtn" onclick="delRoutine('${key}',${i})">✕</button></div>`).join('')+'</div>'; }
function addRoutine(key){ const k=key==='nn'?'nonNegotiables':'weeklyCadence'; promptM('Add item','Text','',v=>{if(v){state.routine[k].push(v);save();renderWorkflow();}}); }
function delRoutine(key,i){ const k=key==='nn'?'nonNegotiables':'weeklyCadence'; state.routine[k].splice(i,1); save(); renderWorkflow(); }
function loadStarter(pid){ const p=getProj(pid); const stages=starterStages(); p.workflow.stages=stages; p.workflow.currentStageId=stages[0].id; if(!p.milestones||!p.milestones.length)p.milestones=starterMilestones(stages); save(); renderWorkflow(); toast('Starter workflow loaded — edit it freely'); }
function addStage(pid){ promptM('Add stage','Stage name','',v=>{ if(!v)return; const p=getProj(pid); p.workflow.stages.push({id:uid('st'),name:v}); if(!p.workflow.currentStageId)p.workflow.currentStageId=p.workflow.stages[0].id; save(); renderWorkflow(); }); }
function renameStage(pid,sid){ const p=getProj(pid); const s=p.workflow.stages.find(x=>x.id===sid); promptM('Rename stage','Stage name',s.name,v=>{if(v){s.name=v;save();renderWorkflow();}}); }
function delStage(pid,sid){ const p=getProj(pid); p.workflow.stages=p.workflow.stages.filter(x=>x.id!==sid); if(p.workflow.currentStageId===sid)p.workflow.currentStageId=p.workflow.stages[0]?p.workflow.stages[0].id:null; save(); renderWorkflow(); }
function setCurStage(pid,sid){ getProj(pid).workflow.currentStageId=sid; save(); renderWorkflow(); }
function moveStage(pid,sid,dir){ const a=getProj(pid).workflow.stages; const i=a.findIndex(x=>x.id===sid); const j=i+dir; if(j<0||j>=a.length)return; [a[i],a[j]]=[a[j],a[i]]; save(); renderWorkflow(); }
function cycleMs(pid,mid){ const m=getProj(pid).milestones.find(x=>x.id===mid); m.status=m.status==='todo'?'doing':m.status==='doing'?'done':'todo'; save(); renderWorkflow(); }
function delMs(pid,mid){ const p=getProj(pid); p.milestones=p.milestones.filter(x=>x.id!==mid); save(); renderWorkflow(); }
function editMilestone(pid,mid){ const p=getProj(pid); const m=mid?p.milestones.find(x=>x.id===mid):{name:'',targetDate:'',status:'todo',stageId:p.workflow.currentStageId};
  const stageOpts='<option value="">— no stage —</option>'+(p.workflow.stages||[]).map(s=>`<option value="${s.id}" ${m.stageId===s.id?'selected':''}>${esc(s.name)}</option>`).join('');
  const body=`<div class="field"><label>Milestone</label><input id="msName" value="${esc(m.name)}" placeholder="e.g. Submit thesis draft"></div>
    <div class="two"><div class="field"><label>Target date</label><input id="msDate" type="date" value="${m.targetDate||''}"></div>
    <div class="field"><label>Status</label><select id="msStatus">${['todo','doing','done'].map(s=>`<option ${m.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
    <div class="field"><label>Stage</label><select id="msStage">${stageOpts}</select></div>`;
  openModal(modalShell(mid?'Edit milestone':'New milestone',body,`<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveMilestone('${pid}','${mid||''}')">Save</button>`)); }
function saveMilestone(pid,mid){ const p=getProj(pid); const name=$('#msName').value.trim(); if(!name){toast('Name required');return;}
  const data={name,targetDate:$('#msDate').value,status:$('#msStatus').value,stageId:$('#msStage').value};
  if(mid){ Object.assign(p.milestones.find(x=>x.id===mid),data); } else { p.milestones.push({id:uid('ms'),...data}); }
  save(); closeModal(); renderWorkflow(); }

/* ===================== PROJECTS ===================== */
function renderProjects(){ const el=$('#page-projects'); let html=`<div class="between mb12"><div class="mut3" style="font-size:13px">Run your main research plus optional parallel projects. Choose how closely to track each one.</div><button class="btn" onclick="editProject()">+ New project</button></div>`;
  if(!state.projects.length){ html+='<div class="empty"><div class="big">🗂️</div>No projects yet. Add your main research to get started.</div>'; el.innerHTML=html; return; }
  html+='<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">';
  state.projects.forEach(p=>{ const tot=(p.milestones||[]).length,done=(p.milestones||[]).filter(m=>m.status==='done').length; const pc=tot?Math.round(done/tot*100):0;
    html+=`<div class="card pad"><div class="between"><div class="flex"><span style="width:13px;height:13px;border-radius:4px;background:${p.color};display:inline-block"></span><b style="font-size:15px">${esc(p.name)}</b></div>${p.isPrimary?'<span class="pill accent">★ primary</span>':''}</div>
      <div class="flex wrap mt8" style="gap:6px"><span class="pill ${p.trackingMode==='daily'?'teal':''}">${p.trackingMode==='daily'?'Tracked daily':'Update when I want'}</span><span class="pill">${(p.workflow.stages||[]).length} stages</span><span class="pill">priority: ${p.priority}</span></div>
      <div class="mt14 mb6 between"><span class="mut3" style="font-size:12px">Milestones</span><span class="mut3" style="font-size:12px">${done}/${tot}</span></div><div class="bar ${barClass(pc)}"><span style="width:${pc}%"></span></div>
      <div class="flex mt14" style="gap:8px"><button class="btn ghost sm" onclick="setActiveProject('${p.id}');go('workflow')">Open workflow</button><button class="btn ghost sm" onclick="editProject('${p.id}')">Edit</button>${state.projects.length>1?`<button class="iconbtn" style="margin-left:auto" onclick="delProject('${p.id}')">🗑</button>`:''}</div></div>`; });
  html+='</div>'; el.innerHTML=html;
}
function editProject(pid){ const p=pid?getProj(pid):{name:'',color:PALETTE[state.projects.length%PALETTE.length],trackingMode:'daily',priority:'normal',isPrimary:!state.projects.length};
  const colorChips=PALETTE.map(c=>`<span class="chip ${p.color===c?'on':''}" style="background:${c};border-color:${c};width:26px;height:26px;padding:0;border-radius:8px" onclick="document.querySelectorAll('#colorRow .chip').forEach(x=>x.classList.remove('on'));this.classList.add('on');this.dataset.sel=1;window._pcolor='${c}'" data-c="${c}"></span>`).join('');
  const body=`<div class="field"><label>Project name</label><input id="pName" value="${esc(p.name)}" placeholder="e.g. MSc thesis — perovskite solar cells"></div>
    <div class="field"><label>Colour</label><div class="chips" id="colorRow">${colorChips}</div></div>
    <div class="two"><div class="field"><label>Tracking mode</label><select id="pMode">
      <option value="daily" ${p.trackingMode==='daily'?'selected':''}>Track daily — counts toward completion & warnings</option>
      <option value="adhoc" ${p.trackingMode==='adhoc'?'selected':''}>Update when I want — no warnings/pressure</option></select></div>
    <div class="field"><label>Priority</label><select id="pPrio">${['high','normal','low'].map(x=>`<option ${p.priority===x?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <label class="flex" style="gap:8px;font-size:13px;cursor:pointer"><input type="checkbox" id="pPrimary" ${p.isPrimary?'checked':''} style="width:auto"> Mark as primary research project</label>
    ${!pid?'<div class="field mt14"><label class="flex" style="gap:8px;cursor:pointer"><input type="checkbox" id="pStarter" style="width:auto"> Load the Materials/Engineering starter workflow (you can edit it)</label></div>':''}`;
  window._pcolor=p.color;
  openModal(modalShell(pid?'Edit project':'New project',body,`<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveProject('${pid||''}')">Save</button>`)); }
function saveProject(pid){ const name=$('#pName').value.trim(); if(!name){toast('Name required');return;}
  const data={name,color:window._pcolor,trackingMode:$('#pMode').value,priority:$('#pPrio').value,isPrimary:$('#pPrimary').checked};
  if(data.isPrimary) state.projects.forEach(p=>p.isPrimary=false);
  if(pid){ Object.assign(getProj(pid),data); }
  else { const np=newProject({...data,loadStarter:$('#pStarter')&&$('#pStarter').checked}); state.projects.push(np); if(!state.activeProjectId)state.activeProjectId=np.id; }
  save(); closeModal(); renderProjSwitch(); renderProjects(); toast('Project saved'); }
function delProject(pid){ promptM('Delete project','Type DELETE to confirm removing this project and its workflow (logs are kept).','',v=>{ if(v==='DELETE'){ state.projects=state.projects.filter(p=>p.id!==pid); if(state.activeProjectId===pid)state.activeProjectId=state.projects[0]?state.projects[0].id:'__all__'; save(); renderProjSwitch(); renderProjects(); toast('Project deleted'); } }); }
