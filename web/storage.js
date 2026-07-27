const storage = {
    STORAGE_KEY: 'chinese-vocab-cards',
    cachedCards: null,

    /**
     * Load all cards. Uses PyWebView Python API if available, else localStorage.
     */
    async loadCards() {
        // Check if PyWebView is present
        if (window.pywebview && window.pywebview.api && window.pywebview.api.load_cards) {
            try {
                const pyCards = await window.pywebview.api.load_cards();
                if (Array.isArray(pyCards) && pyCards.length > 0) {
                    this.cachedCards = pyCards;
                    try {
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pyCards));
                    } catch (e) {}
                    return pyCards;
                }
            } catch (error) {
                console.error('Error loading cards from Python API:', error);
            }
        }

        // Fallback to localStorage
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            this.cachedCards = data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load cards from localStorage:', error);
            this.cachedCards = [];
        }

        return this.cachedCards;
    },

    /**
     * Synchronous get cards from memory or localStorage.
     */
    getCards() {
        if (this.cachedCards !== null) {
            return this.cachedCards;
        }
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    },

    saveCard(card) {
        const cards = this.getCards();
        cards.push(card);
        this.saveAllCards(cards);
    },

    updateCard(card) {
        const cards = this.getCards();
        const index = cards.findIndex(c => c.id === card.id);
        if (index !== -1) {
            cards[index] = card;
            this.saveAllCards(cards);
        } else {
            cards.push(card);
            this.saveAllCards(cards);
        }
    },

    deleteCard(id) {
        const cards = this.getCards();
        const filtered = cards.filter(c => c.id !== id);
        this.saveAllCards(filtered);
    },

    saveAllCards(cards) {
        this.cachedCards = cards;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }

        if (window.pywebview && window.pywebview.api && window.pywebview.api.save_cards) {
            try {
                window.pywebview.api.save_cards(cards);
            } catch (error) {
                console.error('Failed to save to Python API:', error);
            }
        }
    }
};
