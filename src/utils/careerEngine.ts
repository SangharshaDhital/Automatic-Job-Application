export type ApplicationStage = 'saved' | 'applied' | 'interviewing' | 'offer' | 'archived';

export type LLMProviderMode = 'ollama_local' | 'gemini_hybrid';

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  yearsExperience: number;
  coreSkills: string[];
  summary: string;
  achievements: string[];
  portfolioUrl: string;
  rawResume?: string;
}

export interface TailoredResumeResult {
  tailoredMarkdown: string;
  targetedSummary: string;
  prioritizedSkills: string[];
  tailoredBullets: string[];
  atsKeywordsInjected: string[];
  originalKeywordScore: number;
  tailoredKeywordScore: number;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  salaryRange: string;
  postedDate: string;
  stage: ApplicationStage;
  sourceUrl: string;
  rawDescription: string;
  requiredSkills: string[];
  aiSummary?: {
    tldr: string;
    keyResponsibilities: string[];
    techStack: string[];
    teamCulture: string;
    redFlagsOrNotes: string;
  };
  tailoredResumeDraft?: string;
  coverLetterDraft?: string;
  outreachDraft?: {
    recipientRole: string;
    subject: string;
    body: string;
  };
  lastUpdated: string;
}

export interface InterviewEvent {
  id: string;
  jobId: string;
  company: string;
  roleTitle: string;
  roundName: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  interviewerName: string;
  interviewerRole: string;
  meetingLink: string;
  prepChecklist: { id: string; text: string; completed: boolean }[];
  notes: string;
  acknowledged: boolean;
}

export interface SanitizationResult {
  sanitizedText: string;
  redactedCount: number;
  tokenMap: Record<string, string>;
}

export interface JobMatchAnalysis {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: string;
}

export interface InterviewAlertItem {
  interview: InterviewEvent;
  urgency: 'urgent_24h' | 'upcoming_72h' | 'scheduled' | 'past';
  hoursUntil: number;
  hasConflict: boolean;
  conflictingWithIds: string[];
}

/**
 * Redacts PII (Name, Email, Phone) from resume text so sensitive data remains private
 * on the local machine when summarizing or drafting via external APIs.
 */
export function sanitizeResumeForCloud(
  rawText: string,
  profile: Pick<CandidateProfile, 'fullName' | 'email' | 'phone'>
): SanitizationResult {
  let sanitized = rawText;
  let redactedCount = 0;
  const tokenMap: Record<string, string> = {};

  if (profile.fullName && profile.fullName.trim().length > 1) {
    const escapedName = profile.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(escapedName, 'gi');
    const matches = sanitized.match(nameRegex);
    if (matches) {
      redactedCount += matches.length;
      sanitized = sanitized.replace(nameRegex, '[CANDIDATE_NAME]');
      tokenMap['[CANDIDATE_NAME]'] = profile.fullName;
    }
  }

  // Generic email + profile email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = sanitized.match(emailRegex);
  if (emailMatches) {
    redactedCount += emailMatches.length;
    sanitized = sanitized.replace(emailRegex, '[CANDIDATE_EMAIL]');
    tokenMap['[CANDIDATE_EMAIL]'] = profile.email || emailMatches[0];
  }

  // Generic phone pattern
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const phoneMatches = sanitized.match(phoneRegex);
  if (phoneMatches) {
    redactedCount += phoneMatches.length;
    sanitized = sanitized.replace(phoneRegex, '[CANDIDATE_PHONE]');
    tokenMap['[CANDIDATE_PHONE]'] = profile.phone || phoneMatches[0];
  }

  return {
    sanitizedText: sanitized,
    redactedCount,
    tokenMap,
  };
}

/**
 * Restores local PII tokens back into drafted cover letters or outreach messages on the local machine.
 */
export function rehydrateSanitizedText(
  text: string,
  profile: Pick<CandidateProfile, 'fullName' | 'email' | 'phone'>
): string {
  return text
    .replace(/\[CANDIDATE_NAME\]/g, profile.fullName)
    .replace(/\[CANDIDATE_EMAIL\]/g, profile.email)
    .replace(/\[CANDIDATE_PHONE\]/g, profile.phone);
}

