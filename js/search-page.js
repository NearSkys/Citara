import { API } from './api.js';
import { Utils } from './utils.js';

// Elements
const input = document.querySelector('.search-container input.search-input[placeholder^="Enter"]');
const resultsEl = document.getElementById('search-results');
const paginationEl = document.getElementById('search-pagination');
const headerCountEl = document.querySelector('h3.text-lg + p.text-sm');
const headerTitleEl = document.querySelector('h3.text-lg');

let currentQuery = '';
let currentPage = 1;
let lastTotal = 0;
let pageSize = 10;
let isAuthorView = false;
let currentAuthorName = '';

function setLoading(msg = 'Buscando...') {
  resultsEl.innerHTML = `<div class="card" style="text-align:center; padding:1.5rem;">${msg}</div>`;
  paginationEl.innerHTML = '';
}

function renderError(msg) {
  resultsEl.innerHTML = `<div class="card" style="color: var(--danger-500);">Erro na busca: ${Utils.escapeHtml(msg)}</div>`;
}

function renderAuthorResults(authors) {
  if (!authors || authors.length === 0) return '';

  const html = authors.map(a => {
    const name = Utils.escapeHtml(a.name);
    const papers = a.paperCount || 0;
    const citations = a.citationCount || 0;
    const hIndex = a.hIndex || 0;
    const authorId = a.authorId;
    const profileUrl = `https://www.semanticscholar.org/author/${encodeURIComponent(name)}/${authorId}`;

    return `
    <div class="card" style="border-left: 4px solid var(--primary-500); background-color: var(--neutral-50);">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
             <h4 class="font-bold" style="font-size:1.1rem; color: var(--primary-700); margin:0;">${name}</h4>
             <a href="${profileUrl}" target="_blank" rel="noopener" class="btn-icon" style="width:24px;height:24px;color:var(--neutral-500);" title="Ver perfil no Semantic Scholar">
                <span class="material-symbols-outlined" style="font-size:1rem;">open_in_new</span>
             </a>
          </div>
          <div style="display:flex; gap:1rem; margin-top:0.25rem; font-size:0.85rem; color: var(--neutral-600);">
            <span>Papers: <b>${papers}</b></span>
            <span>Citations: <b>${citations}</b></span>
            <span>h-index: <b>${hIndex}</b></span>
          </div>
        </div>
        <button class="btn btn-primary-light" data-view-author="${authorId}" data-author-name="${Utils.escapeHtml(name)}">
          <span class="material-symbols-outlined">person_search</span>
          <span>Ver Artigos</span>
        </button>
      </div>
    </div>`;
  }).join('');

  return `
    <div style="margin-bottom: 1.5rem;">
      <h4 class="font-bold" style="margin-bottom: 0.5rem; color: var(--neutral-600);">Autores Encontrados</h4>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        ${html}
      </div>
    </div>
  `;
}

