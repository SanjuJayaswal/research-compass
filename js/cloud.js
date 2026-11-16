/* Research Compass — split source.
   cloud.js: Supabase sync (email + password auth; whole state stored as one JSONB row per user).
   Loads after the app modules, before main.js. Wraps save() to also sync; gates boot behind auth. */

const SB_URL='https://wpvinpjupowzdkdwxggo.supabase.co';
const SB_KEY='sb_publishable_cvn24gS4kP44PLmvIt4MNg_I-bRGqU9';
const SB_TABLE='compass_states';

let sb=null, currentUser=null, _cloudSaveTimer=null, _authMode='signin';
window.__sync='idle';

/* Session storage: try localStorage, then cookies (chunked, for big session JSON), then memory.
   Keeps you signed in wherever the browser allows persistent storage. */
const _mem={};
function _ckGet(k){ try{ const m=document.cookie.match('(?:^|; )'+k.replace(/([.$?*|{}()\[\]\\\/+^])/g,'\\$1')+'=([^;]*)'); return m?decodeURIComponent(m[1]):null; }catch(e){ return null; } }
function _ckSet(k,v){ try{ document.cookie=k+'='+encodeURIComponent(v)+';path=/;max-age=31536000;SameSite=Lax'; return true; }catch(e){ return false; } }
function _ckDel(k){ try{ document.cookie=k+'=;path=/;max-age=0;SameSite=Lax'; }catch(e){} }
const _CKN=3000;
function cookieGet(k){ const meta=_ckGet(k); if(meta===null) return null; if(!/^chunks:\d+$/.test(meta)) return meta; const n=+meta.split(':')[1]; let out=''; for(let i=0;i<n;i++){ const c=_ckGet(k+'.'+i); if(c===null) return null; out+=c; } return out; }
function cookieSet(k,v){ const prev=_ckGet(k); if(prev&&/^chunks:\d+$/.test(prev)){ const pn=+prev.split(':')[1]; for(let i=0;i<pn;i++) _ckDel(k+'.'+i); }
  if(v.length<=_CKN) return _ckSet(k,v);
  const n=Math.ceil(v.length/_CKN); if(!_ckSet(k,'chunks:'+n)) return false; for(let i=0;i<n;i++){ if(!_ckSet(k+'.'+i, v.slice(i*_CKN,(i+1)*_CKN))) return false; } return true; }
function cookieDel(k){ const meta=_ckGet(k); if(meta&&/^chunks:\d+$/.test(meta)){ const n=+meta.split(':')[1]; for(let i=0;i<n;i++) _ckDel(k+'.'+i); } _ckDel(k); }
const safeStorage={
  getItem:k=>{ try{ const v=localStorage.getItem(k); if(v!==null) return v; }catch(e){} const c=cookieGet(k); if(c!==null) return c; return (k in _mem)?_mem[k]:null; },
  setItem:(k,v)=>{ _mem[k]=v; let ok=false; try{ localStorage.setItem(k,v); ok=true; }catch(e){} if(!ok) cookieSet(k,v); },
  removeItem:k=>{ delete _mem[k]; try{ localStorage.removeItem(k); }catch(e){} cookieDel(k); }
};

