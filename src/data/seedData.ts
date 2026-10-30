import type { CandidateProfile, JobListing, InterviewEvent } from '../utils/careerEngine';

export const INITIAL_CANDIDATE_PROFILE: CandidateProfile = {
  fullName: 'Sangharsha Dhital',
  email: 'sangharsha@localvault.dev',
  phone: '415-890-2341',
  location: 'San Francisco, CA',
  title: 'Senior Full-Stack & Local-AI Systems Engineer',
  yearsExperience: 6,
  coreSkills: [
    'React',
    'TypeScript',
    'Node.js',
    'Local LLMs (Ollama)',
    'Python',
    'PostgreSQL',
    'Docker',
    'GitHub Actions CI/CD',
    'Tailwind CSS',
    'GraphQL',
  ],
  summary:
    'Full-stack software engineer focused on privacy-preserving AI applications, reactive React dashboards, and automated CI/CD developer workflows. Experienced in hybrid local/cloud LLM orchestration and high-density data interfaces.',
  achievements: [
    'Built a zero-egress local LLM document indexing pipeline via Ollama and React, cutting cloud inference spend by 88% across 14,000 daily queries.',
    'Architected an automated CI/CD verification suite with GitHub Actions and Node native test runners, reducing regression defects in production by 64%.',
    'Led front-end architecture for a real-time analytics workbench serving 45k monthly active developers with sub-50ms filter latency.',
  ],
  portfolioUrl: 'https://github.com/sangharsha/careervault-ai',
  rawResume: `# Sangharsha Dhital
San Francisco, CA · sangharsha@localvault.dev · 415-890-2341 · https://github.com/sangharsha/careervault-ai

## Summary
Senior Full-Stack & Local-AI Systems Engineer with 6 years of experience building privacy-preserving AI applications, reactive React dashboards, and automated CI/CD developer workflows.

## Core Technical Skills
React, TypeScript, Node.js, Local LLMs (Ollama), Python, PostgreSQL, Docker, GitHub Actions CI/CD, Tailwind CSS, GraphQL

## Professional Experience
**Senior Full-Stack Systems Engineer — LocalVault Labs** (2023 – Present)
• Built a zero-egress local LLM document indexing pipeline via Ollama and React, cutting cloud inference spend by 88% across 14,000 daily queries.
• Architected an automated CI/CD verification suite with GitHub Actions and Node native test runners, reducing regression defects in production by 64%.

**Full-Stack Software Engineer — CloudScale Analytics** (2020 – 2023)
• Led front-end architecture for a real-time analytics workbench serving 45k monthly active developers with sub-50ms filter latency.
• Designed PostgreSQL and GraphQL data ingestion services handling 1.2M daily telemetry events.`,
};