function renderPaperResults(items, total, append = false) {
  if (!items.length && !append) {
    resultsEl.innerHTML = '<div class="card" style="text-align:center; padding:1.5rem;">Nenhum resultado encontrado.</div>';
    paginationEl.innerHTML = '';
    if (headerCountEl) headerCountEl.textContent = 'Sem resultados';
    return;
  }

  const html = items.map(p => {
    const title = Utils.escapeHtml(p.title || 'Sem título');
    const authors = Array.isArray(p.authors) ? p.authors.map(a => a.name).join(', ') : '';
    const year = p.year || '—';
    const doi = p.doi || (p.externalIds && p.externalIds.DOI) || '';
    const paperId = p.paperId || p.id || '';
    const semanticUrl = paperId ? `https://www.semanticscholar.org/paper/${encodeURIComponent(paperId)}` : '';
    const doiUrl = doi ? `https://doi.org/${encodeURIComponent(doi)}` : '';
    const link = doiUrl || semanticUrl || (p.url || '#');
    const sourceLabel = doiUrl ? 'DOI' : (semanticUrl ? 'Semantic Scholar' : 'Link');

    return `<div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
        <div>
          <a href="${link}" target="_blank" rel="noopener" style="display:inline-block;">
            <h4 class="font-bold" style="font-size:1rem; margin-bottom:0.25rem;">${title}</h4>
          </a>
          <p class="text-sm" style="color: var(--text-muted);">${Utils.escapeHtml(authors)}</p>
          <div style="display:flex; align-items:center; gap:1rem; margin-top:0.5rem; font-size:0.75rem; color: var(--neutral-500);">
            <span>${year}</span>
            <span style="width:4px;height:4px;border-radius:50%;background-color:var(--neutral-500);"></span>
            <span title="Source">${Utils.escapeHtml(p.publicationVenue || p.venue || '')}</span>
            <span style="margin-left:0.5rem; color:var(--text-muted);">(${sourceLabel})</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
          <a class="btn btn-outline" href="${link}" target="_blank" rel="noopener" style="text-decoration:none;">
            <span class="material-symbols-outlined">open_in_new</span>
            <span>Open</span>
          </a>
          <button class="btn btn-primary-light" data-add-citation="${Utils.escapeHtml(paperId)}">
            <span class="material-symbols-outlined">add</span>
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  if (append) {
    resultsEl.insertAdjacentHTML('beforeend', html);
  } else {
    resultsEl.innerHTML = html;
  }

  if (headerCountEl && !isAuthorView) {
    headerCountEl.textContent = `Mostrando página ${currentPage} de ${Math.ceil(total / pageSize)} (${total} resultados)`;
  } else if (headerCountEl && isAuthorView) {
    headerCountEl.textContent = `Artigos de ${currentAuthorName}`;
  }

  if (!isAuthorView) renderPagination(total);
  else paginationEl.innerHTML = ''; // Simple author view no pagination for now or add later
}

function renderPagination(total) {
  lastTotal = total;
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) { paginationEl.innerHTML = ''; return; }

  let buttons = '';
  const maxButtons = 7;
  const start = Math.max(1, currentPage - 3);
  const end = Math.min(pages, start + maxButtons - 1);

  buttons += `<button class="page-item" ${currentPage === 1 ? 'disabled' : ''} data-page="prev"><span class="material-symbols-outlined" style="font-size:1.25rem;">chevron_left</span></button>`;

  for (let p = start; p <= end; p++) {
    buttons += `<button class="page-item ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }

  if (end < pages) {
    buttons += `<div class="page-item" style="cursor:default;">...</div>`;
    buttons += `<button class="page-item" data-page="${pages}">${pages}</button>`;
  }

  buttons += `<button class="page-item" ${currentPage === pages ? 'disabled' : ''} data-page="next"><span class="material-symbols-outlined" style="font-size:1.25rem;">chevron_right</span></button>`;

  paginationEl.innerHTML = `<div class="pagination">${buttons}</div>`;
}

async function performSearch(query, page = 1) {
  currentQuery = query.trim();
  currentPage = page;
  isAuthorView = false;
  currentAuthorName = '';

  if (headerTitleEl) headerTitleEl.textContent = 'Search Results';

  if (!currentQuery) {
    resultsEl.innerHTML = '<div class="card" style="text-align:center; padding:1.5rem;">Digite termos para pesquisar.</div>';
    paginationEl.innerHTML = '';
    return;
  }

  setLoading();

  // Parallel search for Authors and Papers
  const [authorRes, paperRes] = await Promise.all([
    page === 1 ? API.searchAuthors(currentQuery) : Promise.resolve({ items: [] }), // Only search authors on page 1
    API.searchPapers(currentQuery, { limit: pageSize, page: currentPage })
  ]);

  if (paperRes.error) return renderError(paperRes.error);

  // Clear loading
  resultsEl.innerHTML = '';

  // Render Authors first
  if (authorRes.items && authorRes.items.length > 0) {
    resultsEl.innerHTML += renderAuthorResults(authorRes.items);
  }

  // Render Papers
  // Wrap papers in a container
  const papersContainer = document.createElement('div');
  papersContainer.id = 'papers-list';
  papersContainer.style.display = 'flex';
  papersContainer.style.flexDirection = 'column';
  papersContainer.style.gap = '1rem';

  if (authorRes.items && authorRes.items.length > 0) {
    const separator = document.createElement('div');
    separator.innerHTML = '<h4 class="font-bold" style="margin: 1.5rem 0 0.5rem; color: var(--neutral-600);">Resultados Gerais (Texto)</h4>';
    resultsEl.appendChild(separator);
  }

  resultsEl.appendChild(papersContainer);

  if (!paperRes.items.length) {
    papersContainer.innerHTML = '<div class="card" style="text-align:center; padding:1.5rem;">Nenhum artigo encontrado por texto.</div>';
    if (!authorRes.items.length) {
      paginationEl.innerHTML = '';
      if (headerCountEl) headerCountEl.textContent = 'Sem resultados';
    }
  } else {
    const html = paperRes.items.map(p => {
      const title = Utils.escapeHtml(p.title || 'Sem título');
      const authors = Array.isArray(p.authors) ? p.authors.map(a => a.name).join(', ') : '';
      const year = p.year || '—';
      const doi = p.doi || (p.externalIds && p.externalIds.DOI) || '';
      const paperId = p.paperId || p.id || '';
      const semanticUrl = paperId ? `https://www.semanticscholar.org/paper/${encodeURIComponent(paperId)}` : '';
      const doiUrl = doi ? `https://doi.org/${encodeURIComponent(doi)}` : '';
      const link = doiUrl || semanticUrl || (p.url || '#');
      const sourceLabel = doiUrl ? 'DOI' : (semanticUrl ? 'Semantic Scholar' : 'Link');

      return `<div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
            <div>
              <a href="${link}" target="_blank" rel="noopener" style="display:inline-block;">
                <h4 class="font-bold" style="font-size:1rem; margin-bottom:0.25rem;">${title}</h4>
              </a>
              <p class="text-sm" style="color: var(--text-muted);">${Utils.escapeHtml(authors)}</p>
              <div style="display:flex; align-items:center; gap:1rem; margin-top:0.5rem; font-size:0.75rem; color: var(--neutral-500);">
                <span>${year}</span>
                <span style="width:4px;height:4px;border-radius:50%;background-color:var(--neutral-500);"></span>
                <span title="Source">${Utils.escapeHtml(p.publicationVenue || p.venue || '')}</span>
                <span style="margin-left:0.5rem; color:var(--text-muted);">(${sourceLabel})</span>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
              <a class="btn btn-outline" href="${link}" target="_blank" rel="noopener" style="text-decoration:none;">
                <span class="material-symbols-outlined">open_in_new</span>
                <span>Open</span>
              </a>
              <button class="btn btn-primary-light" data-add-citation="${Utils.escapeHtml(paperId)}">
                <span class="material-symbols-outlined">add</span>
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
    papersContainer.innerHTML = html;

    if (headerCountEl) headerCountEl.textContent = `Mostrando página ${currentPage} de ${Math.ceil(paperRes.total / pageSize)} (${paperRes.total} resultados)`;
    renderPagination(paperRes.total);
  }
}

async function loadAuthorPapers(authorId, name) {
  isAuthorView = true;
  currentAuthorName = name;
  if (headerTitleEl) headerTitleEl.textContent = `Artigos de: ${name}`;

  setLoading(`Carregando artigos de ${name}...`);

  const { items, total, error } = await API.getAuthorPapers(authorId, { limit: 10 });

  if (error) return renderError(error);

  // Filter to ensure strict match if possible (though API should be correct)
  // Note: API returns authors list. We can check if authorId is present.
  const filteredItems = items.filter(p => {
    if (!p.authors) return false;
    return p.authors.some(a => a.authorId === authorId);
  });

  const displayItems = filteredItems.length > 0 ? filteredItems : items; // Fallback if filter removes everything (e.g. data inconsistency)

  const profileUrl = `https://www.semanticscholar.org/author/${encodeURIComponent(name)}/${authorId}`;

  // Render back button and info
  resultsEl.innerHTML = `
        <div style="margin-bottom: 1rem; display:flex; justify-content:space-between; align-items:center;">
            <button class="btn btn-outline" id="back-to-search">
                <span class="material-symbols-outlined">arrow_back</span>
                <span>Voltar para Pesquisa</span>
            </button>
            <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-outline" style="font-size:0.875rem;">
                <span>Ver Perfil Oficial</span>
                <span class="material-symbols-outlined" style="font-size:1rem;">open_in_new</span>
            </a>
        </div>
    `;

  // Render papers
  const papersContainer = document.createElement('div');
  papersContainer.style.display = 'flex';
  papersContainer.style.flexDirection = 'column';
  papersContainer.style.gap = '1rem';
  resultsEl.appendChild(papersContainer);

  if (!displayItems.length) {
    papersContainer.innerHTML = '<div class="card">Este autor não possui artigos listados.</div>';
  } else {
    const html = displayItems.map(p => {
      const title = Utils.escapeHtml(p.title || 'Sem título');
      const authors = Array.isArray(p.authors) ? p.authors.map(a => a.name).join(', ') : '';
      const year = p.year || '—';
      const paperId = p.paperId || p.id || '';
      const link = p.url || `https://www.semanticscholar.org/paper/${paperId}`;

      return `<div class="card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div>
                  <a href="${link}" target="_blank" rel="noopener" style="display:inline-block;">
                    <h4 class="font-bold" style="font-size:1rem; margin-bottom:0.25rem;">${title}</h4>
                  </a>
                  <p class="text-sm" style="color: var(--text-muted);">${Utils.escapeHtml(authors)}</p>
                  <div style="display:flex; align-items:center; gap:1rem; margin-top:0.5rem; font-size:0.75rem; color: var(--neutral-500);">
                    <span>${year}</span>
                    <span style="width:4px;height:4px;border-radius:50%;background-color:var(--neutral-500);"></span>
                    <span title="Citations">${p.citationCount || 0} cit.</span>
                  </div>
                </div>
                <button class="btn btn-primary-light" data-add-citation="${Utils.escapeHtml(paperId)}">
                    <span class="material-symbols-outlined">add</span>
                    <span>Adicionar</span>
                </button>
              </div>
            </div>`;
    }).join('');
    papersContainer.innerHTML = html;
  }

  if (headerCountEl) headerCountEl.textContent = `${displayItems.length} artigos encontrados`;
  paginationEl.innerHTML = ''; // No pagination for simple author view yet
}

// Require explicit search trigger: Enter key or click on search icon
const searchIcon = (input && input.closest && input.closest('.search-container'))
  ? input.closest('.search-container').querySelector('.search-icon')
  : document.querySelector('.search-container .search-icon');
if (searchIcon) {
  searchIcon.style.cursor = 'pointer';
  searchIcon.addEventListener('click', () => {
    performSearch(input.value, 1);
  });
}

// Trigger search on Enter key
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    performSearch(input.value, 1);
  }
});

// Pagination click handler
paginationEl.addEventListener('click', e => {
  const btn = e.target.closest('button.page-item');
  if (!btn) return;
  const val = btn.getAttribute('data-page');
  if (val === 'prev') {
    if (currentPage > 1) performSearch(currentQuery, currentPage - 1);
  } else if (val === 'next') {
    const pages = Math.ceil(lastTotal / pageSize);
    if (currentPage < pages) performSearch(currentQuery, currentPage + 1);
  } else {
    performSearch(currentQuery, parseInt(val, 10));
  }
});

// Event delegation for Author View and Back button
resultsEl.addEventListener('click', e => {
  const authorBtn = e.target.closest('button[data-view-author]');
  if (authorBtn) {
    const authorId = authorBtn.dataset.viewAuthor;
    const name = authorBtn.dataset.authorName;
    loadAuthorPapers(authorId, name);
    return;
  }

  const backBtn = e.target.closest('#back-to-search');
  if (backBtn) {
    performSearch(currentQuery, currentPage);
    return;
  }
});

// Optional: trigger initial search if query param exists
(function initFromURL() {
  try {
    const url = new URL(location.href);
    const q = url.searchParams.get('q');
    if (q) {
      input.value = q;
      performSearch(q, 1);
    }
  } catch (e) {
    // ignore
  }
})();

// Expose for debugging
window.citaraSearch = { performSearch };
