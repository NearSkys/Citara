const STORAGE_KEY = 'citara.apikeys.v1';
const KEY_STORE = 'citara.cryptoKey.v1';
const SETTINGS_STORE = 'citara.settings.v1';

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(str) {
  const bin = atob(str);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getOrCreateKey() {
  const existing = localStorage.getItem(KEY_STORE);
  if (existing) {
    try {
      const jwk = JSON.parse(existing);
      return await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    } catch (e) {
      console.warn('failed to import stored crypto key', e);
    }
  }

  // generate new key
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  try { localStorage.setItem(KEY_STORE, JSON.stringify(jwk)); } catch (e) { console.warn(e); }
  return key;
}

async function encryptText(plain) {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  return { iv: bufToBase64(iv), data: bufToBase64(cipher) };
}

async function decryptText(obj) {
  if (!obj || !obj.iv || !obj.data) return '';
  try {
    const key = await getOrCreateKey();
    const iv = base64ToBuf(obj.iv);
    const data = base64ToBuf(obj.data);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, data);
    return new TextDecoder().decode(plainBuf);
  } catch (e) {
    console.warn('decrypt failed', e);
    return '';
  }
}

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
}

function writeStore(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) { console.warn(e); }
}

function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_STORE) || '{}'); } catch (e) { return {}; }
}

function writeSettings(obj) {
  try { localStorage.setItem(SETTINGS_STORE, JSON.stringify(obj)); } catch (e) { console.warn(e); }
}

async function loadKeysToForm(modal) {
  const store = readStore();
  const or = modal.querySelector('#key-openrouter');
  const gem = modal.querySelector('#key-gemini');
  const gpt = modal.querySelector('#key-gpt');
  // mark static inputs as dynamic key inputs
  if (or) { or.classList.add('api-key-input'); or.dataset.provider = 'openrouter'; }
  if (gem) { gem.classList.add('api-key-input'); gem.dataset.provider = 'gemini'; }
  if (gpt) { gpt.classList.add('api-key-input'); gpt.dataset.provider = 'gpt'; }

  // helper to populate keys (support array or single stored object)
  async function populate(providerKey, inputEl) {
    const val = store[providerKey];
    if (!val) return;
    if (Array.isArray(val)) {
      // first value -> static input
      const first = val[0];
      if (first && inputEl) inputEl.value = await decryptText(first);
      // remaining -> create rows
      for (let i = 1; i < val.length; i++) {
        const v = await decryptText(val[i]);
        createApiKeyRow(modal, providerKey, v);
      }
    } else {
      if (inputEl) inputEl.value = await decryptText(val);
    }
  }

  await populate('openrouter', or);
  await populate('gemini', gem);
  await populate('gpt', gpt);
}

async function saveKeysFromForm(modal) {
  const store = readStore();
  // collect keys per provider from all inputs
  const providers = ['openrouter', 'gemini', 'gpt'];
  for (const p of providers) {
    const inputs = Array.from(modal.querySelectorAll(`.api-key-input[data-provider="${p}"]`));
    const values = inputs.map(i => (i.value || '').trim()).filter(Boolean);
    if (values.length > 0) {
      const encs = [];
      for (const v of values) {
        encs.push(await encryptText(v));
      }
      store[p] = encs;
    } else {
      delete store[p];
    }
  }
  writeStore(store);
}

