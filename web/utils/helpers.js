const utils = {
    /**
     * Generate a cryptographically-secure UUID v4 via the Web Crypto API,
     * with a Math.random fallback for ancient environments.
     */
    generateId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        // Fallback: hand-rolled UUID v4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    /**
     * Get timestamp for start of today (00:00:00) in local time.
     */
    todayTimestamp() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    },

    /**
     * Get timestamp for a future date by adding days to today.
     * @param {number} days - number of days to add
     * @returns {number} timestamp at 00:00:00 on that date
     */
    addDaysToToday(days) {
        return this.todayTimestamp() + (days * 24 * 60 * 60 * 1000);
    },

    /**
     * Format timestamp as human-readable date string (YYYY-MM-DD).
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Validate card data before creation/update.
     * @param {object} cardData - object with hanzi, pinyin, meaning, exampleSentence
     * @returns {object} { valid: boolean, errors: string[] }
     */
    validateCard(cardData) {
        const errors = [];

        if (!cardData.hanzi || typeof cardData.hanzi !== 'string' || cardData.hanzi.trim() === '') {
            errors.push('Hanzi is required');
        }
        if (!cardData.pinyin || typeof cardData.pinyin !== 'string' || cardData.pinyin.trim() === '') {
            errors.push('Pinyin is required');
        }
        if (!cardData.meaning || typeof cardData.meaning !== 'string' || cardData.meaning.trim() === '') {
            errors.push('Meaning is required');
        }
        // Example sentence is optional, no validation needed

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Find card in array by id.
     */
    findCardById(cards, id) {
        return cards.find(card => card.id === id) || null;
    }
};
