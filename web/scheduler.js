const scheduler = {
    // Anki Defaults
    LEARNING_STEPS: [1, 10], // Minutes: Step 0 = 1m, Step 1 = 10m
    DEFAULT_EASE: 2.50,       // Initial Ease Factor = 250%
    MIN_EASE: 1.30,           // Minimum Ease Factor = 130%
    GRADUATING_INTERVAL: 1,  // 1 day for Good on last learning step
    EASY_INTERVAL: 4,         // 4 days for Easy on learning card
    HARD_INTERVAL_FACTOR: 1.2,// Factor for Hard on review card
    EASY_BONUS: 1.3,          // Bonus factor for Easy on review card

    /**
     * Ensure card object has all required Anki fields (for backward compatibility).
     * @param {object} card 
     * @returns {object} card with normalized Anki state properties
     */
    initCard(card) {
        const interval = typeof card.interval === 'number' ? card.interval : 0;
        let defaultState = 'new';
        if (interval > 0) {
            defaultState = 'review';
        }

        return {
            ...card,
            state: card.state || defaultState,
            step: typeof card.step === 'number' ? card.step : 0,
            easeFactor: typeof card.easeFactor === 'number' ? card.easeFactor : this.DEFAULT_EASE,
            interval: interval,
            repetition: typeof card.repetition === 'number' ? card.repetition : 0,
            lapses: typeof card.lapses === 'number' ? card.lapses : 0,
            nextReviewAt: card.nextReviewAt || Date.now()
        };
    },

    /**
     * Process review rating according to Anki SM-2 rules.
     * @param {object} cardInput 
     * @param {string} rating - "Again", "Hard", "Good", "Easy"
     * @returns {object} updated card object with new state, due date, ease, and interval
     */
    processReview(cardInput, rating) {
        const card = this.initCard(cardInput);
        const now = Date.now();
        const todayStart = utils.todayTimestamp();

        let newState = card.state;
        let newStep = card.step;
        let newEase = card.easeFactor;
        let newInterval = card.interval;
        let newRepetition = card.repetition;
        let newLapses = card.lapses;
        let nextReviewAt = now;

        if (card.state === 'new' || card.state === 'learning') {
            switch (rating) {
                case 'Again':
                    newState = 'learning';
                    newStep = 0;
                    nextReviewAt = now + 1 * 60 * 1000; // 1 minute
                    break;

                case 'Hard':
                    newState = 'learning';
                    // Repeat current step / 6 min average
                    nextReviewAt = now + 6 * 60 * 1000; // 6 minutes
                    break;

                case 'Good':
                    if (card.step < this.LEARNING_STEPS.length - 1) {
                        newState = 'learning';
                        newStep = card.step + 1;
                        nextReviewAt = now + this.LEARNING_STEPS[newStep] * 60 * 1000; // 10 minutes
                    } else {
                        // Graduate to Review
                        newState = 'review';
                        newStep = 0;
                        newInterval = this.GRADUATING_INTERVAL;
                        newRepetition = 1;
                        nextReviewAt = todayStart + newInterval * 86400 * 1000; // Tomorrow
                    }
                    break;

                case 'Easy':
                    // Graduate immediately
                    newState = 'review';
                    newStep = 0;
                    newInterval = this.EASY_INTERVAL;
                    newRepetition = 1;
                    nextReviewAt = todayStart + newInterval * 86400 * 1000; // 4 days
                    break;

                default:
                    throw new Error(`Unknown rating: ${rating}`);
            }
        } else if (card.state === 'relearning') {
            switch (rating) {
                case 'Again':
                    newStep = 0;
                    nextReviewAt = now + 1 * 60 * 1000;
                    break;
                case 'Hard':
                case 'Good':
                case 'Easy':
                    newState = 'review';
                    newStep = 0;
                    newInterval = Math.max(1, card.interval);
                    nextReviewAt = todayStart + newInterval * 86400 * 1000;
                    break;
                default:
                    throw new Error(`Unknown rating: ${rating}`);
            }
        } else {
            // Review state
            switch (rating) {
                case 'Again':
                    // Lapse card
                    newState = 'relearning';
                    newStep = 0;
                    newLapses += 1;
                    newRepetition = 0;
                    newEase = Math.max(this.MIN_EASE, newEase - 0.20);
                    newInterval = 1;
                    nextReviewAt = now + 10 * 60 * 1000; // Relearning in 10 mins
                    break;

                case 'Hard':
                    newState = 'review';
                    newEase = Math.max(this.MIN_EASE, newEase - 0.15);
                    newInterval = Math.max(1, Math.round(card.interval * this.HARD_INTERVAL_FACTOR));
                    nextReviewAt = todayStart + newInterval * 86400 * 1000;
                    break;

                case 'Good':
                    newState = 'review';
                    newRepetition += 1;
                    newInterval = Math.max(1, Math.round(card.interval * newEase));
                    nextReviewAt = todayStart + newInterval * 86400 * 1000;
                    break;

                case 'Easy':
                    newState = 'review';
                    newRepetition += 1;
                    newEase = newEase + 0.15;
                    newInterval = Math.max(1, Math.round(card.interval * newEase * this.EASY_BONUS));
                    nextReviewAt = todayStart + newInterval * 86400 * 1000;
                    break;

                default:
                    throw new Error(`Unknown rating: ${rating}`);
            }
        }

        return {
            ...card,
            state: newState,
            step: newStep,
            easeFactor: Number(newEase.toFixed(2)),
            interval: newInterval,
            repetition: newRepetition,
            lapses: newLapses,
            lastReviewedAt: now,
            nextReviewAt: nextReviewAt
        };
    },

    /**
     * Get button preview labels for a card.
     * @param {object} cardInput 
     * @returns {object} { Again: string, Hard: string, Good: string, Easy: string }
     */
    getIntervalPreviews(cardInput) {
        const card = this.initCard(cardInput);
        const state = card.state;
        const interval = card.interval;
        const ease = card.easeFactor;

        if (state === 'new' || state === 'learning') {
            const isLastStep = card.step >= this.LEARNING_STEPS.length - 1;
            return {
                Again: '< 1m',
                Hard: '6m',
                Good: isLastStep ? '1d' : '10m',
                Easy: `${this.EASY_INTERVAL}d`
            };
        } else if (state === 'relearning') {
            return {
                Again: '< 1m',
                Hard: '6m',
                Good: `${Math.max(1, interval)}d`,
                Easy: `${Math.max(1, interval + 1)}d`
            };
        } else {
            // Review
            const hardInt = Math.max(1, Math.round(interval * this.HARD_INTERVAL_FACTOR));
            const goodInt = Math.max(1, Math.round(interval * ease));
            const easyInt = Math.max(1, Math.round(interval * ease * this.EASY_BONUS));
            return {
                Again: '10m',
                Hard: `${hardInt}d`,
                Good: `${goodInt}d`,
                Easy: `${easyInt}d`
            };
        }
    }
};

