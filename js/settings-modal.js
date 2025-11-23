const STORAGE_KEY = 'citara.apikeys.v1';
const KEY_STORE = 'citara.cryptoKey.v1';

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

async function loadKeysToForm(modal) {
  const store = readStore();
  const or = modal.querySelector('#key-openrouter');
  const gem = modal.querySelector('#key-gemini');
  const gpt = modal.querySelector('#key-gpt');
  if (store.openrouter) or.value = await decryptText(store.openrouter);
  if (store.gemini) gem.value = await decryptText(store.gemini);
  if (store.gpt) gpt.value = await decryptText(store.gpt);
}

async function saveKeysFromForm(modal) {
  const or = modal.querySelector('#key-openrouter').value.trim();
  const gem = modal.querySelector('#key-gemini').value.trim();
  const gpt = modal.querySelector('#key-gpt').value.trim();
  const store = readStore();
  if (or) store.openrouter = await encryptText(or); else delete store.openrouter;
  if (gem) store.gemini = await encryptText(gem); else delete store.gemini;
  if (gpt) store.gpt = await encryptText(gpt); else delete store.gpt;
  writeStore(store);
}

// Provider model discovery (best-effort). Try live API endpoints; on failure fall back to static lists.
async function fetchModelsForProvider(provider, key) {
  try {
    if (!key) return null;
    if (provider === 'openrouter') {
      // Best-effort: try OpenRouter models endpoint
      const res = await fetch('https://api.openrouter.ai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) throw new Error('openrouter fetch failed');
      const j = await res.json();
      // Expect array in j.models or j.data
      const arr = j.models || j.data || j;
      return Array.isArray(arr) ? arr.map(m => (m.id || m.name || m.model || String(m))).filter(Boolean) : null;
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
}

async function refreshAvailableModels(modal) {
  const store = readStore();
  const providers = [];
  if (store.gemini) providers.push({ provider: 'gemini', key: await decryptText(store.gemini) });
  if (store.openrouter) providers.push({ provider: 'openrouter', key: await decryptText(store.openrouter) });
  if (store.gpt) providers.push({ provider: 'gpt', key: await decryptText(store.gpt) });

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

  const saveBtn = modal.querySelector('#settings-save');
  const cancelBtn = modal.querySelector('#settings-cancel');
  const testOpen = modal.querySelector('#test-openrouter');
  const testGem = modal.querySelector('#test-gemini');
  const testGpt = modal.querySelector('#test-gpt');

  if (saveBtn) saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await saveKeysFromForm(modal);
    // refresh available models after saving keys
    refreshAvailableModels(modal).catch(() => {});
    document.dispatchEvent(new CustomEvent('modal:close'));
  });

  if (cancelBtn) cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('modal:close'));
  });

  // Basic test handlers - just attempt a fetch to provider base (no secrets sent)
  if (testOpen) testOpen.addEventListener('click', async () => {
    const key = modal.querySelector('#key-openrouter').value.trim();
    if (!key) return alert('No OpenRouter key present');
    alert('Key present. Attempting to discover available models...');
    // attempt discovery live then update select
    try {
      const models = await fetchModelsForProvider('openrouter', key);
      if (models && models.length) applyModelsToSelect(modal, [{ provider: 'openrouter', models }]);
      else await refreshAvailableModels(modal);
    } catch (e) {
      await refreshAvailableModels(modal);
    }
  });
  if (testGem) testGem.addEventListener('click', async () => {
    const key = modal.querySelector('#key-gemini').value.trim();
    if (!key) return alert('No Gemini key present');
    alert('Key present. Attempting to discover available models...');
    try {
      const models = await fetchModelsForProvider('gemini', key);
      if (models && models.length) applyModelsToSelect(modal, [{ provider: 'gemini', models }]);
      else await refreshAvailableModels(modal);
    } catch (e) {
      await refreshAvailableModels(modal);
    }
  });
  if (testGpt) testGpt.addEventListener('click', async () => {
    const key = modal.querySelector('#key-gpt').value.trim();
    if (!key) return alert('No GPT key present');
    alert('Key present. Attempting to discover available models...');
    try {
      const models = await fetchModelsForProvider('gpt', key);
      if (models && models.length) applyModelsToSelect(modal, [{ provider: 'gpt', models }]);
      else await refreshAvailableModels(modal);
    } catch (e) {
      await refreshAvailableModels(modal);
    }
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
  return {
    openrouter: store.openrouter ? await decryptText(store.openrouter) : '',
    gemini: store.gemini ? await decryptText(store.gemini) : '',
    gpt: store.gpt ? await decryptText(store.gpt) : ''
  };
}
