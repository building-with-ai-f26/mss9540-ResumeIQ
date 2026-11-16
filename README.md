# ResumeIQ

**Apply Easier.** Optimize your experience for every role without the hassle.

Applying to jobs has never been more stressful. Each job needing a personally tailored resume, it can take up a lot more time than you might have! ResumeIQ is here to help. It ensures your resume accurately reflects your experience for every job. Upload a PDF or Word `.docx` resume, or paste text, then add a specific job description to review strengths, missing evidence, and three suggested improvements. The primary user for PRD v1 is an NYU Stern MBA student recruiting. 

 [PRD and build log](docs/index.html).

**Repository status:** The builder successfully generated a live AI review using the fictional example. T Public deployment remains unverified.

## Run locally

Python 3.8+ is required. In Terminal, install PDF support into a project virtual environment:

```bash
cd /Users/meherseera/Desktop/mss9540-projectTBD
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python server.py
```

Open http://127.0.0.1:8000 . Stop with Ctrl+C. If port 8000 is occupied, check whether ResumeIQ is already running in another terminal.

## Current interface

The local prototype uses a purple and lavender palette, a large “Apply Easier.” headline, soft background gradients, and two numbered input cards:

- **Your experience:** upload a PDF or Word document, or paste resume text. Extracted text appears in an editable preview.
- **Your next opportunity:** paste the specific job description.

Choose a review mode below the cards, then click **Analyze my resume**. Results appear in separate cards for **Strengths**, **Missing evidence**, and **Three next moves**. On smaller screens, the cards stack vertically.

The redesign changes presentation; the upload and analysis workflow is unchanged. Refresh the browser to load updated HTML and styling. The public Product Page at `docs/index.html` is a separate showcase with its own layout.

### Enable AI

The builder has configured OpenRouter and successfully generated a live review. For a new setup, edit `.env` privately in your editor. Do not paste credentials into chat, screenshots, browser code, or terminal output. If the file does not exist, copy `.env.example` to `.env`; never overwrite a real key with the example.

Set `OPENROUTER_API_KEY` to your actual key. Optionally set `OPENROUTER_MODEL` (default `openai/gpt-4o-mini`). Restart the server. Exported shell variables take precedence over `.env`.

Choose **AI analysis · OpenRouter**, load the fictional example, and analyze. A successful response is the actual connection check. The configuration indicator only checks for a non-placeholder key; credits, model availability, and networking may still prevent a review. Errors are displayed without silently substituting non-AI output.

AI mode sends the resume, job description, and any supplied LinkedIn text from the Python server to OpenRouter and its model provider. Remove personal details. This app has no database and does not save or log inputs; provider retention policies still apply. Credentials never go to the browser. The server is for local development only.

### Non-AI demo

Choose **Non-AI keyword comparison**, load the fictional example, and analyze. Literal shared/absent keywords and three generic prompts appear. This cannot interpret synonyms, assess qualifications, or establish resume quality. It calls no external API.

## PostHog analytics (Build 2)

Both the Product Page and local app use `docs/assets/analytics.js` and `docs/assets/posthog-config.js`. Analytics stays off while the configuration is blank. The builder supplied the public project token and US ingestion host on November 15. These are configured locally; the Product Page needs publishing before its public version uses them. Live dashboard verification remains pending.

1. Create or select your PostHog project. Copy its **public project token** (usually `phc_...`) and ingestion host from Web setup into `docs/assets/posthog-config.js`. Supported hosts are `https://us.i.posthog.com` and `https://eu.i.posthog.com`. The project token is intended for browser use; never use a personal API key or OpenRouter credential.
2. Enable **Record user sessions** in the project's session replay settings. Keep network payload/header and console recording disabled. For a fictional verification session, use 100% sampling and no restrictive URL/event triggers or minimum-duration filter; revisit these settings after verification.
3. Restart the local server after updating `server.py`, then refresh the local app. Publish the reviewed files to verify the Product Page on GitHub Pages. Local changes alone do not update the public page.
4. On each surface, stay for at least 20 seconds, scroll, and click a tracked control. In the app, load the fictional example and analyze; a non-AI run is sufficient to verify analytics without additional inference spending.
5. In PostHog, find `$pageview` and `ui_clicked`, filtered by `surface` (`product_page` or `local_app`). Click properties contain only a predefined `action`: `load_example`, `analyze_resume`, `choose_file`, `see_prototype`, `read_prd`, or `read_build_log`.
6. Play each recording. Confirm scrolling and clicks are visible while document inputs, selected files, dynamic status, and generated results are blocked. Check event properties for accidental document content. Use fictional data throughout; record screenshots and verification outcomes only after seeing actual events and replay.

