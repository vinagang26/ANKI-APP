const storage = {
    STORAGE_KEY: 'chinese-vocab-cards',

    /**
     * Load all cards from localStorage.
     * @returns {array} array of card objects, or empty array if none exist
     */
    getCards() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load cards from localStorage:', error);
            return [];
        }
    },

    /**
     * Save a new card to localStorage.
     * Appends to the existing collection.
     * @param {object} card - card object to save
     */
    saveCard(card) {
        try {
            const cards = this.getCards();
            cards.push(card);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
        } catch (error) {
            console.error('Failed to save card to localStorage:', error);
            throw error;
        }
    },

    /**
     * Update an existing card in localStorage.
     * Finds card by id and replaces it.
     * @param {object} card - card object with id field
     */
    updateCard(card) {
        try {
            const cards = this.getCards();
            const index = cards.findIndex(c => c.id === card.id);
            if (index === -1) {
                throw new Error(`Card with id ${card.id} not found`);
            }
            cards[index] = card;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
        } catch (error) {
            console.error('Failed to update card in localStorage:', error);
            throw error;
        }
    },

    /**
     * Delete a card from localStorage by id.
     * @param {string} id - card id
     */
    deleteCard(id) {
        try {
            const cards = this.getCards();
            const filtered = cards.filter(c => c.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to delete card from localStorage:', error);
            throw error;
        }
    }
};
