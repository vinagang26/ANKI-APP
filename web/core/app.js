const app = {
    // State
    library: { decks: [], cards: {} },
    progress: {},
    activeDeckId: null,
    currentScreen: 'home',
    previousScreen: null,
    currentReviewCard: null,
    reviewCardRevealed: false,
    autoFillTimeout: null,
    reviewQueue: [],
    reviewMode: 'due', // 'due', 'practice', or 'single'
    currentReviewDeckId: null,
    librarySortMode: 'recently-added',
    librarySearchQuery: '',
    librarySearchCursor: 0,

    /**
     * Initialize app on page load.
     * Load library and progress, setup initial deck.
     */
    async init() {
        if (window.pywebview && !window.pywebview.api) {
            await new Promise(resolve => window.addEventListener('pywebviewready', resolve));
        }
        const data = await storage.loadLibrary();
        this.library = data.library;
        this.progress = data.progress;

        if (this.library.decks && this.library.decks.length > 0) {
            this.activeDeckId = this.library.decks[0].id;
        }

        this.showScreen('home');
    },

    /**
     * Get combined card list for specified deck (or all cards if deckId is null).
     */
    getCombinedCards(deckId = null) {
        const cardsMap = this.library.cards || {};
        const cardIds = deckId 
            ? (this.library.decks.find(d => d.id === deckId) || {}).cardIds || []
            : Object.keys(cardsMap);

        return cardIds.map(id => {
            const cardContent = cardsMap[id];
            if (!cardContent) return null;
            const prog = this.progress[id] || {};
            return scheduler.initCard({ ...cardContent, ...prog });
        }).filter(Boolean);
    },

    /**
     * Switch screen and re-render.
     */
    showScreen(screenName) {
        if (this.currentScreen && this.currentScreen !== screenName) {
            this.previousScreen = this.currentScreen;
        }
        this.currentScreen = screenName;
        this.reviewCardRevealed = false;

        switch (screenName) {
            case 'home':
                ui.showScreen('home');
                this.renderHome();
                break;
            case 'library':
                ui.showScreen('library');
                ui.renderLibrary(this.library, this.progress, this.activeDeckId);
                break;
            case 'form':
                ui.showScreen('form');
                ui.renderForm(null, this.library.decks, this.activeDeckId);
                break;
            case 'review':
                ui.showScreen('review');
                break;
            default:
                console.error(`Unknown screen: ${screenName}`);
        }
    },

    cancelForm() {
        const target = this.previousScreen || 'home';
        this.showScreen(target);
    },

    exitReview() {
        const deckId = this.currentReviewDeckId;
        this.reviewQueue = [];
        this.currentReviewCard = null;
        this.currentReviewDeckId = null;
        if (deckId) {
            this.activeDeckId = deckId;
            this.showScreen('library');
        } else {
            const target = this.previousScreen || 'library';
            this.showScreen(target);
        }
    },

    switchDeck(deckId) {
        this.activeDeckId = deckId;
        if (this.currentScreen === 'library') {
            ui.renderLibrary(this.library, this.progress, this.activeDeckId);
        }
    },

    setLibrarySortMode(mode) {
        this.librarySortMode = mode;
        if (this.currentScreen === 'library') {
            ui.renderLibrary(this.library, this.progress, this.activeDeckId);
        }
    },

    setLibrarySearchQuery(query) {
        this.librarySearchQuery = query || '';
        this.librarySearchCursor = this.librarySearchQuery.length;
        if (this.currentScreen === 'library') {
            ui.renderLibrary(this.library, this.progress, this.activeDeckId);
        }
    },

    recordDeckOpen(deckId) {
        if (!deckId) return;
        const deck = this.library.decks.find(d => d.id === deckId);
        if (!deck) return;
        deck.lastOpenedAt = Date.now();
        storage.updateDeck(deckId, { lastOpenedAt: deck.lastOpenedAt });
        this.library = storage.getLibrary();
    },

    renderHome() {
        const counts = this.getCardCounts();
        ui.renderHome(counts);
    },

    getCardCounts() {
        const now = Date.now();
        const endOfToday = utils.todayTimestamp() + 86400 * 1000;
        const cards = this.getCombinedCards();

        let newCount = 0;
        let learningCount = 0;
        let dueReviewCount = 0;

        cards.forEach(card => {
            if (card.state === 'new') {
                newCount++;
            } else if (card.state === 'learning' || card.state === 'relearning') {
                if (card.nextReviewAt <= now + 24 * 60 * 60 * 1000) {
                    learningCount++;
                }
            } else if (card.state === 'review') {
                if (card.nextReviewAt <= endOfToday) {
                    dueReviewCount++;
                }
            }
        });

        return {
            total: cards.length,
            newCards: newCount,
            learningCards: learningCount,
            reviewCards: dueReviewCount,
            totalDue: newCount + learningCount + dueReviewCount
        };
    },

    getDueCards(deckId = null) {
        const now = Date.now();
        const endOfToday = utils.todayTimestamp() + 86400 * 1000;
        const cards = this.getCombinedCards(deckId);

        const learning = [];
        const newCards = [];
        const review = [];

        cards.forEach(c => {
            if (c.state === 'learning' || c.state === 'relearning') {
                if (c.nextReviewAt <= now + 24 * 60 * 60 * 1000) {
                    learning.push(c);
                }
            } else if (c.state === 'new') {
                newCards.push(c);
            } else if (c.state === 'review') {
                if (c.nextReviewAt <= endOfToday) {
                    review.push(c);
                }
            }
        });

        return [...learning, ...newCards, ...review];
    },

    // --- Commit Helper ---

    /**
     * Re-read library+progress from the cache and re-render the library screen.
     * Replace the 8x repeated: storage.X -> this.library = ... -> this.progress = ... -> ui.renderLibrary
     */
    commit() {
        this.library = storage.getLibrary();
        this.progress = storage.getProgress();
        if (this.currentScreen === 'library') {
            ui.renderLibrary(this.library, this.progress, this.activeDeckId);
        } else if (this.currentScreen === 'home') {
            this.renderHome();
        }
    },

    // --- Deck Handlers ---

    createDeck({ name, author, description, language }) {
        const newDeck = storage.createDeck({ name, author, description, language });
        this.activeDeckId = newDeck.id;
        this.commit();
    },

    updateDeck(deckId, updates) {
        storage.updateDeck(deckId, updates);
        this.commit();
    },

    deleteDeck(deckId) {
        const deck = this.library.decks.find(d => d.id === deckId);
        if (!deck) return;

        if (confirm(`Are you sure you want to delete deck "${deck.name}" and all its cards?`)) {
            try {
                storage.deleteDeck(deckId);
                this.library = storage.getLibrary();
                this.progress = storage.getProgress();
                if (this.library.decks.length > 0) {
                    this.activeDeckId = this.library.decks[0].id;
                }
                this.commit();
            } catch (err) {
                alert(err.message);
            }
        }
    },

    moveCard(cardId, targetDeckId) {
        const success = storage.moveCard(cardId, targetDeckId);
        if (success) {
            this.commit();
        }
    },

    // --- Card Handlers ---

    editCardStart(cardId) {
        const cardContent = this.library.cards[cardId];
        if (!cardContent) return;

        ui.showCardModal(cardContent, this.library.decks, cardContent.deckId || this.activeDeckId);
    },

    saveCard(formData, cardId = null, targetDeckId = null) {
        const validation = utils.validateCard(formData);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        const resolvedDeckId = targetDeckId || this.activeDeckId || (this.library.decks[0] ? this.library.decks[0].id : null);
        if (!resolvedDeckId) {
            alert('Please create a deck before adding cards.');
            return;
        }

        const cardData = { id: cardId, ...formData };

        storage.saveCard(cardData, resolvedDeckId);
        this.library = storage.getLibrary();
        this.progress = storage.getProgress();

        if (this.currentScreen === 'library') {
            this.commit();
        } else if (this.currentScreen === 'home') {
            this.renderHome();
        } else {
            this.showScreen('library');
        }
    },

    deleteCard(cardId) {
        const cardContent = this.library.cards[cardId];
        if (!cardContent) return;

        if (confirm(`Delete card "${cardContent.hanzi}"?`)) {
            storage.deleteCard(cardId);
            this.commit();
        }
    },

    exportCurrentDeck() {
        const deck = this.library.decks.find(d => d.id === this.activeDeckId);
        if (!deck) return;
        window.deckPortability.exportDeckToFile(deck, this.library.cards, deck.name);
    },

    exportDeckById(deckId) {
        const deck = this.library.decks.find(d => d.id === deckId);
        if (!deck) return;
        window.deckPortability.exportDeckToFile(deck, this.library.cards, deck.name);
    },

    async importDeck() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async () => {
            const [file] = input.files || [];
            if (!file) return;

            try {
                const imported = await window.deckPortability.readPortableDeckFromFile(file);
                const targetDeck = this.library.decks.find(d => d.id === this.activeDeckId);
                const comparison = window.deckPortability.compareImportedDeck(imported.deck, targetDeck, this.library.cards);
                const importResult = {
                    importedDeck: imported.deck,
                    targetDeck,
                    comparison,
                    summaryText: comparison.summaryText,
                    hasExistingDeck: comparison.hasExistingDeck
                };

                if (comparison.hasExistingDeck) {
                    ui.showImportConflictModal(importResult);
                } else {
                    this.handleImportResolution('update', importResult);
                }
            } catch (err) {
                alert(err.message || 'Failed to import deck.');
            }
        };
        input.click();
    },

    handleImportResolution(action, importResult) {
        if (action === 'cancel') {
            return;
        }

        const result = window.deckPortability.applyImportedDeck(this.library, importResult.importedDeck, action, importResult.targetDeck?.id);
        if (!result) return;

        storage.saveLibrary(this.library);
        this.commit();

        if (result.newCardIds.length > 0) {
            alert(`Imported deck complete. Added ${result.newCardIds.length} new card${result.newCardIds.length === 1 ? '' : 's'}.`);
        } else {
            alert('Imported deck complete.');
        }
    },

    async autoFillFromHanzi(hanzi, pinyinTarget = null, meaningTarget = null) {
        const query = hanzi ? hanzi.trim() : '';
        if (!query) {
            ui.showAutoFillLoading(false);
            return;
        }

        ui.showAutoFillLoading(true);

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&dt=rm&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();
            let meaning = '';
            let pinyin = '';

            if (data && data[0]) {
                if (data[0][0] && data[0][0][0]) {
                    meaning = data[0][0][0];
                }
                if (data[0][1] && data[0][1][3]) {
                    pinyin = data[0][1][3];
                } else if (data[0][0] && data[0][0][3]) {
                    pinyin = data[0][0][3];
                }
            }

            const resolvedPinyinTarget = pinyinTarget || document.getElementById('input-pinyin');
            const resolvedMeaningTarget = meaningTarget || document.getElementById('input-meaning');

            if (resolvedPinyinTarget && pinyin) {
                resolvedPinyinTarget.value = pinyin;
            }
            if (resolvedMeaningTarget && meaning) {
                resolvedMeaningTarget.value = meaning;
            }

            ui.showAutoFillLoading(false);
        } catch (error) {
            console.error('Auto-fill error:', error);
            ui.showAutoFillLoading(false);
        }
    },

    triggerAutoFill(hanzi, pinyinTarget = null, meaningTarget = null) {
        clearTimeout(this.autoFillTimeout);
        this.autoFillTimeout = setTimeout(() => {
            this.autoFillFromHanzi(hanzi, pinyinTarget, meaningTarget);
        }, 400);
    },

    startReview(mode = 'due', singleCardId = null, deckId = null) {
        this.reviewMode = mode;
        this.currentReviewDeckId = deckId || this.activeDeckId || this.currentReviewDeckId || null;
        this.showScreen('review');

        if (this.currentReviewDeckId) {
            this.recordDeckOpen(this.currentReviewDeckId);
        }

        if (mode === 'single' && singleCardId) {
            const cardContent = this.library.cards[singleCardId];
            const prog = this.progress[singleCardId] || {};
            const card = cardContent ? scheduler.initCard({ ...cardContent, ...prog }) : null;
            this.reviewQueue = card ? [card] : [];
        } else if (mode === 'practice') {
            this.reviewQueue = this.currentReviewDeckId ? this.getCombinedCards(this.currentReviewDeckId) : this.getCombinedCards();
        } else {
            this.reviewQueue = this.currentReviewDeckId ? this.getDueCards(this.currentReviewDeckId) : this.getDueCards();
        }

        if (this.reviewQueue.length === 0) {
            this.currentReviewCard = null;
            ui.renderReview(0, 0, null, false);
            return;
        }

        this.currentReviewCard = this.reviewQueue[0];
        this.reviewCardRevealed = false;
        ui.renderReview(this.reviewQueue.length, 1, this.currentReviewCard, false);
    },

    revealCard() {
        if (!this.currentReviewCard) return;
        this.reviewCardRevealed = true;
        const currentPos = this.reviewQueue.indexOf(this.currentReviewCard) + 1;
        ui.renderReview(this.reviewQueue.length, currentPos, this.currentReviewCard, true);
    },

    submitRating(cardId, rating) {
        const cardContent = this.library.cards[cardId];
        if (!cardContent) return;

        const prog = this.progress[cardId] || {};
        const currentCard = scheduler.initCard({ ...cardContent, ...prog });

        const updatedCard = scheduler.processReview(currentCard, rating);
        updatedCard.reviewCount = (updatedCard.reviewCount || 0) + 1;

        // Save progress separately
        const { id, deckId, hanzi, pinyin, meaning, exampleSentence, ...progressFields } = updatedCard;
        storage.updateCardProgress(cardId, progressFields);
        this.progress[cardId] = progressFields;

        // Queue logic
        const queueIdx = this.reviewQueue.findIndex(c => c.id === cardId);
        if (queueIdx !== -1) {
            this.reviewQueue.splice(queueIdx, 1);
        }

        if (updatedCard.state === 'learning' || updatedCard.state === 'relearning' || rating === 'Again') {
            this.reviewQueue.push(updatedCard);
        }

        if (this.reviewQueue.length > 0) {
            this.currentReviewCard = this.reviewQueue[0];
            this.reviewCardRevealed = false;
            ui.renderReview(this.reviewQueue.length, 1, this.currentReviewCard, false);
        } else {
            this.currentReviewCard = null;
            ui.renderReview(0, 0, null, false);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

