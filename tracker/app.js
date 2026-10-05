import {esc,timeline,stages} from './ui.js?v=20261005brand1';
import {board,planner,ledger} from './views.js?v=20261005brand1';
import * as dialogs from './dialogs.js?v=20261005brand1';
import {outreach} from './channels.js?v=20261005brand1';
import {project,jobForm,safeLink} from './data.js?v=20261005brand1';
import {ensureTracked} from './persistence.js?v=20261005brand1';
import {linkForm,linkPayload} from './links.js?v=20261005brand1';
import {request,authenticate,signedIn,signOut,onExpired} from './api.js?v=20261005brand1';

const $=s=>document.querySelector(s), VIEWS=['board','planner','ledger'];
const state={data:null,query:'',stage:'all',scope:'all',group:'stage',sort:'updated',selectedId:null,collapsed:[],selectedDate:'',taskFilter:'open'};
let view=new URLSearchParams(location.search).get('view'),detailId=null,detailTab='overview',feedbackKind='core',feedbackPane='form',returnFocus=null,busy=false,loading=false,epoch=0,submission=null,outreachOpen=false;
if(!VIEWS.includes(view)){try{view=localStorage.getItem('miro_tracker_view')}catch{}if(!VIEWS.includes(view))view='board';}
const job=id=>state.data?.jobs.find(j=>j.id===id);
function status(message,error=false){$('#sync-status').textContent=message;$('#sync-status').classList.toggle('error',error);}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),5500);}
function controls(){document.querySelectorAll('.session-controls button').forEach(b=>{b.disabled=!state.data||busy||loading;if(b.dataset.action==='logout'){b.hidden=!signedIn();b.disabled=false;}});}
function selectView(value,replace=false){
  if(!VIEWS.includes(value))return;view=value;
  const url=new URL(location.href);url.searchParams.set('view',value);url.hash='';
  history[replace?'replaceState':'pushState'](null,'',url.pathname+url.search);
  try{localStorage.setItem('miro_tracker_view',value)}catch{}
  render();
}
function render(){
  document.body.dataset.view=view;
  document.querySelectorAll('[data-concept]').forEach(a=>{a.classList.toggle('active',a.dataset.concept===view);a.setAttribute('aria-current',a.dataset.concept===view?'page':'false');});
  controls();if(!state.data)return;
  const focused=document.activeElement?.id,pos=document.activeElement?.selectionStart;
  $('#app').innerHTML=({board,planner,ledger}[view])(state);
  if(focused&&document.getElementById(focused)){const el=document.getElementById(focused);el.focus();if(pos!==null&&el.type==='search')el.setSelectionRange(pos,pos);}
}
function requireSignIn(message='Open My jobs & activity from your signed-in extension.'){
  epoch++;Object.assign(state,{data:null,query:'',stage:'all',scope:'all',selectedId:null,collapsed:[],selectedDate:'',taskFilter:'open'});submission=null;busy=false;loading=false;outreachOpen=false;detailId=null;feedbackKind='core';feedbackPane='form';returnFocus=null;
  clearTimeout(toast.timer);$('#toast').textContent='';$('#toast').classList.remove('visible');
  document.querySelectorAll('dialog').forEach(d=>{d.close();d.replaceChildren();});
  $('#app').innerHTML=`<main id="workspace" class="auth-message"><img src="tracker/assets/logo.png" alt="MiConnects logo"><h1>Your job activity</h1><p>${esc(message)}</p><p class="muted">The extension opens a secure sign-in link for this account. Then use Pipeline, Daybook or Ledger at the top.</p></main>`;
  status(message,true);render();
}
onExpired(()=>requireSignIn('Your session expired. Open My jobs & activity from the extension again.'));
function show(id,html){const el=document.getElementById(id);if(!el.open)returnFocus=document.activeElement;el.innerHTML=html;if(!el.open)el.showModal();el.scrollTop=0;}
function closeDialog(el){el.close();if(el.id==='small-dialog')outreachOpen=false;returnFocus?.focus();}
function refreshDetail(){if($('#detail-dialog').open&&job(detailId))$('#detail-dialog').innerHTML=dialogs.detail(job(detailId),detailTab,state.data.email,state.data.plannerAvailable);}
function openDetail(id){if(!job(id))return;detailId=id;detailTab='overview';show('detail-dialog',dialogs.detail(job(id),detailTab,state.data.email,state.data.plannerAvailable));}
function saveDraft(){
  const f=$('#feedback-dialog form');if(!f||!state.data||busy)return;
  try{sessionStorage.setItem('miro_feedback_draft',JSON.stringify({email:state.data.email,kind:feedbackKind,fields:[...new FormData(f)],submission}));}catch{}
}
function openFeedback(){
  show('feedback-dialog',dialogs.feedback(state,feedbackKind,feedbackPane));
  if(feedbackPane!=='form')return;
  try{const draft=JSON.parse(sessionStorage.getItem('miro_feedback_draft')||'null');if(draft?.email===state.data.email&&draft.kind===feedbackKind){draft.fields.forEach(([k,v])=>{const el=$('#feedback-dialog form').elements.namedItem(k);if(el){if(el.type==='checkbox')el.checked=true;else el.value=v;}});submission=draft.submission;}}catch{}
}
async function reload(){
  if(!signedIn())return;loading=true;controls();const current=++epoch;
  try{
    const raw=await request('/overview');let tasks;
    try{tasks=await request('/tasks')}catch(error){if(error.status===401||error.status===403)throw error;tasks={tasks:[],unavailable:true};}
    if(current!==epoch||!signedIn())return;
    state.data=project(raw,tasks);render();refreshDetail();
    if(outreachOpen&&$('#small-dialog').open)$('#small-dialog').innerHTML=outreach(state.data);
    status((state.data.unlinkedOutreach?state.data.unlinkedOutreach+' outreach records have no usable job link; see Outreach. · ':'')+'Updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})+' IST'+(tasks.unavailable?' · Job activity is available; saved plans are temporarily unavailable.':'')+(state.data.historyLimited?' · Showing recent history.':'')+(raw.activity_expires_at?' · Activity access until '+new Date(raw.activity_expires_at).toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata'}):''),Boolean(tasks.unavailable));
  }catch(error){
    if(current!==epoch)return;
    if(error.status===403){state.data=null;requireSignIn(error.message)}
    else{status(error.message+(state.data?' Showing the previous snapshot.':''),true);if(!state.data)$('#app').innerHTML='<main id="workspace" class="auth-message"><h1>Activity could not load</h1><p>Your account data has not been replaced. Try refreshing.</p><button class="btn primary" data-action="refresh">Try again</button></main>';}
    throw error;
  }finally{if(current===epoch){loading=false;controls();}}
}
async function saved(callback,message){
  await callback();
  if(!signedIn())return;
  try{await reload();toast(message)}catch{toast('Saved to your account. Refresh to see the latest activity.');}
}
async function run(button,callback){
  if(busy||loading)return;busy=true;controls();if(button)button.disabled=true;
  const form=button?.closest('form'),fields=form?[...form.elements].map(el=>[el,el.disabled]):[];fields.forEach(([el])=>el.disabled=true);
  const dialog=button?.closest('dialog');dialog?.querySelector('[data-error]')?.remove();
  try{await callback()}catch(error){status(error.message,true);toast(error.message);if(dialog?.open){const alert=document.createElement('p');alert.setAttribute('role','alert');alert.setAttribute('data-error','');alert.textContent=error.message;dialog.append(alert);}}finally{fields.forEach(([el,disabled])=>{if(el.isConnected)el.disabled=disabled});busy=false;if(button?.isConnected)button.disabled=false;controls();}
}
function planEditor(j){if(!state.data.plannerAvailable){toast('Saved plans are temporarily unavailable. Refresh and try again later.');return;}show('small-dialog',dialogs.schedule(j,state.data.jobs));}
function exportJobs(){
  const result={exported_at:new Date().toISOString(),jobs:state.data.jobs.map(j=>({...jobForm(j),tracked:j.tracked,source:j.tracked===false?'outreach_receipts':'saved_job'})),tasks:state.data.jobs.filter(j=>j.planner).map(j=>({job_id:j.id,...j.planner}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='MiConnects-job-activity.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Export prepared. Check your downloads.');
}
async function openApplication(j){
  const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
  try{const tracked=await ensureTracked(j,request),r=await request('/jobs/'+encodeURIComponent(tracked.id)+'/apply'),url=safeLink(r.url);if(!url)throw Error('The application link is unavailable.');if(popup)popup.location=url;else show('small-dialog',`<header class="dialog-header"><h2 id="small-title">Open application</h2><button class="text-btn" data-action="close">Close</button></header><a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Continue to application</a>`);await reload();toast('Application link opened. Report Applied after you submit.');}catch(error){popup?.close();throw error;}
}
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-concept]');if(tab){e.preventDefault();selectView(tab.dataset.concept);return;}
  const b=e.target.closest('[data-action]');if(!b)return;const {action,id,value}=b.dataset,j=job(id);
  if(action==='close'){saveDraft();closeDialog(b.closest('dialog'));return;}
  if(action==='logout'){signOut();requireSignIn();return;}
  if(action==='refresh'){run(b,reload);return;}
  if(!state.data)return;
  if(action==='scope'){state.scope=value;render();}
  if(action==='clear'){state.query='';state.stage='all';state.scope='all';render();}
  if(action==='open')openDetail(id);
  if(action==='select'){state.selectedId=id;render();}
  if(action==='edit-stage'&&j)show('small-dialog',dialogs.editStage(j));
  if(action==='schedule'&&j)planEditor(j);
  if(action==='plan')planEditor(null);
  if(action==='add')show('small-dialog',dialogs.addJob());
  if(action==='complete'&&j?.planner)run(b,()=>saved(()=>request('/tasks/'+encodeURIComponent(j.id)+'/completion',{done:!j.planner.done,revision:j.planner.revision}),'Step updated. Your application stage is unchanged.'));
  if(action==='detail-tab'){detailTab=value;refreshDetail();}
  if(action==='day'){state.selectedDate=value;state.taskFilter='open';render();}
  if(action==='task-filter'){state.taskFilter=value;render();}
  if(action==='collapse'){state.collapsed=state.collapsed.includes(value)?state.collapsed.filter(x=>x!==value):[...state.collapsed,value];render();}
  if(action==='feedback'){feedbackPane='form';try{const draft=JSON.parse(sessionStorage.getItem('miro_feedback_draft')||'null');if(draft?.email===state.data.email&&['core','issue','outcome','value'].includes(draft.kind))feedbackKind=draft.kind}catch{}openFeedback();}
  if(action==='feedback-pane'){saveDraft();feedbackPane=value;openFeedback();}
  if(action==='history'){const events=state.data.activityEvents;show('small-dialog',`<header class="dialog-header"><span class="eyebrow">YOUR ACCOUNT ACTIVITY</span><button class="icon-btn" data-action="close" aria-label="Close dialog">×</button></header><h2 id="small-title">Your activity timeline</h2><p class="muted">Recorded events with their source and date.</p>${timeline(events,state.data.jobs)}`);}
  if(action==='export')exportJobs();
  if(action==='outreach'){outreachOpen=true;show('small-dialog',outreach(state.data));}
  if(action==='link-send'){const send=state.data.raw.sends.find(s=>s.id===id);if(send){outreachOpen=false;show('small-dialog',linkForm(send,state.data.jobs));}}
  if(action==='apply'&&j)run(b,()=>openApplication(j));
  if(action==='check')run(b,()=>saved(()=>request('/sends/'+encodeURIComponent(id)+'/check',{}),'Gmail check completed.'));
  if(action==='check-linkedin-reply')run(b,()=>saved(()=>request('/actions/'+encodeURIComponent(id)+'/check',{},'linkedin'),'LinkedIn conversation check completed.'));
  if(action==='check-linkedin')run(b,async()=>{const r=await request('/status',undefined,'linkedin');await saved(async()=>{},r.automation_available===false?'LinkedIn is temporarily unavailable. Your recorded actions are preserved.':r.connected?'LinkedIn profile connected.':'LinkedIn profile needs reconnection.');});
  if(action==='revoke'&&window.confirm('Revoke the resume and LinkedIn links for this outreach?'))run(b,()=>saved(()=>request('/links/'+encodeURIComponent(id)+'/revoke',{}),'Outreach links revoked.'));
  if(action==='connect-linkedin')run(b,async()=>{const r=await request('/auth-link',{},'linkedin'),url=safeLink(r.url);if(!url)throw Error('LinkedIn setup is unavailable. Try again shortly.');location.assign(url);});
  if(action==='pause-linkedin')run(b,()=>saved(()=>request('/pause',{paused:!state.data.raw.linkedin_connection?.paused},'linkedin'),'LinkedIn preference saved.'));
  if(action==='disconnect-linkedin'&&window.confirm('Disconnect this LinkedIn profile?'))run(b,()=>saved(()=>request('/disconnect',{},'linkedin'),'LinkedIn disconnected.'));
  if(['renew','retry-without-note','cancel-linkedin'].includes(action))run(b,()=>saved(()=>request('/actions/'+encodeURIComponent(id)+'/'+(action==='cancel-linkedin'?'cancel':action),{},'linkedin'),'LinkedIn action updated.'));
  if(action==='linkedin-outcome')run(b,()=>saved(()=>request('/actions/'+encodeURIComponent(id)+'/outcome',{outcome:value,comment:''},'linkedin'),'Outcome saved · reported by you.'));
});
document.addEventListener('input',e=>{if(e.target.id==='job-search'){state.query=e.target.value;render();}if(e.target.closest('#feedback-dialog form'))saveDraft();});
document.addEventListener('change',e=>{
  const {id,value}=e.target;
  if(id==='stage-filter')state.stage=value;
  if(id==='group-select'){state.group=value;state.collapsed=[];}
  if(id==='sort-select')state.sort=value;
  if(id==='feedback-kind'){feedbackKind=value;submission=null;openFeedback();return;}
  if(['stage-filter','group-select','sort-select'].includes(id))render();
});
document.addEventListener('submit',e=>{
  const f=e.target;if(!f.matches('[data-form]'))return;e.preventDefault();
  const values=new FormData(f),type=f.dataset.form,j=job(f.dataset.id);
  run(e.submitter,async()=>{
    if(type==='link-send'){await request('/sends/'+encodeURIComponent(f.dataset.id)+'/job',linkPayload(values));outreachOpen=true;await saved(async()=>{},'Job link saved · reported by you.');}
    if(['stage','note'].includes(type)&&j){if(j.tracked===false&&!j.metadataComplete)throw Error('Add this job with its role and company first.');const changes={note:values.get('note')};if(type==='note'&&j.tracked===false){const tracked=await ensureTracked(j,request);changes.stage=tracked.stage;changes.outcome_date=tracked.outcome_date;}if(type==='stage'){changes.stage=values.get('stage');changes.outcome_date=values.get('outcome_date')||null;if(!stages.includes(changes.stage))throw Error('Choose an application stage.');}const record=await request('/jobs',jobForm(j,changes));if(j.tracked===false){detailId=record.id;state.selectedId=record.id;}if(type==='stage')closeDialog(f.closest('dialog'));await saved(async()=>{},type==='stage'?'Stage saved · reported by you.':'Private note saved.');}
    if(type==='plan'){const target=job(values.get('job_id'));if(!target)throw Error('Select a job.');const tracked=await ensureTracked(target,request);if(target.tracked===false){detailId=tracked.id;state.selectedId=tracked.id;}await request('/tasks',{job_id:tracked.id,title:values.get('title'),date:values.get('date'),time:values.get('time'),reason:values.get('reason'),timezone:'Asia/Kolkata',revision:target.planner?.revision||0});closeDialog(f.closest('dialog'));await saved(async()=>{},'Plan saved to your account.');}
    if(type==='add'){const form={url:values.get('url').trim(),title:values.get('title').trim(),company:values.get('company').trim(),location:values.get('location').trim(),stage:'Saved',save_only:true};if(!form.title||!form.company)throw Error('Enter a role and company.');await request('/jobs',form);state.query='';state.stage='all';state.scope='all';closeDialog(f.closest('dialog'));await saved(async()=>{},'Job saved to your account.');}
    if(type==='feedback'){
      const choices={},comments={};for(const[k,v]of values){if(k.startsWith('choice_'))choices[k.slice(7)]=v;if(k.startsWith('comment_')&&v.trim())comments[k.slice(8)]=v;}
      const answers={kind:values.get('kind'),choices,comments,extension_version:'tracker-20261004',followup_consent:values.has('followup_consent'),quote_consent:values.has('quote_consent'),job_search_status:values.get('job_search_status'),survey_version:'pilot-v1'};
      const payload=JSON.stringify(answers);if(!submission||submission.payload!==payload)submission={payload,id:crypto.randomUUID()};try{sessionStorage.setItem('miro_feedback_draft',JSON.stringify({email:state.data.email,kind:feedbackKind,fields:[...values],submission}))}catch{}
      await request('/feedback',{...answers,operation_id:submission.id});submission=null;sessionStorage.removeItem('miro_feedback_draft');feedbackPane='history';await saved(async()=>{},'Thank you. Feedback saved to your account.');if(state.data)openFeedback();
    }
  });
});
let dragging=null;
document.addEventListener('dragstart',e=>{const card=e.target.closest('[data-drag-id]');if(card){dragging=card.dataset.dragId;e.dataTransfer.setData('text/plain',dragging);e.dataTransfer.effectAllowed='move';}});
document.addEventListener('dragover',e=>{if(e.target.closest('[data-drop-stage]'))e.preventDefault();});
document.addEventListener('drop',e=>{const lane=e.target.closest('[data-drop-stage]');if(lane&&job(dragging)){e.preventDefault();show('small-dialog',dialogs.editStage(job(dragging),lane.dataset.dropStage));}dragging=null;});
window.addEventListener('popstate',()=>{const requested=new URLSearchParams(location.search).get('view');if(VIEWS.includes(requested)){view=requested;render();}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.data&&!busy&&!loading&&!document.querySelector('dialog[open]'))reload().catch(()=>{});});
setInterval(()=>{if(document.visibilityState==='visible'&&state.data&&!busy&&!loading&&!document.querySelector('dialog[open]'))reload().catch(()=>{});},60000);
async function start(){try{const requested=await authenticate();selectView(view,true);if(!signedIn()){requireSignIn();return;}await reload();if(requested==='outreach'){outreachOpen=true;show('small-dialog',outreach(state.data));}if(requested==='feedback'){feedbackPane='form';openFeedback();}}catch(error){if(!state.data)requireSignIn(error.message);else status(error.message,true);}}
start();
