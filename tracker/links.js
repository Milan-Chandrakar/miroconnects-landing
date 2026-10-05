/* Historical links are explicitly reported by the owner, never guessed. */
import {esc,icon} from './ui.js?v=20261005brand1';
import {canonical} from './data.js?v=20261005brand1';

export function linkForm(send,jobs) {
  const meta=send.metadata||{};
  return `<header class="dialog-header"><span class="eyebrow">LINK OUTREACH TO A JOB</span><button class="icon-btn" data-action="close" aria-label="Close dialog">${icon('close')}</button></header><h2 id="small-title">Choose the exact job</h2><p>${esc(meta.recruiter_name||meta.recipient||'Contact')} · ${esc(meta.company||'Company not recorded')}<br>${esc(meta.job_title||'Role not recorded')}</p><p class="muted">This older record has no usable job link. Your choice will be labeled reported by you. Sending and application stages stay unchanged.</p><form data-form="link-send" data-id="${esc(send.id)}"><input type="hidden" name="expected_url" value="${esc(meta.job_url||'')}"><label>Choose an existing opportunity<select name="job_url"><option value="">Choose a job</option>${jobs.filter(j=>canonical(j.url)).map(j=>`<option value="${esc(j.url)}">${esc(j.company)} · ${esc(j.title)} · ${esc(j.url)}</option>`).join('')}</select></label><label>Or paste its public job link<input type="url" name="url" placeholder="https://www.linkedin.com/jobs/view/…" maxlength="2000"></label><div class="form-footer"><button class="btn" type="button" data-action="outreach">Back to outreach</button><button class="btn primary" type="submit">Save job link</button></div></form>`;
}

export function linkPayload(values) {
  const selected=String(values.get('job_url')||'').trim(),pasted=String(values.get('url')||'').trim();
  if(selected&&pasted&&canonical(selected)!==canonical(pasted))throw Error('Choose an existing job or paste a link, so the target is clear.');
  const url=canonical(pasted||selected);
  if(!url)throw Error('Choose a job or enter its public HTTPS link.');
  return {url,expected_url:String(values.get('expected_url')||'')};
}
