import React, { useState, useMemo } from 'react';
import {
  BellRing,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  evaluateInterviewAlerts,
  type InterviewEvent,
  type JobListing,
} from '../utils/careerEngine';

interface InterviewAlertsViewProps {
  interviews: InterviewEvent[];
  jobs: JobListing[];
  referenceNowIso: string;
  onAddInterview: (interview: InterviewEvent) => void;
  onToggleChecklistItem: (interviewId: string, itemId: string) => void;
  onAcknowledgeAlert: (interviewId: string) => void;
  onDeleteInterview: (interviewId: string) => void;
}

export const InterviewAlertsView: React.FC<InterviewAlertsViewProps> = ({
  interviews,
  jobs,
  referenceNowIso,
  onAddInterview,
  onToggleChecklistItem,
  onAcknowledgeAlert,
  onDeleteInterview,
}) => {
  const [rawInviteText, setRawInviteText] = useState('');
  const [isParsingInvite, setIsParsingInvite] = useState(false);
  const [parseFeedback, setParseFeedback] = useState<string | null>(null);

  // Manual schedule form
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [roundName, setRoundName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-10-30');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerRole, setInterviewerRole] = useState('Engineering Manager');
  const [meetingLink, setMeetingLink] = useState('https://meet.localvault.dev/sync');
  const [formError, setFormError] = useState<string | null>(null);

  const evaluatedAlerts = useMemo(
    () => evaluateInterviewAlerts(interviews, referenceNowIso),
    [interviews, referenceNowIso]
  );

  const urgentCount = useMemo(
    () =>
      evaluatedAlerts.filter(
        (a) => a.urgency === 'urgent_24h' || a.hasConflict
      ).length,
    [evaluatedAlerts]
  );

  const handleParseRecruiterInvite = async () => {
    if (!rawInviteText.trim() || rawInviteText.trim().length < 10) {
      setParseFeedback('Please paste a recruiter invite message (at least 10 characters).');
      return;
    }

    setIsParsingInvite(true);
    setParseFeedback(null);
    const targetJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

    try {
      const response = await fetch('/api/ai/parse-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInviteText,
          defaultCompany: targetJob?.company || 'AetherLabs',
          defaultRole: targetJob?.title || 'Senior Software Engineer',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse invite.');
      }

      const parsed = data.parsed;
      const newInterview: InterviewEvent = {
        id: `int-${Date.now()}`,
        jobId: targetJob?.id || 'job-custom',
        company: parsed.company || targetJob?.company || 'Target Company',
        roleTitle: parsed.roleTitle || targetJob?.title || 'Software Engineer',
        roundName: parsed.roundName || 'Technical Round',
        scheduledAt: new Date(`${scheduledDate}T${scheduledTime}:00.000Z`).toISOString(),
        durationMinutes: Number(parsed.durationMinutes) || 45,
        interviewerName: parsed.interviewerName || 'Hiring Lead',
        interviewerRole: parsed.interviewerRole || 'Engineering Manager',
        meetingLink: parsed.meetingLink || 'https://meet.localvault.dev/interview',
        prepChecklist: (parsed.prepItems || []).map((text: string, idx: number) => ({
          id: `prep-${Date.now()}-${idx}`,
          text,
          completed: false,
        })),
        notes: `Extracted via ${data.engineUsed}`,
        acknowledged: false,
      };

      onAddInterview(newInterview);
      setRawInviteText('');
      setParseFeedback(`Scheduled "${newInterview.roundName}" with ${newInterview.company} (${data.engineUsed}).`);
    } catch (err) {
      setParseFeedback(err instanceof Error ? err.message : 'Error parsing invite');
    } finally {
      setIsParsingInvite(false);
    }
  };

  const handleManualAddInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundName.trim() || !interviewerName.trim()) {
      setFormError('Please provide both the interview round name and interviewer name.');
      return;
    }
    setFormError(null);

    const targetJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
    const scheduledIso = new Date(`${scheduledDate}T${scheduledTime}:00.000Z`).toISOString();

    const created: InterviewEvent = {
      id: `int-${Date.now()}`,
      jobId: targetJob?.id || 'job-1',
      company: targetJob?.company || 'Custom Company',
      roleTitle: targetJob?.title || 'Software Engineer',
      roundName: roundName.trim(),
      scheduledAt: scheduledIso,
      durationMinutes: Number(durationMinutes) || 45,
      interviewerName: interviewerName.trim(),
      interviewerRole: interviewerRole.trim() || 'Interviewer',
      meetingLink: meetingLink.trim() || 'https://meet.localvault.dev/room',
      prepChecklist: [
        {
          id: `prep-${Date.now()}-1`,
          text: `Review ${targetJob?.company || 'company'} architecture & tailored cover letter`,
          completed: false,
        },
        {
          id: `prep-${Date.now()}-2`,
          text: 'Prepare 2 system design stories with concrete metrics',
          completed: false,
        },
      ],
      notes: 'Scheduled via CareerVault Interview Tracker',
      acknowledged: false,
    };

    onAddInterview(created);
    setRoundName('');
    setInterviewerName('');
    setParseFeedback(`Added interview alert for ${created.company} — ${created.roundName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Alert Summary Banner */}
      <section
        aria-label="Interview scheduling alert summary"
        className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Interview Scheduling Alerts & Conflict Radar
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Automated countdown alerts, calendar overlap detection, and recruiter invite parsing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-500 block">Total Scheduled</span>
            <span className="text-base font-bold text-slate-900">{evaluatedAlerts.length} rounds</span>
          </div>
          <div>
            <span className="text-slate-500 block">Urgent (&le;24h) / Conflicts</span>
            <span className={`text-base font-bold ${urgentCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {urgentCount} active alerts
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Active Interview Alerts & Preparation Checklists */}
        <div className="lg:col-span-7 space-y-4">
          {evaluatedAlerts.map(({ interview, urgency, hoursUntil, hasConflict }) => {
            const formattedDate = new Date(interview.scheduledAt).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
              timeZoneName: 'short',
            });

            return (
              <article
                key={interview.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {urgency === 'urgent_24h' && (
                        <span className="font-semibold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Urgent Alert: In {hoursUntil}h
                        </span>
                      )}
                      {urgency === 'upcoming_72h' && (
                        <span className="font-semibold text-amber-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Upcoming: In {hoursUntil}h
                        </span>
                      )}
                      {urgency === 'scheduled' && (
                        <span className="font-semibold text-emerald-600">
                          Scheduled ({hoursUntil}h away)
                        </span>
                      )}
                      {urgency === 'past' && (
                        <span className="font-medium text-slate-500">
                          Completed / Past
                        </span>
                      )}
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-800">{interview.company}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500">{interview.roleTitle}</span>
                    </div>

                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {interview.roundName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {!interview.acknowledged ? (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeAlert(interview.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Acknowledge Alert
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Alert Acknowledged
                      </span>
                    )}

                    <button
                      type="button"
                      aria-label={`Remove interview ${interview.roundName}`}
                      onClick={() => onDeleteInterview(interview.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {hasConflict && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>
                      Schedule Conflict Detected: This session overlaps with another scheduled interview.
                    </span>
                  </div>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formattedDate}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{interview.durationMinutes} mins</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans">
                    Interviewer: <strong className="text-slate-800">{interview.interviewerName}</strong> ({interview.interviewerRole})
                  </span>
                  <span aria-hidden="true">·</span>
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Join Room</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Interactive Preparation Checklist */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    Preparation Checklist
                  </p>
                  <div className="space-y-1.5">
                    {interview.prepChecklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onToggleChecklistItem(interview.id, item.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className={item.completed ? 'line-through text-slate-400' : ''}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right 5 Cols: AI Invite Parser + Manual Interview Scheduler */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Recruiter Invite Parser */}
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Recruiter Email / Invite Parser
              </h3>
              <p className="text-xs text-slate-500">
                Paste a recruiter email to automatically extract the interview round, interviewer, duration, and prep checklist.
              </p>
            </div>

            <label htmlFor="raw-invite-textarea" className="sr-only">
              Recruiter Invite Email Text
            </label>
            <textarea
              id="raw-invite-textarea"
              rows={4}
              value={rawInviteText}
              onChange={(e) => setRawInviteText(e.target.value)}
              placeholder="e.g. Hi Sangharsha, we'd love to invite you to a 60 minute System Design interview with Jordan Lee (Staff Eng Manager) at ModularFlow. Join link: https://meet.modularflow.io/arch-round"
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />

            <button
              type="button"
              disabled={isParsingInvite}
              onClick={handleParseRecruiterInvite}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isParsingInvite ? 'Extracting Schedule...' : 'Parse Invite & Create Alert'}
            </button>

            {parseFeedback && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-2.5">
                {parseFeedback}
              </p>
            )}
          </section>

          {/* Manual Schedule Interview Form */}
          <form
            onSubmit={handleManualAddInterview}
            aria-label="Schedule interview manually"
            className="bg-white border border-slate-200 rounded-lg p-5 space-y-3.5"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Schedule Interview Alert Manually
            </h3>

            {formError && (
              <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {formError}
              </p>
            )}

            <div>
              <label htmlFor="manual-job-select" className="block text-xs font-medium text-slate-700 mb-1">
                Linked Application
              </label>
              <select
                id="manual-job-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manual-round-input" className="block text-xs font-medium text-slate-700 mb-1">
                Interview Round Name *
              </label>
              <input
                id="manual-round-input"
                type="text"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                placeholder="e.g. Live React & Local LLM Pairing"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="manual-date-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Date (UTC)
                </label>
                <input
                  id="manual-date-input"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="manual-time-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Time (UTC)
                </label>
                <input
                  id="manual-time-input"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="manual-duration-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Duration (m)
                </label>
                <input
                  id="manual-duration-input"
                  type="number"
                  min={15}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="manual-interviewer-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Interviewer Name *
                </label>
                <input
                  id="manual-interviewer-input"
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="manual-role-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Interviewer Role
                </label>
                <input
                  id="manual-role-input"
                  type="text"
                  value={interviewerRole}
                  onChange={(e) => setInterviewerRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Interview Alert
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
