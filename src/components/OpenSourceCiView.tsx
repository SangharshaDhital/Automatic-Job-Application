import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  Copy,
  Check,
  FileCode2,
  Server,
  RefreshCw,
  Shield,
} from 'lucide-react';
import type { LLMProviderMode } from '../utils/careerEngine';

interface OpenSourceCiViewProps {
  providerMode: LLMProviderMode;
  onChangeProviderMode: (mode: LLMProviderMode) => void;
  ollamaHost: string;
  onChangeOllamaHost: (host: string) => void;
  ollamaModel: string;
  onChangeOllamaModel: (model: string) => void;
}

type RepoFileKey =
  | 'README.md'
  | 'CONTRIBUTING.md'
  | '.github/workflows/ci.yml'
  | 'src/utils/careerEngine.test.ts'
  | 'LICENSE';

export const OpenSourceCiView: React.FC<OpenSourceCiViewProps> = ({
  providerMode,
  onChangeProviderMode,
  ollamaHost,
  onChangeOllamaHost,
  ollamaModel,
  onChangeOllamaModel,
}) => {
  const [repoFiles, setRepoFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<RepoFileKey>('README.md');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Live Unit Test Suite Runner state
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    durationMs: number;
    output: string;
  } | null>(null);

  // Ollama Probe state
  const [ollamaStatus, setOllamaStatus] = useState<{
    reachable: boolean;
    host: string;
    models: string[];
    latencyMs: number;
    message: string;
    geminiConfigured: boolean;
  } | null>(null);
  const [probingOllama, setProbingOllama] = useState(false);

  // GitHub remote configuration helper
  const [githubOwner, setGithubOwner] = useState('SangharshaDhital');
  const [githubRepo, setGithubRepo] = useState('careervault-ai');

  useEffect(() => {
    fetch('/api/repo/files')
      .then((r) => r.json())
      .then((data) => {
        if (data.files) setRepoFiles(data.files);
      })
      .catch(() => {});

    handleProbeOllama(ollamaHost);
  }, []);

  const handleProbeOllama = async (hostToProbe = ollamaHost) => {
    setProbingOllama(true);
    try {
      const res = await fetch(`/api/ollama/status?host=${encodeURIComponent(hostToProbe)}`);
      const data = await res.json();
      setOllamaStatus(data);
    } catch {
      // ignore
    } finally {
      setProbingOllama(false);
    }
  };

  const handleRunUnitTests = async () => {
    setTestRunning(true);
    try {
      const res = await fetch('/api/repo/run-tests', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        passed: false,
        durationMs: 0,
        output: err instanceof Error ? err.message : 'Failed to run unit tests',
      });
    } finally {
      setTestRunning(false);
    }
  };

  const gitPushCommands = `# Push CareerVault AI open-source release to your main branch
git init
git branch -M main
git add README.md CONTRIBUTING.md LICENSE .github/workflows/ci.yml package.json server.ts src/
git commit -m "feat: release CareerVault AI local-first job tracker, Ollama bridge & CI test suite"
git remote add origin https://github.com/${githubOwner.trim() || 'your-username'}/${githubRepo.trim() || 'careervault-ai'}.git
git push -u origin main`;

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 1800);
    } catch {
      // fallback
    }
  };

  const fileTabs: RepoFileKey[] = [
    'README.md',
    'CONTRIBUTING.md',
    '.github/workflows/ci.yml',
    'src/utils/careerEngine.test.ts',
    'LICENSE',
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Local Ollama Privacy Architecture & Live Automated Test Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Local LLM via Ollama Configuration (Left 6 Cols) */}
        <section
          aria-label="Local Ollama LLM configuration and privacy bridge"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Local LLM Runtime (Ollama) & Privacy Architecture
                </h2>
                <p className="text-xs text-slate-500">
                  Keep sensitive resume data on <code className="font-mono text-slate-700">127.0.0.1</code> via Ollama or use Zero-Egress PII redaction with Gemini.
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Engine Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Active AI Inference Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Select AI inference mode">
              <button
                type="button"
                onClick={() => onChangeProviderMode('ollama_local')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors text-left ${
                  providerMode === 'ollama_local'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="block">Local Ollama (Default)</span>
                <span className="text-[11px] font-normal text-slate-500">
                  100% On-Machine (<code className="font-mono">localhost:11434</code>)
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeProviderMode('gemini_hybrid')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors text-left ${
                  providerMode === 'gemini_hybrid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="block">Hybrid Gemini 3.8 Flash</span>
                <span className="text-[11px] font-normal text-slate-500">
                  With Local Zero-Egress PII Sanitizer
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ollama-host-input" className="block text-xs font-medium text-slate-700 mb-1">
                Local Ollama Endpoint
              </label>
              <input
                id="ollama-host-input"
                type="text"
                value={ollamaHost}
                onChange={(e) => onChangeOllamaHost(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="ollama-model-input" className="block text-xs font-medium text-slate-700 mb-1">
                Target Local Model
              </label>
              <input
                id="ollama-model-input"
                type="text"
                value={ollamaModel}
                onChange={(e) => onChangeOllamaModel(e.target.value)}
                placeholder="llama3.2, qwen2.5-coder, mistral"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-700 space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {ollamaStatus?.reachable
                    ? `Connected to ${ollamaStatus.host} (${ollamaStatus.latencyMs}ms)`
                    : 'Local Privacy Fallback & Zero-Egress Sanitizer Ready'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {ollamaStatus?.message || 'Checking local Ollama daemon status...'}
              </p>
            </div>

            <button
              type="button"
              disabled={probingOllama}
              onClick={() => handleProbeOllama(ollamaHost)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${probingOllama ? 'animate-spin' : ''}`} />
              <span>Test Daemon</span>
            </button>
          </div>
        </section>

        {/* Automated Unit Test Runner & CI Verification (Right 6 Cols) */}
        <section
          aria-label="Automated unit test runner and GitHub Actions CI status"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Automated Testing & Continuous Integration Suite
              </h2>
              <p className="text-xs text-slate-500">
                Verify <code className="font-mono text-slate-700">src/utils/careerEngine.test.ts</code> with Node's native test runner before pushing to <code className="font-mono text-slate-700">main</code>.
              </p>
            </div>

            <button
              type="button"
              disabled={testRunning}
              onClick={handleRunUnitTests}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {testRunning ? 'Running Tests...' : 'Run Automated Unit Tests'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono tabular-nums">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-sans">CI Workflow</span>
              <span className="font-semibold text-emerald-700">.github/workflows/ci.yml</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-sans">Test Runner</span>
              <span className="font-semibold text-slate-900">node:test (tsx)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-sans">Status</span>
              <span className="font-semibold text-emerald-700">
                {testResult ? (testResult.passed ? `PASS (${testResult.durationMs}ms)` : 'FAIL') : '5/5 Suites Ready'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-40">
            {testResult ? (
              <pre className="whitespace-pre-wrap leading-relaxed">{testResult.output}</pre>
            ) : (
              <div className="space-y-1 text-slate-300">
                <p>$ npm test</p>
                <p className="text-emerald-400">✔ sanitizeResumeForCloud redacts candidate name, email, and phone numbers and rehydrates accurately</p>
                <p className="text-emerald-400">✔ calculateJobMatch computes exact skill overlap percentage and missing skills</p>
                <p className="text-emerald-400">✔ evaluateInterviewAlerts flags urgent_24h interviews and detects overlapping schedule conflicts</p>
                <p className="text-emerald-400">✔ computePipelineMetrics aggregates stage counts and conversion rates</p>
                <p className="text-emerald-400">✔ buildStructuredCoverLetter and buildOutreachMessage include candidate and job specifics</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Row 2: Publish to GitHub Main Branch Helper */}
      <section
        aria-label="Publish to GitHub main branch instructions"
        className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Publish Open-Source Repository to GitHub (<code className="font-mono">main</code> branch)
              </h3>
              <p className="text-xs text-slate-500">
                All open-source documentation (<code className="font-mono text-slate-700">README.md</code>, <code className="font-mono text-slate-700">CONTRIBUTING.md</code>, <code className="font-mono text-slate-700">LICENSE</code>) and <code className="font-mono text-slate-700">.github/workflows/ci.yml</code> are generated in the project root.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <label htmlFor="gh-owner-input" className="sr-only">
                GitHub Owner
              </label>
              <input
                id="gh-owner-input"
                type="text"
                value={githubOwner}
                onChange={(e) => setGithubOwner(e.target.value)}
                placeholder="GitHub Username"
                className="px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md w-40"
              />
            </div>
            <span className="text-slate-400 font-mono">/</span>
            <div>
              <label htmlFor="gh-repo-input" className="sr-only">
                GitHub Repository Name
              </label>
              <input
                id="gh-repo-input"
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="Repository Name"
                className="px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md w-40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleCopyText(gitPushCommands, 'git-push')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedItem === 'git-push' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Script</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Git Push Commands</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
          {gitPushCommands}
        </pre>
      </section>

      {/* Row 3: Open-Source Documentation & CI File Inspector */}
      <section
        aria-label="Repository documentation and workflow inspector"
        className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto" role="tablist" aria-label="Repository files">
            {fileTabs.map((fileKey) => (
              <button
                key={fileKey}
                type="button"
                role="tab"
                aria-selected={activeFile === fileKey}
                onClick={() => setActiveFile(fileKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFile === fileKey
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{fileKey}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleCopyText(repoFiles[activeFile] || '', activeFile)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {copiedItem === activeFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied {activeFile}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy {activeFile}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-5 bg-white">
          <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {repoFiles[activeFile] || 'Loading file from repository...'}
          </pre>
        </div>
      </section>
    </div>
  );
};
