import { Utils } from './utils.js';

const STORAGE_KEY = 'citation_graph_data';
const CURRENT_PROJECT_KEY = 'citation_graph_current_project';

export const Storage = {
    data: {
        projects: [],
        settings: {
            theme: 'light',
            apiKey: ''
        }
    },
    currentProject: null,

    /**
     * Initialize storage
     */
    init() {
        this.load();

        // Load last active project
        const lastProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
        if (lastProjectId) {
            this.currentProject = this.getProject(lastProjectId);
        }

        // If no project exists, create a default one
        if (!this.currentProject && this.data.projects.length === 0) {
            this.createProject('My Research', 'Default project');
        } else if (!this.currentProject && this.data.projects.length > 0) {
            this.currentProject = this.data.projects[0];
            this.saveCurrentProjectId();
        }
    },

    /**
     * Load data from LocalStorage
     */
    load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // Merge with default structure to ensure schema integrity
                this.data = { ...this.data, ...parsed };
            } catch (e) {
                console.error('Failed to parse storage data', e);
            }
        }
    },

    /**
     * Save data to LocalStorage
     */
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    },

    /**
     * Save current project ID
     */
    saveCurrentProjectId() {
        if (this.currentProject) {
            localStorage.setItem(CURRENT_PROJECT_KEY, this.currentProject.id);
        } else {
            localStorage.removeItem(CURRENT_PROJECT_KEY);
        }
    },

    /**
     * Create a new project
     * @param {string} name 
     * @param {string} description 
     * @returns {Object} New project
     */
    createProject(name, description = '') {
        const project = {
            id: Utils.uuid(),
            name: name,
            description: description,
            created: Utils.formatDateTime(),
            updated: Utils.formatDateTime(),
            articles: [],   // List of full papers/texts
            citations: [],  // List of extracted citations
            graph: {
                nodes: [],
                edges: []
            }
        };

        this.data.projects.push(project);
        this.currentProject = project;
        this.save();
        this.saveCurrentProjectId();
        return project;
    },

    /**
     * Get a project by ID
     * @param {string} id 
     * @returns {Object|null}
     */
    getProject(id) {
        return this.data.projects.find(p => p.id === id) || null;
    },

    /**
     * Switch current project
     * @param {string} id 
     */
    switchProject(id) {
        const project = this.getProject(id);
        if (project) {
            this.currentProject = project;
            this.saveCurrentProjectId();
            return true;
        }
        return false;
    },

    /**
     * Delete a project
     * @param {string} id 
     */
    deleteProject(id) {
        this.data.projects = this.data.projects.filter(p => p.id !== id);
        if (this.currentProject && this.currentProject.id === id) {
            this.currentProject = this.data.projects.length > 0 ? this.data.projects[0] : null;
            this.saveCurrentProjectId();
        }
        this.save();
    },

    /**
     * Update the current project data
     */
    updateCurrentProject() {
        if (!this.currentProject) return;

        this.currentProject.updated = Utils.formatDateTime();

        // Find index and replace
        const index = this.data.projects.findIndex(p => p.id === this.currentProject.id);
        if (index !== -1) {
            this.data.projects[index] = this.currentProject;
            this.save();
        }
    },

    /**
     * Add an article to the current project
     * @param {Object} article 
     */
    addArticle(article) {
        if (!this.currentProject) return;

        // Check for duplicates (by title or id)
        const exists = this.currentProject.articles.some(a => a.title === article.title);
        if (exists) return;

        const newArticle = {
            id: Utils.uuid(),
            addedAt: Utils.formatDateTime(),
            ...article
        };

        this.currentProject.articles.push(newArticle);
        this.updateCurrentProject();
        return newArticle;
    },

    /**
     * Add citations to the current project
     * @param {Array} citations 
     */
    addCitations(citations) {
        if (!this.currentProject) return;

        let addedCount = 0;
        citations.forEach(cit => {
            // Simple duplicate check based on title + year
            const exists = this.currentProject.citations.some(c =>
                c.title.toLowerCase() === cit.title.toLowerCase() &&
                c.year == cit.year
            );

            if (!exists) {
                this.currentProject.citations.push({
                    id: Utils.uuid(),
                    addedAt: Utils.formatDateTime(),
                    ...cit
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.updateCurrentProject();
        }
        return addedCount;
    },

    /**
     * Get settings
     */
    getSettings() {
        return this.data.settings;
    },

    /**
     * Save settings
     * @param {Object} newSettings 
     */
    saveSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    },

    /**
     * Export current project to JSON
     */
    exportProject() {
        if (!this.currentProject) return null;
        return JSON.stringify(this.currentProject, null, 2);
    }
};
