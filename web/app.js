const app = {
    // State
    cards: [],
    currentScreen: 'home',
    currentReviewCard: null,
    reviewCardRevealed: false,
    autoFillTimeout: null,
    reviewQueue: [],
    reviewMode: 'due', // 'due', 'practice', or 'single'

    /**
     * Initialize app on page load.
     * Load cards from storage and render home screen.
     */
    init() {
        const rawCards = storage.getCards();
        this.cards = rawCards.map(c => scheduler.initCard(c));
        // Persist normalized cards if needed
        this.cards.forEach(c => storage.updateCard(c));
        this.showScreen('home');
    },

    /**
     * Switch to a screen and render it.
     * @param {string} screenName - "home", "library", "form", "review"
     */
    showScreen(screenName) {
        this.currentScreen = screenName;
        this.reviewCardRevealed = false;

        switch (screenName) {
            case 'home':
                ui.showScreen('home');
                this.renderHome();
                break;
            case 'library':
                ui.showScreen('library');
                ui.renderLibrary(this.cards);
                break;
            case 'form':
                ui.showScreen('form');
                ui.renderForm(null);
                break;
            case 'review':
                ui.showScreen('review');
                break;
            default:
                console.error(`Unknown screen: ${screenName}`);
        }
    },

    /**
     * Render home screen with card counts breakdown (New, Learning, Review).
     */
    renderHome() {
        const counts = this.getCardCounts();
        ui.renderHome(counts);
    },

    /**
     * Get statistics breakdown for cards.
     */
    getCardCounts() {
        const now = Date.now();
        const endOfToday = utils.todayTimestamp() + 86400 * 1000;

        let newCount = 0;
        let learningCount = 0;
        let dueReviewCount = 0;

        this.cards.forEach(card => {
            const normalized = scheduler.initCard(card);
            if (normalized.state === 'new') {
                newCount++;
            } else if (normalized.state === 'learning' || normalized.state === 'relearning') {
                if (normalized.nextReviewAt <= now + 24 * 60 * 60 * 1000) {
                    learningCount++;
                }
            } else if (normalized.state === 'review') {
                if (normalized.nextReviewAt <= endOfToday) {
                    dueReviewCount++;
                }
            }
        });

        const totalDue = newCount + learningCount + dueReviewCount;

        return {
            total: this.cards.length,
            newCards: newCount,
            learningCards: learningCount,
            reviewCards: dueReviewCount,
            totalDue: totalDue
        };
    },

    /**
     * Get array of cards that are due for review (ordered: Learning -> New -> Review).
     */
    getDueCards() {
        const now = Date.now();
        const endOfToday = utils.todayTimestamp() + 86400 * 1000;

        const learning = [];
        const newCards = [];
        const review = [];

        this.cards.forEach(card => {
            const c = scheduler.initCard(card);
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

    /**
     * Create a new card from form data.
     * @param {object} formData - { hanzi, pinyin, meaning, exampleSentence }
     */
    createCard(formData) {
        const validation = utils.validateCard(formData);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        const now = Date.now();
        const newCard = scheduler.initCard({
            id: utils.generateId(),
            hanzi: formData.hanzi,
            pinyin: formData.pinyin,
            meaning: formData.meaning,
            exampleSentence: formData.exampleSentence || null,
            createdAt: now,
            lastReviewedAt: null,
            nextReviewAt: now, // Due immediately as New card
            state: 'new',
            step: 0,
            interval: 0,
            easeFactor: scheduler.DEFAULT_EASE,
            repetition: 0,
            lapses: 0,
            reviewCount: 0
        });

        storage.saveCard(newCard);
        this.cards.push(newCard);
        this.showScreen('home');
    },

    /**
     * Start editing a card.
     */
    editCardStart(cardId) {
        const card = utils.findCardById(this.cards, cardId);
        if (!card) {
            console.error(`Card ${cardId} not found`);
            return;
        }

        this.currentEditCardId = cardId;
        ui.showScreen('form');
        ui.renderForm(card);
    },

    /**
     * Save an edited card.
     */
    saveCard(formData, cardId) {
        const validation = utils.validateCard(formData);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        if (cardId) {
            const card = utils.findCardById(this.cards, cardId);
            if (!card) {
                console.error(`Card ${cardId} not found`);
                return;
            }

            card.hanzi = formData.hanzi;
            card.pinyin = formData.pinyin;
            card.meaning = formData.meaning;
            card.exampleSentence = formData.exampleSentence || null;

            storage.updateCard(card);
        } else {
            this.createCard(formData);
            return;
        }

        this.showScreen('home');
    },

    /**
     * Reset card SRS progress back to 'new'.
     */
    resetCardProgress(cardId) {
        const card = utils.findCardById(this.cards, cardId);
        if (!card) return;

        card.state = 'new';
        card.step = 0;
        card.interval = 0;
        card.easeFactor = scheduler.DEFAULT_EASE;
        card.repetition = 0;
        card.lapses = 0;
        card.nextReviewAt = Date.now();

        storage.updateCard(card);
        ui.renderLibrary(this.cards);
    },

    /**
     * Delete a card by id.
     */
    deleteCard(cardId) {
        const card = utils.findCardById(this.cards, cardId);
        if (!card) return;

        if (confirm(`Delete "${card.hanzi}"?`)) {
            storage.deleteCard(cardId);
            this.cards = this.cards.filter(c => c.id !== cardId);
            ui.renderLibrary(this.cards);
        }
    },

    /**
     * Auto-fill Pinyin & Meaning from Hanzi using free Google Translate API.
     */
    async autoFillFromHanzi(hanzi) {
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

            const pinyinInput = document.getElementById('input-pinyin');
            const meaningInput = document.getElementById('input-meaning');

            if (pinyinInput && pinyin) {
                pinyinInput.value = pinyin;
            }
            if (meaningInput && meaning) {
                meaningInput.value = meaning;
            }

            ui.showAutoFillLoading(false);
        } catch (error) {
            console.error('Auto-fill error:', error);
            ui.showAutoFillLoading(false);
        }
    },

    triggerAutoFill(hanzi) {
        clearTimeout(this.autoFillTimeout);
        this.autoFillTimeout = setTimeout(() => {
            this.autoFillFromHanzi(hanzi);
        }, 400);
    },

    /**
     * Start a review or practice session.
     * @param {string} mode - 'due' (SRS due cards), 'practice' (cram all cards), or 'single' (single card)
     * @param {string|null} singleCardId 
     */
    startReview(mode = 'due', singleCardId = null) {
        this.reviewMode = mode;
        this.showScreen('review');

        if (mode === 'single' && singleCardId) {
            const card = utils.findCardById(this.cards, singleCardId);
            this.reviewQueue = card ? [card] : [];
        } else if (mode === 'practice') {
            // Practice/Cram mode - all cards
            this.reviewQueue = [...this.cards];
        } else {
            // Due mode - SRS due cards
            this.reviewQueue = this.getDueCards();
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

    /**
     * Reveal current review card.
     */
    revealCard() {
        if (!this.currentReviewCard) return;
        this.reviewCardRevealed = true;
        const currentPos = this.reviewQueue.indexOf(this.currentReviewCard) + 1;
        ui.renderReview(this.reviewQueue.length, currentPos, this.currentReviewCard, true);
    },

    /**
     * Submit user rating ("Again", "Hard", "Good", "Easy").
     */
    submitRating(cardId, rating) {
        const cardIndex = this.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const currentCard = this.cards[cardIndex];

        // Process review through Anki algorithm
        const updatedCard = scheduler.processReview(currentCard, rating);
        updatedCard.reviewCount = (updatedCard.reviewCount || 0) + 1;

        // Update state in memory & storage
        this.cards[cardIndex] = updatedCard;
        storage.updateCard(updatedCard);

        // Queue logic:
        // Remove current card from queue position
        const queueIdx = this.reviewQueue.findIndex(c => c.id === cardId);
        if (queueIdx !== -1) {
            this.reviewQueue.splice(queueIdx, 1);
        }

        // If card was rated 'Again' or is still in 'learning'/'relearning' state, requeue it at the end of the session!
        if (updatedCard.state === 'learning' || updatedCard.state === 'relearning' || rating === 'Again') {
            this.reviewQueue.push(updatedCard);
        }

        // Show next card in queue
        if (this.reviewQueue.length > 0) {
            this.currentReviewCard = this.reviewQueue[0];
            this.reviewCardRevealed = false;
            ui.renderReview(this.reviewQueue.length, 1, this.currentReviewCard, false);
        } else {
            // Queue completed!
            this.currentReviewCard = null;
            ui.renderReview(0, 0, null, false);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});