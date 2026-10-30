# Contributing to CareerVault AI

Thank you for helping build an open-source, privacy-first career management platform! This document provides guidelines for onboarding, local development, testing, and submitting pull requests.

## Code of Conduct

We are committed to fostering an open, welcoming, and harassment-free community. Please treat all contributors, maintainers, and users with respect and constructive technical feedback.

## Development Workflow

1. **Fork the Repository** and clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/careervault-ai.git
   cd careervault-ai
   npm install
   ```
2. **Create a Feature Branch** from `main`:
   ```bash
   git checkout -b feat/short-description
   ```
3. **Run the Local Dev Server**:
   ```bash
   npm run dev
   ```

## Privacy & Security Requirements

CareerVault AI exists to protect candidate resume data. Every contribution must uphold these architectural invariants:

- **Local-First Priority**: Features must work seamlessly with local Ollama models (`http://127.0.0.1:11434`) and deterministic local fallbacks when offline.
- **Mandatory PII Redaction**: Never transmit unredacted candidate contact details (`fullName`, `email`, `phone`) to cloud endpoints unless explicitly opted in. Always use `sanitizeResumeForCloud` and `rehydrateSanitizedText` from `src/utils/careerEngine.ts`.
- **No Client-Side Secret Exposure**: All `@google/genai` SDK calls must remain strictly inside `server.ts`.

## Automated Testing Policy

Before submitting a Pull Request, verify that all checks pass locally:

```bash
# 1. Execute automated unit tests
npm test

# 2. Validate TypeScript types
npm run lint

# 3. Verify production Vite build
npm run build
```

When adding new business logic (e.g., ATS keyword scoring, ICS calendar export, or new interview alert rules), decouple the pure functions in `src/utils/` and add corresponding test assertions in `src/utils/careerEngine.test.ts`.

## Pull Request Checklist

- [ ] Code compiles cleanly with `npm run lint` and `npm run build`.
- [ ] Unit tests pass via `npm test` (`npx --yes tsx --test src/utils/careerEngine.test.ts`).
- [ ] UI components maintain WCAG AA contrast and keyboard accessibility (`aria-label` on icon buttons, semantic HTML elements).
- [ ] Documentation (`README.md` or inline comments) is updated if user-facing configuration changed.
