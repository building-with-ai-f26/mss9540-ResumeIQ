const $ = id => document.getElementById(id);
const inputControls = ['analyze', 'sample', 'resume-file', 'resume', 'linkedin-file', 'linkedin-text', 'job', 'mode'];
const setBusy = busy => { for (const id of inputControls) $(id).disabled = busy; };
async function uploadDocument(fileId, textId, statusId, pdfOnly = false) {
  const file = $(fileId).files[0];
  if (!file) return;
  const validExtension = pdfOnly ? /\.pdf$/i : /\.(pdf|docx)$/i;
  if (!validExtension.test(file.name) || !file.size || file.size > 5 * 1024 * 1024) {
    $(statusId).textContent = pdfOnly ? 'Choose a non-empty LinkedIn profile PDF up to 5 MB.' : 'Choose a non-empty PDF or Word .docx file up to 5 MB.';
    $(fileId).value = '';
    return;
  }
  $('results').hidden = true;
  setBusy(true);
  $(statusId).textContent = 'Reading your document…';
  try {
    const response = await fetch('/api/extract', {method: 'POST', headers: {'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name)}, body: file});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not read the document.');
    $(textId).value = data.text;
    $(statusId).textContent = 'Text extracted. Review and correct it below, then analyze. The uploaded file was not saved.';
  } catch (error) {
    $(statusId).textContent = error.message + ' Your previous text has been kept.';
  } finally {
    setBusy(false);
    $(fileId).value = '';
  }
}
$('resume-file').onchange = () => uploadDocument('resume-file', 'resume', 'upload-status');
$('linkedin-file').onchange = () => uploadDocument('linkedin-file', 'linkedin-text', 'linkedin-status', true);
$('sample').onclick = () => {
  $('resume').value = 'FICTIONAL DEMO — Alex Chen, NYU Stern MBA candidate.\nProduct analyst at ExampleCo, 2022–2025. Used SQL to analyze onboarding drop-off. Partnered with design and engineering to test a simpler signup flow, increasing activation from 40% to 47%. Interviewed 12 customers and presented findings to product leadership. Led weekly cross-functional project updates.';
  $('job').value = 'FICTIONAL DEMO — Associate Product Manager. Own product roadmap prioritization, define success metrics, and collaborate with engineering and design. Use SQL and customer research to identify opportunities. Experience with A/B testing, stakeholder communication, and competitive analysis preferred.';
  $('linkedin-text').value = 'FICTIONAL DEMO — Alex Chen. At ExampleCo, created a competitive analysis comparing onboarding at five competing products and presented findings to product leadership to inform roadmap prioritization.';
  $('linkedin-status').textContent = '';
  $('results').hidden = true;
  $('status').textContent = 'Fictional resume, job description, and optional LinkedIn text loaded. Choose a mode and analyze.';
};
fetch('/api/status').then(r => r.json()).then(data => {
  $('configuration').textContent = data.ai_configured ? 'API key is configured. Provider access is verified only when an analysis succeeds.' : 'AI setup needed: add a valid OPENROUTER_API_KEY to .env and restart. You can explicitly choose Non-AI keyword comparison now.';
}).catch(() => { $('configuration').textContent = 'Cannot reach the local server. Start it with python3 server.py.'; });
$('review-form').onsubmit = async event => {
  event.preventDefault();
  $('results').hidden = true;
  setBusy(true);
  $('status').textContent = 'Analyzing… AI requests may take up to 60 seconds.';
  try {
    const response = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resume:$('resume').value,job_description:$('job').value,mode:$('mode').value,linkedin_text:$('linkedin-text').value}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analysis failed. Try again.');
    for (const field of ['strengths','missing_evidence','improvements']) {
      $(field).replaceChildren(...data.result[field].map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
    }
    const opportunities = data.result.linkedin_opportunities;
    $('linkedin-results').hidden = !Array.isArray(opportunities);
    $('linkedin-opportunities').replaceChildren();
    if (Array.isArray(opportunities)) {
      const items = opportunities.length ? opportunities : ['No additional job-relevant LinkedIn evidence was identified beyond your resume.'];
      $('linkedin-opportunities').replaceChildren(...items.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
    }
    $('result-label').textContent = data.label;
    $('results').hidden = false;
    $('status').textContent = 'Analysis complete. Review your results below.';
  } catch (error) { $('status').textContent = error.message || 'Cannot reach the server. Check that it is running.'; }
  finally { setBusy(false); }
};
