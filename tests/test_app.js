// UI logic checks using fictional data and mocked HTTP responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = {};
const element = id => elements[id] ||= {
  addEventListener() {}, dataset: {}, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, checkValidity: () => true, value: '', hidden: false, disabled: false, textContent: '', files: [],
  replaceChildren(...children) { this.children = children; }
};
let response = {};
let request;
const context = {
  document: {getElementById: element, createElement: () => ({textContent: ''})},
  fetch: async (url, options) => {
    if (url === '/api/status') return {json: async () => ({ai_configured: false})};
    request = {url, options};
    return {ok: true, json: async () => response};
  }
};
vm.runInNewContext(fs.readFileSync('app/app.js', 'utf8'), context);
async function main() {
  element('sample').onclick();
  assert.ok(element('linkedin-text').value.includes('FICTIONAL DEMO'));
  assert.equal(element('resume-editor').open, true);
  element('mode').value = 'ai';
  const text = '<img src=x onerror=alert(1)> fictional evidence';
  response = {label: 'Mocked AI', result: {strengths: ['Evidence'], missing_evidence: ['Gap'], improvements: ['1', '2', '3'], linkedin_opportunities: [text]}};
  await element('review-form').onsubmit({preventDefault() {}});
  assert.ok(JSON.parse(request.options.body).linkedin_text.includes('competitive analysis'));
  assert.equal(element('linkedin-results').hidden, false);
  assert.equal(element('linkedin-opportunities').children[0].textContent, text);
  assert.equal(element('linkedin-text').disabled, false);
  assert.equal(element('review-form').attributes['aria-busy'], 'false');
  assert.equal(element('status').dataset.state, 'success');
  assert.equal(element('analyze').textContent, 'Analyze my resume');
  response.result.linkedin_opportunities = [];
  await element('review-form').onsubmit({preventDefault() {}});
  assert.ok(element('linkedin-opportunities').children[0].textContent.startsWith('No additional'));
  delete response.result.linkedin_opportunities;
  element('mode').value = 'local';
  await element('review-form').onsubmit({preventDefault() {}});
  assert.equal(element('linkedin-results').hidden, true);
  assert.equal(element('linkedin-opportunities').children.length, 0);
  const resume = element('resume').value;
  element('linkedin-file').files = [{name: 'fictional-profile.pdf', size: 100}];
  response = {text: 'Fictional LinkedIn profile extracted from PDF'};
  await element('linkedin-file').onchange();
  assert.equal(element('linkedin-text').value, response.text);
  assert.equal(element('resume').value, resume);
  element('linkedin-file').files = [{name: 'unsupported.docx', size: 100}];
  await element('linkedin-file').onchange();
  assert.equal(element('linkedin-text').value, response.text);
  element('job-url').value = 'https://example.com/fictional-job';
  response = {text: 'Fictional imported PM role requiring SQL and research.'};
  await element('load-job').onclick();
  assert.equal(request.url, '/api/job-description');
  assert.equal(JSON.parse(request.options.body).url, element('job-url').value);
  assert.equal(element('job').value, response.text);
  const imported = element('job').value;
  context.fetch = async () => { throw new Error('Mock site blocked import'); };
  await element('load-job').onclick();
  assert.equal(element('job').value, imported);
  assert.ok(element('job-link-status').textContent.includes('previous job description has been kept'));
  assert.equal(element('load-job').disabled, false);
  assert.equal(element('job-link-status').dataset.state, 'error');
  assert.equal(element('load-job').textContent, 'Import job');
  element('job-url').value = '';
  await element('load-job').onclick();
  assert.equal(element('job').value, imported);
  context.fetch = async () => { throw new Error('Mock upload failure'); };
  element('linkedin-file').files = [{name: 'fictional-profile.pdf', size: 100}];
  await element('linkedin-file').onchange();
  assert.equal(element('linkedin-text').value, 'Fictional LinkedIn profile extracted from PDF');
  assert.ok(element('linkedin-status').textContent.includes('previous text has been kept'));
  assert.equal(element('analyze').disabled, false);
  let finishReview;
  context.fetch = () => new Promise(resolve => { finishReview = resolve; });
  const reviewing = element('review-form').onsubmit({preventDefault() {}});
  assert.equal(element('review-form').attributes['aria-busy'], 'true');
  assert.equal(element('analyze').textContent, 'Analyzing…');
  assert.equal(element('status').dataset.state, 'loading');
  assert.equal(element('job-url').disabled, true);
  finishReview({ok: false, json: async () => ({error: 'Mock provider unavailable'})});
  await reviewing;
  assert.equal(element('status').dataset.state, 'error');
  assert.equal(element('results').hidden, true);
  assert.equal(element('review-form').attributes['aria-busy'], 'false');
  assert.equal(element('analyze').textContent, 'Analyze my resume');
  assert.equal(element('job-url').disabled, false);
  console.log('App UI checks passed: optional LinkedIn submission, safe rendering, empty/stale results, and upload isolation/error handling.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