/**
 * Computes deterministic skill match score and identifies matched vs missing skills.
 */
export function calculateJobMatch(
  candidateSkills: string[],
  requiredSkills: string[]
): JobMatchAnalysis {
  if (!requiredSkills || requiredSkills.length === 0) {
    return {
      score: 100,
      matchedSkills: [],
      missingSkills: [],
      recommendation: 'All listed qualifications matched.',
    };
  }

  const normalizedCandidate = new Set(
    candidateSkills.map((s) => s.trim().toLowerCase())
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of requiredSkills) {
    const cleanReq = req.trim();
    const lowerReq = cleanReq.toLowerCase();
    const isMatched = Array.from(normalizedCandidate).some(
      (cand) => cand === lowerReq || cand.includes(lowerReq) || lowerReq.includes(cand)
    );
    if (isMatched) {
      matchedSkills.push(cleanReq);
    } else {
      missingSkills.push(cleanReq);
    }
  }

  const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  let recommendation = 'Strong alignment — prioritize immediate application and direct hiring manager outreach.';
  if (score < 50) {
    recommendation = 'Partial stack overlap — emphasize transferable systems experience in your cover letter.';
  } else if (score < 80) {
    recommendation = 'Solid fit — address gap skills with concrete project examples in your cover letter.';
  }

  return {
    score,
    matchedSkills,
    missingSkills,
    recommendation,
  };
}

/**
 * Evaluates upcoming interview schedules relative to reference time, computing urgency and calendar conflicts.
 */
export function evaluateInterviewAlerts(
  interviews: InterviewEvent[],
  nowIso: string
): InterviewAlertItem[] {
  const nowMs = new Date(nowIso).getTime();

  const sorted = [...interviews].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return sorted.map((interview) => {
    const startMs = new Date(interview.scheduledAt).getTime();
    const endMs = startMs + interview.durationMinutes * 60 * 1000;
    const hoursUntil = Number(((startMs - nowMs) / (1000 * 60 * 60)).toFixed(1));

    let urgency: InterviewAlertItem['urgency'] = 'scheduled';
    if (hoursUntil < 0) {
      urgency = 'past';
    } else if (hoursUntil <= 24) {
      urgency = 'urgent_24h';
    } else if (hoursUntil <= 72) {
      urgency = 'upcoming_72h';
    }

    const conflictingWithIds: string[] = [];
    for (const other of sorted) {
      if (other.id === interview.id) continue;
      const otherStart = new Date(other.scheduledAt).getTime();
      const otherEnd = otherStart + other.durationMinutes * 60 * 1000;
      if (startMs < otherEnd && endMs > otherStart) {
        conflictingWithIds.push(other.id);
      }
    }

    return {
      interview,
      urgency,
      hoursUntil,
      hasConflict: conflictingWithIds.length > 0,
      conflictingWithIds,
    };
  });
}

/**
 * Computes pipeline funnel metrics for the dashboard overview.
 */
export function computePipelineMetrics(jobs: JobListing[]) {
  const counts: Record<ApplicationStage, number> = {
    saved: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    archived: 0,
  };

  for (const job of jobs) {
    counts[job.stage] = (counts[job.stage] || 0) + 1;
  }

  const totalSubmitted = counts.applied + counts.interviewing + counts.offer;
  const positiveResponses = counts.interviewing + counts.offer;
  const interviewConversionRate =
    totalSubmitted > 0 ? Math.round((positiveResponses / totalSubmitted) * 100) : 0;

  const draftedCoverLettersCount = jobs.filter(
    (j) => Boolean(j.coverLetterDraft && j.coverLetterDraft.trim().length > 20)
  ).length;

  return {
    totalJobs: jobs.length,
    counts,
    totalSubmitted,
    interviewConversionRate,
    draftedCoverLettersCount,
  };
}

/**
 * Generates a structured, tailored cover letter deterministically when local fallback is used.
 */
