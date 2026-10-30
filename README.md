# CareerVault AI — Local-First Job Search & Cover Letter Studio

[![CI Pipeline](https://img.shields.io/badge/CI-GitHub_Actions-16a34a?style=flat-square)](./.github/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f172a?style=flat-square)](./LICENSE)
[![Stack: React 19 + TypeScript + Ollama + Gemini](https://img.shields.io/badge/Stack-React_19_%7C_Ollama_%7C_Gemini-2563eb?style=flat-square)](#architecture)

**CareerVault AI** is an open-source, privacy-first career search workbench built with **React 19**, **TypeScript**, **Express**, **Local LLMs via Ollama**, and **Google Gemini (`@google/genai`)**. It summarizes job descriptions, calculates deterministic skill alignment, drafts tailored cover letters and personalized outreach messages, automates application pipeline tracking, and triggers real-time interview scheduling alerts with conflict detection.

---

## Why Local-First Architecture?

Resumes, compensation history, contact details, and unlisted portfolio links contain highly sensitive Personal Identifiable Information (PII). CareerVault AI is architected around two privacy guarantees:

1. **100% Offline Local Inference via Ollama (`http://localhost:11434`)**: Run `llama3.2`, `qwen2.5-coder`, or `mistral` directly on your workstation so zero bytes of resume data leave `127.0.0.1`.
2. **Zero-Egress PII Sanitizer in Hybrid Gemini Mode**: When using Google Gemini (`gemini-3.8-flash`) for high-speed structured extraction or drafting, the local sanitizer (`sanitizeResumeForCloud`) automatically strips your full name, email address, and phone number into cryptographic placeholders (`[CANDIDATE_NAME]`, `[CANDIDATE_EMAIL]`, `[CANDIDATE_PHONE]`) before the request leaves your machine, and rehydrates them locally (`rehydrateSanitizedText`) upon completion.

---

## Quick Setup Guide

### Prerequisites

- **Node.js** `>= 22.0.0` and `npm`
- **Ollama** (optional, recommended for 100% local offline inference): [Download Ollama](https://ollama.com)
- **Gemini API Key** (optional, for hybrid cloud summarization & structured JSON generation)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/careervault-ai.git
cd careervault-ai
npm install
```

### 2. Configure Local Ollama (Privacy-First Default)

Pull a local model and start the Ollama daemon:

```bash
ollama pull llama3.2
ollama serve
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` if you want to customize the local Ollama endpoint or enable hybrid Gemini support:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
OLLAMA_HOST="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.2"
```

### 4. Start the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Automated Testing & Quality Assurance

All core career engine logic—including PII redaction/rehydration, deterministic skill matching, pipeline funnel metrics, cover letter assembly, and interview conflict detection—is decoupled in `src/utils/careerEngine.ts` and verified with Node's native test runner.

```bash
# Run unit tests
npm test

# Run TypeScript type checking
npm run lint

# Build production bundle
npm run build
```

---

## Contribution Policy

We welcome contributions from engineers, career coaches, and privacy advocates! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a Pull Request.

1. **Fork & Branch**: Create a feature branch from `main` (`git checkout -b feat/your-feature`).
2. **Zero-Egress Privacy Standard**: Any new AI prompt or external adapter **must** pass candidate data through `sanitizeResumeForCloud()` when operating outside `127.0.0.1`.
3. **Unit Tests Required**: Every new utility or scoring rule in `src/utils/` must include deterministic unit tests in `src/utils/*.test.ts`.
4. **CI Gate**: All pull requests must pass the `.github/workflows/ci.yml` pipeline (linting, unit tests, and production build) before merge.

---

## Publishing to Your GitHub Repository

To push this workspace directly to your GitHub `main` branch:

```bash
git init
git branch -M main
git add .
git commit -m "feat: initial release of CareerVault AI local-first job search & cover letter studio"
git remote add origin https://github.com/YOUR_USERNAME/careervault-ai.git
git push -u origin main
```

---

## License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for full details.
