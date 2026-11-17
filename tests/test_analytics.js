// Mocked SDK checks: no live requests and no claim of verified PostHog ingestion.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('docs/assets/analytics.js', 'utf8');

function boot(config, surface) {
  const scripts = [], captures = [], listeners = {};
  let options;
  const sdk = {
    register: properties => captures.push(['register', properties]),
    capture: (...args) => captures.push(args),
    init: (token, settings) => { options = settings; settings.loaded(sdk); }
  };
  const document = {
    body: {dataset: {analyticsSurface: surface}},
    createElement: () => ({}),
    head: {appendChild: script => scripts.push(script)},
    addEventListener: (name, listener) => { listeners[name] = listener; }
  };
  vm.runInNewContext(source, {window: {RESUMEIQ_POSTHOG: config, posthog: sdk}, document});
  if (scripts.length) scripts[0].onload();
  return {scripts, captures, listeners, get options() { return options; }};
}

assert.equal(boot({}, 'local_app').scripts.length, 0);
assert.equal(boot({token: 'phc_test', host: 'https://attacker.example'}, 'local_app').scripts.length, 0);
assert.equal(boot({token: 'sk-or-v1-not-a-posthog-token', host: 'https://us.i.posthog.com'}, 'local_app').scripts.length, 0);
for (const surface of ['product_page', 'local_app']) {
  const run = boot({token: 'phc_test', host: 'https://us.i.posthog.com'}, surface);
  assert.equal(run.scripts[0].src, 'https://us-assets.i.posthog.com/static/array.js');
  assert.equal(run.captures[0][1].surface, surface);
  assert.equal(run.captures[1][0], '$pageview');
  assert.equal(run.options.autocapture, false);
  assert.equal(run.options.capture_performance, false);
  assert.equal(run.options.session_recording.maskAllInputs, true);
  assert.equal(run.options.session_recording.recordBody, false);
  assert.equal(run.options.session_recording.recordHeaders, false);
  assert.equal(run.options.session_recording.maskCapturedNetworkRequestFn({body: 'private'}), null);
  for (const id of ['resume', 'save-resume-status', 'saved-resumes-view', 'resume-name-dialog', 'resume-confirm-dialog', 'job', 'job-url', 'job-link-status', 'resume-file', 'linkedin-text', 'linkedin-file', 'linkedin-status', 'results', 'upload-status', 'status', 'configuration']) {
    assert.ok(run.options.session_recording.blockSelector.split(', ').includes('#' + id));
  }
  run.listeners.click({target: {closest: () => ({dataset: {analyticsAction: 'analyze_resume'}, textContent: 'PRIVATE RESUME'})}});
  assert.equal(JSON.stringify(run.captures[2]), JSON.stringify(['ui_clicked', {action: 'analyze_resume'}]));
  run.listeners.click({target: {closest: () => ({dataset: {analyticsAction: 'PRIVATE RESUME'}})}});
  assert.equal(run.captures.length, 3);
  run.listeners.click({target: {closest: () => null}});
  assert.equal(run.captures.length, 3);
}
console.log('Analytics mocked-SDK checks passed for both surfaces; no live ingestion tested.');
