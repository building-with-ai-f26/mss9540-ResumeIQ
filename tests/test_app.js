// UI logic checks using fictional data and mocked HTTP responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = {};
const element = id => elements[id] ||= {
  value: '', hidden: false, disabled: false, textContent: '', files: [],
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
  element('mode').value = 'ai';
  const text = '<img src=x onerror=alert(1)> fictional evidence';
  response = {label: 'Mocked AI', result: {strengths: ['Evidence'], missing_evidence: ['Gap'], improvements: ['1', '2', '3'], linkedin_opportunities: [text]}};
  await element('review-form').onsubmit({preventDefault() {}});
  assert.ok(JSON.parse(request.options.body).linkedin_text.includes('competitive analysis'));
  assert.equal(element('linkedin-results').hidden, false);
  assert.equal(element('linkedin-opportunities').children[0].textContent, text);
  assert.equal(element('linkedin-text').disabled, false);
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
  context.fetch = async () => { throw new Error('Mock upload failure'); };
  element('linkedin-file').files = [{name: 'fictional-profile.pdf', size: 100}];
  await element('linkedin-file').onchange();
  assert.equal(element('linkedin-text').value, response.text);
  assert.ok(element('linkedin-status').textContent.includes('previous text has been kept'));
  assert.equal(element('analyze').disabled, false);
  console.log('App UI checks passed: optional LinkedIn submission, safe rendering, empty/stale results, and upload isolation/error handling.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
