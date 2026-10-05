import {freshness} from './freshness.js?v=20261005brand1';
import {esc,icon,badge,dateLabel} from './ui.js?v=20261005brand1';
import {gmailRecord,safeLink,canonical} from './data.js?v=20261005brand1';

const action=(name,id,label)=>`<button class="btn" data-action="${name}" data-id="${esc(id)}">${esc(label)}</button>`;
const link=(url,label)=>safeLink(url)?`<a class="btn" href="${esc(safeLink(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon('out')}</a>`:'';
export function gmailObservation(s) {
  if(s.bounced)return 'Delivery failure observed';
  if(s.replied)return 'Reply observed during a Gmail check';
  if(s.state==='rejected')return 'Gmail rejected this send';
  if(s.state==='pending')return 'Gmail acceptance is unconfirmed';
  return s.checkedAt?'No reply or delivery failure observed during the last check':'Replies and delivery failures have not been checked yet';
}
export function gmailActions(s,email) {
  return `<div class="button-row">${s.state==='rejected'?'':action('check',s.id,'Check now')}${s.hasLink&&!s.revoked?action('revoke',s.id,'Revoke outreach links'):''}</div>`;
}
export function gmailCard(s,jobLink=s.jobUrl) {
  return `<div class="section-heading"><h3>${esc(s.contact)}${s.company?' · '+esc(s.company):''}</h3>${badge(s.label)}</div><p>${esc(s.jobTitle)} · ${dateLabel(s.sentAt)}</p><p>${esc(gmailObservation(s))}</p><p>${jobLink?link(jobLink,'Job link'):'Job link not recorded. '+action('link-send',s.id,'Link to a job')}</p><details><summary>Link activity and evidence</summary><p>Resume visits ${s.visits} · LinkedIn visits ${s.linkedinVisits}</p></details>${gmailActions(s)}`;
}
export function linkedinActions(a) {
  let actions=(a.reply_check_available&&['messaged','replied'].includes(a.state)?action('check-linkedin-reply',a.id,'Check now'):'')+link(a.linkedin_url,a.replied_at?'Open LinkedIn to reply':'Open LinkedIn profile');
  if(a.state==='expired')actions+=action('renew',a.id,'Review & renew');
  if(a.state==='needs_review'&&String(a.last_error).includes('note_quota'))actions+=action('retry-without-note',a.id,'Retry without note');
  if(['queued','paused','needs_review','failed','expired'].includes(a.state))actions+=action('cancel-linkedin',a.id,'Cancel');
  if(['messaged','replied'].includes(a.state))actions+=['helpful_reply','referred','interview','not_relevant'].map(outcome=>`<button class="btn" data-action="linkedin-outcome" data-id="${esc(a.id)}" data-value="${outcome}">${esc(outcome.replaceAll('_',' '))}</button>`).join('');
  return `<div class="button-row">${actions}</div>`;
}
export function outreach(data) {
  const raw=data.raw,c=raw.linkedin_connection;
  const connected=c?.status==='connected';
  const profile=c?`${c.display_name||'LinkedIn profile'} · ${c.paused?'Paused':String(c.status||'unknown').replaceAll('_',' ')}`:'Connect your own LinkedIn profile to approve connection requests and an opening message.';
  return `<header class="dialog-header"><span class="eyebrow">GMAIL & LINKEDIN</span><button class="icon-btn" data-action="close" aria-label="Close dialog">${icon('close')}</button></header><h2 id="small-title">Your outreach</h2><p class="muted">Outreach and your application stage are recorded separately.</p><section class="connection-panel"><h3>Your LinkedIn profile</h3><p>${esc(profile)}</p><p class="small muted">Notes sent through MiConnects this month: ${Number(raw.linkedin_notes_sent_this_month||0)} / ${Number(raw.linkedin_note_allowance??3)}. This is not LinkedIn's exact balance.</p><div class="button-row">${action('check-linkedin','','Refresh LinkedIn status')}${!connected?action('connect-linkedin','',c?.status==='reconnect_required'?'Reconnect LinkedIn':'Connect LinkedIn'):''}${c&&c.status!=='disconnected'?action('pause-linkedin','',c.paused?'Resume':'Pause')+action('disconnect-linkedin','','Disconnect'):''}</div></section><div class="outreach-list">${(raw.sends||[]).map(item=>{
    const s=gmailRecord(item,raw);
    const jobLink=canonical(item.metadata?.job_url);
    return `<section class="channel">${gmailCard(s,jobLink)}</section>`;
  }).join('')}${(raw.linkedin_actions||[]).map(a=>`<section class="channel"><div class="section-heading"><h3>${esc(a.recipient_name)} · ${esc(a.company)}</h3>${badge(String(a.state||'unknown').replaceAll('_',' '))}</div><p>${esc(a.job_title)}</p><p class="small muted">Updated ${dateLabel(a.updated_at)}</p>${freshness(a.monitoring,null,'linkedin')}${a.last_error?'<p>Needs attention. Review this action or reconnect your profile.</p>':''}<details><summary>Message, resume & dates</summary><p>${esc(a.opening_message)}</p><p>${esc(a.resume_filename)}</p>${[['Invited',a.invited_at],['Connected',a.connected_at],['Opening message sent',a.messaged_at],['Reply received',a.replied_at]].filter(([,date])=>date).map(([label,date])=>`<p>${label} · ${dateLabel(date)}</p>`).join('')}</details>${linkedinActions(a)}${a.outcome?`<p>Outcome reported by you: ${esc(String(a.outcome).replaceAll('_',' '))}</p>`:''}</section>`).join('')}${!(raw.sends||[]).length&&!(raw.linkedin_actions||[]).length?'<p class="muted">No outreach recorded yet. New activity from the extension will appear here.</p>':''}</div>`;
}
