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
        document.getElementById('new-project-btn')?.addEventListener('click', () => {
            const name = prompt('Project Name:');
            if (name) {
                Storage.createProject(name);
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
            const el = document.createElement('div');
            el.className = `project-item ${Storage.currentProject?.id === proj.id ? 'active' : ''}`;
            el.innerHTML = `
                <i data-lucide="folder" class="w-4 h-4 ${Storage.currentProject?.id === proj.id ? 'text-primary' : 'text-muted-foreground'}"></i>
                <span class="truncate">${Utils.escapeHtml(proj.name)}</span>
            `;
            el.addEventListener('click', () => {
                Storage.switchProject(proj.id);
                this.renderProjects(); // Re-render to update active state
                this.renderCitations(Storage.currentProject.citations);
                this.updateGraph();
            });
            container.appendChild(el);
        });
        try { lucide.createIcons(); } catch (e) { }
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

        // Clear existing graph data
        Graph.data = { nodes: [], links: [] };

        // Add nodes from citations
        Storage.currentProject.citations.forEach(cit => {
            Graph.addPaper({
                id: cit.id,
                title: cit.title,
                authors: cit.authors,
                year: cit.year
            });
        });

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
