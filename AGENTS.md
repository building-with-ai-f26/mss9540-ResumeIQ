# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** ResumeIQ compares a resume with a job description and returns strengths, missing evidence, and three improvements.
- **Primary user & core workflow:** NYU Stern MBA student recruiting for product management; upload PDF/.docx or paste resume text, paste a job description, and review advice. See `docs/index.html`.
- **Tech stack:** Python 3.8+ with pypdf for PDFs and standard-library DOCX extraction, plain HTML/CSS/JavaScript, server-side OpenRouter. No database. GitHub Pages showcase.

## 2. Commands
- **Install dependencies:** `python3 -m venv .venv` then `.venv/bin/python -m pip install -r requirements.txt`.
- **Run locally:** `.venv/bin/python server.py` → `http://127.0.0.1:8000`; stop with Ctrl+C.
- **Run deterministic tests:** `.venv/bin/python -m unittest discover -s tests -v`; `node --check app/app.js` (Node optional).
- **Analytics checks:** `node tests/test_app.js` (mocked browser/HTTP) and `node tests/test_analytics.js` (mocked SDK only); `node --check docs/assets/analytics.js`.
- **Run model evals:** Not implemented. Provider tests use mocks; live quality is unverified. Build 4 track undecided.

## 3. Non-Negotiable Engineering Rules
1. **Plan before coding:** Before touching multiple files, propose a brief plan and wait for approval.
2. **Small batches:** Make small, focused changes that can be reviewed and explained by a human in a single Pull Request.
3. **Explainability:** Avoid unnecessary abstractions or dependencies. Help the human builder understand the main components, what changed, why it matters, what could break, and how it was checked.
4. **Verify changes:** Run relevant checks. For a reproducible logic bug, use a failing test to demonstrate the fix when practical. Record manual checks and known limitations; follow the selected Build 4 evaluation track.
5. **Zero secrets in code:** Never hardcode API keys, tokens, or credentials. Always read from environment variables (`.env`) and update `.env.example` when new variables are needed.
6. **Stop when looping:** If a fix fails twice in a row, stop, summarize what failed, and ask the human before trying a third approach.

## Build 1 boundaries
- Load credentials privately from `.env` or environment variables; restart after changes.
- Keep explicit asset routes; never serve the repository root or `.env`.
- Never silently replace an AI failure with non-AI results. Render output with textContent.
- Keep resume content and credentials out of logs and screenshots. Use fictional screenshot inputs.
- Record only actual checks, hours, costs, and feedback; distinguish mocks from live model tests.
- Do not commit or push until the builder reviews and authorizes it.

## Project structure and Build 2 analytics
- `server.py`: local server and OpenRouter requests; `resume_files.py`: in-memory document extraction.
- `app/`: local HTML/CSS/JS. `docs/index.html`: GitHub Pages Product Page.
- `docs/assets/posthog-config.js`: public PostHog project token and ingestion host, shared by both pages. This browser project token is intentionally public; never use a personal API key or OpenRouter key here. Private credentials still belong only in `.env`.
- `docs/assets/analytics.js`: pageviews, predefined click events, and masked session replay. Served locally through two explicit asset routes, never by exposing the repository root.
- `tests/`: deterministic Python tests and mocked JavaScript analytics checks. `Plan.md` and the Product Page record verification limits.
- Keep resume/job inputs, file selection, dynamic status, and generated output blocked from replay. Never send document content, filenames, raw errors, or credentials as event properties. Keep network body/header capture off.
- Enable session recording in PostHog project settings and verify pageviews, clicks, and masked replay using fictional inputs. Mocked tests do not establish live ingestion.

## Optional LinkedIn comparison
- Users may upload a profile PDF or paste profile text (20,000 characters maximum). No URL fetching, LinkedIn OAuth, or third-party profile provider.
- Reuse `/api/extract`; never save uploads. AI sends profile text separately as untrusted data and validates an optional `linkedin_opportunities` array. Non-AI mode does not compare LinkedIn.
- Keep LinkedIn inputs, upload status, and results blocked from PostHog replay; never put their contents in events or logs. Live LinkedIn comparison quality remains unverified.
