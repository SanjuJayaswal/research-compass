/* Research Compass — split source.
   Loaded as CLASSIC scripts that share one global scope (inline on* handlers depend on it).
   Load order is fixed in index.html; main.js (bootstrap) MUST stay last.
   Do not convert to ES modules without refactoring the inline event handlers. */

/* ===================== RESEARCH GUIDE ===================== */
function renderGuide(){ const el=$('#page-guide');
  const flow=[['1','Read & map the field','Survey the literature, build a reference library, and write down the specific gap you are addressing. A gap you can state in one sentence is a gap you can attack.'],
    ['2','Frame the question','Turn the gap into a sharp, testable research question and 2–4 concrete objectives. Get these in front of your advisor early.'],
    ['3','Design the study','Plan experiments, fabrication routes, or simulations with controls and success criteria defined *before* you start. Decide what data you need and how you will analyse it.'],
    ['4','Make & measure','Synthesise, fabricate, or model — then characterise and test. Log every run, parameter, and deviation in your notebook as you go, not later.'],
    ['5','Analyse honestly','Process data with consistent, version-controlled scripts. Separate what the data shows from what you hoped it would show. Quantify uncertainty.'],
    ['6','Document & write','Keep a living lab notebook and write continuously — methods while fresh, results as they land. Writing reveals gaps in your thinking.'],
    ['7','Share & defend','Present to your group, your advisor, and at venues. Feedback is data. Iterate the question and the work.']];
  let html=`<div class="banner tip"><span class="bic">🎓</span><div>This is a starting playbook for Master's research in Materials & Engineering. It's guidance, not gospel — make it yours in the <b><a onclick="go('workflow')" style="cursor:pointer">Workflow</a></b> tab, which is fully editable and tracks your real progress.</div></div>`;
  html+=`<div class="card pad mb12"><div class="h2 mb12">The research arc</div><div class="mut3" style="font-size:12.5px;margin-bottom:14px">It rarely runs in a straight line — you'll loop back constantly. But these are the moves that turn effort into a thesis.</div>`;
  flow.forEach(f=>html+=`<div class="flex mb12" style="align-items:flex-start;gap:13px"><span style="width:30px;height:30px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:800;flex:none">${f[0]}</span><div><b>${f[1]}</b><div class="muted" style="font-size:13px;margin-top:2px">${f[2]}</div></div></div>`);
  html+=`</div>`;
  html+=`<div class="row mb12"><div class="card pad" style="flex:1;min-width:300px"><div class="h2 mb12">☀️ A solid research day</div>
    ${[['Plan first (10 min)','Pick 3 priorities tied to a milestone. Vague days drift; named tasks get done.'],
      ['One deep-work block (2–4 h)','Protect your sharpest hours for your hardest objective — no email, no Slack.'],
      ['Read something (30–45 min)','One paper or section daily keeps you fluent in your field and sparks ideas.'],
      ['Make tangible progress','Run an experiment, write a section, debug a model — something that moves a milestone.'],
      ['Log as you go','Update your notebook and this dashboard the moment things happen, not at midnight.'],
      ['Close the loop (10 min)','Record learnings & results, then set tomorrow\'s plan so you start with momentum.']].map(x=>`<div class="task"><span style="color:var(--amber)">●</span><div class="tx"><b>${x[0]}</b><div class="mut3" style="font-size:12.5px">${x[1]}</div></div></div>`).join('')}</div>
    <div class="card pad" style="flex:1;min-width:300px"><div class="h2 mb12">📆 Weekly rhythm</div>
    ${[['Literature scan','Skim new papers/alerts in your area; queue the good ones.'],
      ['Advisor meeting','Bring a one-page progress note + specific questions. Send notes after.'],
      ['Weekly review','Use the Reviews tab: what moved, what stalled, next week\'s top 3.'],
      ['Data & reference hygiene','Back up data, organise files, tidy your reference manager.'],
      ['Protect a long block','Schedule one half-day of uninterrupted deep work.']].map(x=>`<div class="task"><span style="color:var(--teal)">●</span><div class="tx"><b>${x[0]}</b><div class="mut3" style="font-size:12.5px">${x[1]}</div></div></div>`).join('')}</div></div>`;
  html+=`<div class="card pad"><div class="h2 mb12">🔧 Habits that protect a Materials/Engineering thesis</div><div class="two">
    ${[['🧪 Notebook discipline','Every sample, condition, and instrument setting — recorded live. Future-you cannot reconstruct what past-you didn\'t write down.'],
      ['💾 Data management','Raw data is sacred: back it up, never overwrite it, and keep analysis scripts under version control so results are reproducible.'],
      ['📏 Measurement rigor','Calibrate, run controls and replicates, and report uncertainty. One clean, trustworthy dataset beats ten sloppy ones.'],
      ['🛡️ Safety & SOPs','Know the hazards of your materials and equipment. Follow protocols — a lab incident can cost months.'],
      ['🔁 Reproducibility','If you can\'t repeat it, you don\'t have a result yet. Document methods precisely enough that someone else could follow them.'],
      ['🗣️ Talk about it','Explain your work weekly — to peers, your advisor, a rubber duck. Articulating it surfaces the holes faster than anything else.']].map(x=>`<div class="card pad" style="background:var(--surface-2)"><b>${x[0]}</b><div class="muted" style="font-size:13px;margin-top:5px">${x[1]}</div></div>`).join('')}
  </div></div>`;
  el.innerHTML=html;
}
