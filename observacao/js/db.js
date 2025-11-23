export class CitationDB {
    constructor(dbName = 'CitationSystem', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    // Inicializar banco de dados
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            // Primeira vez que abre: criar estrutura
            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                // Object Store 1: Pesquisas
                if (!db.objectStoreNames.contains('searches')) {
                    const store = db.createObjectStore('searches', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('query', 'query', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Object Store 2: Artigos
                if (!db.objectStoreNames.contains('articles')) {
                    const store = db.createObjectStore('articles', { keyPath: 'id', autoIncrement: true }); // Using autoIncrement for simplicity if ID not provided, but we might use UUIDs
                    store.createIndex('tags', 'tags', { multiEntry: true });
                    store.createIndex('year', 'year', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
                }

                // Object Store 3: Perfis
                if (!db.objectStoreNames.contains('profiles')) {
                    const store = db.createObjectStore('profiles', { keyPath: 'id' }); // Assuming UUIDs for profiles
                    store.createIndex('name', 'name', { unique: false });
                }
            };

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
        });
    }

    // Fechar banco
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    // --- Operações CRUD - Pesquisas ---

    async saveSearch(query, results, source = 'arxiv') {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('searches', 'readwrite');
            const store = tx.objectStore('searches');
            const search = {
                query,
                results,
                source,
                timestamp: Date.now()
            };

            const request = store.add(search);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async searchByQuery(query) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('searches', 'readonly');
            const store = tx.objectStore('searches');
            const index = store.index('query');
            const request = index.getAll(query);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getRecentSearches(limit = 10) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('searches', 'readonly');
            const store = tx.objectStore('searches');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const results = [];

            request.onerror = () => reject(request.error);
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }

    async deleteSearch(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('searches', 'readwrite');
            const store = tx.objectStore('searches');
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // --- Operações CRUD - Artigos ---

    async saveArticle(articleData) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('articles', 'readwrite');
            const store = tx.objectStore('articles');
            
            // Ensure ID is present if we are using UUIDs from Utils, or let DB auto-increment if not
            // The guide suggests auto-increment or provided ID. 
            // If we use UUIDs in the app, we should use them as keys.
            // However, the guide's schema for articles used autoIncrement: true in my implementation above?
            // Wait, I used autoIncrement: true for articles. 
            // If articleData has an ID, we should probably use `put` instead of `add` to allow upsert or specify key.
            // But `add` throws if key exists. `put` updates.
            
            const article = {
                ...articleData,
                saved: Date.now(),
                citationFormats: articleData.citationFormats || {}
            };

            const request = store.put(article); // Changed to put to allow updating/inserting with specific ID
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getArticlesByTag(tag) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('articles', 'readonly');
            const store = tx.objectStore('articles');
            const index = store.index('tags');
            const request = index.getAll(tag);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getArticleById(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('articles', 'readonly');
            const store = tx.objectStore('articles');
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async updateArticle(id, updates) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('articles', 'readwrite');
            const store = tx.objectStore('articles');
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const article = getRequest.result;
                if (!article) {
                    reject(new Error('Article not found'));
                    return;
                }
                const updated = { ...article, ...updates };

                const putRequest = store.put(updated);
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(updated);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async getArticlesByYear(year) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('articles', 'readonly');
            const store = tx.objectStore('articles');
            const index = store.index('year');
            const request = index.getAll(year);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async deleteArticle(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('articles', 'readwrite');
            const store = tx.objectStore('articles');
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // --- Operações CRUD - Perfis ---

    async createProfile(profileData) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readwrite');
            const store = tx.objectStore('profiles');
            const profile = {
                ...profileData,
                created: Date.now(),
                modified: Date.now(),
                // color: this.generateRandomColor() // Assuming this method exists or passed in
            };

            const request = store.add(profile);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getAllProfiles() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readonly');
            const store = tx.objectStore('profiles');
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    
    async getProfile(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readonly');
            const store = tx.objectStore('profiles');
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async addArticleToProfile(profileId, articleId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readwrite');
            const store = tx.objectStore('profiles');
            const getRequest = store.get(profileId);
            getRequest.onsuccess = () => {
                const profile = getRequest.result;
                if (!profile) {
                    reject(new Error('Profile not found'));
                    return;
                }
                if (!profile.articles) profile.articles = [];
                
                if (!profile.articles.includes(articleId)) {
                    profile.articles.push(articleId);
                    profile.modified = Date.now();
                }

                const putRequest = store.put(profile);
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(profile);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async removeArticleFromProfile(profileId, articleId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readwrite');
            const store = tx.objectStore('profiles');
            const getRequest = store.get(profileId);
            getRequest.onsuccess = () => {
                const profile = getRequest.result;
                if (!profile) {
                    reject(new Error('Profile not found'));
                    return;
                }
                if (profile.articles) {
                    profile.articles = profile.articles.filter(id => id !== articleId);
                    profile.modified = Date.now();
                }

                const putRequest = store.put(profile);
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(profile);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async updateProfile(profileId, updates) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readwrite');
            const store = tx.objectStore('profiles');
            const getRequest = store.get(profileId);
            getRequest.onsuccess = () => {
                const profile = getRequest.result;
                if (!profile) {
                    reject(new Error('Profile not found'));
                    return;
                }
                const updated = {
                    ...profile,
                    ...updates,
                    modified: Date.now()
                };

                const putRequest = store.put(updated);
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(updated);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteProfile(profileId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readwrite');
            const store = tx.objectStore('profiles');
            const request = store.delete(profileId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }
    
    generateRandomColor() {
        const colors = [
            '#3b82f6', // Azul
            '#ef4444', // Vermelho
            '#10b981', // Verde
            '#f59e0b', // Laranja
            '#8b5cf6', // Roxo
            '#ec4899' // Rosa
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
