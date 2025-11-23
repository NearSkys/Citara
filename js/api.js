// API Handling Module

export const API = {
    // Semantic Scholar API
    async searchPapers(query) {
        try {
            const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,authors,year,abstract,citationCount`);
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Semantic Scholar API Error:", error);
            throw error;
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
