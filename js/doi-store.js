// Simple DOI store for the app
// Other pages (e.g., search) can call setCurrentDOI(doi) to set the current DOI
let _currentDOI = null;

export function setCurrentDOI(doi) {
  _currentDOI = doi ? String(doi) : null;
  try {
    document.dispatchEvent(new CustomEvent('doi:change', { detail: { doi: _currentDOI } }));
  } catch (e) { /* noop */ }
}

export function getCurrentDOI() {
  return _currentDOI;
}

export function onDOIChange(cb) {
  if (typeof cb !== 'function') return () => {};
  const handler = (e) => cb(e.detail && e.detail.doi);
  document.addEventListener('doi:change', handler);
  return () => document.removeEventListener('doi:change', handler);
}
