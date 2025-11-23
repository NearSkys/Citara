/**
 * Utility functions for Citation Graph
 */

export const Utils = {
    /**
     * Generate a UUID v4
     * @returns {string}
     */
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Format date to ISO string (YYYY-MM-DD)
     * @param {Date} date 
     * @returns {string}
     */
    formatDate(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Format datetime to ISO string
     * @param {Date} date 
     * @returns {string}
     */
    formatDateTime(date = new Date()) {
        return date.toISOString();
    },

    /**
     * Debounce a function
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Generate a consistent color from a string
     * @param {string} str 
     * @returns {string} Hex color
     */
    stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    },

    /**
     * Sanitize text for HTML display
     * @param {string} str 
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
