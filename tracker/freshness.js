import {esc} from './ui.js?v=20261005brand1';

export function checkedTime(value) {
  if(!value)return 'Not checked yet';
  const date=new Date(typeof value==='number'?value*1000:value);
  return Number.isNaN(date.getTime())?'Not checked yet':date.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})+' IST';
}
export function freshness(m={},fallback=null,channel='gmail') {
  const labels={scheduled:'Automatic checks active',partial:'Check partly complete; continuing shortly',retrying:'Check delayed; automatic retry scheduled',reconnect_required:'Reconnect to resume checks',paused:'Checks paused',complete:'Routine checks finished: response or delivery failure recorded',stopped:'Routine monitoring ended; Check now remains available',notifications_only:'Replies use LinkedIn notifications; no recorded chat is available for recovery'};
  const last=m.last_checked_at||fallback;
  const next=m.next_check_at&&['scheduled','partial','retrying'].includes(m.status)?` · Next check ${checkedTime(m.next_check_at)}`:'';
  const status=labels[m.status]||'Automatic monitoring status unavailable';
  return `<p class="small muted">Last checked ${esc(checkedTime(last))}${esc(next)}.</p><p class="small muted">${esc(status)}${channel==='linkedin'?' · Notifications are the primary source.':''}</p>${m.coverage?`<p class="small muted">${esc(m.coverage)}</p>`:''}`;
}
