export const stages = ['Saved','Applying','Applied','Interview','Offer','Rejected','Withdrawn'];
export const filterStages = ['Outreach only',...stages];
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  calendar:'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z M3 10h18 M8 3v4 M16 3v4',
  rows:'M4 5h16 M4 12h16 M4 19h16',
  search:'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus:'M12 5v14 M5 12h14',
  arrow:'M5 12h14 M13 6l6 6-6 6',
  mail:'M3 5h18v14H3z M3 6l9 7 9-7',
  clock:'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  check:'M5 12l4 4L19 6',
  close:'M6 6l12 12 M6 18L18 6',
  doc:'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',
  spark:'m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z',
  chat:'M3 3h18v14H8l-5 4Z M7 8h10 M7 12h7',
  flag:'M5 22V3h13l-3 5 3 5H5',
  down:'m6 9 6 6 6-6',
  out:'M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7',
};
export const icon = (name, cls='') => `<svg class="icon ${esc(cls)}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.doc}"/></svg>`;
export const badge = (label, cls='') => `<span class="badge ${cls}">${esc(label)}</span>`;
export const initials = job => job.company.split(' ').map(x=>x[0]).slice(0,2).join('');
export const mark = job => `<span class="company-mark">${esc(initials(job))}</span>`;
export const dateLabel = value => value ? new Date(value.length===10 ? value+'T12:00:00+05:30' : value).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Kolkata'}) : 'Not recorded';
export const timeLabel = value => value ? new Date(value).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}) : '';
export const dayKey = value => value ? new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Kolkata'}).format(new Date(value)) : '';
export const active = job => !['Offer','Rejected','Withdrawn'].includes(job.stage);
export const today = () => dayKey(new Date().toISOString());
export function due(task, todayKey=today()) {
  if (!task) return 'No date set';
  if (task.done) return 'Completed';
  if (task.date < todayKey) return 'Overdue · '+dateLabel(task.date);
  if (task.date === todayKey) return 'Today';
  return dateLabel(task.date);
}
export const taskOpen = j => j.planner && !j.planner.done && active(j) && !j.stopOutreach;
export const needsAttention = j => active(j) && (taskOpen(j) && j.planner.date <= today() || j.gmail.some(s=>s.bounced||['pending','rejected'].includes(s.state)) || j.linkedin.some(s=>['needs_review','failed','expired'].includes(s.state)));
export function signal(job) {
  if (job.gmail.some(s=>s.bounced)) return 'Delivery failure observed';
  if (job.gmail.some(s=>s.replied)) return 'Gmail reply observed';
  if (job.linkedin.some(s=>s.replied_at)) return 'LinkedIn reply recorded';
  if (job.gmail.some(s=>s.state==='pending')) return 'Gmail pending';
  if (job.gmail.some(s=>s.state==='rejected')) return 'Gmail send rejected';
  if (job.linkedin.some(s=>['needs_review','failed','expired'].includes(s.state))) return 'LinkedIn needs your review';
  if (job.linkedin.some(s=>s.state==='invited')) return 'LinkedIn request sent';
  if (job.linkedin.some(s=>s.messaged_at)) return 'LinkedIn message sent';
  if (job.gmail.some(s=>s.state==='accepted')) return 'Accepted by Gmail';
  if (job.linkedin.some(s=>s.state==='paused')) return 'LinkedIn outreach paused';
  if (job.gmail.length || job.linkedin.length) return 'Check outreach history';
  return 'No outreach yet';
}
export function channelSummary(job) {
  const gmail = job.gmail.filter(s=>s.state==='accepted').length;
  const messages = job.linkedin.filter(s=>s.messaged_at).length;
  return [job.gmail.length ? `Gmail: ${gmail} accepted` : '',job.linkedin.length ? `LinkedIn: ${messages} messages · ${job.linkedin.length} records` : ''].filter(Boolean).join(' · ');
}
export const awaitingReply = j => !j.stopOutreach && !j.gmail.some(s=>s.replied||s.bounced) && !j.linkedin.some(s=>s.replied_at) && (j.gmail.some(s=>s.state==='accepted') || j.linkedin.some(s=>s.invited_at||s.messaged_at));
export function readiness(job) {
  const app = job.dashboard;
  if (job.stopOutreach) return 'Outreach stopped';
  if (app?.resume_feedback?.unanswered_clarifications) return `${app.resume_feedback.unanswered_clarifications} ${app.resume_feedback.unanswered_clarifications === 1 ? "answer" : "answers"} needed`;
  if (app?.is_packet_approved) return 'Packet approval recorded';
  if (app?.packet_hash) return 'Packet needs approval';
  if (job.enrichment.freshness?.label==='stale') return 'Recheck availability';
  if (job.enrichment.freshness?.label==='unknown') return 'Availability unknown';
  return 'Readiness not linked';
}
export function filtered(state) {
  const q = state.query.trim().toLowerCase();
  const list = state.data.jobs.filter(j => (!q || [j.company,j.title,j.location,j.note,...j.gmail.map(x=>x.contact),...j.linkedin.map(x=>x.recipient_name)].join(' ').toLowerCase().includes(q)) && (state.stage==='all' || j.stage===state.stage) && (state.scope==='all' || state.scope==='attention' && needsAttention(j) || state.scope==='waiting' && awaitingReply(j) || state.scope==='interviews' && j.stage==='Interview' || state.scope==='closed' && !active(j)));
  return list.sort((a,b)=>state.sort==='company' ? a.company.localeCompare(b.company) : state.sort==='due' ? (a.planner?.date||'9999').localeCompare(b.planner?.date||'9999') : (b.updatedAt||'').localeCompare(a.updatedAt||''));
}
export function empty(message='No jobs match these filters.') {
  return `<div class="empty">${icon('search')}<h3>${esc(message)}</h3><p>Try a company, role or another stage.</p><button class="btn" data-action="clear">Clear filters</button></div>`;
}
export function searchTools(state, extra='') {
  return `<div class="tools"><label class="search">${icon('search')}<input id="job-search" type="search" placeholder="Search jobs, companies, people" value="${esc(state.query)}" aria-label="Search jobs"></label><label class="select-wrap"><span class="sr-only">Filter stage</span><select id="stage-filter"><option value="all">All stages</option>${filterStages.map(x=>`<option ${state.stage===x?'selected':''}>${x}</option>`).join('')}</select></label>${extra}${state.scope!=="all"||state.stage!=="all"||state.query?`<button class="text-btn" data-action="clear">Clear filters ×</button>`:""}<span class="tools-spacer"></span><span class="muted small">${filtered(state).length} jobs</span></div>`;
}
export function timeline(events, jobs=null) {
  if (!events.length) return '<p class="muted pad">No activity recorded yet.</p>';
  let previous = null;
  return `<div class="timeline">${events.map(e=>{
    const day = dayKey(e.at), heading = day!==previous || previous===null ? `<h4>${dateLabel(e.at)}</h4>` : '';
    previous = day;
    const job = jobs?.find(j=>j.id===e.jobId);
    return `${heading}<div class="timeline-event"><span class="event-dot"></span><div><div class="event-title">${esc(e.title)} ${badge(e.source,'subtle')}</div>${job?`<button class="text-btn" data-action="open" data-id="${esc(job.id)}">${esc(job.company)} · ${esc(job.title)}</button>`:''}<p>${esc(e.detail)}</p></div><time>${timeLabel(e.at)}</time></div>`;
  }).join('')}</div>`;
}

export function weekDates(value=today()) {
  const date=new Date(value+'T12:00:00+05:30');
  const offset=(date.getUTCDay()+6)%7;
  return Array.from({length:7},(_,i)=>{const d=new Date(date);d.setUTCDate(date.getUTCDate()-offset+i);return dayKey(d.toISOString())});
}
