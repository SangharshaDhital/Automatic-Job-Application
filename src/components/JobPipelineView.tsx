import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import {
  calculateJobMatch,
  computePipelineMetrics,
  type ApplicationStage,
  type CandidateProfile,
  type JobListing,
  type LLMProviderMode,
} from '../utils/careerEngine';

interface JobPipelineViewProps {
  jobs: JobListing[];
  profile: CandidateProfile;
  selectedJobId: string;
  onSelectJob: (id: string) => void;
  onUpdateJobStage: (id: string, stage: ApplicationStage) => void;
  onUpdateJobSummary: (id: string, summary: NonNullable<JobListing['aiSummary']>, engineName: string) => void;
  onAddJob: (job: JobListing) => void;
  onDeleteJob: (id: string) => void;
  onOpenCoverLetterStudio: (jobId: string) => void;
  providerMode: LLMProviderMode;
  ollamaHost: string;
  ollamaModel: string;
}

const STAGE_OPTIONS: { value: ApplicationStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Listings' },
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
];

const STAGE_LABELS: Record<ApplicationStage, { text: string; colorClass: string }> = {
  saved: { text: 'Saved', colorClass: 'text-slate-600' },
  applied: { text: 'Applied', colorClass: 'text-blue-700 font-medium' },
  interviewing: { text: 'Interviewing', colorClass: 'text-amber-700 font-semibold' },
  offer: { text: 'Offer Received', colorClass: 'text-emerald-700 font-semibold' },
  archived: { text: 'Archived', colorClass: 'text-slate-400' },
};

