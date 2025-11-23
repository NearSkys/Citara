import { dispatchEvent } from './utils.js';

const STORAGE_KEY = 'citara.filters.v1.search';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('failed to read stored filters', e);
    return {};
  }
}

function writeStored(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('failed to write stored filters', e);
  }
}

function serializeForm(form) {
  const data = new FormData(form);
  const out = {};
  for (const [k, v] of data.entries()) {
    out[k] = String(v).trim();
  }
  return out;
}

function applyToForm(form, obj) {
  Object.keys(obj || {}).forEach(k => {
    const field = form.querySelector(`[name="${k}"]`);
    if (!field) return;
    field.value = obj[k] ?? '';
  });
}

document.addEventListener('modal:open', (ev) => {
  const name = ev.detail?.name;
  if (name !== 'filters_search') return;

  const modal = document.querySelector('.modal-container');
  const form = modal.querySelector('#filters-form');
  const applyBtn = modal.querySelector('#apply-filters');
  const resetBtn = modal.querySelector('#reset-filters');

  const stored = readStored();
  applyToForm(form, stored);

  applyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const filters = serializeForm(form);
    writeStored(filters);
    dispatchEvent('filters:apply', { filters });
    document.dispatchEvent(new CustomEvent('modal:close'));
  });

  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    form.reset();
    writeStored({});
    dispatchEvent('filters:reset', {});
    document.dispatchEvent(new CustomEvent('modal:close'));
  });
});

export function getStoredSearchFilters() {
  return readStored();
}
