import { PDFHandler } from './pdf-handler.js';
import { Utils } from './utils.js';

const MAX_BYTES = 50 * 1024 * 1024;

function parseMetadataFromText(text) {
  const meta = {};
  if (!text) return meta;
  // Try to find year
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) meta.year = yearMatch[0];

  // Try to heuristically get the first line as title
  const firstLine = text.split(/\n+/).map(s => s.trim()).find(s => s.length > 5);
  if (firstLine) meta.title = firstLine;

  // Try author-like pattern (Last, First or First Last)
  const authorMatch = text.match(/[A-Z][a-z]+,?\s+[A-Z][a-z]+/);
  if (authorMatch) meta.authors = authorMatch[0];

  return meta;
}

document.addEventListener('modal:open', (ev) => {
  const name = ev.detail?.name;
  if (name !== 'upload') return;

  const modal = document.querySelector('.modal-container');
  if (!modal) return;

  const dropZone = modal.querySelector('#upload-drop-zone');
  const browseBtn = modal.querySelector('#browse-files-btn');
  const fileInput = modal.querySelector('#upload-file-input');
  const fileNameEl = modal.querySelector('#upload-file-name');
  const titleEl = modal.querySelector('#extracted-title');
  const authorsEl = modal.querySelector('#extracted-authors');
  const yearEl = modal.querySelector('#extracted-year');
  const snippetEl = modal.querySelector('#extracted-snippet');
  const addBtn = modal.querySelector('#add-to-library');
  const cancelBtn = modal.querySelector('#upload-cancel');

  let lastFile = null;
  let lastText = '';
  let lastMeta = {};

  function resetState() {
    lastFile = null;
    lastText = '';
    lastMeta = {};
    fileNameEl.textContent = '';
    titleEl.textContent = 'No file processed yet';
    authorsEl.textContent = '';
    yearEl.textContent = '';
    snippetEl.textContent = '';
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    addBtn.style.cursor = 'not-allowed';
  }

  resetState();

  function validateFile(file) {
    if (!file) return 'No file';
    if (file.size > MAX_BYTES) return 'File exceeds 50MB limit';
    if (file.type && file.type !== 'application/pdf') return 'Not a PDF file';
    if (!file.name.toLowerCase().endsWith('.pdf')) return 'Not a PDF file';
    return null;
  }

  async function handleFile(file) {
    const err = validateFile(file);
    if (err) {
      fileNameEl.textContent = err;
      return;
    }
    lastFile = file;
    fileNameEl.textContent = `Processing: ${file.name}`;
    titleEl.textContent = 'Processing...';
    snippetEl.textContent = '';

    try {
      const first = await PDFHandler.getFirstPageText(file);
      const full = await PDFHandler.extractText(file);
      lastText = full;
      lastMeta = parseMetadataFromText(first || full);

      titleEl.textContent = lastMeta.title || file.name;
      authorsEl.textContent = lastMeta.authors ? `Authors: ${lastMeta.authors}` : '';
      yearEl.textContent = lastMeta.year ? `Year: ${lastMeta.year}` : '';
      snippetEl.textContent = (full || '').slice(0, 1000) || '';

      addBtn.disabled = false;
      addBtn.style.opacity = '1';
      addBtn.style.cursor = 'pointer';
    } catch (e) {
      console.error('Failed processing PDF', e);
      titleEl.textContent = 'Failed to process PDF';
      fileNameEl.textContent = 'Processing error';
    }
  }

  // Drag & drop
  dropZone.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', (ev) => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', (ev) => {
    ev.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) handleFile(file);
  });

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!lastFile) return;
    const metadata = Object.assign({}, lastMeta, {
      id: Utils.uuid(),
      filename: lastFile.name,
      size: lastFile.size,
      uploadedAt: Utils.formatDateTime(new Date())
    });

    document.dispatchEvent(new CustomEvent('pdf:processed', { detail: { file: lastFile, text: lastText, metadata } }));
    document.dispatchEvent(new CustomEvent('modal:close'));
    resetState();
  });

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('modal:close'));
    resetState();
  });
});

// No export