function cloudConfigured(){ return !!(window.supabase && /^https?:\/\//.test(SB_URL) && SB_KEY); }

/* light safety normalize for state loaded from the cloud */
function cloudNormalize(s){
  if(!s||typeof s!=='object') return s;
  s.settings=Object.assign({weekendDays:[0,6],weekendMode:'light',weekendIntentions:['Reading','Rest'],warnThreshold:70,reminderMorning:'08:30',reminderEvening:'20:00',theme:'light',onboarded:false},s.settings||{});
  if(!s.settings.timezone){ try{s.settings.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){s.settings.timezone='Asia/Kolkata';} }
  if(s.settings.notify===undefined) s.settings.notify=true;
  s.routine=s.routine||(typeof defaultRoutine==='function'?defaultRoutine():{nonNegotiables:[],weeklyCadence:[],notes:''});
  s.reviews=s.reviews||{weekly:[],monthly:[]};
  ['projects','papers','deadlines','timeSessions'].forEach(k=>{ if(!Array.isArray(s[k])) s[k]=[]; });
  s.logs=s.logs||{};
  if(typeof ensureHabits==='function') ensureHabits(s);
  return s;
}

function updateSyncUI(){
  const map={idle:['',''],loading:['Loading…','amber'],saving:['Saving…','amber'],saved:['Synced','green'],offline:['Offline · cached','red']};
  const v=map[window.__sync]||['',''];
  const badge=document.getElementById('syncBadge');
  if(badge){ badge.textContent=v[0]; badge.className='syncbadge '+(v[1]||''); badge.style.display=v[0]?'flex':'none'; }
  const acct=document.getElementById('acctSync'); if(acct){ acct.textContent=v[0]||'—'; acct.className='pill '+(v[1]||''); }
}

async function cloudInit(){
  if(!cloudConfigured()) return false;
  try{ sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{storage:safeStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}); return true; }
  catch(e){ sb=null; return false; }
}

function scheduleCloudSave(){ if(!sb||!currentUser) return; window.__sync='saving'; updateSyncUI(); clearTimeout(_cloudSaveTimer); _cloudSaveTimer=setTimeout(doCloudSave,1200); }
async function doCloudSave(){ if(!sb||!currentUser) return;
  try{ const {error}=await sb.from(SB_TABLE).upsert({user_id:currentUser.id,data:state},{onConflict:'user_id'}); if(error) throw error; window.__sync='saved'; }
  catch(e){ window.__sync='offline'; console.warn('[cloud] save failed:', e&&e.message); }
  updateSyncUI();
}
async function loadCloud(){
  window.__sync='loading'; updateSyncUI();
  try{
    const {data,error}=await sb.from(SB_TABLE).select('data').eq('user_id',currentUser.id).maybeSingle();
    if(error) throw error;
    if(data&&data.data&&Object.keys(data.data).length){
      state=cloudNormalize(data.data); try{ rawSet(JSON.stringify(state)); }catch(e){} window.__sync='saved';
    } else if(state&&state.settings&&state.settings.onboarded){
      await doCloudSave();              // first sign-in with existing local data → migrate it up
    } else { window.__sync='saved'; }
  }catch(e){ window.__sync='offline'; console.warn('[cloud] load failed:', e&&e.message); }
  updateSyncUI();
}

/* wrap the app's save() so every local save also schedules a cloud sync */
if(typeof save==='function'){ const _origSave=save; save=function(){ _origSave(); scheduleCloudSave(); }; }

/* ---------- Auth gate ---------- */
function buildAuthGate(){
  if(document.getElementById('authGate')) return;
  const g=document.createElement('div'); g.id='authGate';
  g.innerHTML=`<div class="authcard">
    <div class="authbrand"><div class="authlogo">R</div><div><b class="serif">Research Compass</b><div class="authsub">Sign in to sync your research data</div></div></div>
    <div id="authMsg" class="authmsg" style="display:none"></div>
    <div class="field"><label>Email</label><input id="authEmail" type="email" autocomplete="email" placeholder="you@university.edu" onkeydown="if(event.key==='Enter')document.getElementById('authPass').focus()"></div>
    <div class="field"><label>Password</label><input id="authPass" type="password" autocomplete="current-password" placeholder="At least 6 characters" onkeydown="if(event.key==='Enter')cloudPrimary()"></div>
    <button class="btn" id="authPrimary" style="width:100%;justify-content:center" onclick="cloudPrimary()">Sign in</button>
    <div class="authnote">Your data is stored privately in your own Supabase project (row-level security keeps it yours), and you stay signed in on this device.</div>
  </div>`;
  document.body.appendChild(g);
}
function applyAuthMode(){
  const p=document.getElementById('authPrimary'),t=document.getElementById('authToggle'),tt=document.getElementById('authToggleText'),pw=document.getElementById('authPass');
  if(_authMode==='signup'){ p.textContent='Create account'; t.textContent='Sign in instead'; tt.textContent='Already have an account?'; if(pw)pw.setAttribute('autocomplete','new-password'); }
  else { p.textContent='Sign in'; t.textContent='Create one'; tt.textContent="Don't have an account?"; if(pw)pw.setAttribute('autocomplete','current-password'); }
}
function cloudToggleMode(){ _authMode=(_authMode==='signin')?'signup':'signin'; applyAuthMode(); authMsg(''); }
function authMsg(t,kind){ const m=document.getElementById('authMsg'); if(!m)return; m.style.display=t?'block':'none'; m.textContent=t||''; m.className='authmsg '+(kind||''); }
function showAuthGate(){ buildAuthGate(); document.getElementById('authGate').style.display='grid'; }
function hideAuthGate(){ const g=document.getElementById('authGate'); if(g) g.style.display='none'; }

async function cloudPrimary(){
  const email=(document.getElementById('authEmail').value||'').trim();
  const pass=document.getElementById('authPass').value||'';
  if(!email||!pass){ authMsg('Enter your email and password.','err'); return; }
  if(pass.length<6){ authMsg('Password must be at least 6 characters.','err'); return; }
  const btn=document.getElementById('authPrimary'); btn.disabled=true; const orig=btn.textContent; btn.textContent='Please wait…';
  try{
    const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error) throw error;
    currentUser=data.user; await afterAuth();
  }catch(e){ authMsg((e&&e.message)?e.message:'Sign-in failed — check your email and password.','err'); btn.disabled=false; btn.textContent=orig; }
}
async function afterAuth(){ hideAuthGate(); await loadCloud(); if(typeof startApp==='function') startApp(); else if(typeof go==='function') go('today'); }
function cloudContinueOffline(){ hideAuthGate(); if(typeof startApp==='function') startApp(); }
async function cloudSignOut(){ try{ if(sb) await sb.auth.signOut(); }catch(e){} try{ localStorage.removeItem(KEY); }catch(e){} location.reload(); }

