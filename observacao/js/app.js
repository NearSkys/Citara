import { API } from './api.js';
import { PDFHandler } from './pdf-handler.js';
import { Graph } from './graph.js';
import { Storage } from './storage.js';
import { Parser } from './parser.js';
import { UI } from './ui.js';

// Expose objects for legacy / non-module scripts (modals.js expects window.Storage and window.UI)
try {
    window.Storage = Storage;
    window.UI = UI;
} catch (e) { /* noop */ }

async function init() {
    // Initialize Storage
    await Storage.init();
    console.log('Storage initialized. Current Project:', Storage.currentProject?.name);

    // Expose to window for legacy scripts (modals.js uses window.Storage/UI)
    try {
        window.Storage = Storage;
        window.UI = UI;
    } catch (e) { /* noop */ }

    // Initialize Icons
    try { lucide.createIcons(); } catch (e) { }

    // Initialize Graph
    try { Graph.init('graph-view'); } catch (e) { console.warn('Graph init failed', e); }

    // Initialize UI
    try { UI.init(); } catch (e) { console.warn('UI init failed', e); }

    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const settingsBtn = document.getElementById('settings-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    // Initial Render
    UI.renderProjects();
    if (Storage.currentProject) {
        UI.renderCitations(Storage.currentProject.citations);
        UI.updateGraph();
    }

    // Settings Handler
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const currentKey = Storage.getSettings().apiKey || '';
            const newKey = prompt('Enter Gemini API Key:', currentKey);
            if (newKey !== null) {
                Storage.saveSettings({ apiKey: newKey.trim() });
                alert('API Key saved!');
            }
        });
    }

    // File Upload Handler
    if (fileInput) {
        fileInput.addEventListener('change', async (ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;

            UI.showStatus('Processing...');

            try {
                // 1. Extract Text (Local)
                UI.showStatus('Extracting text...');
                const text = await PDFHandler.extractText(file);
                const firstPage = await PDFHandler.getFirstPageText(file);

                // 2. Extract Metadata (Local)
                const metadata = Parser.extractMetadata(firstPage);

                // Add the main paper to the project
                await Storage.addArticle({
                    title: metadata.title,
                    authors: metadata.authors,
                    year: metadata.year,
                    content: text.substring(0, 1000) + '...' // Store preview
                });

                // 3. Extract Citations (Local Regex)
                UI.showStatus('Scanning for citations (Local)...');
                const localCitations = Parser.extractCitations(text);

                // 4. Save to Storage
                if (localCitations.length > 0) {
                    const count = await Storage.addCitations(localCitations);
                    UI.showStatus(`Found ${localCitations.length} citations (${count} new).`);
                } else {
                    UI.showStatus('No citations found locally.');
                }

                // 5. Update UI
                UI.renderCitations(Storage.currentProject.citations);
                UI.updateGraph();

            } catch (err) {
                console.error(err);
                UI.showStatus('Error processing file.');
                alert('Failed to process PDF. Check console.');
            } finally {
                setTimeout(() => {
                    UI.hideStatus();
                }, 3000);
                fileInput.value = ''; // Reset input
            }
        });
    }

    // Search Handler
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const q = searchInput?.value?.trim();
            if (!q) return;

            searchBtn.disabled = true;
            searchBtn.textContent = 'Searching...';

            try {
                const results = await API.searchPapers(q);
                // Render search results temporarily
                UI.renderCitations(results);
            } catch (err) {
                console.error(err);
                alert('Search failed.');
            } finally {
                searchBtn.disabled = false;
                searchBtn.textContent = 'Search';
            }
        });
    }
}

// Start App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
