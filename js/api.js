// API Handling Module

export const API = {
    // Semantic Scholar API
    async searchPapers(query, { limit = 10, page = 1 } = {}) {
        // Guard contra queries muito curtas que geram 400
        if (!query || query.trim().length < 3) {
            return { items: [], total: 0, limit, page, error: 'Query muito curta (mínimo 3 caracteres).' };
        }
        const offset = (page - 1) * limit;
        // Campos válidos segundo documentação
        const baseFields = 'title,authors,year,abstract,citationCount,doi,publicationVenue,url,externalIds';
        const endpoint = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fields=${baseFields}`;
        try {
            let response = await fetch(endpoint);
            if (!response.ok) {
                // Fallback: tentar com conjunto mínimo de campos
                const minimalFields = 'title,authors,year,url,externalIds';
                const fallbackEndpoint = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fields=${minimalFields}`;
                response = await fetch(fallbackEndpoint);
                if (!response.ok) throw new Error(`Semantic Scholar HTTP ${response.status}`);
            }
            const data = await response.json();
            return {
                items: data.data || [],
                total: data.total || 0,
                limit,
                page
            };
        } catch (error) {
            console.error('Semantic Scholar API Error:', error);
            return {
                items: [],
                total: 0,
                limit,
                page,
                error: error.message || String(error)
            };
        }
    },

    // Author Search
    async searchAuthors(query, { limit = 5 } = {}) {
        if (!query || query.trim().length < 3) return { items: [] };
        // Buscar autores relevantes
        const endpoint = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=authorId,name,paperCount,citationCount,hIndex,affiliations`;
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Semantic Scholar Author Search HTTP ${response.status}`);
            const data = await response.json();
            return { items: data.data || [] };
        } catch (error) {
            console.error('Author Search Error:', error);
            return { items: [], error: error.message };
        }
    },

    // Get Papers by Author
    async getAuthorPapers(authorId, { limit = 50, page = 1 } = {}) {
        if (!authorId) return { items: [], error: 'Author ID is missing' };
        const offset = (page - 1) * limit;
        const fields = 'title,authors,year,abstract,citationCount,doi,publicationVenue,url,externalIds';
        const endpoint = `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?limit=${limit}&offset=${offset}&fields=${fields}`;
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Semantic Scholar Author Papers HTTP ${response.status}`);
            const data = await response.json();
            // O endpoint de papers do autor retorna lista plana, sem 'total' na raiz geralmente, 
            // mas vamos assumir que a paginação é controlada pelo client sabendo o paperCount do autor se necessário.
            // Para simplificar, retornamos os items.
            return {
                items: data.data || [],
                total: data.total || 0, // Se disponível
                limit,
                page
            };
        } catch (error) {
            console.error('Author Papers Error:', error);
            return { items: [], error: error.message };
        }
    },

    // Gemini API (via REST)
    async enrichCitations(text, apiKey) {
        const prompt = `
        Analyze the following academic text and extract a list of citations.
        For each citation, provide:
        - title: string (full title if possible)
        - authors: array of strings
        - year: number
        - type: string (journal, book, conference, etc.)
        - context: string (the sentence where it was cited)
        - sentiment: string (neutral, positive, negative)
        
        Return ONLY a valid JSON array.
        
        Text: ${text.substring(0, 30000)}
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No response from Gemini");
            }

            const textResponse = data.candidates[0].content.parts[0].text;

            // Clean markdown
            const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    }
};
