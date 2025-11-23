/**
 * Citation Formatter Module
 */

export const Formatter = {
    /**
     * Format a citation object into a string
     * @param {Object} paper 
     * @param {string} style 'abnt' | 'apa' | 'ieee'
     * @returns {string}
     */
    format(paper, style = 'abnt') {
        const authors = this.parseAuthors(paper.authors);
        const title = paper.title || 'Unknown Title';
        const year = paper.year || 's.d.';

        switch (style.toLowerCase()) {
            case 'apa':
                return this.formatAPA(authors, title, year);
            case 'ieee':
                return this.formatIEEE(authors, title, year);
            case 'abnt':
            default:
                return this.formatABNT(authors, title, year);
        }
    },

    parseAuthors(authors) {
        if (!authors) return [];
        if (Array.isArray(authors)) return authors.map(a => typeof a === 'string' ? a : a.name);
        if (typeof authors === 'string') return authors.split(',').map(a => a.trim());
        return [];
    },

    formatABNT(authors, title, year) {
        // AUTOR, A. Título. Ano.
        let authorStr = 'AUTOR DESCONHECIDO';
        if (authors.length > 0) {
            const first = authors[0].split(' ');
            const last = first.pop().toUpperCase();
            const initials = first.map(n => n[0].toUpperCase() + '.').join(' ');
            authorStr = `${last}, ${initials}`;
            if (authors.length > 1) authorStr += ' et al.';
        }
        return `${authorStr} **${title}**. ${year}.`;
    },

    formatAPA(authors, title, year) {
        // Author, A. (Year). Title.
        let authorStr = 'Unknown';
        if (authors.length > 0) {
            const first = authors[0].split(' ');
            const last = first.pop();
            const initials = first.map(n => n[0].toUpperCase() + '.').join(' ');
            authorStr = `${last}, ${initials}`;
            if (authors.length > 1) authorStr += ' et al.';
        }
        return `${authorStr} (${year}). *${title}*.`;
    },

    formatIEEE(authors, title, year) {
        // [1] A. Author, "Title," Year.
        let authorStr = 'A. Author';
        if (authors.length > 0) {
            const first = authors[0].split(' ');
            const last = first.pop();
            const initials = first.map(n => n[0].toUpperCase() + '.').join(' ');
            authorStr = `${initials} ${last}`;
            if (authors.length > 1) authorStr += ' *et al.*';
        }
        return `${authorStr}, "${title}," ${year}.`;
    }
};