function cloudAccountCard(){
  if(!currentUser) return `<div class="card pad mb12"><div class="h2 mb12">☁️ Account & sync</div><div class="muted" style="font-size:13px">Not syncing — running locally on this device. <a onclick="showAuthGate()" style="cursor:pointer;font-weight:600">Sign in to sync →</a></div></div>`;
  const v={loading:'Loading…',saving:'Saving…',saved:'Synced',offline:'Offline'}[window.__sync]||'—';
  return `<div class="card pad mb12"><div class="h2 mb12">☁️ Account & sync</div>
    <div class="between"><div><div class="mut3" style="font-size:12px">Signed in as</div><div style="font-weight:600">${typeof esc==='function'?esc(currentUser.email):currentUser.email}</div></div>
      <span class="pill" id="acctSync">${v}</span></div>
    <div class="mut3" style="font-size:12px;margin-top:8px">Your dashboard syncs to your Supabase project, with a local cache so it keeps working offline.</div>
    <button class="btn ghost mt14" onclick="cloudSignOut()">Sign out</button></div>`;
}

async function initCloudAndBoot(){
  if(!document.getElementById('syncBadge')){ const s=document.createElement('div'); s.id='syncBadge'; s.className='syncbadge'; s.style.display='none'; document.body.appendChild(s); }
  const ok=await cloudInit();
  if(!ok){ if(typeof startApp==='function') startApp(); return; }   // cloud unavailable → local only
  if(typeof applyTheme==='function') applyTheme((state.settings&&state.settings.theme)||'light');
  showAuthGate(); authMsg('');
  try{ const {data}=await sb.auth.getSession(); if(data&&data.session){ currentUser=data.session.user; await afterAuth(); } }
  catch(e){ /* leave gate visible */ }
}
