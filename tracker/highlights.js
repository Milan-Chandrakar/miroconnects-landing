import {esc,badge,dateLabel,icon} from './ui.js?v=20261005brand1';
import {safeLink} from './data.js?v=20261005brand1';
import {gmailObservation,gmailActions} from './channels.js?v=20261005brand1';

const external=(url,label)=>safeLink(url)?`<a class="btn" href="${esc(safeLink(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon('out')}</a>`:'';
const liLabels={queued:'Approved',invited:'Connection request sent',connected:'Connected',messaged:'Opening message sent',replied:'Reply recorded',needs_review:'Needs review',failed:'Needs attention',paused:'Paused',expired:'Approval expired',cancelled:'Cancelled'};

export function highlights(job) {
  const gmail=job.gmail||[],linkedin=job.linkedin||[];
  if(!gmail.length&&!linkedin.length)return '<p class="small muted">No outreach recorded.</p>';
  return `<div class="job-highlights" aria-label="Outreach highlights for ${esc(job.company)} ${esc(job.title)}">${gmail.map(s=>`<section class="outreach-highlight"><div class="highlight-heading"><strong>${esc(s.contact)}</strong>${badge(s.label)}</div><p class="highlight-date">Gmail · ${dateLabel(s.sentAt)}</p><p>${esc(gmailObservation(s))}</p><p class="highlight-visits">Resume visits ${Number(s.visits||0)} · LinkedIn visits ${Number(s.linkedinVisits||0)}</p><div class="highlight-actions">${external(s.jobUrl,'Job link')}${gmailActions(s)}</div></section>`).join('')}${linkedin.map(a=>`<section class="outreach-highlight"><div class="highlight-heading"><strong>${esc(a.recipient_name||'LinkedIn contact')}</strong>${badge('LinkedIn')}</div><p>${esc(a.replied_at?'Reply recorded':liLabels[a.state]||'Status not recorded')} · ${dateLabel(a.replied_at||a.messaged_at||a.invited_at||a.created_at)}</p><div class="highlight-actions">${external(a.linkedin_url,'Open LinkedIn')}${a.reply_check_available&&['messaged','replied'].includes(a.state)?`<button class="btn" data-action="check-linkedin-reply" data-id="${esc(a.id)}">Check now</button>`:''}</div></section>`).join('')}</div>`;
}

export function daybookHighlights(jobs) {
  return `<section class="daybook-highlights"><div class="section-heading"><h2>Job highlights</h2><span class="small muted">${jobs.length} opportunities</span></div><div class="daybook-highlight-grid">${jobs.map(j=>`<article class="daybook-job"><div class="section-heading"><strong>${esc(j.company)}</strong>${badge(j.stage)}</div><button class="card-title" data-action="open" data-id="${esc(j.id)}">${esc(j.title)}</button>${highlights(j)}</article>`).join('')}</div></section>`;
}
