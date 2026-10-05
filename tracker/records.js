/* Build opportunities from account-owned receipts without inferring applications. */
export function activityJobs(raw, canonical, stamp) {
  const jobs = raw.jobs.map(job => ({...job, tracked: true}));
  const identities = new Map(jobs.map(job => [canonical(job.canonical_url), job]));
  let unlinked = 0;
  const receipts = [
    ...(raw.sends || []).map(send => ({
      url: send.metadata?.job_url, title: send.metadata?.job_title,
      company: send.metadata?.company, created: send.created_at,
      updated: send.result?.checked_at || send.updated_at || send.created_at,
    })),
    ...(raw.linkedin_actions || []).map(action => ({
      url: action.job_url, title: action.job_title, company: action.company,
      created: action.created_at, updated: action.updated_at,
    })),
  ];
  for (const receipt of receipts) {
    const identity = canonical(receipt.url);
    if (!identity) { unlinked++; continue; }
    let job = identities.get(identity);
    if (!job) {
      job = {
        id: 'outreach:' + identity, canonical_url: identity,
        title: receipt.title || 'Role not recorded',
        company: receipt.company || 'Company not recorded',
        location: '', stage: 'Outreach only', note: '', outcome_date: null,
        created_at: stamp(receipt.created), updated_at: stamp(receipt.updated),
        tracked: false, metadataComplete: Boolean(receipt.title && receipt.company),
      };
      jobs.push(job); identities.set(identity, job);
    } else if (!job.tracked) {
      // A receipt date is real evidence; it is not a saved/application date.
      const created = stamp(receipt.created), updated = stamp(receipt.updated);
      if (created && (!job.created_at || created < job.created_at)) job.created_at = created;
      if (updated && (!job.updated_at || updated > job.updated_at)) job.updated_at = updated;
      if (!job.metadataComplete && receipt.title && receipt.company) {
        job.title = receipt.title; job.company = receipt.company; job.metadataComplete = true;
      }
    }
  }
  return {jobs, unlinked};
}
