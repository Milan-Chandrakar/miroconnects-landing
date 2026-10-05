import {jobForm} from './data.js?v=20261005brand1';

export async function ensureTracked(job, request) {
  if (job.tracked !== false) return job;
  if (!job.metadataComplete) throw Error('Add this job with its role and company first, then plan a step.');
  // Saving a plan/note intentionally saves the opportunity; never infer Applied.
  const record = await request('/jobs', jobForm(job, {stage: 'Saved', save_only: true}));
  if (!record?.id) throw Error('The job could not be saved. Your form is still here.');
  return {...job, id: record.id, tracked: true, stage: record.stage, outcome_date: record.outcome_date||null};
}
