// PDF Handling Module

export const PDFHandler = {
    /**
     * Extract full text from PDF
     * @param {File} file 
     * @returns {Promise<string>}
     */
    async extractText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            const maxPages = Math.min(pdf.numPages, 50); // Limit pages for performance

            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // Join items with space, but try to respect layout slightly
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            return this.cleanText(fullText);
        } catch (error) {
            console.error("PDF Extraction Error:", error);
            throw new Error("Failed to extract text from PDF");
        }
    },

    /**
     * Extract text from the first page only (for metadata)
     * @param {File} file 
     * @returns {Promise<string>}
     */
    async getFirstPageText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            return textContent.items.map(item => item.str).join(' ');
        } catch (error) {
            console.error("PDF First Page Error:", error);
            return "";
        }
    },

    /**
     * Basic text cleanup
     * @param {string} text 
     * @returns {string}
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')       // Normalize whitespace
            .replace(/-\s+/g, '')       // Fix hyphenation
            .trim();
    }
};