export const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job-aether-01',
    title: 'Staff Frontend Engineer — Local AI Workspace',
    company: 'AetherLabs',
    location: 'San Francisco, CA',
    workMode: 'Hybrid',
    salaryRange: '$190,000 – $225,000',
    postedDate: '2026-10-28',
    stage: 'interviewing',
    sourceUrl: 'https://aetherlabs.dev/careers/staff-frontend-local-ai',
    rawDescription: `AetherLabs is building the next generation of privacy-first developer workspaces powered by local open-weight models and hybrid cloud reasoning. We are looking for a Staff Frontend Engineer to lead our React 19 dashboard architecture, real-time telemetry visualizations, and local daemon bridges (Ollama / llama.cpp). You will partner closely with systems engineers, maintain rigorous automated tests in TypeScript, and steward our open-source SDK on GitHub.`,
    requiredSkills: [
      'React',
      'TypeScript',
      'Local LLMs (Ollama)',
      'Tailwind CSS',
      'GitHub Actions CI/CD',
      'WebSockets',
    ],
    aiSummary: {
      tldr: 'Lead React 19 dashboard architecture for a local-first AI developer workspace integrating directly with Ollama and open-source GitHub workflows.',
      keyResponsibilities: [
        'Architect reactive data visualization dashboards in React 19 and TypeScript.',
        'Build resilient local bridge connectors for Ollama and local inference runtimes.',
        'Maintain high automated test coverage and GitHub Actions CI pipelines for open-source contributors.',
      ],
      techStack: ['React 19', 'TypeScript', 'Ollama', 'Tailwind CSS', 'WebSockets', 'GitHub Actions'],
      teamCulture: 'Open-source first, high autonomy, strong emphasis on automated testing and zero-telemetry user privacy.',
      redFlagsOrNotes: 'Hybrid 2 days/week in SF Mission District; competitive equity + open-source sponsorship stipend.',
    },
    tailoredResumeDraft: `# Sangharsha Dhital
San Francisco, CA · sangharsha@localvault.dev · 415-890-2341 · https://github.com/sangharsha/careervault-ai
**Target Role:** Staff Frontend Engineer — Local AI Workspace (AetherLabs)

## Executive Summary (Tailored for AetherLabs)
Senior Full-Stack & Local-AI Systems Engineer with 6+ years of experience architecting production systems in React, TypeScript, Local LLMs (Ollama), Tailwind CSS. Proven track record of delivering high-reliability engineering aligned with AetherLabs's "Staff Frontend Engineer — Local AI Workspace" objectives: Lead React 19 dashboard architecture for a local-first AI developer workspace integrating directly with Ollama and open-source GitHub workflows.

## Core Technical Stack (Prioritized for ATS & Role Fit)
React · TypeScript · Local LLMs (Ollama) · Tailwind CSS · GitHub Actions CI/CD · WebSockets · Node.js · Python · PostgreSQL · Docker

## Selected Impact & Relevant Engineering Experience
**Senior Full-Stack & Local-AI Systems Engineer** | Local-First & Cloud Systems (2020 – Present)
• Built a zero-egress local LLM document indexing pipeline via Ollama and React, cutting cloud inference spend by 88% across 14,000 daily queries.
• Architected an automated CI/CD verification suite with GitHub Actions and Node native test runners, reducing regression defects in production by 64% (Leveraged TypeScript best practices for production reliability).
• Led front-end architecture for a real-time analytics workbench serving 45k monthly active developers with sub-50ms filter latency (Leveraged WebSockets best practices for production reliability).
• Direct alignment with AetherLabs roadmap: Architect reactive data visualization dashboards in React 19 and TypeScript.

## Role-Specific Alignment Notes for AetherLabs
• **Matched Core Stack (83%):** React, TypeScript, Local LLMs (Ollama), Tailwind CSS, GitHub Actions CI/CD
• **Key Focus Areas:** Architect reactive data visualization dashboards in React 19 and TypeScript; Build resilient local bridge connectors for Ollama and local inference runtimes`,
    coverLetterDraft: `Dear AetherLabs Hiring Team,

I am writing to apply for the Staff Frontend Engineer — Local AI Workspace role at AetherLabs. With 6 years of experience building production systems using React, TypeScript, Local LLMs (Ollama), and Tailwind CSS, I was immediately drawn to AetherLabs's focus on lead React 19 dashboard architecture for a local-first AI developer workspace integrating directly with Ollama and open-source GitHub workflows.

In my recent work, I have focused on turning complex technical requirements into maintainable, well-tested software:
• Built a zero-egress local LLM document indexing pipeline via Ollama and React, cutting cloud inference spend by 88% across 14,000 daily queries.
• Architected an automated CI/CD verification suite with GitHub Actions and Node native test runners, reducing regression defects in production by 64%.
• Led front-end architecture for a real-time analytics workbench serving 45k monthly active developers with sub-50ms filter latency.

Beyond my core background in React, TypeScript, Local LLMs (Ollama), and GitHub Actions CI/CD, I actively prototype with adjacent technologies including WebSockets and thrive in collaborative, test-driven engineering cultures.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my background aligns with your upcoming milestones.

Sincerely,
Sangharsha Dhital
sangharsha@localvault.dev · 415-890-2341
https://github.com/sangharsha/careervault-ai`,
    outreachDraft: {
      recipientRole: 'VP of Engineering / Staff Recruiter at AetherLabs',
      subject: 'Staff Frontend Engineer Application — Sangharsha Dhital (React, TypeScript, Local LLMs)',
      body: `Hi Elena & AetherLabs Team,\n\nI just submitted my application for the Staff Frontend Engineer — Local AI Workspace role. Having spent the past 6 years building privacy-first React & TypeScript interfaces backed by local Ollama inference, AetherLabs's commitment to zero-egress developer tooling really resonated with me.\n\nI recently open-sourced CareerVault AI (complete with automated Node unit tests and GitHub Actions CI) and would love to share a 10-minute walkthrough this week.\n\nBest regards,\nSangharsha Dhital\nsangharsha@localvault.dev`,
    },
    lastUpdated: '2026-10-29T18:30:00Z',
  },
  {
    id: 'job-chronos-02',
    title: 'Senior Full-Stack Engineer — Privacy Platform',
    company: 'Veridian Security',
    location: 'Remote (US)',
    workMode: 'Remote',
    salaryRange: '$175,000 – $205,000',
    postedDate: '2026-10-27',
    stage: 'applied',
    sourceUrl: 'https://veridian.security/jobs/senior-fullstack-privacy',
    rawDescription: `Veridian Security builds zero-trust data redaction and local AI compliance gateways for healthcare and fintech engineering teams. We need a Senior Full-Stack Engineer experienced in React, Node.js, TypeScript, PostgreSQL, and Docker to build our policy control plane and PII sanitization rules engine.`,
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
    aiSummary: {
      tldr: 'Build the control plane and PII redaction rules engine for a zero-trust AI compliance gateway.',
      keyResponsibilities: [
        'Develop interactive policy management dashboards in React and TypeScript.',
        'Scale Node.js and PostgreSQL ingestion pipelines for real-time PII redaction.',
        'Package self-hosted customer deployments using Docker and automated CI workflows.',
      ],
      techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
      teamCulture: 'Remote-first, asynchronous RFC engineering culture, security-obsessed.',
      redFlagsOrNotes: '100% remote within US time zones; quarterly engineering offsites.',
    },
    lastUpdated: '2026-10-29T14:15:00Z',
  },
  {
    id: 'job-orbit-03',
    title: 'Lead Developer Experience & Open Source Engineer',
    company: 'ModularFlow',
    location: 'New York, NY',
    workMode: 'Remote',
    salaryRange: '$180,000 – $210,000',
    postedDate: '2026-10-26',
    stage: 'saved',
    sourceUrl: 'https://modularflow.io/careers/lead-dx-oss',
    rawDescription: `ModularFlow maintains an open-source local model orchestration framework with 28k GitHub stars. We are hiring a Lead DX & Open Source Engineer to build our web-based model inspector in React, write crystal-clear onboarding documentation, maintain our GitHub Actions CI matrix, and mentor community contributors.`,
    requiredSkills: [
      'React',
      'TypeScript',
      'Local LLMs (Ollama)',
      'Python',
      'GitHub Actions CI/CD',
    ],
    aiSummary: {
      tldr: 'Steward a 28k-star open-source local LLM toolkit, leading the React web inspector, contributor docs, and GitHub Actions CI matrix.',
      keyResponsibilities: [
        'Own the React + TypeScript model inspection dashboard and local API playground.',
        'Maintain contributor guidelines, quickstart documentation, and automated PR verification workflows.',
        'Triage community PRs and ensure 100% deterministic unit test pass rates.',
      ],
      techStack: ['React', 'TypeScript', 'Ollama', 'Python', 'GitHub Actions CI/CD'],
      teamCulture: 'Deeply collaborative public-by-default open source team.',
      redFlagsOrNotes: '100% skill match with your profile! High priority to draft cover letter and apply.',
    },
    lastUpdated: '2026-10-29T10:00:00Z',
  },
  {
    id: 'job-lumina-04',
    title: 'Principal UI Architect — AI Observability',
    company: 'Lumina Telemetry',
    location: 'Seattle, WA',
    workMode: 'Hybrid',
    salaryRange: '$200,000 – $240,000',
    postedDate: '2026-10-22',
    stage: 'offer',
    sourceUrl: 'https://luminatelemetry.io/careers/principal-ui',
    rawDescription: `Lumina Telemetry provides real-time trace evaluation and cost analytics for enterprise AI deployments. We seek a Principal UI Architect with deep mastery of React, TypeScript, GraphQL, and high-density tabular data grids to lead our core observability console.`,
    requiredSkills: ['React', 'TypeScript', 'GraphQL', 'Tailwind CSS', 'Node.js'],
    aiSummary: {
      tldr: 'Architect high-density trace and evaluation dashboards for an enterprise AI observability suite.',
      keyResponsibilities: [
        'Design sub-millisecond virtualized data tables and trace flamegraphs in React.',
        'Standardize design system tokens, accessibility compliance, and automated UI tests.',
        'Collaborate with backend GraphQL and clickhouse teams on query optimization.',
      ],
      techStack: ['React', 'TypeScript', 'GraphQL', 'Tailwind CSS', 'Node.js'],
      teamCulture: 'Metrics-driven engineering organization with strong design-engineering partnership.',
      redFlagsOrNotes: 'Offer received ($215k base + equity); decision deadline in 5 days.',
    },
    lastUpdated: '2026-10-29T09:00:00Z',
  },
];

