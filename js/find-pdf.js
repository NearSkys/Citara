import { setCurrentDOI, getCurrentDOI, onDOIChange } from './doi-store.js';

// Helper: normalize DOI/URL and produce a proper https://doi.org/... url
function toDoiUrl(raw) {
  if (!raw) return null;
  raw = String(raw).trim();
  // If it already looks like a full URL, return as-is
  if (/^https?:\/\//i.test(raw)) return raw;
  // Otherwise assume it's a DOI path like 10.xxxx/yyy and prepend
  // ensure no leading doi.org
  raw = raw.replace(/^doi:\/\//i, '').replace(/^doi\.org\//i, '');
  return 'https://doi.org/' + encodeURIComponent(raw).replace(/%2F/g, '/');
}

function openDoiInNewTab(raw) {
  const url = toDoiUrl(raw);
  if (!url) return;
  try {
    window.open(url, '_blank', 'noopener');
  } catch (e) {
    // fallback
    location.href = url;
  }
}

function initFindPdfButton() {
  const btn = document.getElementById('find-pdf-btn');
  if (!btn) return;
  // If the button is configured to open the injected modal (data-modal="find_pdf"),
  // do not override its click handler here — let the modal loader handle opening.
  if (btn.getAttribute && btn.getAttribute('data-modal') === 'find_pdf') {
    return;
  }

  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const doi = getCurrentDOI();
    if (doi) {
      openDoiInNewTab(doi);
      return;
    }
    // If no DOI is set, optionally try to extract from details panel
    const details = document.getElementById('details-content');
    if (details) {
      // heuristic: look for a link or a data-doi attribute
      const link = details.querySelector('a[href*="doi.org"]');
      if (link && link.href) { openDoiInNewTab(link.href); return; }
      const doiAttr = details.dataset && details.dataset.doi;
      if (doiAttr) { openDoiInNewTab(doiAttr); return; }
    }

    // As a last resort, do nothing or show a quick message
    try { btn.textContent = 'No DOI'; setTimeout(() => btn.innerHTML = '<span class="material-symbols-outlined">picture_as_pdf</span><span>Find PDF</span>', 1200); } catch (e) {}
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initFindPdfButton();
  // For the graph page example, set the hardcoded DOI for Turing example
  // Example DOI provided: https://doi.org/10.1093%2FMIND%2FLIX.236.433
  // Normalize to readable form
  const example = '10.1093/MIND/LIX.236.433';
  setCurrentDOI(example);
});

// Handle dynamically injected modal (loaded by modals.js)
document.addEventListener('modal:open', (e) => {
  try {
    if (!e.detail || e.detail.name !== 'find_pdf') return;
    const wrapper = e.detail.modal;
    if (!wrapper) return;

    const display = wrapper.querySelector('#doi-display');
    const openBtn = wrapper.querySelector('#open-doi-btn');
    const copyBtn = wrapper.querySelector('#copy-doi-btn');

    // Determine DOI (store takes precedence)
    let doi = getCurrentDOI();
    if (!doi) {
      const details = document.getElementById('details-content');
      if (details) {
        const link = details.querySelector('a[href*="doi.org"]');
        if (link && link.href) doi = link.href;
        const doiAttr = details.dataset && details.dataset.doi;
        if (!doi && doiAttr) doi = doiAttr;
      }
    }

    const url = doi ? toDoiUrl(doi) : null;
    if (display) display.textContent = url || 'No DOI available';

    function handleOpen(ev) {
      ev.preventDefault();
      if (!url) return;
      openDoiInNewTab(url);
    }

    function handleCopy(ev) {
      ev.preventDefault();
      if (!url) return;
      const toCopy = doi || url;
      try {
        navigator.clipboard.writeText(toCopy).then(() => {
          copyBtn.textContent = 'Copied';
          setTimeout(() => { copyBtn.textContent = 'Copy DOI'; }, 1000);
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = toCopy;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); copyBtn.textContent = 'Copied'; } catch (e) {}
          ta.remove();
          setTimeout(() => { copyBtn.textContent = 'Copy DOI'; }, 1000);
        });
      } catch (err) { /* noop */ }
    }

    if (openBtn) {
      openBtn.addEventListener('click', handleOpen);
      if (!url) openBtn.disabled = true;
      else openBtn.disabled = false;
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', handleCopy);
      if (!url) copyBtn.disabled = true;
      else copyBtn.disabled = false;
      copyBtn.textContent = 'Copy DOI';
    }
  } catch (err) {
    console.error('find-pdf: modal init error', err);
  }
});

// Export helpers for other scripts to call if they import this module
export { toDoiUrl, openDoiInNewTab };
