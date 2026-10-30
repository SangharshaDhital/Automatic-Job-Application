import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  evaluateInterviewAlerts,
  type ApplicationStage,
  type CandidateProfile,
  type InterviewEvent,
  type JobListing,
  type LLMProviderMode,
} from './utils/careerEngine';
import {
  INITIAL_CANDIDATE_PROFILE,
  INITIAL_INTERVIEWS,
  INITIAL_JOBS,
} from './data/seedData';
import { JobPipelineView } from './components/JobPipelineView';
import { CoverLetterStudio } from './components/CoverLetterStudio';
import { InterviewAlertsView } from './components/InterviewAlertsView';
import { OpenSourceCiView } from './components/OpenSourceCiView';

type ActiveTab = 'pipeline' | 'studio' | 'interviews' | 'opensource';

const STORAGE_KEYS = {
  JOBS: 'careervault_jobs_v1',
  PROFILE: 'careervault_profile_v1',
  INTERVIEWS: 'careervault_interviews_v1',
  PROVIDER: 'careervault_provider_v1',
};

// Fixed reference timestamp matching current local session context for deterministic countdowns
const REFERENCE_NOW_ISO = '2026-10-30T04:12:40.000Z';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline');

  const [jobs, setJobs] = useState<JobListing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_JOBS;
  });

  const [profile, setProfile] = useState<CandidateProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CANDIDATE_PROFILE;
  });

  const [interviews, setInterviews] = useState<InterviewEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVIEWS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_INTERVIEWS;
  });

  const [selectedJobId, setSelectedJobId] = useState<string>(INITIAL_JOBS[0].id);
  const [providerMode, setProviderMode] = useState<LLMProviderMode>('ollama_local');
  const [ollamaHost, setOllamaHost] = useState('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    } catch {
      // ignore
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews));
    } catch {
      // ignore
    }
  }, [interviews]);

  const evaluatedAlerts = useMemo(
    () => evaluateInterviewAlerts(interviews, REFERENCE_NOW_ISO),
    [interviews]
  );

  const unacknowledgedUrgentAlerts = useMemo(
    () =>
      evaluatedAlerts.filter(
        (item) =>
          !item.interview.acknowledged &&
          (item.urgency === 'urgent_24h' || item.hasConflict)
      ),
    [evaluatedAlerts]
  );

  const handleUpdateJobStage = (jobId: string, stage: ApplicationStage) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, stage, lastUpdated: new Date().toISOString() } : j
      )
    );
  };

  const handleUpdateJobSummary = (
    jobId: string,
    summary: NonNullable<JobListing['aiSummary']>,
    _engineName: string
  ) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              aiSummary: summary,
              requiredSkills:
                summary.techStack && summary.techStack.length > 0
                  ? summary.techStack
                  : j.requiredSkills,
              lastUpdated: new Date().toISOString(),
            }
          : j
      )
    );
  };

  const handleAddJob = (newJob: JobListing) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== jobId);
      if (selectedJobId === jobId && next.length > 0) {
        setSelectedJobId(next[0].id);
      }
      return next;
    });
  };

  const handleSaveDraftsToJob = (
    jobId: string,
    coverLetter: string,
    outreach: NonNullable<JobListing['outreachDraft']>,
    tailoredResume?: string
  ) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              ...(tailoredResume !== undefined
                ? { tailoredResumeDraft: tailoredResume }
                : {}),
              coverLetterDraft: coverLetter,
              outreachDraft: outreach,
              lastUpdated: new Date().toISOString(),
            }
          : j
      )
    );
  };

  const handleOpenCoverLetterStudio = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('studio');
  };

  const handleAddInterview = (newInterview: InterviewEvent) => {
    setInterviews((prev) => [...prev, newInterview]);
  };

  const handleToggleChecklistItem = (interviewId: string, itemId: string) => {
    setInterviews((prev) =>
      prev.map((iv) =>
        iv.id === interviewId
          ? {
              ...iv,
              prepChecklist: iv.prepChecklist.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : iv
      )
    );
  };

  const handleAcknowledgeAlert = (interviewId: string) => {
    setInterviews((prev) =>
      prev.map((iv) => (iv.id === interviewId ? { ...iv, acknowledged: true } : iv))
    );
  };

  const handleDeleteInterview = (interviewId: string) => {
    setInterviews((prev) => prev.filter((iv) => iv.id !== interviewId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: [Brand title, one line] — [4 nav links, single-line] — [1 primary action] */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-20">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#pipeline"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('pipeline');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          CareerVault AI
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav aria-label="Main workspace navigation" className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto">
          <a
            href="#pipeline"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('pipeline');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'pipeline'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Job Pipeline
          </a>
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('studio');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'studio'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Resume & Letters
          </a>
          <a
            href="#interviews"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('interviews');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'interviews'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Interview Alerts ({interviews.length})
          </a>
          <a
            href="#opensource"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('opensource');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'opensource'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Open Source & CI
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tailor Resume & Letter
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Workspace Context Sub-Bar (Privacy & Engine Switch + Urgent Interview Notification) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2.5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold text-slate-900">
              Zero-Egress Local Architecture
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Engine:{' '}
              <strong className="font-mono text-slate-800">
                {providerMode === 'ollama_local'
                  ? `Ollama (${ollamaModel})`
                  : 'Gemini 3.8 Flash (PII Redacted)'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() =>
                setProviderMode((m) =>
                  m === 'ollama_local' ? 'gemini_hybrid' : 'ollama_local'
                )
              }
              className="text-blue-600 font-medium hover:underline whitespace-nowrap cursor-pointer"
            >
              Switch Engine Mode
            </button>
          </div>

          {unacknowledgedUrgentAlerts.length > 0 && (
            <div
              role="region"
              aria-label="Urgent interview scheduling alert"
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                <strong>Upcoming Interview Alert:</strong>{' '}
                {unacknowledgedUrgentAlerts[0].interview.company} —{' '}
                {unacknowledgedUrgentAlerts[0].interview.roundName} in{' '}
                <span className="font-mono font-bold tabular-nums">
                  {unacknowledgedUrgentAlerts[0].hoursUntil}h
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('interviews')}
                className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:underline whitespace-nowrap cursor-pointer"
              >
                <span>Prep Checklist</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Active View Content */}
        {activeTab === 'pipeline' && (
          <JobPipelineView
            jobs={jobs}
            profile={profile}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            onUpdateJobStage={handleUpdateJobStage}
            onUpdateJobSummary={handleUpdateJobSummary}
            onAddJob={handleAddJob}
            onDeleteJob={handleDeleteJob}
            onOpenCoverLetterStudio={handleOpenCoverLetterStudio}
            providerMode={providerMode}
            ollamaHost={ollamaHost}
            ollamaModel={ollamaModel}
          />
        )}

        {activeTab === 'studio' && (
          <CoverLetterStudio
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            profile={profile}
            onUpdateProfile={setProfile}
            onSaveDraftsToJob={handleSaveDraftsToJob}
            providerMode={providerMode}
            ollamaHost={ollamaHost}
            ollamaModel={ollamaModel}
          />
        )}

        {activeTab === 'interviews' && (
          <InterviewAlertsView
            interviews={interviews}
            jobs={jobs}
            referenceNowIso={REFERENCE_NOW_ISO}
            onAddInterview={handleAddInterview}
            onToggleChecklistItem={handleToggleChecklistItem}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onDeleteInterview={handleDeleteInterview}
          />
        )}

        {activeTab === 'opensource' && (
          <OpenSourceCiView
            providerMode={providerMode}
            onChangeProviderMode={setProviderMode}
            ollamaHost={ollamaHost}
            onChangeOllamaHost={setOllamaHost}
            ollamaModel={ollamaModel}
            onChangeOllamaModel={setOllamaModel}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          CareerVault AI · Open-Source Local-First Job Search & Cover Letter Studio (MIT License)
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('opensource')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            README & Setup Guide
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setActiveTab('opensource')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Contribution Policy
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setActiveTab('opensource')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            GitHub Actions CI
          </button>
        </div>
      </footer>
    </div>
  );
}