Autocapture is disabled in favor of explicit click events. Replay blocks sensitive app elements and masks all inputs; network bodies/headers, performance capture, exception capture, and console recording are disabled in the client configuration. The SDK still collects standard browser/session metadata and uses browser storage; the page and app disclose analytics. An unavailable or blocked SDK does not prevent the app from running. Ad blockers may prevent delivery.

Checks: `node tests/test_analytics.js` uses a mocked SDK to verify pageview/click behavior, disabled configuration, and privacy settings. Python HTTP tests check the explicit analytics routes and rejected private-file paths. These checks do not establish live PostHog ingestion or actual replay masking; dashboard verification is still required.

References: [PostHog JavaScript installation](https://posthog.com/docs/libraries/js), [replay privacy controls](https://posthog.com/docs/session-replay/privacy), and [network capture controls](https://posthog.com/docs/session-replay/network-recording).

## Upload a resume

Choose a text-based PDF or Word `.docx` file, up to 5 MB (PDFs: 20 pages maximum). The local server extracts text in memory and fills the resume text box. Review and correct it before clicking Analyze. You can also paste text directly. Failed uploads preserve your existing text.

Scanned/image-only PDFs need OCR first. Password-protected PDFs and older `.doc` files are not supported; save as `.docx` or paste text. Complex layouts may extract in a different order. Word extraction covers body paragraphs and tables; headers, footers, and text boxes may need manual correction. Uploaded files are not saved or sent to OpenRouter; only the reviewed text is sent when you choose AI analysis.

After initial installation, start with `.venv/bin/python server.py`. Restart any previously running server to load the new upload endpoint.

Upload verification: ten automated tests passed, including real generated PDF/DOCX extraction, DOCX tables, invalid/encrypted/empty-text/oversized document rejection, and HTTP upload-to-non-AI-analysis for both formats. Tests use fictional generated documents, not user resumes. Try your own PDF and Word document and inspect the extracted text before the demo.

## Optional LinkedIn experience

Expand **Additional experience from LinkedIn · optional** beneath the two input cards. Upload a text-based LinkedIn profile PDF (5 MB, 20 pages maximum) or paste your About, Experience, and project text. Review the editable preview before analyzing; clear it to leave LinkedIn out. The app does not visit LinkedIn or retrieve profiles from URLs. Existing PDF extraction limits apply; profile text is limited to 20,000 characters.

In AI mode, the supplied profile text is sent with the resume and job description to OpenRouter. An additional result section asks for job-relevant LinkedIn evidence missing from the resume, with short supporting quotes and suggested truthful additions. It can report no additional evidence. Profile claims are user-supplied and not independently verified; review the comparison before making edits. Non-AI mode compares only the resume and job description and clearly labels LinkedIn comparison as requiring AI.

**Load fictional example** now also fills an optional fictional LinkedIn example with competitive-analysis experience. The existing November 12 screenshot predates this feature. New LinkedIn comparison behavior is tested with mocked provider responses, not a fresh live model-quality evaluation. Added profile text increases token usage; the earlier per-review cost estimate covers the short original example, not every LinkedIn-assisted review.

The profile PDF is extracted in memory through the existing endpoint. No documents are saved or logged. PostHog blocks the LinkedIn text, file input, upload status, and all results from replay. Custom events contain no profile content. Checks: `node tests/test_app.js`, `node tests/test_analytics.js`, and the Python suite cover the optional input, output validation, safe rendering, upload errors, and backward compatibility. Restart the server and refresh the browser to load this update.

## Your two-minute demo and manual checks

1. Explain the primary user: a Stern MBA student tailoring a resume to a PM opening.
2. Load the fictional example, choose a mode, and analyze. State the mode honestly; use AI only after a successful live check.
3. Point out strengths, missing evidence, and exactly three improvements. Explain the edit you would make.
4. Try a blank field: the browser should prevent submission. Without a valid key, AI mode should show a setup error.
5. In AI mode, verify strengths cite real resume evidence, gaps reflect the job, and all three suggestions are actionable without invented facts. Try unrelated documents and documents with embedded instructions. These model quality checks are still pending.
6. Resize to phone width and navigate with the keyboard. Invite a reachable Stern student and record feedback only afterward.

## Checks completed

```bash
.venv/bin/python -m unittest discover -s tests -v
node --check app/app.js
```

All ten existing tests passed again on November 12: five review tests and five upload tests. Node is optional for the syntax check. Provider tests use simulated responses; these do not establish live AI quality.

After the redesign, headless Chrome verified the fictional-sample non-AI workflow and three suggestions, a 390px layout without horizontal overflow, 400 for invalid input, and 404 for private-file routes. A temporary desktop screenshot of the redesign was captured and visually inspected. JavaScript syntax and Git whitespace checks passed.

`docs/assets/prototype.png` is a fresh browser capture of the purple redesign, including the PDF/Word upload area and result cards. It uses fictional sample inputs in explicitly selected non-AI mode. The screenshot was visually inspected and its Product Page caption identifies the mode.

On November 12, the builder supplied `docs/assets/ai-review.png`, a screenshot of a successful live OpenRouter response labeled `openai/gpt-4o-mini`, with strengths, missing evidence, and three next moves for the fictional example. This demonstrates connectivity, while systematic model quality, target-user usefulness, assistive technology, and public deployment remain unverified. Build 4 evaluation track is undecided. See [Plan.md](Plan.md).

## Costs and time

The builder estimates the coding-agent subscription at approximately $20/month, shared with other uses; ResumeIQ’s portion has not been measured. The builder reports purchasing $5 in prepaid OpenRouter credits. Estimated runtime API cost is $0.0003–$0.0007 per short fictional-example review using GPT-4o mini, excluding credit-purchase fees. This is an estimate, not a measured usage charge; actual usage charges and cumulative project costs remain unreported. Builder time is approximately 3 hours (previously reported estimate). See the [Product Page cost entry](docs/index.html#build-log) for pricing and billing links.

## Publish after review

The current screenshot and documentation changes require builder review and authorization before committing or pushing. When ready, stage only reviewed files, confirm `.env` is ignored (`git check-ignore .env`) and absent from staged changes, then commit and push approved changes to `main`.

On GitHub:

1. Ensure the repository is public for the assignment.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose **main**, **/docs**, then **Save**.
5. Wait for deployment; follow GitHub’s published-site link. Verify the PRD, log, and screenshot in a private browser window.

Expected address for this repository: https://building-with-ai-f26.github.io/mss9540-projectTBD/ . Publication has not been verified. GitHub Pages hosts the showcase, not the local Python app.

Reference: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Submit the published Product Page and [repository URL](https://github.com/building-with-ai-f26/mss9540-projectTBD) in Icerynk. The class template requires meaningful commits on two separate days outside class; do not invent or backdate history.

## Main files

- `server.py`: server, environment configuration, OpenRouter, validation, keyword fallback.
- `resume_files.py`: in-memory PDF and Word text extraction; `requirements.txt`: pinned PDF dependency.
- `app/`: browser interface.
- `tests/test_server.py`: deterministic behavior and simulated provider tests.
- `tests/test_uploads.py`: document extraction and HTTP upload-to-analysis checks.
- `docs/index.html`, `docs/assets/prototype.png`, `docs/assets/ai-review.png`: PRD, build log, non-AI interface capture, and successful live AI review screenshot.
- `AGENTS.md`, `Intent.md`, `Plan.md`: rules, intent, architecture and risks.

API reference: [OpenRouter chat completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request).
