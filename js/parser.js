/**
 * Parser Module for Local Citation Extraction
 */

export const Parser = {
    patterns: {
        // (Smith, 2020) or (Smith et al., 2020)
        parenthetical: /\(([A-Z][a-z]+(?: et al\.)?),?\s*(\d{4})\)/g,

        // Smith (2020)
        narrative: /([A-Z][a-z]+(?: et al\.)?)\s*\((\d{4})\)/g,

        // [1] or [1, 2] or [1-3]
        numeric: /\[(\d+(?:,\s*\d+|-?\d+)*)\]/g,

        // Title candidates (lines that look like titles)
        title: /^[A-Z][a-zA-Z0-9\s\-\:]{10,150}$/m
    },

    /**
     * Extract citations from text
     * @param {string} text 
     * @returns {Array} List of citation objects
     */
    extractCitations(text) {
        const citations = [];
        const seen = new Set();

        // 1. Parenthetical: (Author, Year)
        let match;
        while ((match = this.patterns.parenthetical.exec(text)) !== null) {
            const [full, author, year] = match;
            const key = `${author}-${year}`;

            if (!seen.has(key)) {
                citations.push({
                    title: `Citation by ${author}`, // Placeholder title
                    authors: [author],
                    year: parseInt(year),
                    type: 'article',
                    context: this.getContext(text, match.index),
                    confidence: 0.8
                });
                seen.add(key);
            }
        }

        // 2. Narrative: Author (Year)
        while ((match = this.patterns.narrative.exec(text)) !== null) {
            const [full, author, year] = match;
            const key = `${author}-${year}`;

            if (!seen.has(key)) {
                citations.push({
                    title: `Work by ${author}`,
                    authors: [author],
                    year: parseInt(year),
                    type: 'article',
                    context: this.getContext(text, match.index),
                    confidence: 0.85
                });
                seen.add(key);
            }
        }

        return citations;
    },

    /**
     * Get surrounding context for a match
     * @param {string} text 
     * @param {number} index 
     * @returns {string}
     */
    getContext(text, index) {
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + 100);
        return '...' + text.substring(start, end).replace(/\s+/g, ' ').trim() + '...';
    },

    /**
     * Attempt to extract metadata from the first page text
     * @param {string} firstPageText 
     * @returns {Object}
     */
    extractMetadata(firstPageText) {
        const lines = firstPageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Heuristic: Title is usually the first long line in CAPS or Title Case
        // This is very basic and can be improved
        let title = 'Unknown Title';
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            if (lines[i].length > 20 && !lines[i].match(/ISSN|DOI|Vol\.|No\./i)) {
                title = lines[i];
                break;
            }
        }

        return {
            title: title,
            authors: ['Unknown Author'], // Hard to extract authors reliably with regex alone
            year: new Date().getFullYear() // Default to current year if not found
        };
    }
};
