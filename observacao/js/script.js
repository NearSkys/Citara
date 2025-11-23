// Ensure a hidden file input exists for upload workflows so `app.js` can find it
function ensureHiddenFileInput() {
    if (document.getElementById('file-input')) return;
    const dropZone = document.querySelector('.drop-zone');
    const browseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Browse Files');
    if (!dropZone && !browseBtn) return; // nothing to attach to

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.id = 'file-input';
    input.style.display = 'none';

    // Append to dropZone if present, else to body
    (dropZone || document.body).appendChild(input);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureHiddenFileInput);
} else {
    // DOM already parsed; ensure immediately
    ensureHiddenFileInput();
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Modals ---
    const uploadModal = document.getElementById('upload-modal');
    const settingsModal = document.getElementById('settings-modal');

    // Robust button lookup: look for button that contains visible text "Upload PDF" or an inner span with the icon name
    function findButtonByText(text) {
        return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().includes(text));
    }

    function findButtonByIconName(iconName) {
        return Array.from(document.querySelectorAll('button')).find(b => {
            const span = b.querySelector('span.material-symbols-outlined');
            return span && span.textContent && span.textContent.trim() === iconName;
        });
    }

    const uploadBtn = findButtonByText('Upload PDF') || findButtonByIconName('upload_file');
    const settingsBtn = findButtonByIconName('settings') || Array.from(document.querySelectorAll('button')).find(b => b.classList.contains('btn-icon'));

    // Helper to open modal
    function openModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
            // Animate in (optional, if using CSS transitions)
        }
    }

    // Helper to close modal
    function closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Open Modals
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (uploadModal) {
                openModal(uploadModal);
            } else {
                // If modal HTML is not embedded on this page, navigate to the upload page
                window.location.href = 'upload_modal.html';
            }
        });
    }
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsModal) {
                openModal(settingsModal);
            } else {
                // Navigate to settings page if modal not present
                window.location.href = 'settings_modal.html';
            }
        });
    }

    // Close Modals (Cancel buttons, Close icons, Overlay click)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.parentElement); // Assuming overlay is child of modal wrapper or is the wrapper
                // In our HTML structure, .modal-overlay IS the wrapper.
                if (e.target.classList.contains('modal-overlay')) {
                    e.target.classList.add('hidden');
                }
            }
        });
    });

    document.querySelectorAll('.modal-header .btn-icon').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    document.querySelectorAll('.modal-footer .btn-outline').forEach(btn => {
        if (btn.textContent.trim() === 'Cancel') {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                closeModal(modal);
            });
        }
    });

    // --- Project Actions ---
    const newProjectBtn = document.querySelector('.sidebar-section .btn-primary-light');
    const projectList = document.getElementById('project-list') || document.querySelector('.sidebar-section:first-child > div:last-child'); // Container of nav-items

    // New Project
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', async () => {
            const projectName = prompt("Enter project name:");
            if (projectName && projectName.trim() !== "") {
                // If app is loaded, delegate to Storage to persist
                if (window.Storage && window.UI) {
                    try {
                        await window.Storage.createProject(projectName);
                        window.UI.renderProjects();
                        if (window.UI.renderCitations && window.Storage.currentProject) {
                            window.UI.renderCitations(window.Storage.currentProject.citations);
                        }
                        if (window.UI.updateGraph) window.UI.updateGraph();
                        return;
                    } catch (e) {
                        console.error('Failed to persist new project via Storage', e);
                    }
                }

                // Fallback: create a temporary nav-item just-in-DOM
                const newItem = document.createElement('a');
                newItem.className = 'nav-item';
                newItem.href = '#';
                newItem.innerHTML = `
                    <span>${projectName}</span>
                    <span class="material-symbols-outlined more-icon">more_horiz</span>
                `;
                // Add event listener for the new more icon
                const moreIcon = newItem.querySelector('.more-icon');
                setupDropdown(moreIcon, newItem);

                if (projectList) projectList.appendChild(newItem);
            }
        });
    }

    // Dropdown Logic for existing and new projects
    function setupDropdown(trigger, item) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Close any open dropdowns
            closeAllDropdowns();

            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown-menu';
            dropdown.innerHTML = `
                <a href="#" class="dropdown-item" data-action="rename">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem;">edit</span>
                    Rename
                </a>
                <a href="#" class="dropdown-item text-danger" data-action="delete">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem;">delete</span>
                    Delete
                </a>
            `;

            // Position dropdown
            // For simplicity in this mock, we'll append to the item and use absolute positioning relative to item
            item.style.position = 'relative';
            item.appendChild(dropdown);

            // Handle dropdown actions
            dropdown.querySelectorAll('.dropdown-item').forEach(actionBtn => {
                actionBtn.addEventListener('click', (evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    const action = actionBtn.dataset.action;

                    if (action === 'rename') {
                        const currentNameSpan = item.querySelector('span:first-child');
                        const newName = prompt("Rename project:", currentNameSpan.textContent);
                        if (newName && newName.trim() !== "") {
                            currentNameSpan.textContent = newName;
                        }
                    } else if (action === 'delete') {
                        if (confirm("Are you sure you want to delete this project?")) {
                            item.remove();
                        }
                    }
                    closeAllDropdowns();
                });
            });
        });
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.remove());
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    // Setup existing project items
    document.querySelectorAll('.nav-item .more-icon').forEach(icon => {
        setupDropdown(icon, icon.closest('.nav-item'));
    });


    // --- Citation Actions ---
    const copyBtn = document.querySelector('.details-actions .btn-outline:nth-child(2)');
    const editBtn = document.querySelector('.details-actions .btn-primary');

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            // Mock copy
            alert("Citation copied to clipboard!");
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // Mock edit
            alert("Edit mode enabled.");
        });
    }

    // --- Upload: connect all "Browse Files" buttons and all .drop-zone elements to a single input#file-input ---
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        // Attach click to any button whose text contains "Browse Files" (case-insensitive)
        const browseButtons = Array.from(document.querySelectorAll('button')).filter(b => {
            return b.textContent && b.textContent.trim().toLowerCase().includes('browse files');
        });

        browseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                fileInput.click();
            });
        });

        // Attach drag & drop handlers to all drop-zone elements
        const dropZones = Array.from(document.querySelectorAll('.drop-zone'));
        dropZones.forEach(dropZone => {
            ['dragenter', 'dragover'].forEach(ev => {
                dropZone.addEventListener(ev, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('drag-over');
                });
            });

            ['dragleave', 'dragend'].forEach(ev => {
                dropZone.addEventListener(ev, (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('drag-over');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    // Prefer to trigger app.js via the input element's change event.
                    // Assigning to input.files may be restricted, but most browsers allow it when created programmatically.
                    try {
                        // Create a DataTransfer to set input.files if needed
                        if (typeof DataTransfer === 'function') {
                            const dataTransfer = new DataTransfer();
                            Array.from(dt.files).forEach(f => dataTransfer.items.add(f));
                            fileInput.files = dataTransfer.files;
                        } else {
                            // Fallback: attempt direct assignment
                            fileInput.files = dt.files;
                        }
                        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                    } catch (err) {
                        console.warn('Unable to set input.files programmatically', err);
                        if (window.handleDroppedFiles) {
                            window.handleDroppedFiles(Array.from(dt.files));
                        }
                    }
                }
            });
        });
    }

    // Prevent duplicate rapid `change` events from triggering processing twice.
    if (fileInput) {
        fileInput.__lastChange = fileInput.__lastChange || 0;
        fileInput.addEventListener('change', (e) => {
            const now = Date.now();
            // If a change event occurred recently (within 800ms), stop further propagation for this event
            if (fileInput.__lastChange && (now - fileInput.__lastChange) < 800) {
                try {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                } catch (err) { }
                console.log('Ignored duplicate file-input change event');
                return;
            }
            fileInput.__lastChange = now;
        }, true); // use capture so this runs before other listeners
    }

    // --- Search & Filters for List View ---
    // Find the main header search input (prefers placeholder with "Search")
    function findHeaderSearch() {
        const inputs = Array.from(document.querySelectorAll('input.search-input'));
        return inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('search')) || inputs[0] || null;
    }

    const headerSearch = findHeaderSearch();
    let activeTypeFilters = new Set();

    function getTableRows() {
        const table = document.querySelector('.data-table');
        if (!table) return [];
        return Array.from(table.querySelectorAll('tbody tr'));
    }

    function extractRowData(row) {
        const cols = Array.from(row.querySelectorAll('td'));
        return {
            title: (cols[1] && cols[1].textContent) ? cols[1].textContent.trim() : '',
            authors: (cols[2] && cols[2].textContent) ? cols[2].textContent.trim() : '',
            year: (cols[3] && cols[3].textContent) ? cols[3].textContent.trim() : '',
            type: (cols[4] && cols[4].textContent) ? cols[4].textContent.trim() : ''
        };
    }

    function filterTable(query) {
        const q = (query || '').toLowerCase().trim();
        const rows = getTableRows();
        rows.forEach(row => {
            const data = extractRowData(row);
            let matchesQuery = true;
            if (q) {
                matchesQuery = (data.title + ' ' + data.authors + ' ' + data.year + ' ' + data.type).toLowerCase().includes(q);
            }

            let matchesType = true;
            if (activeTypeFilters.size > 0) {
                matchesType = activeTypeFilters.has(data.type);
            }

            if (matchesQuery && matchesType) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Build filter panel for types
    const filtersBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Filters');
    let filtersPanel = null;

    function buildFiltersPanel() {
        // remove existing
        if (filtersPanel) filtersPanel.remove();

        const types = new Set();
        getTableRows().forEach(r => types.add(extractRowData(r).type));

        filtersPanel = document.createElement('div');
        filtersPanel.className = 'filters-panel';
        filtersPanel.style.position = 'absolute';
        filtersPanel.style.zIndex = 1000;
        filtersPanel.style.background = 'var(--background)';
        filtersPanel.style.border = '1px solid var(--neutral-200)';
        filtersPanel.style.padding = '0.5rem';
        filtersPanel.style.borderRadius = '6px';
        filtersPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';

        types.forEach(t => {
            const id = `filter-type-${t.replace(/\s+/g, '-')}`;
            const row = document.createElement('label');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '0.5rem';
            row.style.marginBottom = '0.25rem';
            row.innerHTML = `<input type="checkbox" data-type="${t}" id="${id}"> <span style="font-size:0.9rem">${t || 'Unknown'}</span>`;
            filtersPanel.appendChild(row);
        });

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '0.5rem';
        actions.style.marginTop = '0.5rem';
        actions.innerHTML = `<button class="btn btn-outline btn-sm" id="clear-filters">Clear</button>`;
        filtersPanel.appendChild(actions);

        // Events
        filtersPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const t = cb.dataset.type;
                if (cb.checked) activeTypeFilters.add(t);
                else activeTypeFilters.delete(t);
                filterTable(headerSearch ? headerSearch.value : '');
            });
        });

        filtersPanel.querySelector('#clear-filters').addEventListener('click', () => {
            activeTypeFilters.clear();
            filtersPanel.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
            filterTable(headerSearch ? headerSearch.value : '');
        });

        document.body.appendChild(filtersPanel);
        return filtersPanel;
    }

    function toggleFiltersPanel(btn) {
        if (!btn) return;
        if (filtersPanel && document.body.contains(filtersPanel)) {
            filtersPanel.remove();
            filtersPanel = null;
            return;
        }
        const panel = buildFiltersPanel();
        const rect = btn.getBoundingClientRect();
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.bottom + 8}px`;
    }

    if (filtersBtn) {
        filtersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFiltersPanel(filtersBtn);
        });
    }

    if (headerSearch) {
        headerSearch.addEventListener('input', (e) => {
            filterTable(e.target.value);
        });
        headerSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                headerSearch.value = '';
                activeTypeFilters.clear();
                if (filtersPanel) filtersPanel.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
                filterTable('');
            }
        });
    }

    // Initial filter run in case table exists
    filterTable('');

});
