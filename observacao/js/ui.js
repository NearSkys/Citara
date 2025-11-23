import { Utils } from './utils.js';
import { Graph } from './graph.js';
import { Storage } from './storage.js';
import { Formatter } from './formatter.js';

export const UI = {
    elements: {
        projectList: document.getElementById('project-list'),
        citationList: document.getElementById('citation-list'),
        uploadStatus: document.getElementById('upload-status'),
        graphView: document.getElementById('graph-view'),
        listView: document.getElementById('list-view'),
        detailsPanel: document.getElementById('details-panel'),
        detailsContent: document.getElementById('details-content'),
        detailsActions: document.getElementById('details-actions'),
        viewGraphBtn: document.getElementById('view-graph-btn'),
        viewListBtn: document.getElementById('view-list-btn'),
        emptyState: document.getElementById('empty-state')
    },

    state: {
        currentFormat: 'abnt' // abnt, apa, ieee
    },

    init() {
        // Re-query DOM elements in case module import occurred before DOM was ready
        this.elements.projectList = document.getElementById('project-list') || this.elements.projectList;
        this.elements.citationList = document.getElementById('citation-list') || this.elements.citationList;
        this.elements.uploadStatus = document.getElementById('upload-status') || this.elements.uploadStatus;
        this.elements.graphView = document.getElementById('graph-view') || this.elements.graphView;
        this.elements.listView = document.getElementById('list-view') || this.elements.listView;
        this.elements.detailsPanel = document.getElementById('details-panel') || this.elements.detailsPanel;
        this.elements.detailsContent = document.getElementById('details-content') || this.elements.detailsContent;
        this.elements.detailsActions = document.getElementById('details-actions') || this.elements.detailsActions;
        this.elements.viewGraphBtn = document.getElementById('view-graph-btn') || this.elements.viewGraphBtn;
        this.elements.viewListBtn = document.getElementById('view-list-btn') || this.elements.viewListBtn;
        this.elements.emptyState = document.getElementById('empty-state') || this.elements.emptyState;
        // View Toggles
        this.elements.viewGraphBtn?.addEventListener('click', () => this.toggleView('graph'));
        this.elements.viewListBtn?.addEventListener('click', () => this.toggleView('list'));

        // Close Details: add collapsed class (animated) and show open button
        document.getElementById('close-details')?.addEventListener('click', () => {
            if (this.elements.detailsPanel) {
                this.elements.detailsPanel.classList.add('collapsed');
            }
            const openBtn = document.getElementById('open-details');
            if (openBtn) {
                openBtn.classList.remove('hidden');
                openBtn.setAttribute('aria-expanded', 'false');
                const ic = openBtn.querySelector('.material-symbols-outlined');
                if (ic) ic.textContent = 'chevron_right';
            }
        });

        // Open Details (restore panel)
        document.getElementById('open-details')?.addEventListener('click', () => {
            if (this.elements.detailsPanel) {
                this.elements.detailsPanel.classList.remove('collapsed');
            }
            const openBtn = document.getElementById('open-details');
            if (openBtn) {
                openBtn.setAttribute('aria-expanded', 'true');
                const ic = openBtn.querySelector('.material-symbols-outlined');
                if (ic) ic.textContent = 'chevron_left';
                openBtn.classList.add('hidden');
            }
        });

        // New Project
        document.getElementById('new-project-btn')?.addEventListener('click', async () => {
            const name = prompt('Project Name:');
            if (name) {
                await Storage.createProject(name);
                this.renderProjects();
                this.renderCitations([]);
                this.updateGraph();
            }
        });

        // Projects sidebar toggle (if elements present)
        const projectsSidebar = document.getElementById('projects-sidebar');
        const closeProjectsBtn = document.getElementById('close-projects');
        const openProjectsBtn = document.getElementById('open-projects');

        if (closeProjectsBtn) closeProjectsBtn.addEventListener('click', () => {
            if (projectsSidebar) projectsSidebar.classList.add('collapsed');
            if (openProjectsBtn) {
                openProjectsBtn.classList.remove('hidden');
                openProjectsBtn.setAttribute('aria-expanded', 'false');
                const ic = openProjectsBtn.querySelector('.material-symbols-outlined');
                if (ic) ic.textContent = 'menu';
            }
        });

        if (openProjectsBtn) openProjectsBtn.addEventListener('click', () => {
            if (projectsSidebar) projectsSidebar.classList.remove('collapsed');
            if (openProjectsBtn) {
                openProjectsBtn.setAttribute('aria-expanded', 'true');
                const ic = openProjectsBtn.querySelector('.material-symbols-outlined');
                if (ic) ic.textContent = 'menu_open';
                openProjectsBtn.classList.add('hidden');
            }
        });
    },

    toggleView(view) {
        if (view === 'graph') {
            this.elements.graphView.classList.remove('hidden');
            this.elements.listView.classList.add('hidden');
            this.elements.viewGraphBtn.classList.add('bg-background', 'shadow-sm');
            this.elements.viewGraphBtn.classList.remove('text-muted-foreground');
            this.elements.viewListBtn.classList.remove('bg-background', 'shadow-sm');
            this.elements.viewListBtn.classList.add('text-muted-foreground');
            this.updateGraph(); // Refresh graph size
        } else {
            this.elements.graphView.classList.add('hidden');
            this.elements.listView.classList.remove('hidden');
            this.elements.viewListBtn.classList.add('bg-background', 'shadow-sm');
            this.elements.viewListBtn.classList.remove('text-muted-foreground');
            this.elements.viewGraphBtn.classList.remove('bg-background', 'shadow-sm');
            this.elements.viewGraphBtn.classList.add('text-muted-foreground');
        }
    },

    renderProjects() {
        const container = this.elements.projectList;
        if (!container) return;

        container.innerHTML = '';
        Storage.data.projects.forEach(proj => {
            const el = document.createElement('a');
            el.className = `nav-item ${Storage.currentProject?.id === proj.id ? 'active' : ''}`;
            el.href = '#';
            el.dataset.id = proj.id;
            
            // Use color if available
            const iconStyle = proj.color ? `color: ${proj.color}` : '';
            const iconClass = Storage.currentProject?.id === proj.id ? 'text-primary' : 'text-muted-foreground';

            el.innerHTML = `
                <span class="material-symbols-outlined ${!proj.color ? iconClass : ''}" style="${iconStyle}">folder</span>
                <span class="truncate" style="flex:1; margin-left: 8px;">${Utils.escapeHtml(proj.name)}</span>
                <span class="material-symbols-outlined more-icon" style="font-size: 16px; opacity: 0.5;">more_horiz</span>
            `;
            
            el.addEventListener('click', async (e) => {
                e.preventDefault();
                // If clicked on the more-icon, don't switch
                if (e.target.closest('.more-icon')) return;

                await Storage.switchProject(proj.id);
                this.renderProjects(); // Re-render to update active state
                this.renderCitations(Storage.currentProject.citations);
                this.updateGraph();
            });

            // No explicit more button bound here; we rely on delegated 'more-icon' handling in modals.js

            container.appendChild(el);
        });
    },

    renderCitations(citations) {
        const container = this.elements.citationList;
        if (!container) return;

        container.innerHTML = '';

        // Handle Empty State
        if (!citations || citations.length === 0) {
            if (this.elements.emptyState) this.elements.emptyState.classList.remove('hidden');
        } else {
            if (this.elements.emptyState) this.elements.emptyState.classList.add('hidden');
        }

        citations.forEach(paper => {
            const el = document.createElement('div');
            el.className = 'p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors cursor-pointer group';

            let firstAuthor = 'Unknown';
            if (Array.isArray(paper.authors)) {
                firstAuthor = paper.authors[0]?.name || paper.authors[0] || 'Unknown';
            } else if (typeof paper.authors === 'string') {
                firstAuthor = paper.authors.split(',')[0];
            }

            // Generate formatted string for clipboard
            const formattedRef = Formatter.format(paper, this.state.currentFormat);

            el.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="font-medium text-sm leading-tight line-clamp-2">${Utils.escapeHtml(paper.title)}</h4>
                    ${paper.confidence ? `<span class="text-[10px] bg-muted px-1 rounded text-muted-foreground shrink-0 ml-2">${Math.round(paper.confidence * 100)}%</span>` : ''}
                </div>
                <div class="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>${Utils.escapeHtml(firstAuthor)}</span>
                    <span>•</span>
                    <span>${paper.year || '?'}</span>
                </div>
                <div class="mt-2 pt-2 border-t border-dashed hidden group-hover:block">
                     <button class="text-xs flex items-center gap-1 text-primary hover:underline" data-clipboard="${Utils.escapeHtml(formattedRef)}">
                        <i data-lucide="copy" class="w-3 h-3"></i> Copy (${this.state.currentFormat.toUpperCase()})
                     </button>
                </div>
            `;

            // Click on card opens details
            el.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.showDetails(paper);
                }
            });

            // Copy button
            const copyBtn = el.querySelector('button[data-clipboard]');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const text = copyBtn.getAttribute('data-clipboard');
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = originalText;
                            lucide.createIcons();
                        }, 2000);
                    });
                });
            }

            container.appendChild(el);
        });
        try { lucide.createIcons(); } catch (e) { }
    },

    showDetails(paper) {
        const panel = this.elements.detailsPanel;
        const content = this.elements.detailsContent;
        const actions = this.elements.detailsActions;

        // Ensure panel is visible in layout and slide in
        if (panel) {
            panel.style.display = 'flex';
            panel.style.transform = 'translateX(0)';
        }
        // Hide open button if present
        const openBtn = document.getElementById('open-details');
        if (openBtn) openBtn.classList.add('hidden');

        // Populate content
        let authors = 'Unknown';
        if (Array.isArray(paper.authors)) {
            authors = paper.authors.map(a => typeof a === 'string' ? a : a.name).join(', ');
        } else {
            authors = paper.authors;
        }

        const formattedRef = Formatter.format(paper, this.state.currentFormat);

        content.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h3 class="text-lg font-semibold leading-tight">${Utils.escapeHtml(paper.title)}</h3>
                    <p class="text-sm text-muted-foreground mt-1">${Utils.escapeHtml(authors)}</p>
                </div>
                
                <div class="bg-muted/50 p-3 rounded-md">
                    <p class="text-xs font-mono text-muted-foreground mb-1">Reference (${this.state.currentFormat.toUpperCase()})</p>
                    <p class="text-sm select-all">${formattedRef}</p>
                </div>

                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-muted/30 p-2 rounded">
                        <span class="block text-xs text-muted-foreground">Year</span>
                        <span class="font-medium">${paper.year || 'N/A'}</span>
                    </div>
                    <div class="bg-muted/30 p-2 rounded">
                        <span class="block text-xs text-muted-foreground">Type</span>
                        <span class="font-medium capitalize">${paper.type || 'Article'}</span>
                    </div>
                </div>

                ${paper.context ? `
                <div>
                    <h4 class="text-xs font-semibold uppercase text-muted-foreground mb-1">Context</h4>
                    <p class="text-sm italic border-l-2 border-primary/20 pl-3 py-1 bg-muted/10 rounded-r">
                        "...${Utils.escapeHtml(paper.context)}..."
                    </p>
                </div>
                ` : ''}
            </div>
        `;

        actions.classList.remove('hidden');
    },

    updateGraph() {
        if (!Storage.currentProject) return;

        // Load graph data from storage
        // The requirement specifies distinct graph data (3 nodes) vs list data (9 items)
        if (Storage.currentProject.graph && Storage.currentProject.graph.nodes) {
            Graph.data = {
                nodes: JSON.parse(JSON.stringify(Storage.currentProject.graph.nodes)), // Deep copy to avoid mutation issues
                links: JSON.parse(JSON.stringify(Storage.currentProject.graph.edges || []))
            };
        } else {
            Graph.data = { nodes: [], links: [] };
        }

        Graph.update();
    },

    showStatus(msg) {
        if (this.elements.uploadStatus) {
            this.elements.uploadStatus.textContent = msg;
            this.elements.uploadStatus.classList.remove('hidden');
        }
    },

    hideStatus() {
        if (this.elements.uploadStatus) {
            this.elements.uploadStatus.classList.add('hidden');
        }
    }
};
