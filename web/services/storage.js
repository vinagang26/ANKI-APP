const storage = {
    STORAGE_KEY_LEGACY: 'chinese-vocab-cards',
    STORAGE_KEY_LIBRARY: 'chinese-vocab-library-v2',
    STORAGE_KEY_PROGRESS: 'chinese-vocab-progress-v2',
    STORAGE_KEY_MIGRATED: 'chinese-vocab-migrated-v2',

    cachedLibrary: null,
    cachedProgress: null,

    /**
     * Load library and progress. Perform migration if legacy cards exist.
     */
    async loadLibrary() {
        let libraryData = null;
        let progressData = null;

        // Ensure pywebview object & api are fully initialized if running inside PyWebView desktop shell
        if (!window.pywebview || !window.pywebview.api) {
            await new Promise(resolve => {
                if (window.pywebview && window.pywebview.api) {
                    return resolve();
                }
                const handleReady = () => {
                    window.removeEventListener('pywebviewready', handleReady);
                    resolve();
                };
                window.addEventListener('pywebviewready', handleReady);
                setTimeout(() => {
                    window.removeEventListener('pywebviewready', handleReady);
                    resolve();
                }, 1000);
            });
        }

        // Try pywebview API first if available
        if (window.pywebview && window.pywebview.api && window.pywebview.api.load_cards) {
            try {
                const pyData = await window.pywebview.api.load_cards();
                if (pyData && typeof pyData === 'object' && pyData.library && pyData.library.decks) {
                    libraryData = pyData.library;
                    progressData = pyData.progress || {};
                } else if (pyData && typeof pyData === 'object' && pyData.decks) {
                    libraryData = pyData;
                    progressData = {};
                }
            } catch (e) {
                console.error('Error loading library from Python API:', e);
            }
        }

        // Fallback or read from localStorage
        if (!libraryData) {
            try {
                const rawLib = localStorage.getItem(this.STORAGE_KEY_LIBRARY);
                libraryData = rawLib ? JSON.parse(rawLib) : null;
                const rawProg = localStorage.getItem(this.STORAGE_KEY_PROGRESS);
                progressData = rawProg ? JSON.parse(rawProg) : {};
            } catch (e) {
                console.error('Error reading localStorage:', e);
            }
        }

        // Check if migration is needed from legacy format
        const isMigrated = localStorage.getItem(this.STORAGE_KEY_MIGRATED);
        if (!libraryData && !isMigrated) {
            const legacyCardsData = localStorage.getItem(this.STORAGE_KEY_LEGACY);
            let legacyCards = [];
            try {
                legacyCards = legacyCardsData ? JSON.parse(legacyCardsData) : [];
            } catch (e) {}

            libraryData = this.migrateLegacyData(legacyCards);
            progressData = libraryData.migratedProgress;
            delete libraryData.migratedProgress;

            this.saveLibrary(libraryData);
            this.saveProgress(progressData);
            localStorage.setItem(this.STORAGE_KEY_MIGRATED, 'true');
        }

        if (!libraryData) {
            libraryData = this.createEmptyLibrary();
            this.saveLibrary(libraryData);
        }

        if (!progressData) {
            progressData = {};
            this.saveProgress(progressData);
        }

        this.cachedLibrary = libraryData;
        this.cachedProgress = progressData;

        // Ensure Python API stays in sync
        this.syncToPython();

        return { library: this.cachedLibrary, progress: this.cachedProgress };
    },

    createEmptyLibrary() {
        const defaultDeckId = utils.generateId();
        return {
            decks: [
                {
                    id: defaultDeckId,
                    name: 'Default Deck',
                    author: 'User',
                    description: 'Default vocabulary deck',
                    language: 'zh-CN',
                    cardIds: []
                }
            ],
            cards: {}
        };
    },

    migrateLegacyData(legacyCards) {
        const defaultDeckId = utils.generateId();
        const library = {
            decks: [
                {
                    id: defaultDeckId,
                    name: 'Default Deck',
                    author: 'User',
                    description: 'Migrated cards from version 1',
                    language: 'zh-CN',
                    cardIds: []
                }
            ],
            cards: {},
            migratedProgress: {}
        };

        if (Array.isArray(legacyCards)) {
            legacyCards.forEach(c => {
                const cardId = c.id || utils.generateId();
                library.decks[0].cardIds.push(cardId);
                library.cards[cardId] = {
                    id: cardId,
                    deckId: defaultDeckId,
                    hanzi: c.hanzi || '',
                    pinyin: c.pinyin || '',
                    meaning: c.meaning || '',
                    exampleSentence: c.exampleSentence || ''
                };
                library.migratedProgress[cardId] = {
                    state: c.state || (c.interval > 0 ? 'review' : 'new'),
                    step: typeof c.step === 'number' ? c.step : 0,
                    easeFactor: typeof c.easeFactor === 'number' ? c.easeFactor : 2.5,
                    interval: typeof c.interval === 'number' ? c.interval : 0,
                    repetition: typeof c.repetition === 'number' ? c.repetition : 0,
                    lapses: typeof c.lapses === 'number' ? c.lapses : 0,
                    nextReviewAt: c.nextReviewAt || Date.now(),
                    lastReviewedAt: c.lastReviewedAt || null
                };
            });
        }

        return library;
    },

    getLibrary() {
        if (!this.cachedLibrary) {
            this.cachedLibrary = this.createEmptyLibrary();
        }
        return this.cachedLibrary;
    },

    getProgress() {
        if (!this.cachedProgress) {
            this.cachedProgress = {};
        }
        return this.cachedProgress;
    },

    saveLibrary(library) {
        this.cachedLibrary = library;
        try {
            localStorage.setItem(this.STORAGE_KEY_LIBRARY, JSON.stringify(library));
        } catch (e) {
            console.error('Failed to save library to localStorage:', e);
        }
        this.syncToPython();
    },

    saveProgress(progress) {
        this.cachedProgress = progress;
        try {
            localStorage.setItem(this.STORAGE_KEY_PROGRESS, JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save progress to localStorage:', e);
        }
        this.syncToPython();
    },

    /**
     * Sync current state to the Python-side cards.json.
     * Returns a Promise so callers can optionally await it.
     */
    async syncToPython() {
        if (!(window.pywebview && window.pywebview.api && window.pywebview.api.save_cards)) {
            return;
        }
        try {
            await window.pywebview.api.save_cards({
                library: this.cachedLibrary,
                progress: this.cachedProgress
            });
        } catch (e) {
            console.error('[storage] Failed to sync to Python backend - data is safe in localStorage:', e);
        }
    },

    // --- Deck Operations ---

    createDeck({ name, author, description, language }) {
        const library = this.getLibrary();
        const deckId = utils.generateId();
        const newDeck = {
            id: deckId,
            name: name || 'New Deck',
            author: author || 'User',
            description: description || '',
            language: language || 'zh-CN',
            cardIds: [],
            createdAt: Date.now(),
            lastOpenedAt: Date.now()
        };
        library.decks.push(newDeck);
        this.saveLibrary(library);
        return newDeck;
    },

    updateDeck(deckId, updates) {
        const library = this.getLibrary();
        const deck = library.decks.find(d => d.id === deckId);
        if (deck) {
            if (updates.name !== undefined) deck.name = updates.name;
            if (updates.author !== undefined) deck.author = updates.author;
            if (updates.description !== undefined) deck.description = updates.description;
            if (updates.language !== undefined) deck.language = updates.language;
            if (updates.createdAt !== undefined) deck.createdAt = updates.createdAt;
            if (updates.lastOpenedAt !== undefined) deck.lastOpenedAt = updates.lastOpenedAt;
            this.saveLibrary(library);
        }
        return deck;
    },

    deleteDeck(deckId) {
        const library = this.getLibrary();
        if (library.decks.length <= 1) {
            throw new Error('Cannot delete the last remaining deck.');
        }

        const deckIndex = library.decks.findIndex(d => d.id === deckId);
        if (deckIndex === -1) return false;

        const deckToDelete = library.decks[deckIndex];
        const cardIdsToDelete = deckToDelete.cardIds || [];

        // Delete associated cards and progress
        const progress = this.getProgress();
        cardIdsToDelete.forEach(cardId => {
            delete library.cards[cardId];
            delete progress[cardId];
        });

        library.decks.splice(deckIndex, 1);
        this.saveLibrary(library);
        this.saveProgress(progress);
        return true;
    },

    // --- Card Operations ---

    saveCard(cardData, targetDeckId) {
        const library = this.getLibrary();
        const progress = this.getProgress();
        const cardId = cardData.id || utils.generateId();

        let deck = null;
        if (targetDeckId && library.decks.some(d => d.id === targetDeckId)) {
            deck = library.decks.find(d => d.id === targetDeckId);
        }
        if (!deck && library.decks.length > 0) {
            deck = library.decks[0];
        }
        if (!deck) {
            return null;
        }

        const isNew = !library.cards[cardId];
        library.cards[cardId] = {
            id: cardId,
            deckId: deck.id,
            hanzi: cardData.hanzi,
            pinyin: cardData.pinyin,
            meaning: cardData.meaning,
            exampleSentence: cardData.exampleSentence || ''
        };

        if (!deck.cardIds.includes(cardId)) {
            deck.cardIds.push(cardId);
        }

        if (isNew || !progress[cardId]) {
            progress[cardId] = {
                state: 'new',
                step: 0,
                easeFactor: 2.5,
                interval: 0,
                repetition: 0,
                lapses: 0,
                nextReviewAt: Date.now(),
                lastReviewedAt: null
            };
        }

        this.saveLibrary(library);
        this.saveProgress(progress);
        return library.cards[cardId];
    },

    deleteCard(cardId) {
        const library = this.getLibrary();
        const progress = this.getProgress();

        const card = library.cards[cardId];
        if (card) {
            const deck = library.decks.find(d => d.id === card.deckId);
            if (deck) {
                deck.cardIds = deck.cardIds.filter(id => id !== cardId);
            }
            delete library.cards[cardId];
        }

        delete progress[cardId];

        this.saveLibrary(library);
        this.saveProgress(progress);
    },

    moveCard(cardId, targetDeckId) {
        const library = this.getLibrary();
        const card = library.cards[cardId];
        if (!card) return false;

        const sourceDeck = library.decks.find(d => d.id === card.deckId);
        const targetDeck = library.decks.find(d => d.id === targetDeckId);

        if (!targetDeck) return false;

        if (sourceDeck) {
            sourceDeck.cardIds = sourceDeck.cardIds.filter(id => id !== cardId);
        }

        card.deckId = targetDeck.id;
        if (!targetDeck.cardIds.includes(cardId)) {
            targetDeck.cardIds.push(cardId);
        }

        this.saveLibrary(library);
        return true;
    },

    updateCardProgress(cardId, progressObj) {
        const progress = this.getProgress();
        progress[cardId] = { ...progress[cardId], ...progressObj };
        this.saveProgress(progress);
    }
};