// Provider model discovery (best-effort). Try live API endpoints; on failure fall back to static lists.
async function fetchModelsForProvider(provider, key) {
  try {
    if (!key) return null;
    if (provider === 'openrouter') {
      // Try multiple OpenRouter endpoints (some users report different domains)
      const endpoints = [
        'https://openrouter.ai/api/v1/models',
        'https://api.openrouter.ai/v1/models'
      ];
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json'
            }
          });
          if (!res.ok) {
            // try next endpoint
            console.warn('openrouter models fetch not ok', url, res.status);
            continue;
          }
          const j = await res.json();
          const arr = j.data || j.models || j;
          return Array.isArray(arr) ? arr.map(m => (m.id || m.name || m.model || String(m))).filter(Boolean) : null;
        } catch (err) {
          // network/CORS/other error - try next endpoint
          console.warn('openrouter fetch failed for', url, err);
          continue;
        }
      }
      // all attempts failed
      throw new Error('openrouter fetch attempts failed');
    }

    if (provider === 'gpt') {
      // Try OpenAI-style models endpoint
      const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) throw new Error('openai fetch failed');
      const j = await res.json();
      const arr = j.data || j.models || [];
      return Array.isArray(arr) ? arr.map(m => (m.id || m.name || String(m))).filter(Boolean) : null;
    }

    if (provider === 'gemini') {
      // Use Google Generative Language models endpoint as suggested.
      // Note: this expects a valid API key that has permission to list models.
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('gemini fetch failed');
      const j = await res.json();
      const arr = j.models || [];
      // Filter to generation-capable models (generateContent)
      const chatModels = Array.isArray(arr) ? arr.filter(m => (m.supportedGenerationMethods || []).includes('generateContent')) : [];
      return chatModels.map(m => (m.name || m.displayName || m.model || String(m))).filter(Boolean);
    }

    return null;
  } catch (e) {
    console.warn('model discovery failed for', provider, e);
    return null;
  }
}

function createApiKeyRow(modal, provider, initialValue = '') {
  const block = modal.querySelector(`.api-block[data-provider="${provider}"]`);
  if (!block) return null;
  const body = block.querySelector('.api-block-body');
  if (!body) return null;

  const row = document.createElement('div');
  row.className = 'api-key-row';
  row.style.display = 'flex';
  row.style.gap = '0.5rem';
  row.style.alignItems = 'center';
  row.innerHTML = `
    <div style="position: relative; flex: 1;">
      <span class="material-symbols-outlined text-muted" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 1rem;">key</span>
      <input type="password" class="search-input api-key-input" data-provider="${provider}" style="padding-left: 2.25rem; width: 100%;" value="${initialValue ? initialValue.replace(/"/g,'&quot;') : ''}" />
    </div>
    <button class="btn btn-outline test-row-btn" type="button" style="flex:0 0 auto;">
      <span class="material-symbols-outlined" style="font-size: 1.125rem;">api</span>
      <span>Test</span>
    </button>
    <button class="btn btn-outline remove-api-key" type="button" style="flex:0 0 auto;">
      <span class="material-symbols-outlined" style="font-size: 1.125rem;">delete</span>
    </button>
  `;

  // insert before the buttons wrapper if present (the add/test buttons group)
  const btnAdd = body.querySelector('.add-api-key');
  if (btnAdd && btnAdd.parentElement) {
    body.insertBefore(row, btnAdd.parentElement);
  } else {
    body.appendChild(row);
  }

  // wire test for this row
  const testBtn = row.querySelector('.test-row-btn');
  const input = row.querySelector('.api-key-input');
  const removeBtn = row.querySelector('.remove-api-key');

  if (testBtn) testBtn.addEventListener('click', async () => {
    const key = (input.value || '').trim();
    if (!key) return;
    testBtn.disabled = true;
    const orig = testBtn.innerHTML;
    testBtn.innerHTML = 'Checking...';
    // ensure status element exists
    let status = row.querySelector('.api-test-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'api-test-status';
      status.style.marginLeft = '0.5rem';
      status.style.fontSize = '0.9rem';
      status.style.color = 'var(--text-muted)';
      row.appendChild(status);
    }
    status.textContent = '';
    try {
      const models = await fetchModelsForProvider(provider, key);
      if (models && models.length) {
        applyModelsToSelect(modal, [{ provider, models }]);
        testBtn.style.backgroundColor = '#16a34a';
        testBtn.style.color = '#ffffff';
        testBtn.innerHTML = 'OK ✓';
        status.textContent = 'Models discovered';
        status.style.color = '#16a34a';
        setTimeout(() => { try { testBtn.innerHTML = orig; testBtn.style.backgroundColor = ''; testBtn.style.color = ''; testBtn.disabled = false; status.textContent = ''; } catch (e) {} }, 1500);
      } else {
        // fallback: refresh all models
        await refreshAvailableModels(modal);
        status.textContent = 'No models found (fallback)';
        status.style.color = '#d97706';
        testBtn.innerHTML = orig;
        testBtn.disabled = false;
      }
    } catch (e) {
      console.warn(provider, 'row test failed', e);
      try { testBtn.innerHTML = orig; } catch (err) {}
      testBtn.disabled = false;
      // show error message inline (CORS or network)
      try {
        status.textContent = `Error: ${e.message || String(e)}`;
        status.style.color = '#dc2626';
      } catch (err) {}
    }
  });

  if (removeBtn) removeBtn.addEventListener('click', () => {
    row.remove();
  });

  return row;
}

