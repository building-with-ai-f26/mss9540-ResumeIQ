# ResumeIQ — Plan

Build 1 scope approved: local paste-and-review app, server-side OpenRouter first, explicit non-AI fallback, PRD, real screenshot, honest log, and documentation. No commit or push before review.

## Architecture

- `server.py`: Python 3.8+ HTTP server; loads environment, serves explicit UI routes, validates input, calls OpenRouter, validates result shape. Binds to 127.0.0.1 only.
- `app/`: plain HTML/CSS/JavaScript. Output uses textContent.
- `docs/`: static Product Page and actual screenshot for GitHub Pages.
- One PDF library (pypdf); standard-library DOCX parsing; no database, login, or saved resume history. Build 2 adds optional PostHog analytics on both pages.
- Default model: `openai/gpt-4o-mini`, overridable with `OPENROUTER_MODEL`. The builder’s November 12 fictional-example review succeeded, as captured in `docs/assets/ai-review.png`. Systematic model quality remains unverified.

## Risk and verification

Main risk: misleading or invented advice. The prompt asks for grounded evidence and forbids invented metrics. Schema checks verify structure and exactly three improvements, not factual correctness.

Completed: ten deterministic tests and JavaScript syntax checks rerun November 12. Earlier browser checks covered the non-AI workflow, private-file/invalid-input HTTP routes, and mobile width. The builder supplied a screenshot of a successful live AI review on November 12; the Product Page now includes that actual output alongside the earlier non-AI screenshot.

Pending: systematic model quality checks; outside target-user review; public Pages deployment verification. Build 4 track undecided: choose Track A domain evals or Track B user replays using `tests/README.md` later.

## Costs and time

Coding-agent subscription: approximately $20/month (builder estimate), shared with other uses; ResumeIQ’s portion has not been measured. OpenRouter: $5 in prepaid credits purchased (builder-reported). Estimated runtime API cost: $0.0003–$0.0007 per short fictional-example GPT-4o mini review, excluding credit-purchase fees. This is an estimate; actual API usage charges and cumulative project costs have not been reported. Builder time: approximately 3 hours (previously reported estimate). Pricing and billing links are in the Product Page build log.

## Next steps

1. Review the captured successful AI output; add experience or metrics only when supported by actual evidence.
2. Check grounded strengths, relevant gaps, and three truthful actionable edits.
3. Record actual API usage charges and any revised hours or expenses when available; collect outside feedback before claiming user outcomes.
4. Review changes, then separately authorize commit/push. Publish Pages from `main` → `/docs`.
5. Build 2: test output quality and plan analytics. Never include resume content in analytics.

## Approved upload extension

PDF and .docx upload → `/api/extract` → editable resume text → existing analysis workflow. Files stay in memory. Limits: 5 MB, 20 PDF pages, 20,000 extracted characters. Errors preserve existing text. No OCR or legacy .doc support. Use a virtual environment and `requirements.txt`; see README. Ten tests passed, including PDF/DOCX extraction and upload-to-analysis HTTP checks. Complex document reading order and real-user documents still need manual review.

## Build 2 analytics update · November 14, 2026

Implemented a shared, optional PostHog setup for the Product Page and local app. The public configuration is blank pending the builder's project token and ingestion host. Two explicit local asset routes serve only the shared scripts. Tracking includes pageviews and predefined click actions, with a surface property to separate the two pages. Replay is enabled in client configuration but also requires the project's recording setting.

Privacy: document inputs, file selection, results, and dynamic status are blocked from replay; all inputs are masked. Custom events contain only predefined action names. Network payload/header, performance, exception, and console recording are disabled. No paid API call is needed for analytics verification.

Verification: mocked JavaScript SDK checks passed for both surfaces, JavaScript syntax and Git whitespace checks passed. Live ingestion and actual replay masking remain pending project configuration and dashboard inspection. No new spending, builder hours, or user feedback has been reported for this update. Do not claim this completes PRD v2 or the two-day Build 2 commit requirement.

## Optional LinkedIn evidence extension

Builder-approved: add a profile PDF upload and editable text field, without profile URL retrieval. Reuse in-memory PDF extraction, preserve the resume and job-description requirements, and send optional LinkedIn text separately in AI mode. Validate a new `linkedin_opportunities` array (0–5 non-empty strings) only when profile text is supplied. Keep exactly three improvements and the original resume-only response shape. Non-AI results explicitly state that LinkedIn comparison requires AI.

The prompt requests short LinkedIn evidence, relevance to the job, and experience absent from the resume. Schema checks do not verify factual accuracy or semantic duplication. All 15 Python tests passed, including mocked LinkedIn requests, PDF-to-mocked-analysis, invalid input, empty opportunities, and the existing resume-only workflow. Node checks exercise UI behavior and analytics privacy settings. No new live model request, costs, hours, or outside feedback is claimed. Existing cost estimates cover the original short example; additional profile text increases input usage.

## PostHog configuration · November 15, 2026