export function buildStructuredCoverLetter(
  job: JobListing,
  profile: CandidateProfile,
  tone: 'executive' | 'technical' | 'concise' = 'technical'
): string {
  const match = calculateJobMatch(profile.coreSkills, job.requiredSkills);
  const topMatched =
    match.matchedSkills.length > 0
      ? match.matchedSkills.slice(0, 4).join(', ')
      : profile.coreSkills.slice(0, 4).join(', ');

  const greeting = `Dear ${job.company} Hiring Team,`;

  const openingByTone = {
    technical: `I am writing to apply for the ${job.title} role at ${job.company}. With ${profile.yearsExperience} years of experience building production systems using ${topMatched}, I was immediately drawn to ${job.company}'s focus on ${job.aiSummary?.tldr || 'high-impact engineering and scalable product architecture'}.`,
    executive: `As a ${profile.title} with ${profile.yearsExperience} years of track record delivering resilient software platforms, I am excited to submit my application for the ${job.title} position at ${job.company}.`,
    concise: `I am applying for the ${job.title} position at ${job.company}, bringing ${profile.yearsExperience}+ years of hands-on expertise in ${topMatched}.`,
  };

  const highlightBullets = profile.achievements
    .slice(0, 3)
    .map((ach) => `• ${ach}`)
    .join('\n');

  const bodyParagraph = `In my recent work, I have focused on turning complex technical requirements into maintainable, well-tested software:\n${highlightBullets}`;

  const alignmentParagraph =
    match.missingSkills.length > 0
      ? `Beyond my core background in ${topMatched}, I actively prototype with adjacent technologies including ${match.missingSkills.join(', ')} and thrive in collaborative, test-driven engineering cultures.`
      : `My direct experience across your entire target stack (${topMatched}) allows me to contribute immediately to ${job.company}'s roadmap from day one.`;

  const signOff = `Thank you for your time and consideration. I would welcome the opportunity to discuss how my background aligns with your upcoming milestones.\n\nSincerely,\n${profile.fullName}\n${profile.email} · ${profile.phone}\n${profile.portfolioUrl}`;

  return [greeting, openingByTone[tone], bodyParagraph, alignmentParagraph, signOff].join('\n\n');
}

/**
 * Generates a personalized hiring manager outreach message.
 */
export function buildOutreachMessage(
  job: JobListing,
  profile: CandidateProfile
): { recipientRole: string; subject: string; body: string } {
  const match = calculateJobMatch(profile.coreSkills, job.requiredSkills);
  const topSkills = (match.matchedSkills.length ? match.matchedSkills : profile.coreSkills)
    .slice(0, 3)
    .join(', ');

  return {
    recipientRole: `Engineering Manager / Technical Recruiter at ${job.company}`,
    subject: `${job.title} Application — ${profile.fullName} (${topSkills})`,
    body: `Hi ${job.company} Team,\n\nI just submitted my application for the ${job.title} role (${job.location} · ${job.workMode}). Having spent the past ${profile.yearsExperience} years working deeply with ${topSkills}, I was particularly excited by your work on ${job.aiSummary?.keyResponsibilities?.[0]?.toLowerCase() || 'scalable product architecture'}.\n\nNotably, I recently ${profile.achievements[0]?.charAt(0).toLowerCase() + (profile.achievements[0]?.slice(1) || 'delivered high-throughput web applications')}.\n\nI'd love to share a quick walkthrough of my recent open-source work at ${profile.portfolioUrl} if you have 15 minutes this week.\n\nBest regards,\n${profile.fullName}\n${profile.email}`,
  };
}

/**
 * Computes ATS keyword coverage before and after tailoring a resume against a job's required skills.
 */
export function analyzeResumeAtsDelta(
  originalResumeText: string,
  tailoredResumeText: string,
  requiredSkills: string[]
): {
  originalKeywordScore: number;
  tailoredKeywordScore: number;
  atsKeywordsInjected: string[];
} {
  if (!requiredSkills || requiredSkills.length === 0) {
    return {
      originalKeywordScore: 100,
      tailoredKeywordScore: 100,
      atsKeywordsInjected: [],
    };
  }

  const origLower = originalResumeText.toLowerCase();
  const tailoredLower = tailoredResumeText.toLowerCase();

  let origHits = 0;
  let tailoredHits = 0;
  const atsKeywordsInjected: string[] = [];

  for (const skill of requiredSkills) {
    const cleanSkill = skill.trim();
    const token = cleanSkill.toLowerCase().split(' (')[0];
    const inOrig = origLower.includes(token);
    const inTailored = tailoredLower.includes(token);

    if (inOrig) origHits++;
    if (inTailored) tailoredHits++;
    if (inTailored && !inOrig) {
      atsKeywordsInjected.push(cleanSkill);
    }
  }

  return {
    originalKeywordScore: Math.round((origHits / requiredSkills.length) * 100),
    tailoredKeywordScore: Math.round((tailoredHits / requiredSkills.length) * 100),
    atsKeywordsInjected,
  };
}

