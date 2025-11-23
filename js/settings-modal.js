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
    alert('Key present (not sent). Use your backend to validate in production.');
  });
  if (testGem) testGem.addEventListener('click', async () => {
    const key = modal.querySelector('#key-gemini').value.trim();
    if (!key) return alert('No Gemini key present');
    alert('Key present (not sent). Use your backend to validate in production.');
  });
  if (testGpt) testGpt.addEventListener('click', async () => {
    const key = modal.querySelector('#key-gpt').value.trim();
    if (!key) return alert('No GPT key present');
    alert('Key present (not sent). Use your backend to validate in production.');
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
