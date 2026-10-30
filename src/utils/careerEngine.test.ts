import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeResumeForCloud,
  rehydrateSanitizedText,
  calculateJobMatch,
  evaluateInterviewAlerts,
  computePipelineMetrics,
  buildStructuredCoverLetter,
  buildOutreachMessage,
  tailorResumeLocally,
  type CandidateProfile,
  type JobListing,
  type InterviewEvent,
} from './careerEngine';

const sampleProfile: CandidateProfile = {
  fullName: 'Sangharsha Dhital',
  email: 'sangharsha@localvault.dev',
  phone: '415-890-2341',
  location: 'San Francisco, CA',
  title: 'Senior Full-Stack Engineer',
  yearsExperience: 6,
  coreSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Ollama'],
  summary: 'Privacy-first software engineer specializing in local LLM architectures and reactive dashboards.',
  achievements: [
    'Architected a local-first AI career pipeline reducing cloud token egress by 94%.',
    'Led migration of legacy analytics to React 19 and TypeScript with 98% unit test coverage.',
  ],
  portfolioUrl: 'https://github.com/sangharsha/careervault-ai',
};

const sampleJob: JobListing = {
  id: 'job-1',
  title: 'Staff Frontend Systems Engineer',
  company: 'AetherLabs',
  location: 'San Francisco, CA',
  workMode: 'Hybrid',
  salaryRange: '$185,000 - $220,000',
  postedDate: '2026-10-28',
  stage: 'interviewing',
  sourceUrl: 'https://aetherlabs.example.com/careers/staff-fe',
  rawDescription: 'Build local-first AI developer tools with React, TypeScript, Node.js, and Rust.',
  requiredSkills: ['React', 'TypeScript', 'Node.js', 'Rust'],
  lastUpdated: '2026-10-29T12:00:00Z',
};

test('sanitizeResumeForCloud redacts candidate name, email, and phone numbers and rehydrates accurately', () => {
  const rawResume = `Resume for Sangharsha Dhital. Contact me at sangharsha@localvault.dev or call 415-890-2341 for roles.`;
  const result = sanitizeResumeForCloud(rawResume, sampleProfile);

  assert.equal(result.sanitizedText.includes('Sangharsha Dhital'), false);
  assert.equal(result.sanitizedText.includes('sangharsha@localvault.dev'), false);
  assert.equal(result.sanitizedText.includes('415-890-2341'), false);
  assert.equal(result.sanitizedText.includes('[CANDIDATE_NAME]'), true);
  assert.equal(result.sanitizedText.includes('[CANDIDATE_EMAIL]'), true);
  assert.equal(result.sanitizedText.includes('[CANDIDATE_PHONE]'), true);
  assert.equal(result.redactedCount, 3);

  const rehydrated = rehydrateSanitizedText(result.sanitizedText, sampleProfile);
  assert.equal(rehydrated, rawResume);
});

test('calculateJobMatch computes exact skill overlap percentage and missing skills', () => {
  const analysis = calculateJobMatch(sampleProfile.coreSkills, sampleJob.requiredSkills);
  assert.equal(analysis.score, 75);
  assert.deepEqual(analysis.matchedSkills, ['React', 'TypeScript', 'Node.js']);
  assert.deepEqual(analysis.missingSkills, ['Rust']);
});

test('evaluateInterviewAlerts flags urgent_24h interviews and detects overlapping schedule conflicts', () => {
  const nowIso = '2026-10-29T20:00:00.000Z';
  const interviews: InterviewEvent[] = [
    {
      id: 'int-1',
      jobId: 'job-1',
      company: 'AetherLabs',
      roleTitle: 'Staff Frontend Systems Engineer',
      roundName: 'System Architecture Deep Dive',
      scheduledAt: '2026-10-30T10:00:00.000Z', // 14 hours away -> urgent_24h
      durationMinutes: 60,
      interviewerName: 'Elena Vance',
      interviewerRole: 'VP of Engineering',
      meetingLink: 'https://meet.example.com/aether-arch',
      prepChecklist: [],
      notes: '',
      acknowledged: false,
    },
    {
      id: 'int-2',
      jobId: 'job-2',
      company: 'Chronos AI',
      roleTitle: 'Principal UI Engineer',
      roundName: 'Hiring Manager Screen',
      scheduledAt: '2026-10-30T10:30:00.000Z', // Overlaps with int-1!
      durationMinutes: 45,
      interviewerName: 'Marcus Sterling',
      interviewerRole: 'Director of Product',
      meetingLink: 'https://meet.example.com/chronos-hm',
      prepChecklist: [],
      notes: '',
      acknowledged: false,
    },
  ];

  const evaluated = evaluateInterviewAlerts(interviews, nowIso);
  assert.equal(evaluated.length, 2);
  assert.equal(evaluated[0].urgency, 'urgent_24h');
  assert.equal(evaluated[0].hoursUntil, 14);
  assert.equal(evaluated[0].hasConflict, true);
  assert.deepEqual(evaluated[0].conflictingWithIds, ['int-2']);
  assert.equal(evaluated[1].hasConflict, true);
});

test('computePipelineMetrics aggregates stage counts and conversion rates', () => {
  const jobs: JobListing[] = [
    sampleJob,
    { ...sampleJob, id: 'job-2', stage: 'applied', coverLetterDraft: 'A comprehensive tailored cover letter for this role.' },
    { ...sampleJob, id: 'job-3', stage: 'saved' },
    { ...sampleJob, id: 'job-4', stage: 'offer' },
  ];

  const metrics = computePipelineMetrics(jobs);
  assert.equal(metrics.totalJobs, 4);
  assert.equal(metrics.counts.saved, 1);
  assert.equal(metrics.counts.applied, 1);
  assert.equal(metrics.counts.interviewing, 1);
  assert.equal(metrics.counts.offer, 1);
  assert.equal(metrics.totalSubmitted, 3);
  assert.equal(metrics.interviewConversionRate, 67);
  assert.equal(metrics.draftedCoverLettersCount, 1);
});

test('buildStructuredCoverLetter and buildOutreachMessage include candidate and job specifics', () => {
  const letter = buildStructuredCoverLetter(sampleJob, sampleProfile, 'technical');
  assert.equal(letter.includes('AetherLabs'), true);
  assert.equal(letter.includes('Staff Frontend Systems Engineer'), true);
  assert.equal(letter.includes('Sangharsha Dhital'), true);

  const outreach = buildOutreachMessage(sampleJob, sampleProfile);
  assert.equal(outreach.subject.includes('Staff Frontend Systems Engineer'), true);
  assert.equal(outreach.body.includes('AetherLabs'), true);
});

test('tailorResumeLocally generates role-aligned resume and improves ATS keyword score', () => {
  const originalResume = `Sangharsha Dhital\nSenior Engineer\n• Built web dashboards in React and TypeScript for 45k users.\n• Managed backend APIs using Node.js and PostgreSQL.`;
  const result = tailorResumeLocally(originalResume, sampleJob, sampleProfile);

  assert.equal(result.tailoredMarkdown.includes('AetherLabs'), true);
  assert.equal(result.tailoredMarkdown.includes('Staff Frontend Systems Engineer'), true);
  assert.equal(result.originalKeywordScore, 75); // React, TypeScript, Node.js present; Rust missing
  assert.equal(result.tailoredKeywordScore, 100); // Rust woven into prioritized skills & bullets
  assert.deepEqual(result.atsKeywordsInjected, ['Rust']);
});