function applyModelsToSelect(modal, providersModels) {
  const sel = modal.querySelector('#default-ai-model-select');
  if (!sel) return;
  // clear
  sel.innerHTML = '';

  // If we have models grouped by provider, add optgroups
  let added = 0;
  for (const { provider, models } of providersModels) {
    if (!models || models.length === 0) continue;
    const og = document.createElement('optgroup');
    og.label = provider.toUpperCase();
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = `${provider}::${m}`;
      opt.textContent = m;
      og.appendChild(opt);
      added++;
    });
    sel.appendChild(og);
  }

  if (added === 0) {
    // fallback default options
    const defaults = ['gpt-4', 'gpt-3.5-turbo', 'Gemini 1.5 Pro'];
    defaults.forEach(m => {
      const opt = document.createElement('option');
      opt.value = `default::${m}`;
      opt.textContent = m;
      sel.appendChild(opt);
    });
  }

  // attempt to restore previously saved default AI model
  try {
    const s = readSettings();
    const desired = s.defaultAIModel;
    if (desired) {
      // try to set by value first
      let matched = false;
      for (let i = 0; i < sel.options.length; i++) {
        const o = sel.options[i];
        if (o.value === desired || o.text === desired) { o.selected = true; matched = true; break; }
      }
      // if not matched but there is an optgroup with matching text, try a loose match
      if (!matched) {
        for (let i = 0; i < sel.options.length; i++) {
          const o = sel.options[i];
          if ((o.text || '').toLowerCase().includes(String(desired).toLowerCase())) { o.selected = true; matched = true; break; }
        }
      }
    }
  } catch (e) { /* ignore */ }
}

