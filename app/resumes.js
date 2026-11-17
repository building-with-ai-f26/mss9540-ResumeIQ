(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const storageKey = 'resumeiq.saved-resumes.v1';
  const limit = 20;
  let editing = null;
  let snapshot = '';
  let confirmAction = null;

  function feedback(id, text, state = 'info') {
    get(id).textContent = text;
    get(id).dataset.state = state;
  }

  function readResumes() {
    let raw;
    try { raw = window.localStorage.getItem(storageKey); }
    catch (_) { throw new Error('Browser storage is unavailable. You can still use the workspace without saving.'); }
    if (raw === null) return [];
    try {
      if (raw.length > 1500000) throw new Error();
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.resumes) || data.resumes.length > limit) throw new Error();
      const ids = new Set();
      for (const item of data.resumes) {
        if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 100 || ids.has(item.id) ||
            typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 ||
            typeof item.text !== 'string' || item.text.trim().length < 30 || item.text.length > 20000 ||
            typeof item.updated !== 'string' || !Number.isFinite(Date.parse(item.updated))) throw new Error();
        ids.add(item.id);
      }
      return data.resumes;
    } catch (_) { throw new Error('Saved resumes could not be read. Existing browser data was left unchanged.'); }
  }

  function writeResumes(resumes) {
    try { window.localStorage.setItem(storageKey, JSON.stringify({version: 1, resumes})); }
    catch (_) { throw new Error('The change could not be saved. Browser storage may be full or blocked. Existing saves were left unchanged.'); }
  }

  function busy() {
    return get('review-form').getAttribute('aria-busy') === 'true';
  }

  function confirm(title, text, label, action) {
    get('resume-confirm-title').textContent = title;
    get('resume-confirm-text').textContent = text;
    get('resume-confirm-action').textContent = label;
    confirmAction = action;
    get('resume-confirm-dialog').showModal();
  }

  function openResume(id) {
    try {
      if (busy()) throw new Error('Wait for the current upload, import, or review to finish before opening a saved resume.');
      const item = readResumes().find(resume => resume.id === id);
      if (!item) throw new Error('This resume is no longer saved.');
      const apply = () => {
        if (busy()) { feedback('library-status', 'Wait for the current task to finish.', 'error'); return; }
        // Restore only the resume; leave target role and optional profile text alone.
        get('resume').value = item.text;
        get('resume-editor').open = true;
        get('results').hidden = true;
        get('resume-file').value = '';
        get('upload-status').textContent = '';
        get('status').textContent = '';
        feedback('save-resume-status', 'Saved resume opened. Review the text and target role before analyzing.', 'success');
        window.location.hash = 'workspace';
        showView();
      };
      if (get('resume').value.trim() && get('resume').value !== item.text) {
        confirm('Replace current resume text?', 'Opening this saved resume replaces the text currently in the workspace. Save any edits you want to keep first.', 'Open resume', apply);
      } else { apply(); }
    } catch (error) { feedback('library-status', error.message, 'error'); }
  }

  function editName(id) {
    try {
      const item = readResumes().find(resume => resume.id === id);
      if (!item) throw new Error('This resume is no longer saved.');
      editing = id;
      get('resume-name').value = item.name;
      get('resume-name-title').textContent = 'Rename resume';
      get('resume-name-submit').textContent = 'Save name';
      feedback('resume-name-status', '');
      get('resume-name-dialog').showModal();
    } catch (error) { feedback('library-status', error.message, 'error'); }
  }

  function removeResume(id) {
    confirm('Delete saved resume?', 'This removes the saved copy from this browser. Text already open in the workspace is kept.', 'Delete resume', () => {
      try {
        const resumes = readResumes();
        writeResumes(resumes.filter(item => item.id !== id));
        renderLibrary();
        feedback('library-status', 'Saved resume deleted.', 'success');
      } catch (error) { feedback('library-status', error.message, 'error'); }
    });
  }

  function renderLibrary() {
    get('saved-resumes-list').replaceChildren();
    get('library-empty').hidden = true;
    try {
      const resumes = readResumes();
      get('library-empty').hidden = resumes.length > 0;
      for (const item of [...resumes].reverse()) {
        const row = document.createElement('li');
        row.className = 'panel saved-resume';
        const description = document.createElement('div');
        const title = document.createElement('h2');
        title.textContent = item.name;
        const meta = document.createElement('p');
        meta.textContent = 'Updated ' + new Date(item.updated).toLocaleDateString() + ' · ' + item.text.length.toLocaleString() + ' characters';
        description.append(title, meta);
        const controls = document.createElement('div');
        controls.className = 'saved-resume-actions';
        for (const [label, handler] of [['Open', openResume], ['Rename', editName], ['Delete', removeResume]]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'secondary';
          button.textContent = label;
          button.setAttribute('aria-label', label + ' ' + item.name);
          button.addEventListener('click', () => handler(item.id));
          controls.append(button);
        }
        row.append(description, controls);
        get('saved-resumes-list').append(row);
      }
    } catch (error) { feedback('library-status', error.message, 'error'); }
  }

  function showView() {
    const library = window.location.hash === '#saved-resumes';
    get('workspace-view').hidden = library;
    get('saved-resumes-view').hidden = !library;
    get('current-view-label').textContent = library ? 'Saved resumes' : 'New review';
    document.title = (library ? 'Saved resumes' : 'Workspace') + ' · ResumeIQ';
    for (const [id, active] of [['workspace-nav', !library], ['saved-resumes-nav', library]]) {
      get(id).classList.toggle('active', active);
      if (active) get(id).setAttribute('aria-current', 'page');
      else get(id).removeAttribute('aria-current');
    }
    if (library) { feedback('library-status', ''); renderLibrary(); get('saved-resumes-heading').focus(); }
    else get('workspace').focus();
  }

  get('save-resume').addEventListener('click', () => {
    if (busy()) return;
    snapshot = get('resume').value;
    if (snapshot.trim().length < 30 || snapshot.length > 20000) {
      get('resume-editor').open = true;
      feedback('save-resume-status', 'Upload or paste 30–20,000 characters of resume text before saving.', 'error');
      get('resume').focus();
      return;
    }
    editing = null;
    get('resume-name').value = '';
    get('resume-name-title').textContent = 'Save resume';
    get('resume-name-submit').textContent = 'Save resume';
    feedback('resume-name-status', '');
    get('resume-name-dialog').showModal();
  });

  get('resume-name-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = get('resume-name').value.trim();
    if (!name || name.length > 80) { feedback('resume-name-status', 'Enter a resume name of 1–80 characters.', 'error'); return; }
    try {
      const resumes = readResumes();
      if (editing) {
        const item = resumes.find(resume => resume.id === editing);
        if (!item) throw new Error('This resume is no longer saved.');
        item.name = name;
        item.updated = new Date().toISOString();
      } else {
        if (resumes.length >= limit) throw new Error('You can save up to 20 resumes in this browser. Delete an older save first.');
        resumes.push({id: window.crypto.randomUUID(), name, text: snapshot, updated: new Date().toISOString()});
      }
      writeResumes(resumes);
      get('resume-name-dialog').close();
      renderLibrary();
      if (editing) feedback('library-status', 'Resume renamed.', 'success');
      else feedback('save-resume-status', 'Resume saved in this browser. Open Saved resumes to reuse it.', 'success');
    } catch (error) { feedback('resume-name-status', error.message, 'error'); }
  });
  get('resume-name-cancel').addEventListener('click', () => get('resume-name-dialog').close());
  get('resume-confirm-cancel').addEventListener('click', () => { confirmAction = null; get('resume-confirm-dialog').close(); });
  get('resume-confirm-action').addEventListener('click', () => {
    const action = confirmAction;
    confirmAction = null;
    get('resume-confirm-dialog').close();
    if (action) action();
  });
  window.addEventListener('hashchange', showView);
  window.addEventListener('storage', event => {
    if ((event.key === storageKey || event.key === null) && window.location.hash === '#saved-resumes') {
      feedback('library-status', ''); renderLibrary();
    }
  });
  showView();
})();
