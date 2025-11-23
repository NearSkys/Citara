// Filters modal logic
const STORAGE_KEY = 'citara.filters.v1';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeStored(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) {}
}

function serializeForm(form) {
  const data = {};
  const fm = new FormData(form);
  for (const [k, v] of fm.entries()) {
    data[k] = v === null ? '' : String(v).trim();
  }
  return data;
}

function applyToForm(form, obj) {
  if (!form) return;
  for (const key of ['title','authors','year','tags','type','style','keyword']) {
    const el = form.querySelector('[name="' + key + '"]');
    if (el) el.value = obj[key] || '';
  }
}

document.addEventListener('modal:open', (e) => {
  try {
    if (!e.detail || e.detail.name !== 'filters') return;
    const wrapper = e.detail.modal;
    if (!wrapper) return;
    const form = wrapper.querySelector('#filters-form');
    if (!form) return;

    // Prefill from storage
    const stored = readStored();
    applyToForm(form, stored);

    const applyBtn = wrapper.querySelector('#apply-filters');
    const resetBtn = wrapper.querySelector('#reset-filters');

    function onApply(ev) {
      ev.preventDefault();
      const filters = serializeForm(form);
      // persist
      writeStored(filters);
      // emit event so the app can handle filtering
      document.dispatchEvent(new CustomEvent('filters:apply', { detail: { filters } }));
      // close modal by triggering data-modal-close via existing loader behavior
      try { wrapper.querySelector('[data-modal-close]')?.click(); } catch (e) {}
    }

    function onReset(ev) {
      ev.preventDefault();
      // clear storage and form
      writeStored({});
      applyToForm(form, {});
      document.dispatchEvent(new CustomEvent('filters:reset', {}));
    }

    if (applyBtn) {
      applyBtn.removeEventListener('__applied', onApply);
      applyBtn.addEventListener('click', onApply);
    }
    if (resetBtn) {
      resetBtn.removeEventListener('__reset', onReset);
      resetBtn.addEventListener('click', onReset);
    }
  } catch (err) {
    console.error('filters-modal:init', err);
  }
});

// Expose helper to get current saved filters
export function getSavedFilters() { return readStored(); }