The builder supplied the browser project token and `https://us.i.posthog.com` ingestion host. Both are now in the shared public configuration. No personal API key or OpenRouter credential is exposed by this change. A live Chrome check loaded the SDK on the local app and reported capture was not opted out, but recording was inactive. Dashboard verification and publication of the current Product Page changes remain pending. Enable project session recording before verifying replay.

## PostHog delivery diagnosis · November 15, 2026

The existing app process on port 8000 served the updated HTML but returned 404 for `/analytics.js` and `/posthog-config.js`, indicating that the server needed restarting to load the new asset routes. A temporary server running current code loaded PostHog on both the local app and Product Page preview. Session recording was active. With PostHog's bot filter overridden only inside the temporary automated test browser, labeled test events and replay requests both received HTTP 200 responses (`/i/v0/e/` and `/s/`). The production bot-filter setting was unchanged. These are delivery checks, not outside-user evidence or confirmation of dashboard rendering and replay privacy. Normal-server restart, dashboard inspection, and public-page deployment remain pending.

## Local app refinement · November 16, 2026

Builder-approved optional job-link import fills the existing editable job-description box. A new standard-library module checks public addresses and redirects, pins connections to vetted IPs, verifies HTTPS hostname certificates, and limits response bytes, redirects, and read duration. Structured JobPosting descriptions are preferred, with visible HTML/plain-text extraction as fallback. Import failures preserve the existing job text. URLs/status are blocked from replay and excluded from custom event properties. Twenty-four Python tests and mocked JavaScript UI/privacy checks passed. Live compatibility with individual job sites is not established by mocked tests.

Design refinements requested by the builder: remove the headline eyebrow, use upright Helvetica-style headings, replace the resume-card subtitle with direct instructions, and vary the palette with purple actions, neutral backgrounds, and small amber/blue accents. Existing Product Page screenshots predate these visual changes. No new model call, spending, hours, or outside-user feedback is claimed.

## Approved workspace redesign · November 16, 2026

Replaced the oversized hero, decorative step indicators, gradients, rounded card styling, and marketing copy with a functional workspace. The existing logo sits in a minimal sidebar with only a working Workspace link. Colors follow the builder's specified palette: purple #58129B, text #262132, background #F8F7F5, borders #E8E4EC, white panels. The new stylesheet replaces accumulated overrides with organized component rules and responsive breakpoints. Inputs retain their IDs and analytics exclusions. Uploads, job-link import, optional LinkedIn input, request payloads, and result validation retain their behavior. Inline state styles, loading button labels, aria-busy, field errors, labeled controls, a skip link, and reduced-motion support improve usability. No export, saved resumes, or application tracker was added.

Verified: all 24 Python tests passed; JavaScript UI and analytics checks, syntax, and whitespace checks passed. Actual Chrome checks at 1440, 1280, 390, and 320 pixels confirmed no horizontal overflow and a working fictional non-AI review with exactly three improvements. Both main text inputs are above the fold at desktop/laptop sizes. Actual fictional PDF/DOCX resume uploads, LinkedIn PDF extraction, blocked-link error with preserved job text, and skip-link focus passed. Desktop/mobile empty and non-AI results captures were visually inspected. AI rendering and privacy settings were checked with mocks; no new live model-quality check, paid AI request, assistive-technology audit, or measured user outcome is claimed. Screenshots on the Product Page predate this redesign. No new hours or costs have been supplied.

## Reference-layout refinement

Builder-approved follow-up: use a narrower, stacked editor matching the supplied reference, with the existing functional sidebar. The resume upload is prominent above Target role; paste/edit text is in an accessible disclosure that opens on upload, sample loading, or invalid-field validation. Existing job text/URL import and collapsed optional LinkedIn inputs remain available. The purple Analyze my resume button spans the editor width. No nonfunctional navigation or unbuilt features were added.

## Saved resumes extension

Builder-approved: a real Saved resumes navigation view with explicit save, open, rename, and confirmed deletion. Only resume text/name and local record metadata are saved in browser local storage, capped at 20 records; no backend database, autosave, job/profile storage, or original-file storage. Opening a different resume confirms before replacing the current text and preserves the target role and LinkedIn text. Blocked, full, or corrupted storage fails visibly. The new library and dialogs are excluded from PostHog replay and no custom library-content events are emitted. Privacy copy now distinguishes optional browser-local saves from server processing. This feature needs the explicit new `/resumes.js` asset route and a local server restart. No costs, hours, or outside-user feedback are inferred.

Saved-resume verification: all 24 Python tests passed. JavaScript library tests cover explicit saving, persistence across reinitialization, safe rendering of names, rename, replace confirmation, delete/cancel, blocked/quota/corrupt storage, and limits. Actual isolated-profile Chrome checks verified save → page reload → rename → open with replacement confirmation → delete, while preserving target-role text. Desktop/mobile library captures were visually inspected; existing uploads and non-AI analysis still passed at 1440, 1280, 390, and 320 pixels. No paid AI request was made.
