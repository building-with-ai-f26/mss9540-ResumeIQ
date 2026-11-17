// Browser-storage and library interaction tests; no network requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app/resumes.js', 'utf8');
const key = 'resumeiq.saved-resumes.v1';
const text = 'FICTIONAL resume with product strategy, SQL, and customer research experience.';
function boot(existing = null, blocked = false) {
  const data = new Map(existing === null ? [] : [[key, existing]]);
  let writes = 0, failWrites = false, nextId = 0;
  const elements = {}, listeners = {};
  class Element {
    constructor() { this.value = ''; this.textContent = ''; this.hidden = false; this.open = false; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.classList = {toggle() {}}; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    fire(type) { this.listeners[type]?.({preventDefault() {}}); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    removeAttribute(key) { delete this.attributes[key]; }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const get = id => elements[id] ||= new Element();
  const window = {
    localStorage: {
      getItem: key => { if (blocked) throw new Error('blocked'); return data.get(key) ?? null; },
      setItem: (key, value) => { if (blocked || failWrites) throw new Error('quota'); data.set(key, value); writes++; }
    },
    crypto: {randomUUID: () => 'fictional-' + ++nextId},
    location: {hash: '#workspace'},
    addEventListener: (type, callback) => { listeners[type] = callback; }
  };
  const document = {getElementById: get, createElement: () => new Element()};
  vm.runInNewContext(source, {window, document});
  return {
    get, data, window,
    get writes() { return writes; },
    set failWrites(value) { failWrites = value; },
    navigate() { window.location.hash = '#saved-resumes'; listeners.hashchange(); },
    save(name) { get('resume').value = text; get('save-resume').fire('click'); get('resume-name').value = name; get('resume-name-form').fire('submit'); },
    action(label) { const row = get('saved-resumes-list').children[0]; return row.children[1].children.find(button => button.textContent === label); }
  };
}
const run = boot();
assert.equal(run.writes, 0); // No autosave or storage write on load.
run.get('resume').value = 'short'; run.get('save-resume').fire('click');
assert.equal(run.get('save-resume-status').dataset.state, 'error');
assert.equal(run.writes, 0);
run.save('<img src=x onerror=alert(1)>');
assert.equal(run.writes, 1);
let stored = JSON.parse(run.data.get(key));
assert.equal(stored.resumes[0].text, text);
assert.equal(stored.resumes[0].name, '<img src=x onerror=alert(1)>');
assert.deepEqual(Object.keys(stored.resumes[0]).sort(), ['id', 'name', 'text', 'updated']);
run.navigate();
assert.equal(run.get('workspace-view').hidden, true);
assert.equal(run.get('saved-resumes-view').hidden, false);
assert.equal(run.get('saved-resumes-list').children[0].children[0].children[0].textContent, stored.resumes[0].name);
run.action('Rename').fire('click');
run.get('resume-name').value = 'PM application'; run.get('resume-name-form').fire('submit');
stored = JSON.parse(run.data.get(key));
assert.equal(stored.resumes[0].name, 'PM application');
assert.equal(stored.resumes[0].text, text);
run.get('resume').value = 'Different unsaved fictional resume content';
run.get('job').value = 'Keep this job'; run.get('linkedin-text').value = 'Keep this profile';
run.action('Open').fire('click');
assert.equal(run.get('resume-confirm-dialog').open, true);
assert.equal(run.get('resume').value, 'Different unsaved fictional resume content');
run.get('resume-confirm-cancel').fire('click');
assert.equal(run.get('resume').value, 'Different unsaved fictional resume content');
run.action('Open').fire('click'); run.get('resume-confirm-action').fire('click');
assert.equal(run.get('resume').value, text);
assert.equal(run.get('resume-editor').open, true);
assert.equal(run.get('job').value, 'Keep this job');
assert.equal(run.get('linkedin-text').value, 'Keep this profile');
const reloaded = boot(run.data.get(key)); reloaded.navigate();
assert.equal(reloaded.get('saved-resumes-list').children.length, 1);
reloaded.action('Delete').fire('click'); reloaded.get('resume-confirm-cancel').fire('click');
assert.equal(JSON.parse(reloaded.data.get(key)).resumes.length, 1);
reloaded.action('Delete').fire('click'); reloaded.get('resume-confirm-action').fire('click');
assert.equal(JSON.parse(reloaded.data.get(key)).resumes.length, 0);
assert.equal(reloaded.get('library-empty').hidden, false);
run.navigate(); run.failWrites = true;
run.action('Delete').fire('click'); run.get('resume-confirm-action').fire('click');
assert.equal(run.get('library-status').dataset.state, 'error');
assert.equal(JSON.parse(run.data.get(key)).resumes.length, 1);
const quota = boot(); quota.failWrites = true; quota.save('Test');
assert.equal(quota.get('resume-name-dialog').open, true);
assert.equal(quota.get('resume-name-status').dataset.state, 'error');
assert.equal(quota.writes, 0);
const blocked = boot(null, true); blocked.save('Test');
assert.equal(blocked.get('resume-name-status').dataset.state, 'error');
assert.equal(blocked.writes, 0);
const corrupt = boot('{broken'); corrupt.save('Test');
assert.equal(corrupt.data.get(key), '{broken');
assert.equal(corrupt.writes, 0);
const full = boot(JSON.stringify({version: 1, resumes: Array.from({length:20}, (_,i) => ({id:String(i),name:'Test',text,updated:'2026-11-16T00:00:00Z'}))}));
full.save('Extra');
assert.equal(full.writes, 0);
assert.ok(full.get('resume-name-status').textContent.includes('20 resumes'));
console.log('Saved-resume tests passed: explicit saves, reload persistence, safe names, rename, replace confirmation, deletion, quota/blocked/corrupt storage, and limits.');