/**
 * Deterministically tailors an original resume (or structured profile) to a specific job listing.
 * Re-orders skills by role relevance, aligns the executive summary, and frames experience bullets around job requirements.
 */
export function tailorResumeLocally(
  originalResume: string,
  job: JobListing,
  profile: CandidateProfile
): TailoredResumeResult {
  const match = calculateJobMatch(profile.coreSkills, job.requiredSkills);

  // Extract custom lines or bullets from user's provided originalResume if present
  const customBullets = originalResume
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[•\-*]\s+/.test(line))
    .map((line) => line.replace(/^[•\-*]\s+/, '').trim())
    .filter((line) => line.length > 20);

  const sourceBullets =
    customBullets.length >= 2 ? customBullets : profile.achievements;

  // Prioritize matched required skills first, then remaining required skills (as adjacent/familiar), then candidate core skills
  const prioritizedSkills = Array.from(
    new Set([
      ...match.matchedSkills,
      ...job.requiredSkills,
      ...profile.coreSkills,
    ])
  );

  const primaryStackStr = prioritizedSkills.slice(0, 4).join(', ');

  const targetedSummary = `${profile.title} with ${profile.yearsExperience}+ years of experience architecting production systems in ${primaryStackStr}. Proven track record of delivering high-reliability engineering aligned with ${job.company}'s "${job.title}" objectives: ${job.aiSummary?.tldr || 'scalable full-stack & local-first AI architectures'}.`;

  const tailoredBullets = sourceBullets.map((bullet, idx) => {
    const targetSkill = job.requiredSkills[idx % Math.max(1, job.requiredSkills.length)];
    if (targetSkill && !bullet.toLowerCase().includes(targetSkill.toLowerCase().split(' ')[0])) {
      return `${bullet} (Leveraged ${targetSkill} best practices for production reliability).`;
    }
    return bullet;
  });

  // Add a role-aligned highlight if the job has specific responsibilities
  if (job.aiSummary?.keyResponsibilities?.[0]) {
    tailoredBullets.push(
      `Direct alignment with ${job.company} roadmap: ${job.aiSummary.keyResponsibilities[0]}`
    );
  }

  const tailoredMarkdown = `# ${profile.fullName}
${profile.location} · ${profile.email} · ${profile.phone} · ${profile.portfolioUrl}
**Target Role:** ${job.title} (${job.company})

## Executive Summary (Tailored for ${job.company})
${targetedSummary}

## Core Technical Stack (Prioritized for ATS & Role Fit)
${prioritizedSkills.join(' · ')}

## Selected Impact & Relevant Engineering Experience
**${profile.title}** | Local-First & Cloud Systems (${new Date().getFullYear() - profile.yearsExperience} – Present)
${tailoredBullets.map((b) => `• ${b}`).join('\n')}

## Role-Specific Alignment Notes for ${job.company}
• **Matched Core Stack (${match.score}%):** ${match.matchedSkills.join(', ') || primaryStackStr}
• **Key Focus Areas:** ${(job.aiSummary?.keyResponsibilities || ['Scalable architecture', 'Automated CI/CD testing']).slice(0, 2).join('; ')}`;

  const delta = analyzeResumeAtsDelta(
    originalResume || profile.summary,
    tailoredMarkdown,
    job.requiredSkills
  );

  return {
    tailoredMarkdown,
    targetedSummary,
    prioritizedSkills,
    tailoredBullets,
    atsKeywordsInjected: delta.atsKeywordsInjected,
    originalKeywordScore: delta.originalKeywordScore,
    tailoredKeywordScore: delta.tailoredKeywordScore,
  };
}

