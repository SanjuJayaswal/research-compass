/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== ANALYTICS ===================== */
let _charts=[];
function disposeCharts(){ _charts.forEach(c=>{try{c.dispose()}catch(e){}}); _charts=[]; }
function mkChart(id,opt){ const dom=document.getElementById(id); if(!dom)return; const c=echarts.init(dom); c.setOption(opt); _charts.push(c); }
function renderAnalytics(){ disposeCharts(); const el=$('#page-analytics'); const t=todayStr();
  // KPIs
  const days30=[...Array(30)].map((_,i)=>addDays(t,-29+i));
  const logged=days30.filter(d=>isTrackedWorkday(d)&&hasAnyLog(d)).length;
  const trackedDays=days30.filter(d=>isTrackedWorkday(d)).length;
  const avg=(()=>{ const vals=days30.map(d=>overallCompletion(d)).filter(v=>v!==null); return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null; })();
  const fh=(state.timeSessions.filter(s=>s.date>=days30[0]).reduce((a,b)=>a+b.minutes,0)/60);
  const papers30=state.papers.filter(p=>p.readAt&&p.readAt>=days30[0]).length;
  let html=`<div class="row mb12">
    <div class="card pad kpi"><div class="lab">Avg completion (30d)</div><div class="val">${avg==null?'—':avg+'<small>%</small>'}</div></div>
    <div class="card pad kpi"><div class="lab">Days logged (30d)</div><div class="val">${logged}<small>/ ${trackedDays}</small></div></div>
    <div class="card pad kpi"><div class="lab">Focus hours (30d)</div><div class="val">${fh.toFixed(1)}<small>h</small></div></div>
    <div class="card pad kpi"><div class="lab">Papers read (30d)</div><div class="val">${papers30}</div></div></div>`;
  html+=`<div class="card pad mb12"><div class="sec-title">📈 Completion trend (last 30 days)</div><div id="cTrend" style="height:260px"></div></div>`;
  html+=`<div class="row mb12"><div class="card pad" style="flex:1;min-width:300px"><div class="sec-title">🗓️ Consistency calendar</div><div id="cCal" style="height:200px"></div><div class="mut3" style="font-size:11.5px;margin-top:4px">Greener = higher completion. Weekends in rest mode don't count against you.</div></div></div>`;
  html+=`<div class="row mb12"><div class="card pad" style="flex:1;min-width:280px"><div class="sec-title">🧩 Effort by category (done tasks, 30d)</div><div id="cCat" style="height:240px"></div></div>
    <div class="card pad" style="flex:1;min-width:280px"><div class="sec-title">⏱️ Focus time by category (30d)</div><div id="cTime" style="height:240px"></div></div></div>`;
  html+=`<div class="card pad"><div class="sec-title">🎯 Milestone progress by project</div><div id="msWrap"></div></div>`;
  el.innerHTML=html;

  // trend
  const trend=days30.map(d=>{ const v=overallCompletion(d); return [d, v]; });
  mkChart('cTrend',{grid:{left:38,right:16,top:18,bottom:46},tooltip:{trigger:'axis',formatter:p=>{const x=p[0];return fmtNice(x.axisValue)+'<br/>'+(x.data[1]==null?'No plan':x.data[1]+'%');}},
    xAxis:{type:'category',data:days30,axisLabel:{formatter:v=>fmtShort(v),color:chAxis(),interval:4},axisLine:{lineStyle:{color:chSplit()}}},
    yAxis:{type:'value',max:100,min:0,splitLine:{lineStyle:{color:chSplit()}},axisLabel:{formatter:'{value}%',color:chAxis()}},
    series:[{type:'line',data:trend.map(x=>x[1]),smooth:true,connectNulls:false,symbol:'circle',symbolSize:6,
      lineStyle:{width:3,color:'#ff7e5f'},itemStyle:{color:'#ff7e5f'},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(255,126,95,.22)'},{offset:1,color:'rgba(255,126,95,0)'}])},
      markLine:{silent:true,symbol:'none',data:[{yAxis:state.settings.warnThreshold,lineStyle:{color:'#c7791f',type:'dashed'},label:{formatter:'Warn '+state.settings.warnThreshold+'%',color:'#c7791f',fontSize:10}}]}}]});

  // calendar
  const calStart=addDays(t,-112); const calData=[];
  for(let i=0;i<=112;i++){ const d=addDays(calStart,i); const v=overallCompletion(d); if(v!==null) calData.push([d,v]); }
  mkChart('cCal',{tooltip:{formatter:p=>fmtNice(p.data[0])+': '+p.data[1]+'%'},visualMap:{min:0,max:100,show:false,inRange:{color:['#ffe9e0','#ffc6b0','#ff9b7d','#ff7e5f']}},
    calendar:{top:24,left:24,right:10,bottom:6,cellSize:['auto',16],range:[calStart,t],itemStyle:{borderColor:'#fff',borderWidth:2,color:'#f1f3f9'},
      splitLine:{show:false},yearLabel:{show:false},dayLabel:{color:chAxis(),fontSize:10,firstDay:1},monthLabel:{color:chAxis(),fontSize:11}},
    series:[{type:'heatmap',coordinateSystem:'calendar',data:calData}]});

  // category breakdown
  const catCount={}; days30.forEach(d=>{ const dd=state.logs[d]; if(!dd)return; Object.values(dd.byProject).forEach(l=>l.tasks.forEach(tk=>{ if(tk.done){ const c=tk.category||'Other'; catCount[c]=(catCount[c]||0)+1; } })); });
  const catData=Object.keys(catCount).map(c=>({name:c,value:catCount[c],itemStyle:{color:catColor(c)}}));
  if(catData.length) mkChart('cCat',{tooltip:{trigger:'item'},legend:{bottom:0,textStyle:{color:chAxis(),fontSize:11}},
    series:[{type:'pie',radius:['46%','72%'],center:['50%','44%'],avoidLabelOverlap:true,itemStyle:{borderColor:'#fff',borderWidth:2},label:{show:false},data:catData}]});
  else document.getElementById('cCat').innerHTML='<div class="empty" style="padding:60px 0">No completed tasks yet</div>';

  // time by category
  const timeCount={}; state.timeSessions.filter(s=>s.date>=days30[0]).forEach(s=>{ const c=s.category||'Other'; timeCount[c]=(timeCount[c]||0)+s.minutes; });
  const tk=Object.keys(timeCount);
  if(tk.length) mkChart('cTime',{grid:{left:60,right:18,top:12,bottom:24},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>p[0].name+': '+(p[0].value/60).toFixed(1)+'h'},
    xAxis:{type:'value',axisLabel:{formatter:v=>(v/60).toFixed(0)+'h',color:chAxis()},splitLine:{lineStyle:{color:chSplit()}}},
    yAxis:{type:'category',data:tk,axisLabel:{color:chAxis()}},
    series:[{type:'bar',data:tk.map(c=>({value:timeCount[c],itemStyle:{color:catColor(c),borderRadius:[0,6,6,0]}})),barWidth:'56%'}]});
  else document.getElementById('cTime').innerHTML='<div class="empty" style="padding:60px 0">No focus sessions logged yet</div>';

  // milestones
  let ms=''; state.projects.forEach(p=>{ const tot=(p.milestones||[]).length; const done=(p.milestones||[]).filter(m=>m.status==='done').length; const pc=tot?Math.round(done/tot*100):0;
    ms+=`<div class="mb12"><div class="between mb6"><div class="flex"><span class="dot" style="width:10px;height:10px;border-radius:50%;background:${p.color};display:inline-block"></span> <b>${esc(p.name)}</b></div><span class="mut3">${done}/${tot} milestones</span></div><div class="bar ${barClass(pc)}"><span style="width:${pc}%"></span></div></div>`; });
  document.getElementById('msWrap').innerHTML=ms||'<div class="mut3">No milestones yet — add them in Workflow.</div>';
}