async function refreshAvailableModels(modal) {
  const store = readStore();
  const providers = [];
  if (store.gemini) {
    const val = Array.isArray(store.gemini) ? store.gemini[0] : store.gemini;
    providers.push({ provider: 'gemini', key: await decryptText(val) });
  }
  if (store.openrouter) {
    const val = Array.isArray(store.openrouter) ? store.openrouter[0] : store.openrouter;
    providers.push({ provider: 'openrouter', key: await decryptText(val) });
  }
  if (store.gpt) {
    const val = Array.isArray(store.gpt) ? store.gpt[0] : store.gpt;
    providers.push({ provider: 'gpt', key: await decryptText(val) });
  }

  const providersModels = [];
  for (const p of providers) {
    const models = await fetchModelsForProvider(p.provider, p.key);
    if (models && models.length) providersModels.push({ provider: p.provider, models });
    else {
      // fallback lists
      const FALLBACK = {
        gemini: ['Gemini 1.0 Pro', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
        openrouter: ['OpenRouter-Standard', 'OpenRouter-Pro'],
        gpt: ['gpt-4', 'gpt-4o', 'gpt-3.5-turbo']
      };
      providersModels.push({ provider: p.provider, models: FALLBACK[p.provider] || [] });
    }
  }

  applyModelsToSelect(modal, providersModels);
}


document.addEventListener('modal:open', async (ev) => {
  const name = ev.detail?.name;
  if (name !== 'settings') return;
  const modal = document.querySelector('.modal-container');
  if (!modal) return;

  await getOrCreateKey(); // ensure key exists
  await loadKeysToForm(modal);

  // Transform static inputs (e.g. #key-gemini) into api-key-row layout so
  // every key appears as a row with Test and Delete buttons on the right.
  try {
    ['gemini','openrouter','gpt'].forEach(provider => {
      const staticInput = modal.querySelector(`#key-${provider}`);
      if (!staticInput) return;
      // find the containing outer div that holds label and input wrapper
      const innerDiv = staticInput.parentElement; // the div around input
      const outerDiv = innerDiv ? innerDiv.parentElement : null; // the div that contains the label and innerDiv
      const currentVal = staticInput.value || '';
      // remove the original input wrapper so we don't show plain input
      try { if (innerDiv && innerDiv.parentElement) innerDiv.remove(); } catch (e) {}

      // create a new api-key row for the current value
      const row = createApiKeyRow(modal, provider, currentVal);
      if (row && outerDiv && outerDiv.parentElement) {
        // move the created row right after the label block (outerDiv)
        outerDiv.parentElement.insertBefore(row, outerDiv.nextSibling);
      }
    });
  } catch (e) { console.warn('transform static inputs failed', e); }

  // wire 'Add API Key' buttons
  const addButtons = modal.querySelectorAll('.add-api-key');
  addButtons.forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const prov = b.dataset.provider;
      createApiKeyRow(modal, prov, '');
    });
  });

  // Left nav behavior: scroll to section and highlight
  try {
    const navItems = modal.querySelectorAll('.nav-item[data-target]');
    navItems.forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        // active class
        navItems.forEach(x => x.classList.remove('active'));
        a.classList.add('active');
        const targetId = a.dataset.target;
        const target = modal.querySelector(`#${targetId}`);
        if (!target) return;
        // smooth scroll
        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { target.scrollIntoView(); }
        // visual highlight: temporary background
        try {
          const origBg = target.style.backgroundColor || '';
          target.style.transition = 'background-color 240ms ease-in-out';
          target.style.backgroundColor = 'rgba(16,185,129,0.06)';
          setTimeout(() => {
            try { target.style.backgroundColor = origBg; } catch (e) {}
          }, 1500);
        } catch (e) { /* ignore */ }
      });
    });
  } catch (e) { console.warn('nav wiring failed', e); }

  // load default export format into select
  try {
    const s = readSettings();
    const sel = modal.querySelector('#default-export-format-select');
    if (sel) {
      const value = s.exportFormat || sel.value || sel.options[sel.selectedIndex]?.text || 'BibTeX';
      // if option exists, set it; otherwise add it and select
      let found = Array.from(sel.options).some(opt => opt.value === value || opt.text === value);
      if (!found) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        sel.appendChild(opt);
      }
      sel.value = value;
    }
  } catch (e) { console.warn('load export format failed', e); }

  // populate available models from configured providers
  try {
    await refreshAvailableModels(modal);
  } catch (e) { console.warn('refresh models failed', e); }

  const saveBtn = modal.querySelector('#settings-save');
  const cancelBtn = modal.querySelector('#settings-cancel');

  if (saveBtn) saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    // disable controls while saving
    try {
      if (saveBtn) { saveBtn.disabled = true; }
      if (cancelBtn) { cancelBtn.disabled = true; }

      await saveKeysFromForm(modal);
      // refresh available models after saving keys
      await refreshAvailableModels(modal).catch(() => {});

      // persist export format and default AI model selection as part of settings
      try {
        const selExport = modal.querySelector('#default-export-format-select');
        const selAI = modal.querySelector('#default-ai-model-select');
        const s = readSettings();
        if (selExport) s.exportFormat = selExport.value || selExport.options[selExport.selectedIndex]?.text || '';
        if (selAI) s.defaultAIModel = selAI.value || selAI.options[selAI.selectedIndex]?.text || '';
        writeSettings(s);
        if (selExport) document.dispatchEvent(new CustomEvent('settings:export-format:changed', { detail: { format: s.exportFormat } }));
        if (selAI) document.dispatchEvent(new CustomEvent('settings:ai-model:changed', { detail: { model: s.defaultAIModel } }));
      } catch (e) { console.warn('save settings failed', e); }

      // visual confirmation on the Save button: green + check text for 1.5s
      try {
        const originalText = saveBtn.innerHTML;
        const originalBg = saveBtn.style.backgroundColor || '';
        const originalColor = saveBtn.style.color || '';
        // set green background and white text
        saveBtn.style.backgroundColor = '#16a34a';
        saveBtn.style.color = '#ffffff';
        saveBtn.innerText = 'Saved ✓';

        // keep confirmation visible for 1.5s then close modal
        setTimeout(() => {
          try {
            // restore (optional) and close
            saveBtn.innerHTML = originalText;
            saveBtn.style.backgroundColor = originalBg;
            saveBtn.style.color = originalColor;
          } catch (e) {}
          document.dispatchEvent(new CustomEvent('modal:close'));
        }, 1500);
      } catch (e) {
        // fallback: close immediately
        document.dispatchEvent(new CustomEvent('modal:close'));
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Falha ao salvar as configurações. Veja o console para detalhes.');
      if (saveBtn) saveBtn.disabled = false;
      if (cancelBtn) cancelBtn.disabled = false;
    }
  });

  if (cancelBtn) cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('modal:close'));
  });

  // Collapsible API blocks UI
  const UI_STATE_KEY = 'citara.api.ui.v1';
  function readUiState() {
    try { return JSON.parse(localStorage.getItem(UI_STATE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function writeUiState(obj) { try { localStorage.setItem(UI_STATE_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ } }

  function setBlockExpanded(block, expanded) {
    const body = block.querySelector('.api-block-body');
    const btn = block.querySelector('.api-toggle');
    if (!body || !btn) return;
    body.style.display = expanded ? '' : 'none';
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (!expanded) block.classList.add('collapsed'); else block.classList.remove('collapsed');
  }

  // initialize blocks from saved state (default expanded)
  const uiState = readUiState();
  const blocks = modal.querySelectorAll('.api-block');
  blocks.forEach(b => {
    const provider = b.dataset.provider;
    const expanded = provider ? (uiState[provider] !== false) : true;
    setBlockExpanded(b, expanded);
    const toggle = b.querySelector('.api-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const current = toggle.getAttribute('aria-expanded') !== 'false';
        const next = !current;
        setBlockExpanded(b, next);
        if (provider) {
          uiState[provider] = next;
          writeUiState(uiState);
        }
      });
    }
  });
});

export async function getStoredApiKeys() {
  const store = readStore();
  const out = {};
  for (const p of ['openrouter', 'gemini', 'gpt']) {
    if (!store[p]) { out[p] = []; continue; }
    if (Array.isArray(store[p])) {
      out[p] = [];
      for (const e of store[p]) out[p].push(await decryptText(e));
    } else {
      out[p] = [await decryptText(store[p])];
    }
  }
  return out;
}

export function getDefaultExportFormat() {
  const s = readSettings();
  if (s && s.exportFormat) return s.exportFormat;
  // fallback to select default if available in DOM
  try {
    const sel = document.querySelector('#default-export-format-select');
    if (sel) return sel.value || sel.options[sel.selectedIndex]?.text || 'BibTeX';
  } catch (e) {}
  return 'BibTeX';
}

export function setDefaultExportFormat(format) {
  const s = readSettings();
  s.exportFormat = format;
  writeSettings(s);
  document.dispatchEvent(new CustomEvent('settings:export-format:changed', { detail: { format } }));
}

export function getDefaultAIModel() {
  const s = readSettings();
  if (s && s.defaultAIModel) return s.defaultAIModel;
  try {
    const sel = document.querySelector('#default-ai-model-select');
    if (sel) return sel.value || sel.options[sel.selectedIndex]?.text || '';
  } catch (e) {}
  return '';
}

export function setDefaultAIModel(model) {
  const s = readSettings();
  s.defaultAIModel = model;
  writeSettings(s);
  document.dispatchEvent(new CustomEvent('settings:ai-model:changed', { detail: { model } }));
}
