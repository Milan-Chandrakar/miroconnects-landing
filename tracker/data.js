/* Read-only view projection. URL identity joins outreach; titles never do. */
import {activityJobs} from './records.js?v=20261005brand1';
export function canonical(value) {
  try {
    const safe=safeLink(value);if(!safe)return '';const url=new URL(safe);
    if(['linkedin.com','www.linkedin.com'].includes(url.hostname)){
      const id=url.pathname.match(/\/jobs\/view\/(\d+)/)?.[1]||url.searchParams.get('currentJobId');
      if(/^\d+$/.test(id||''))return `https://www.linkedin.com/jobs/view/${id}/`;
    }
    url.hash='';[...url.searchParams.keys()].forEach(k=>{if(/^utm_|^(trackingid|refid|ebp)$/i.test(k))url.searchParams.delete(k)});
    url.searchParams.sort();url.pathname=url.pathname.replace(/\/$/,'')||'/';
    return url.href.replace(/\/$/,'');
  }catch{return '';}
}
export function safeLink(value) {
  try {const url=new URL(value),host=url.hostname.toLowerCase();return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&host.includes('.')&&/[a-z]/i.test(host.split('.').at(-1))&&!/\.(local|localhost|internal)$/.test(host)?url.href:'';}catch{return '';}
}
export function stamp(value) {
  if(value===null||value===undefined||value==='')return null;
  const date=new Date(typeof value==='number'?value*1000:value);
  return Number.isNaN(date.getTime())?null:date.toISOString();
}
export function gmailRecord(item,raw) {
  const meta=item.metadata||{}, result=item.result||{}, link=(raw.links||[]).find(l=>l.send_id===item.id)||{};
  return {id:item.id,jobUrl:canonical(meta.job_url),monitoring:item.monitoring||{},state:item.state,label:({accepted:'Accepted by Gmail',pending:'Acceptance pending',rejected:'Send rejected'})[item.state]||'Status unknown',contact:meta.recruiter_name||meta.recipient||'Contact',recipient:meta.recipient||'',sentAt:stamp(item.created_at),checkedAt:stamp(result.checked_at),replied:result.replied===true,bounced:result.bounced===true,coverage:result.coverage||'Not checked',visits:link.visits||0,linkedinVisits:link.linkedin_visits||0,possibleOpens:link.possible_opens||0,revoked:link.revoked===true,hasLink:Boolean(link.send_id),destination:safeLink(link.destination),threadId:result.thread_id||'',company:meta.company||'',jobTitle:meta.job_title||''};
}
export function project(raw,taskData={tasks:[]}) {
  if(!Array.isArray(raw.jobs)||!Array.isArray(raw.feedback))throw Error('Activity could not be loaded. Try refreshing.');
  const activity=activityJobs(raw,canonical,stamp);
  const jobs=activity.jobs.map(j=>{
    const identity=canonical(j.canonical_url), events=[];
    const push=(at,title,detail,source)=>events.push({at:stamp(at),title,detail,source});
    (raw.events||[]).filter(e=>e.entity_id===j.id).forEach(e=>{
      const data=e.data||{}, titles={job_saved:'Job saved',job_updated:'Stage reported: '+(data.stage||'updated'),apply_link_opened:'Application link opened',plan_saved:'Next step planned',plan_updated:'Plan updated',plan_completed:'Step completed',plan_reopened:'Step reopened'};
      if(titles[e.kind])push(e.created_at,titles[e.kind],e.kind==='apply_link_opened'?'Opening a link does not confirm an application.':data.title||'Reported by you','You');
    });
    const gmail=(raw.sends||[]).filter(s=>identity&&canonical(s.metadata?.job_url)===identity).map(s=>{
      const record=gmailRecord(s,raw);push(record.sentAt,record.label,record.contact+(s.metadata?.job_link_source==='user_reported'?' · Job association reported by you':''),'Gmail');
      if(s.metadata?.job_linked_at)push(s.metadata.job_linked_at,'Outreach linked to this job','Job association reported by you','You');
      if(record.replied)push(record.checkedAt,'Gmail checked · reply on record','A reply was confirmed by Gmail. This date is the latest check; the reply arrival time is not recorded.','Gmail');
      if(record.bounced)push(record.checkedAt,'Gmail checked · delivery failure on record','A delivery failure was confirmed by Gmail. This date is the latest check; the failure time is not recorded.','Gmail');
      return record;
    });
    const linkedin=(raw.linkedin_actions||[]).filter(a=>identity&&canonical(a.job_url)===identity);
    linkedin.forEach(a=>{
      if(a.created_at)push(a.created_at,'LinkedIn outreach approved',a.recipient_name||'Contact','LinkedIn');
      [['invited_at','Connection request sent'],['connected_at','Connected on LinkedIn'],['messaged_at','Opening message sent'],['replied_at','LinkedIn reply recorded']].forEach(([key,title])=>{if(a[key])push(a[key],title,a.recipient_name||'Contact','LinkedIn')});
      if(a.updated_at)push(a.updated_at,'LinkedIn record updated',String(a.state||'unknown').replaceAll('_',' '),'LinkedIn');
    });
    const plan=(taskData.tasks||[]).find(p=>p.job_id===j.id);
    const local=plan?.due_at?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(plan.due_at)):'';
    events.sort((a,b)=>(b.at||'').localeCompare(a.at||''));
    return {id:j.id,url:j.canonical_url,title:j.title,company:j.company,location:j.location||'',stage:j.stage,note:j.note||'',outcome_date:j.outcome_date,tracked:j.tracked,metadataComplete:j.metadataComplete,createdAt:stamp(j.created_at),updatedAt:[stamp(j.updated_at),...events.map(e=>e.at)].filter(Boolean).sort().at(-1)||null,gmail,linkedin,events,dashboard:null,enrichment:{},stopOutreach:['Offer','Rejected','Withdrawn'].includes(j.stage),planner:plan?{id:plan.job_id,title:plan.title,date:local.slice(0,10),time:local.slice(11,16),reason:plan.reason,done:Boolean(plan.completed_at),revision:plan.revision,completedAt:stamp(plan.completed_at)}:null};
  });
  const activityEvents=jobs.flatMap(j=>j.events.map(e=>({...e,jobId:j.id})));
  raw.feedback.forEach(f=>activityEvents.push({at:stamp(f.created_at),title:'Feedback saved',detail:({core:'Your experience',issue:'Issue report',outcome:'Reported outreach outcome',value:'Product value'})[f.answers?.kind]||'Your feedback',source:'You'}));
  (raw.sends||[]).filter(s=>!canonical(s.metadata?.job_url)).forEach(s=>{const r=gmailRecord(s,raw);activityEvents.push({at:r.sentAt,title:r.label,detail:r.contact+' · Job link not recorded',source:'Gmail'})});
  (raw.linkedin_actions||[]).filter(a=>!canonical(a.job_url)).forEach(a=>activityEvents.push({at:stamp(a.updated_at||a.created_at),title:'LinkedIn record updated',detail:(a.recipient_name||'Contact')+' · Job link not recorded',source:'LinkedIn'}));
  activityEvents.sort((a,b)=>(b.at||'').localeCompare(a.at||''));
  return {jobs,activityEvents,unlinkedOutreach:activity.unlinked,feedback:raw.feedback,choices:raw.choices||{},email:raw.email||'',raw,plannerAvailable:!taskData.unavailable,historyLimited:taskData.has_more||['jobs','sends','events','linkedin_actions'].some(key=>(raw[key]||[]).length>=500)||(raw.feedback||[]).length>=50,daily:{gmail:Math.min(raw.credits_remaining??0,raw.gmail_daily_remaining??0),linkedin:Math.min(raw.linkedin_remaining??0,raw.linkedin_daily_remaining??0),gmailLimit:raw.gmail_daily_limit??7,linkedinLimit:raw.linkedin_daily_limit??7}};
}
export function jobForm(job,changes={}) {
  return {url:job.url,title:job.title,company:job.company,location:job.location,stage:job.stage,note:job.note,outcome_date:job.outcome_date||null,save_only:false,...changes};
}
