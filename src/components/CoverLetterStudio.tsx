import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Download,
  Lock,
  UserCheck,
  Send,
  Save,
  FileText,
  Upload,
  ArrowRight,
} from 'lucide-react';
import {
  sanitizeResumeForCloud,
  calculateJobMatch,
  analyzeResumeAtsDelta,
  type CandidateProfile,
  type JobListing,
  type LLMProviderMode,
} from '../utils/careerEngine';

interface CoverLetterStudioProps {
  jobs: JobListing[];
  selectedJobId: string;
  onSelectJob: (id: string) => void;
  profile: CandidateProfile;
  onUpdateProfile: (profile: CandidateProfile) => void;
  onSaveDraftsToJob: (
    jobId: string,
    coverLetter: string,
    outreach: NonNullable<JobListing['outreachDraft']>,
    tailoredResume?: string
  ) => void;
  providerMode: LLMProviderMode;
  ollamaHost: string;
  ollamaModel: string;
}

const DEFAULT_ORIGINAL_RESUME = `# Sangharsha Dhital
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
• Designed PostgreSQL and GraphQL data ingestion services handling 1.2M daily telemetry events.`;

export const CoverLetterStudio: React.FC<CoverLetterStudioProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  profile,
  onUpdateProfile,
  onSaveDraftsToJob,
  providerMode,
  ollamaHost,
  ollamaModel,
}) => {
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || jobs[0],
    [jobs, selectedJobId]
  );

  const [tone, setTone] = useState<'technical' | 'executive' | 'concise'>('technical');
  const [enforcePiiRedaction, setEnforcePiiRedaction] = useState(true);
  const [showPrivacyDiff, setShowPrivacyDiff] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const [originalResumeText, setOriginalResumeText] = useState(
    profile.rawResume || DEFAULT_ORIGINAL_RESUME
  );
  const [tailoredResumeText, setTailoredResumeText] = useState(
    selectedJob?.tailoredResumeDraft || ''
  );
  const [coverLetterText, setCoverLetterText] = useState(
    selectedJob?.coverLetterDraft || ''
  );
  const [outreachSubject, setOutreachSubject] = useState(
    selectedJob?.outreachDraft?.subject || ''
  );
  const [outreachRecipient, setOutreachRecipient] = useState(
    selectedJob?.outreachDraft?.recipientRole || ''
  );
  const [outreachBody, setOutreachBody] = useState(
    selectedJob?.outreachDraft?.body || ''
  );

  const [rightPanelTab, setRightPanelTab] = useState<'cover_letter' | 'outreach'>('cover_letter');
  const [isGenerating, setIsGenerating] = useState(false);
  const [engineBadge, setEngineBadge] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'resume' | 'letter' | 'outreach' | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Sync local editors when switching jobs
  React.useEffect(() => {
    if (selectedJob) {
      setTailoredResumeText(selectedJob.tailoredResumeDraft || '');
      setCoverLetterText(selectedJob.coverLetterDraft || '');
      setOutreachSubject(selectedJob.outreachDraft?.subject || '');
      setOutreachRecipient(
        selectedJob.outreachDraft?.recipientRole || `Engineering Hiring Team at ${selectedJob.company}`
      );
      setOutreachBody(selectedJob.outreachDraft?.body || '');
      setSaveMessage(null);
    }
  }, [selectedJob]);

  const sanitizationPreview = useMemo(() => {
    return sanitizeResumeForCloud(originalResumeText, profile);
  }, [originalResumeText, profile]);

  const matchAnalysis = useMemo(() => {
    if (!selectedJob) return null;
    return calculateJobMatch(profile.coreSkills, selectedJob.requiredSkills);
  }, [profile.coreSkills, selectedJob]);

  const atsDelta = useMemo(() => {
    if (!selectedJob) return null;
    return analyzeResumeAtsDelta(
      originalResumeText,
      tailoredResumeText || originalResumeText,
      selectedJob.requiredSkills
    );
  }, [originalResumeText, tailoredResumeText, selectedJob]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setOriginalResumeText(reader.result);
        onUpdateProfile({ ...profile, rawResume: reader.result });
        setSaveMessage(`Loaded original resume from ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateDrafts = async () => {
    if (!selectedJob) return;
    setIsGenerating(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/ai/draft-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: selectedJob,
          profile,
          originalResume: originalResumeText,
          tone,
          providerMode,
          ollamaHost,
          ollamaModel,
          enforcePiiRedaction,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate application drafts.');
      }

      const nextTailoredResume = data.tailoredResume || '';
      setTailoredResumeText(nextTailoredResume);
      setCoverLetterText(data.coverLetter);
      setOutreachRecipient(data.outreach.recipientRole);
      setOutreachSubject(data.outreach.subject);
      setOutreachBody(data.outreach.body);
      setEngineBadge(data.engineUsed);

      onUpdateProfile({ ...profile, rawResume: originalResumeText });
      onSaveDraftsToJob(
        selectedJob.id,
        data.coverLetter,
        {
          recipientRole: data.outreach.recipientRole,
          subject: data.outreach.subject,
          body: data.outreach.body,
        },
        nextTailoredResume
      );
      setSaveMessage(
        `Tailored resume, cover letter, and outreach saved for ${selectedJob.company}.`
      );
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = () => {
    if (!selectedJob) return;
    onUpdateProfile({ ...profile, rawResume: originalResumeText });
    onSaveDraftsToJob(
      selectedJob.id,
      coverLetterText,
      {
        recipientRole: outreachRecipient,
        subject: outreachSubject,
        body: outreachBody,
      },
      tailoredResumeText
    );
    setSaveMessage('Saved tailored resume, cover letter, and outreach to application record.');
  };

  const handleCopy = async (text: string, field: 'resume' | 'letter' | 'outreach') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Fallback if clipboard blocked
    }
  };

  const handleDownloadBundle = () => {
    if (!selectedJob) return;
    const content = `# Tailored Application Package: ${selectedJob.title} at ${selectedJob.company}\n\n## 1. Tailored Resume\n\n${tailoredResumeText}\n\n---\n\n## 2. Tailored Cover Letter\n\n${coverLetterText}\n\n---\n\n## 3. Personalized Outreach (${outreachRecipient})\n**Subject:** ${outreachSubject}\n\n${outreachBody}\n`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedJob.company.toLowerCase().replace(/\s+/g, '-')}-application-bundle.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Control Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Tailored Resume, Cover Letter & Outreach Studio
            </h2>
            <p className="text-xs text-slate-500">
              Provide your original resume to automatically tailor your summary, ATS skill order, and impact bullets alongside a custom cover letter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowProfileEditor((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              {showProfileEditor ? 'Hide Contact & Skills Vault' : 'Edit Contact & Skills Vault'}
            </button>

            <button
              type="button"
              onClick={() => setShowPrivacyDiff((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              {showPrivacyDiff
                ? 'Hide Zero-Egress Sanitizer'
                : `Inspect PII Redaction (${sanitizationPreview.redactedCount} fields masked)`}
            </button>
          </div>
        </div>

        {/* Target Job & Tone Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label htmlFor="studio-job-select" className="block text-xs font-medium text-slate-700 mb-1">
              Target Job Application
            </label>
            <select
              id="studio-job-select"
              value={selectedJob?.id || ''}
              onChange={(e) => onSelectJob(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company} — {j.title} ({j.workMode})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Drafting Tone
            </label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Select cover letter tone">
              {(['technical', 'executive', 'concise'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md capitalize transition-colors ${
                    tone === t
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="button"
              disabled={isGenerating || !selectedJob}
              onClick={handleGenerateDrafts}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating
                ? 'Tailoring Resume & Cover Letter...'
                : 'Tailor Resume, Cover Letter & Outreach'}
            </button>
          </div>
        </div>

        {/* ATS Alignment & Skill Match Strip */}
        {selectedJob && matchAnalysis && atsDelta && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                Original ATS Fit: {atsDelta.originalKeywordScore}%
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className="font-mono font-bold text-emerald-700 tabular-nums"
                data-testid="tailored-ats-score"
              >
                Tailored ATS Fit: {atsDelta.tailoredKeywordScore}%
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Target Stack: {selectedJob.requiredSkills.join(', ')}
              </span>
              {atsDelta.atsKeywordsInjected.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-700 font-medium">
                    Woven Keywords: {atsDelta.atsKeywordsInjected.join(', ')}
                  </span>
                </>
              )}
            </div>
            {engineBadge && (
              <span className="text-slate-500 font-mono text-[11px]">
                Engine: {engineBadge}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Local Contact & Skills Vault Editor */}
      {showProfileEditor && (
        <section aria-label="Local candidate resume profile editor" className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Local Candidate Contact & Skills Vault (Stored in Browser LocalStorage)
              </h3>
              <p className="text-xs text-slate-500">
                Your contact fields are automatically tokenized by the Zero-Egress PII Sanitizer before any cloud model request.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="vault-name" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name (PII Protected)
              </label>
              <input
                id="vault-name"
                type="text"
                value={profile.fullName}
                onChange={(e) => onUpdateProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="vault-email" className="block text-xs font-medium text-slate-700 mb-1">
                Email Address (PII Protected)
              </label>
              <input
                id="vault-email"
                type="email"
                value={profile.email}
                onChange={(e) => onUpdateProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label htmlFor="vault-phone" className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number (PII Protected)
              </label>
              <input
                id="vault-phone"
                type="text"
                value={profile.phone}
                onChange={(e) => onUpdateProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vault-skills" className="block text-xs font-medium text-slate-700 mb-1">
                Core Technical Skills (comma-separated)
              </label>
              <input
                id="vault-skills"
                type="text"
                value={profile.coreSkills.join(', ')}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    coreSkills: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="vault-portfolio" className="block text-xs font-medium text-slate-700 mb-1">
                GitHub / Portfolio URL
              </label>
              <input
                id="vault-portfolio"
                type="text"
                value={profile.portfolioUrl}
                onChange={(e) => onUpdateProfile({ ...profile, portfolioUrl: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </section>
      )}

      {/* Collapsible Zero-Egress PII Sanitizer Inspector */}
      {showPrivacyDiff && (
        <section aria-label="Zero-egress PII redaction preview" className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Zero-Egress PII Sanitization Audit
              </h3>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enforcePiiRedaction}
                onChange={(e) => setEnforcePiiRedaction(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span>Mask PII before hybrid cloud calls ({sanitizationPreview.redactedCount} sensitive tokens masked)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-sans font-semibold text-slate-700 mb-1.5">
                1. Original Resume Input (Stays on 127.0.0.1)
              </p>
              <pre className="whitespace-pre-wrap text-slate-600 leading-relaxed max-h-48 overflow-y-auto">
                {originalResumeText}
              </pre>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <p className="font-sans font-semibold text-emerald-900 mb-1.5">
                2. Sanitized Outbound Payload (PII Stripped)
              </p>
              <pre className="whitespace-pre-wrap text-emerald-950 leading-relaxed max-h-48 overflow-y-auto">
                {sanitizationPreview.sanitizedText}
              </pre>
            </div>
          </div>
        </section>
      )}

      {saveMessage && (
        <div className="px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{saveMessage}</span>
          <span className="font-mono text-[11px]">Auto-persisted locally</span>
        </div>
      )}

      {/* Original Resume Input Box (Always Accessible) */}
      <section
        aria-label="Original resume input"
        className="bg-white border border-slate-200 rounded-lg p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              1. Your Original Master Resume (Paste or Upload .md / .txt)
            </h3>
            <p className="text-xs text-slate-500">
              Provide your master resume below. CareerVault AI will re-order your skills, align your executive summary, and tailor your experience bullets to {selectedJob?.company || 'the target role'}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume (.txt/.md)</span>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <label htmlFor="original-resume-textarea" className="sr-only">
          Original Master Resume
        </label>
        <textarea
          id="original-resume-textarea"
          rows={6}
          value={originalResumeText}
          onChange={(e) => setOriginalResumeText(e.target.value)}
          placeholder="Paste your original resume text or markdown here..."
          className="w-full p-3 text-xs font-mono leading-relaxed text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
        />
      </section>

      {/* Side-by-Side Editors: Tailored Resume (Left 6 Cols) + Tailored Cover Letter & Outreach (Right 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Tailored Resume */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>2. Tailored Role-Specific Resume</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedJob
                    ? `Customized for ${selectedJob.title} at ${selectedJob.company}`
                    : 'Select a job listing'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(tailoredResumeText, 'resume')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedField === 'resume' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <label htmlFor="tailored-resume-textarea" className="sr-only">
              Tailored Resume Content
            </label>
            <textarea
              id="tailored-resume-textarea"
              rows={16}
              value={tailoredResumeText}
              onChange={(e) => setTailoredResumeText(e.target.value)}
              placeholder="Click 'Tailor Resume, Cover Letter & Outreach' above to generate a role-tailored resume from your original resume..."
              className="w-full p-3.5 text-xs font-mono leading-relaxed text-slate-800 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-mono tabular-nums">
              {tailoredResumeText.trim() ? tailoredResumeText.trim().split(/\s+/).length : 0} words
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadBundle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Bundle (.md)</span>
              </button>
              <button
                type="button"
                onClick={handleManualSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save All to Job
              </button>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Tailored Cover Letter & Personalized Direct Outreach */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Cover letter and outreach tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightPanelTab === 'cover_letter'}
                  onClick={() => setRightPanelTab('cover_letter')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    rightPanelTab === 'cover_letter'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. Tailored Cover Letter
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightPanelTab === 'outreach'}
                  onClick={() => setRightPanelTab('outreach')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    rightPanelTab === 'outreach'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4. Hiring Manager Outreach
                </button>
              </div>

              {rightPanelTab === 'cover_letter' ? (
                <button
                  type="button"
                  onClick={() => handleCopy(coverLetterText, 'letter')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedField === 'letter' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Letter</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(`Subject: ${outreachSubject}\n\n${outreachBody}`, 'outreach')
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedField === 'outreach' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Copy Outreach</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {rightPanelTab === 'cover_letter' ? (
              <div>
                <label htmlFor="cover-letter-textarea" className="sr-only">
                  Cover Letter Content
                </label>
                <textarea
                  id="cover-letter-textarea"
                  rows={16}
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  placeholder="Click 'Tailor Resume, Cover Letter & Outreach' above to draft a tailored cover letter..."
                  className="w-full p-3.5 text-sm leading-relaxed text-slate-800 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="outreach-recipient-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Target Recipient Role
                  </label>
                  <input
                    id="outreach-recipient-input"
                    type="text"
                    value={outreachRecipient}
                    onChange={(e) => setOutreachRecipient(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="outreach-subject-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Email / InMail Subject Line
                  </label>
                  <input
                    id="outreach-subject-input"
                    type="text"
                    value={outreachSubject}
                    onChange={(e) => setOutreachSubject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="outreach-body-textarea" className="block text-xs font-medium text-slate-700 mb-1">
                    Outreach Message Body
                  </label>
                  <textarea
                    id="outreach-body-textarea"
                    rows={11}
                    value={outreachBody}
                    onChange={(e) => setOutreachBody(e.target.value)}
                    placeholder="Personalized hiring manager outreach message will appear here..."
                    className="w-full p-3 text-xs leading-relaxed text-slate-800 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Synced with tailored resume highlights</span>
            <span className="font-mono tabular-nums">
              {rightPanelTab === 'cover_letter'
                ? `${coverLetterText.trim() ? coverLetterText.trim().split(/\s+/).length : 0} words`
                : `${outreachBody.trim() ? outreachBody.trim().split(/\s+/).length : 0} words`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
