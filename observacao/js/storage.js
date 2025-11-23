import { Utils } from './utils.js';
import { CitationDB } from './db.js';

const CURRENT_PROJECT_KEY = 'citation_graph_current_project';

export const Storage = {
    db: new CitationDB(),
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
    async init() {
        await this.db.init();

        // Load all projects from DB
        this.data.projects = await this.db.getAllProfiles();

        // Load last active project
        const lastProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
        if (lastProjectId) {
            this.currentProject = this.data.projects.find(p => p.id === lastProjectId) || null;
        }

        // If no project exists, create a default one
        if (!this.currentProject && this.data.projects.length === 0) {
            await this.seedDefaultProject();
        } else if (!this.currentProject && this.data.projects.length > 0) {
            this.currentProject = this.data.projects[0];
            this.saveCurrentProjectId();
        }

        // Load articles for current project
        if (this.currentProject) {
            await this.loadProjectArticles();
        }
    },

    async loadProjectArticles() {
        if (!this.currentProject) return;

        // In the DB schema, profiles have a list of article IDs.
        // We need to fetch the actual article objects.
        // However, the current app structure expects `citations` array in the project object.
        // We will map DB articles to `citations`.

        if (this.currentProject.articles && this.currentProject.articles.length > 0) {
            const articles = [];
            for (const id of this.currentProject.articles) {
                const article = await this.db.getArticleById(id);
                if (article) articles.push(article);
            }
            this.currentProject.citations = articles;
        } else {
            this.currentProject.citations = [];
        }
    },

    /**
     * Seed the default "Thesis Chapter 1" project
     */
    async seedDefaultProject() {
        const project = await this.createProject('Thesis Chapter 1', 'Initial research for chapter 1');

        // 1. Add 9 sample citations
        const sampleCitations = [
            { title: "Deep Learning for Graphs", authors: [{ name: "Wu, Z." }], year: 2020, type: "Review", abstract: "A comprehensive survey on graph neural networks.", tags: ["AI", "Graphs"] },
            { title: "Graph Attention Networks", authors: [{ name: "Velickovic, P." }], year: 2018, type: "Method", abstract: "Novel neural network architectures that operate on graph-structured data.", tags: ["Attention", "GNN"] },
            { title: "Semi-Supervised Classification with Graph Convolutional Networks", authors: [{ name: "Kipf, T.N." }], year: 2017, type: "Method", abstract: "Scalable approach for semi-supervised learning on graph-structured data.", tags: ["GCN", "Seminal"] },
            { title: "Inductive Representation Learning on Large Graphs", authors: [{ name: "Hamilton, W.L." }], year: 2017, type: "Method", abstract: "GraphSAGE: Inductive representation learning.", tags: ["Scalability"] },
            { title: "Representation Learning on Graphs: Methods and Applications", authors: [{ name: "Hamilton, W.L." }], year: 2017, type: "Review", abstract: "Overview of representation learning on graphs.", tags: ["Review"] },
            { title: "Attention Is All You Need", authors: [{ name: "Vaswani, A." }], year: 2017, type: "Method", abstract: "Transformer architecture.", tags: ["NLP", "Transformer"] },
            { title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: [{ name: "Devlin, J." }], year: 2019, type: "Method", abstract: "New language representation model.", tags: ["NLP"] },
            { title: "Visualizing Data using t-SNE", authors: [{ name: "Maaten, L." }], year: 2008, type: "Method", abstract: "Technique for dimensionality reduction.", tags: ["Visualization"] },
            { title: "UMAP: Uniform Manifold Approximation and Projection", authors: [{ name: "McInnes, L." }], year: 2018, type: "Method", abstract: "Dimension reduction technique.", tags: ["Visualization"] }
        ];

        this.currentProject = project; // Ensure it's active for addCitations
        await this.addCitations(sampleCitations);

        // 2. Add 3 sample graph nodes (subset of citations)
        // We'll just manually construct the graph data for now as per requirement
        project.graph = {
            nodes: [
                { id: "1", label: "Graph Attention Networks", group: "Method" },
                { id: "2", label: "Deep Learning for Graphs", group: "Review" },
                { id: "3", label: "Semi-Supervised Classification", group: "Method" }
            ],
            edges: [
                { source: "1", target: "2" },
                { source: "3", target: "2" }
            ]
        };

        await this.updateCurrentProject();

        // 3. Add sample search results
        project.searchResults = {
            query: "Graph Neural Networks",
            timestamp: Utils.formatDateTime(),
            results: [
                { title: "A Comprehensive Survey on Graph Neural Networks", authors: [{ name: "Wu, Z." }], year: 2020, paperId: "sample1" },
                { title: "Graph Neural Networks: A Review of Methods and Applications", authors: [{ name: "Zhou, J." }], year: 2020, paperId: "sample2" }
            ]
        };

        await this.updateCurrentProject();

        this.saveCurrentProjectId();
        console.log("Seeded default project: Thesis Chapter 1");
    },

    /**
     * Load data from LocalStorage
     * Deprecated in favor of DB, but kept for settings
     */
    load() {
        // Settings still in localStorage for now or move to DB?
        // Guide doesn't specify settings store, so keep in localStorage or add to DB.
        // For simplicity, keep settings in localStorage or memory.
    },

    /**
     * Save data to LocalStorage
     * Deprecated
     */
    save() {
        // No-op for projects, maybe save settings
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
     * @param {string} color
     * @param {Array} tags
     * @returns {Object} New project
     */
    async createProject(name, description = '', color = '', tags = []) {
        const project = {
            id: Utils.uuid(),
            name: name,
            description: description,
            color: color,
            tags: tags,
            created: Utils.formatDateTime(),
            updated: Utils.formatDateTime(),
            articles: [],   // List of article IDs
            citations: [],  // In-memory list of full articles
            graph: {
                nodes: [],
                edges: []
            },
            selectedPaperId: null,
            searchResults: { // Store last search state
                query: '',
                results: [],
                timestamp: null
            }
        };

        await this.db.createProfile(project);
        this.data.projects.push(project);
        this.currentProject = project;
        this.saveCurrentProjectId();
        return project;
    },

    /**
     * Update project metadata (name, color, tags)
     * @param {string} id
     * @param {Object} metadata
     */
    async updateProjectMetadata(id, { name, color, tags }) {
        const project = this.data.projects.find(p => p.id === id);
        if (project) {
            if (name) project.name = name;
            if (color !== undefined) project.color = color;
            if (tags !== undefined) project.tags = tags;
            project.updated = Utils.formatDateTime();

            await this.db.updateProfile(id, project);

            // If it's the current project, ensure consistency
            if (this.currentProject && this.currentProject.id === id) {
                this.currentProject = project;
            }
            return true;
        }
        return false;
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
    async switchProject(id) {
        const project = this.getProject(id);
        if (project) {
            this.currentProject = project;
            await this.loadProjectArticles();
            this.saveCurrentProjectId();
            return true;
        }
        return false;
    },

    /**
     * Delete a project
     * @param {string} id 
     */
    async deleteProject(id) {
        await this.db.deleteProfile(id);
        this.data.projects = this.data.projects.filter(p => p.id !== id);
        if (this.currentProject && this.currentProject.id === id) {
            this.currentProject = this.data.projects.length > 0 ? this.data.projects[0] : null;
            if (this.currentProject) await this.loadProjectArticles();
            this.saveCurrentProjectId();
        }
    },

    /**
     * Update the current project data
     */
    async updateCurrentProject() {
        if (!this.currentProject) return;

        this.currentProject.updated = Utils.formatDateTime();

        // We need to save the project metadata (graph, searchResults, selectedPaperId)
        // The articles list is just IDs in the DB profile.

        // Ensure articles list matches citations
        this.currentProject.articles = this.currentProject.citations.map(c => c.id);

        await this.db.updateProfile(this.currentProject.id, this.currentProject);

        // Update in memory list
        const index = this.data.projects.findIndex(p => p.id === this.currentProject.id);
        if (index !== -1) {
            this.data.projects[index] = this.currentProject;
        }
    },

    /**
     * Add an article to the current project
     * @param {Object} article 
     */
    async addArticle(article) {
        if (!this.currentProject) return;

        // Check for duplicates (by title or id)
        const exists = this.currentProject.citations.some(a => a.title === article.title);
        if (exists) return;

        const newArticle = {
            id: Utils.uuid(),
            addedAt: Utils.formatDateTime(),
            ...article
        };

        // Save article to DB
        await this.db.saveArticle(newArticle);

        // Add to project in memory
        this.currentProject.citations.push(newArticle);

        // Add to project in DB
        await this.db.addArticleToProfile(this.currentProject.id, newArticle.id);

        await this.updateCurrentProject();
        return newArticle;
    },

    /**
     * Add citations to the current project
     * @param {Array} citations 
     */
    async addCitations(citations) {
        if (!this.currentProject) return;

        let addedCount = 0;
        for (const cit of citations) {
            // Simple duplicate check based on title + year
            const exists = this.currentProject.citations.some(c =>
                c.title.toLowerCase() === cit.title.toLowerCase() &&
                c.year == cit.year
            );

            if (!exists) {
                const newArticle = {
                    id: Utils.uuid(),
                    addedAt: Utils.formatDateTime(),
                    ...cit
                };

                await this.db.saveArticle(newArticle);
                this.currentProject.citations.push(newArticle);
                await this.db.addArticleToProfile(this.currentProject.id, newArticle.id);

                addedCount++;
            }
        }

        if (addedCount > 0) {
            await this.updateCurrentProject();
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