// Anchor interview dates relative to 2026-10-29T21:12:40-07:00 (2026-10-30T04:12:40Z)
export const INITIAL_INTERVIEWS: InterviewEvent[] = [
  {
    id: 'int-aether-arch',
    jobId: 'job-aether-01',
    company: 'AetherLabs',
    roleTitle: 'Staff Frontend Engineer — Local AI Workspace',
    roundName: 'Technical Architecture & Live Local-LLM Pairing',
    scheduledAt: '2026-10-30T17:00:00.000Z', // ~12.8 hours away (Urgent <= 24h!)
    durationMinutes: 60,
    interviewerName: 'Elena Vance',
    interviewerRole: 'VP of Engineering',
    meetingLink: 'https://meet.aetherlabs.dev/room-staff-fe-402',
    prepChecklist: [
      { id: 'p-1', text: 'Demo local Ollama bridge & zero-egress PII redaction architecture', completed: true },
      { id: 'p-2', text: 'Review React 19 concurrent state patterns for streaming tokens', completed: true },
      { id: 'p-3', text: 'Prepare questions on open-source governance and roadmap', completed: false },
    ],
    notes: 'Focus on how local inference fallbacks behave when localhost:11434 is offline.',
    acknowledged: false,
  },
  {
    id: 'int-veridian-screen',
    jobId: 'job-chronos-02',
    company: 'Veridian Security',
    roleTitle: 'Senior Full-Stack Engineer — Privacy Platform',
    roundName: 'Hiring Manager & Security Architecture Screen',
    scheduledAt: '2026-10-31T18:30:00.000Z', // ~38 hours away (Upcoming <= 72h)
    durationMinutes: 45,
    interviewerName: 'Marcus Thorne',
    interviewerRole: 'Director of Platform Engineering',
    meetingLink: 'https://zoom.veridian.security/j/892341902',
    prepChecklist: [
      { id: 'p-4', text: 'Walk through sanitizeResumeForCloud regex & token map design', completed: true },
      { id: 'p-5', text: 'Discuss PostgreSQL row-level security and Docker deployment', completed: false },
    ],
    notes: 'Emphasize deterministic unit test suite and GitHub Actions CI pipeline.',
    acknowledged: false,
  },
  {
    id: 'int-lumina-exec',
    jobId: 'job-lumina-04',
    company: 'Lumina Telemetry',
    roleTitle: 'Principal UI Architect — AI Observability',
    roundName: 'Final Offer Review & Compensation Q&A',
    scheduledAt: '2026-11-02T19:00:00.000Z',
    durationMinutes: 30,
    interviewerName: 'Priya Nair',
    interviewerRole: 'Head of Talent & Co-Founder',
    meetingLink: 'https://meet.luminatelemetry.io/offer-sync',
    prepChecklist: [
      { id: 'p-6', text: 'Compare equity refresh schedule and remote flexibility', completed: false },
    ],
    notes: 'Clarify open-source contribution IP policy before signing.',
    acknowledged: true,
  },
];