export const JobPipelineView: React.FC<JobPipelineViewProps> = ({
  jobs,
  profile,
  selectedJobId,
  onSelectJob,
  onUpdateJobStage,
  onUpdateJobSummary,
  onAddJob,
  onDeleteJob,
  onOpenCoverLetterStudio,
  providerMode,
  ollamaHost,
  ollamaModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<ApplicationStage | 'all'>('all');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [summarizingJobId, setSummarizingJobId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Add Job Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Remote (US)');
  const [newWorkMode, setNewWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [newSalary, setNewSalary] = useState('$175,000 – $210,000');
  const [newSkillsInput, setNewSkillsInput] = useState('React, TypeScript, Node.js,Local LLMs (Ollama)');
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const metrics = useMemo(() => computePipelineMetrics(jobs), [jobs]);

  const enrichedJobs = useMemo(() => {
    return jobs.map((job) => ({
      job,
      match: calculateJobMatch(profile.coreSkills, job.requiredSkills),
    }));
  }, [jobs, profile.coreSkills]);

  const filteredJobs = useMemo(() => {
    return enrichedJobs.filter(({ job, match }) => {
      if (stageFilter !== 'all' && job.stage !== stageFilter) return false;
      if (match.score < minMatchFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [enrichedJobs, stageFilter, minMatchFilter, searchQuery]);

  const activeJobEntry = useMemo(() => {
    return (
      enrichedJobs.find((item) => item.job.id === selectedJobId) ||
      filteredJobs[0] ||
      enrichedJobs[0] ||
      null
    );
  }, [enrichedJobs, filteredJobs, selectedJobId]);

  const handleSummarizeJob = async (job: JobListing) => {
    setSummarizingJobId(job.id);
    setStatusFeedback(null);
    try {
      const response = await fetch('/api/ai/summarize-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          rawDescription: job.rawDescription,
          providerMode,
          ollamaHost,
          ollamaModel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize job.');
      }
      onUpdateJobSummary(job.id, data.summary, data.engineUsed);
      setStatusFeedback(`Summarized via ${data.engineUsed}`);
    } catch (err) {
      setStatusFeedback(
        err instanceof Error ? err.message : 'Error summarizing job listing.'
      );
    } finally {
      setSummarizingJobId(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim() || newDescription.trim().length < 15) {
      setFormError(
        'Please enter a job title, company name, and a job description (at least 15 characters).'
      );
      return;
    }
    setFormError(null);

    const parsedSkills = newSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const createdJob: JobListing = {
      id: `job-${Date.now()}`,
      title: newTitle.trim(),
      company: newCompany.trim(),
      location: newLocation.trim() || 'Remote',
      workMode: newWorkMode,
      salaryRange: newSalary.trim() || 'Competitive',
      postedDate: new Date().toISOString().slice(0, 10),
      stage: 'saved',
      sourceUrl: `https://careers.example.com/${newCompany.toLowerCase().replace(/\s+/g, '-')}`,
      rawDescription: newDescription.trim(),
      requiredSkills: parsedSkills.length > 0 ? parsedSkills : ['React', 'TypeScript'],
      lastUpdated: new Date().toISOString(),
    };

    onAddJob(createdJob);
    onSelectJob(createdJob.id);
    setShowAddForm(false);
    setNewTitle('');
    setNewCompany('');
    setNewDescription('');

    // Automatically trigger AI summary for the newly added job
    await handleSummarizeJob(createdJob);
  };

  return (
    <div className="space-y-6">
      {/* Top KPI & Pipeline Funnel Row */}
      <section aria-label="Application pipeline metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Tracked Opportunities</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums" data-testid="metric-total-jobs">
              {metrics.totalJobs}
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {metrics.counts.saved} saved · {metrics.totalSubmitted} active
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Interview Pipeline</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {metrics.counts.interviewing}
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {metrics.interviewConversionRate}% conversion rate
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Tailored Cover Letters</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {metrics.draftedCoverLettersCount}
            </span>
            <span className="text-xs text-slate-500">Zero-egress PII protected</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500">Stage Distribution</p>
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded bg-slate-100" role="img" aria-label="Pipeline stage distribution bar">
            {metrics.totalJobs > 0 && (
              <>
                <div
                  style={{ width: `${(metrics.counts.saved / metrics.totalJobs) * 100}%` }}
                  className="bg-slate-400"
                  title={`Saved: ${metrics.counts.saved}`}
                />
                <div
                  style={{ width: `${(metrics.counts.applied / metrics.totalJobs) * 100}%` }}
                  className="bg-blue-600"
                  title={`Applied: ${metrics.counts.applied}`}
                />
                <div
                  style={{ width: `${(metrics.counts.interviewing / metrics.totalJobs) * 100}%` }}
                  className="bg-amber-500"
                  title={`Interviewing: ${metrics.counts.interviewing}`}
                />
                <div
                  style={{ width: `${(metrics.counts.offer / metrics.totalJobs) * 100}%` }}
                  className="bg-emerald-600"
                  title={`Offer: ${metrics.counts.offer}`}
                />
              </>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
            <span>Saved {metrics.counts.saved}</span>
            <span>·</span>
            <span>Applied {metrics.counts.applied}</span>
            <span>·</span>
            <span>Interview {metrics.counts.interviewing}</span>
            <span>·</span>
            <span>Offer {metrics.counts.offer}</span>
          </div>
        </div>
      </section>

      {/* Filter & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search job listings by role, company, or skill"
              placeholder="Search roles, companies, or skills (e.g., Ollama, React)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto" role="group" aria-label="Filter jobs by application stage">
            {STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStageFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  stageFilter === opt.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="min-match-select" className="whitespace-nowrap">
              Min Match:
            </label>
            <select
              id="min-match-select"
              value={minMatchFilter}
              onChange={(e) => setMinMatchFilter(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value={0}>All (0%+)</option>
              <option value={50}>50%+ Fit</option>
              <option value={75}>75%+ Strong Fit</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Close Job Form' : 'Add Job Listing'}
          </button>
        </div>
      </div>

      {/* Collapsible Add / Import Job Listing Panel */}
      {showAddForm && (
        <form
          onSubmit={handleCreateJob}
          aria-label="Add or import a new job listing"
          className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Import & Summarize New Job Listing
              </h2>
              <p className="text-xs text-slate-500">
                Paste a raw job posting to calculate deterministic skill alignment and generate a structured AI summary.
              </p>
            </div>
          </div>

          {formError && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="job-title-input" className="block text-xs font-medium text-slate-700 mb-1">
                Role Title *
              </label>
              <input
                id="job-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Senior React & AI Engineer"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="job-company-input" className="block text-xs font-medium text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                id="job-company-input"
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="e.g. Raycast / Linear"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="job-workmode-select" className="block text-xs font-medium text-slate-700 mb-1">
                  Work Mode
                </label>
                <select
                  id="job-workmode-select"
                  value={newWorkMode}
                  onChange={(e) => setNewWorkMode(e.target.value as 'Remote' | 'Hybrid' | 'On-site')}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <div>
                <label htmlFor="job-salary-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Salary Band
                </label>
                <input
                  id="job-salary-input"
                  type="text"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-location-input" className="block text-xs font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                id="job-location-input"
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label htmlFor="job-skills-input" className="block text-xs font-medium text-slate-700 mb-1">
                Required Skills (comma-separated)
              </label>
              <input
                id="job-skills-input"
                type="text"
                value={newSkillsInput}
                onChange={(e) => setNewSkillsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-description-input" className="block text-xs font-medium text-slate-700 mb-1">
              Raw Job Description *
            </label>
            <textarea
              id="job-description-input"
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Paste the job responsibilities, qualifications, and engineering stack here..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Save & Summarize Listing
            </button>
          </div>
        </form>
      )}

      {/* Main Split Grid: High-Density Job Table (Left 7 cols) + AI Summary & Match Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Job Discovery & Application Ledger
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Showing {filteredJobs.length} of {jobs.length} roles
            </span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">
                No job listings match your current filter criteria.
              </p>
              <p className="text-xs text-slate-500">
                Reset your stage or match filter, or import a new job listing above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStageFilter('all');
                  setMinMatchFilter(0);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-4">Role & Company</th>
                    <th className="py-2.5 px-3">Compensation</th>
                    <th className="py-2.5 px-3 text-right">Skill Fit</th>
                    <th className="py-2.5 px-4">Pipeline Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredJobs.map(({ job, match }) => {
                    const isSelected = activeJobEntry?.job.id === job.id;
                    return (
                      <tr
                        key={job.id}
                        onClick={() => onSelectJob(job.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {job.title}
                          </div>
                          {/* Zero-Pill Metadata Discipline: Clean unboxed text with · separators */}
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{job.company}</span>
                            <span aria-hidden="true">·</span>
                            <span>{job.location}</span>
                            <span aria-hidden="true">·</span>
                            <span>{job.workMode}</span>
                            {job.coverLetterDraft && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-blue-700 font-medium">Letter Drafted</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-xs font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {job.salaryRange}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              match.score >= 80
                                ? 'text-emerald-700'
                                : match.score >= 60
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {match.score}% match
                          </span>
                        </td>

                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            aria-label={`Stage for ${job.title} at ${job.company}`}
                            value={job.stage}
                            onChange={(e) =>
                              onUpdateJobStage(job.id, e.target.value as ApplicationStage)
                            }
                            className={`text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                              STAGE_LABELS[job.stage].colorClass
                            }`}
                          >
                            <option value="saved">Saved</option>
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offer">Offer Received</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Selected Job AI Summary, Skill Gap Analysis & Action Panel */}
        {activeJobEntry && (
          <aside
            aria-label="Selected job AI summary and skill match analysis"
            className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{activeJobEntry.job.company}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeJobEntry.job.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Posted {activeJobEntry.job.postedDate}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {activeJobEntry.job.title}
                </h3>
                <p className="mt-1 text-xs font-mono tabular-nums text-slate-600">
                  {activeJobEntry.job.salaryRange} · {STAGE_LABELS[activeJobEntry.job.stage].text}
                </p>
              </div>

              <button
                type="button"
                aria-label={`Delete ${activeJobEntry.job.title}`}
                onClick={() => onDeleteJob(activeJobEntry.job.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                title="Remove listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenCoverLetterStudio(activeJobEntry.job.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                {activeJobEntry.job.tailoredResumeDraft || activeJobEntry.job.coverLetterDraft
                  ? 'Edit Tailored Resume & Cover Letter'
                  : 'Tailor Resume & Cover Letter'}
              </button>

              <button
                type="button"
                disabled={summarizingJobId === activeJobEntry.job.id}
                onClick={() => handleSummarizeJob(activeJobEntry.job)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {summarizingJobId === activeJobEntry.job.id
                  ? 'Summarizing...'
                  : 'Re-Summarize with AI'}
              </button>
            </div>

            {statusFeedback && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusFeedback}</span>
              </div>
            )}

            {/* Skill Match Breakdown */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Resume-to-Role Skill Alignment
                </span>
                <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
                  {activeJobEntry.match.score}% ({activeJobEntry.match.matchedSkills.length}/
                  {activeJobEntry.job.requiredSkills.length} skills)
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {activeJobEntry.match.recommendation}
              </p>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="font-medium text-emerald-800">Matched Stack: </span>
                  <span className="text-slate-700">
                    {activeJobEntry.match.matchedSkills.length > 0
                      ? activeJobEntry.match.matchedSkills.join(' · ')
                      : 'None detected'}
                  </span>
                </div>
                {activeJobEntry.match.missingSkills.length > 0 && (
                  <div>
                    <span className="font-medium text-amber-800">Gap / Highlight in Letter: </span>
                    <span className="text-slate-600">
                      {activeJobEntry.match.missingSkills.join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Structured Summary */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-800">
                  AI Listing Summary & Key Signals
                </h4>
                <span className="text-[11px] text-slate-500">
                  {providerMode === 'ollama_local' ? `Local Ollama (${ollamaModel})` : 'Hybrid Gemini 3.8'}
                </span>
              </div>

              {activeJobEntry.job.aiSummary ? (
                <div className="space-y-3 text-xs text-slate-700">
                  <p className="font-medium text-slate-900 leading-relaxed">
                    {activeJobEntry.job.aiSummary.tldr}
                  </p>

                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Key Responsibilities:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {activeJobEntry.job.aiSummary.keyResponsibilities.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="font-semibold text-slate-800">Engineering Culture</p>
                      <p className="text-slate-600 mt-0.5">
                        {activeJobEntry.job.aiSummary.teamCulture}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Candidate Notes</p>
                      <p className="text-slate-600 mt-0.5">
                        {activeJobEntry.job.aiSummary.redFlagsOrNotes}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2 bg-slate-50 rounded-lg border border-slate-200/80 p-4">
                  <p className="text-xs text-slate-600">
                    No structured summary generated for this role yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSummarizeJob(activeJobEntry.job)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Summary Now
                  </button>
                </div>
              )}
            </div>

            {/* Raw Description Accordion / Excerpt */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Source Job Description</span>
                <a
                  href={activeJobEntry.job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <span>Source Listing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                {activeJobEntry.job.rawDescription}
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
