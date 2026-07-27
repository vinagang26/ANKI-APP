const ui = {
    /**
     * Show a screen by ID, hide all others.
     * @param {string} screenName - "home", "library", "form", "review"
     */
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        const screenId = `screen-${screenName}`;
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        } else {
            console.error(`Screen ${screenId} not found`);
        }
    },

    /**
     * Render home screen with Anki stats badges (New, Learning, Review).
     * @param {object} counts - { total, newCards, learningCards, reviewCards, totalDue }
     */
    renderHome(counts) {
        const homeContent = document.getElementById('home-content');
        homeContent.innerHTML = `
            <div class="home-stats">
                <div class="anki-stats-grid">
                    <div class="stat-box stat-new">
                        <span class="stat-number">${counts.newCards}</span>
                        <span class="stat-label">New</span>
                    </div>
                    <div class="stat-box stat-learning">
                        <span class="stat-number">${counts.learningCards}</span>
                        <span class="stat-label">Learning</span>
                    </div>
                    <div class="stat-box stat-review">
                        <span class="stat-number">${counts.reviewCards}</span>
                        <span class="stat-label">To Review</span>
                    </div>
                </div>
                <p class="total-cards-info">Total cards in library: <strong>${counts.total}</strong></p>
            </div>
            <div class="button-group">
                <button id="btn-review" class="btn btn-primary ${counts.totalDue === 0 ? 'disabled' : ''}">
                    Start Due Review (${counts.totalDue})
                </button>
                <button id="btn-practice" class="btn ${counts.total === 0 ? 'disabled' : ''}">
                    Practice All Cards
                </button>
                <button id="btn-new-card" class="btn">New Card</button>
                <button id="btn-library" class="btn">Library</button>
            </div>
        `;

        // Event listeners
        const btnReview = document.getElementById('btn-review');
        if (counts.totalDue > 0 && btnReview) {
            btnReview.addEventListener('click', () => {
                app.startReview('due');
            });
        }

        const btnPractice = document.getElementById('btn-practice');
        if (counts.total > 0 && btnPractice) {
            btnPractice.addEventListener('click', () => {
                app.startReview('practice');
            });
        }

        document.getElementById('btn-new-card').addEventListener('click', () => {
            app.showScreen('form');
        });

        document.getElementById('btn-library').addEventListener('click', () => {
            app.showScreen('library');
        });
    },

    /**
     * Render library screen with reset & train actions.
     * @param {array} cards 
     */
    renderLibrary(cards) {
        const libraryContent = document.getElementById('library-content');

        if (cards.length === 0) {
            libraryContent.innerHTML = '<p class="empty-msg">No cards in library yet. Click "New Card" to create one.</p>';
        } else {
            let html = '<ul class="card-list">';
            cards.forEach(cardInput => {
                const card = scheduler.initCard(cardInput);
                const nextReview = utils.formatDate(card.nextReviewAt);
                const stateClass = `state-${card.state}`;
                const easePct = Math.round(card.easeFactor * 100);

                html += `
                    <li class="card-item">
                        <div class="card-info">
                            <div class="card-header-line">
                                <strong>${card.hanzi}</strong>
                                <span class="pinyin">(${card.pinyin})</span>
                                <span class="card-state-badge ${stateClass}">${card.state.toUpperCase()}</span>
                            </div>
                            <p class="card-meaning">${card.meaning}</p>
                            <div class="card-meta">
                                <span>Interval: ${card.interval}d</span>
                                <span>Ease: ${easePct}%</span>
                                <span>Next: ${nextReview}</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-small train" data-id="${card.id}">Train</button>
                            <button class="btn-small reset" data-id="${card.id}">Reset</button>
                            <button class="btn-small edit" data-id="${card.id}">Edit</button>
                            <button class="btn-small delete" data-id="${card.id}">Delete</button>
                        </div>
                    </li>
                `;
            });
            html += '</ul>';
            libraryContent.innerHTML = html;

            // Attach event listeners
            document.querySelectorAll('.card-item .train').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardId = e.target.dataset.id;
                    app.startReview('single', cardId);
                });
            });

            document.querySelectorAll('.card-item .reset').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardId = e.target.dataset.id;
                    if (confirm('Reset this card to NEW state?')) {
                        app.resetCardProgress(cardId);
                    }
                });
            });

            document.querySelectorAll('.card-item .edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardId = e.target.dataset.id;
                    app.editCardStart(cardId);
                });
            });

            document.querySelectorAll('.card-item .delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardId = e.target.dataset.id;
                    app.deleteCard(cardId);
                });
            });
        }

        libraryContent.innerHTML += '<button id="btn-back-home" class="btn">Back to Home</button>';
        document.getElementById('btn-back-home').addEventListener('click', () => {
            app.showScreen('home');
        });
    },

    /**
     * Render card form (create or edit).
     */
    renderForm(card = null) {
        const formTitle = document.getElementById('form-title');
        const cardForm = document.getElementById('card-form');

        formTitle.textContent = card ? 'Edit Card' : 'New Card';

        cardForm.innerHTML = `
            <div class="form-group">
                <label for="input-hanzi">Hanzi *</label>
                <div class="input-with-indicator">
                    <input type="text" id="input-hanzi" placeholder="e.g., 学习" value="${card ? card.hanzi : ''}" required>
                    <div id="auto-fill-indicator" class="auto-fill-indicator hidden">
                        <span class="spinner"></span> Filling...
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="input-pinyin">Pinyin *</label>
                <input type="text" id="input-pinyin" placeholder="e.g., xuéxí" value="${card ? card.pinyin : ''}" required>
            </div>
            <div class="form-group">
                <label for="input-meaning">Meaning *</label>
                <input type="text" id="input-meaning" placeholder="e.g., to study" value="${card ? card.meaning : ''}" required>
            </div>
            <div class="form-group">
                <label for="input-example">Example Sentence</label>
                <input type="text" id="input-example" placeholder="(optional)" value="${card ? card.exampleSentence || '' : ''}">
            </div>
            <div class="button-group">
                <button type="button" id="btn-form-save" class="btn btn-primary">Save Card</button>
                <button type="button" id="btn-form-cancel" class="btn">Cancel</button>
            </div>
        `;

        const hanziInput = document.getElementById('input-hanzi');
        hanziInput.addEventListener('input', (e) => {
            app.triggerAutoFill(e.target.value);
        });

        document.getElementById('btn-form-save').addEventListener('click', () => {
            const formData = {
                hanzi: document.getElementById('input-hanzi').value.trim(),
                pinyin: document.getElementById('input-pinyin').value.trim(),
                meaning: document.getElementById('input-meaning').value.trim(),
                exampleSentence: document.getElementById('input-example').value.trim()
            };
            app.saveCard(formData, card ? card.id : null);
        });

        document.getElementById('btn-form-cancel').addEventListener('click', () => {
            app.showScreen('home');
        });
    },

    showAutoFillLoading(isLoading) {
        const indicator = document.getElementById('auto-fill-indicator');
        if (!indicator) return;

        if (isLoading) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    },

    /**
     * Render review screen with Anki rating buttons and preview intervals.
     * @param {number} remainingCount 
     * @param {number} currentPos 
     * @param {object|null} currentCard 
     * @param {boolean} revealed 
     */
    renderReview(remainingCount, currentPos, currentCard = null, revealed = false) {
        const reviewContent = document.getElementById('review-content');

        if (!currentCard || remainingCount === 0) {
            reviewContent.innerHTML = `
                <div class="session-complete-card">
                    <h2>Session Complete! 🎉</h2>
                    <p>All cards in this queue have been reviewed.</p>
                    <div class="button-group">
                        <button id="btn-review-home" class="btn btn-primary">Back to Home</button>
                        <button id="btn-practice-again" class="btn">Practice Again</button>
                    </div>
                </div>
            `;
            document.getElementById('btn-review-home').addEventListener('click', () => {
                app.showScreen('home');
            });
            document.getElementById('btn-practice-again').addEventListener('click', () => {
                app.startReview('practice');
            });
            return;
        }

        const normalizedCard = scheduler.initCard(currentCard);
        const previews = scheduler.getIntervalPreviews(normalizedCard);

        if (!revealed) {
            // Front side
            reviewContent.innerHTML = `
                <div class="card-display">
                    <div class="card-header-bar">
                        <span class="card-state-badge state-${normalizedCard.state}">
                            ${normalizedCard.state.toUpperCase()}
                        </span>
                    </div>
                    <div class="card-front">
                        <div class="card-hanzi">${normalizedCard.hanzi}</div>
                    </div>
                    <button id="btn-reveal" class="btn btn-primary">Reveal Answer</button>
                </div>
                <p class="card-progress">Card ${currentPos} of ${remainingCount} in queue</p>
            `;

            document.getElementById('btn-reveal').addEventListener('click', () => {
                app.revealCard();
            });
        } else {
            // Back side
            let exampleHtml = '';
            if (normalizedCard.exampleSentence) {
                exampleHtml = `<p class="card-example"><strong>Example:</strong> ${normalizedCard.exampleSentence}</p>`;
            }

            reviewContent.innerHTML = `
                <div class="card-display">
                    <div class="card-header-bar">
                        <span class="card-state-badge state-${normalizedCard.state}">
                            ${normalizedCard.state.toUpperCase()}
                        </span>
                    </div>
                    <div class="card-back">
                        <div class="card-hanzi">${normalizedCard.hanzi}</div>
                        <p class="card-pinyin">${normalizedCard.pinyin}</p>
                        <p class="card-meaning">${normalizedCard.meaning}</p>
                        ${exampleHtml}
                    </div>
                    <div class="rating-buttons">
                        <button class="btn rating-btn again" data-rating="Again">
                            <span class="rating-time">${previews.Again}</span>
                            <span class="rating-label">Again</span>
                        </button>
                        <button class="btn rating-btn hard" data-rating="Hard">
                            <span class="rating-time">${previews.Hard}</span>
                            <span class="rating-label">Hard</span>
                        </button>
                        <button class="btn rating-btn good" data-rating="Good">
                            <span class="rating-time">${previews.Good}</span>
                            <span class="rating-label">Good</span>
                        </button>
                        <button class="btn rating-btn easy" data-rating="Easy">
                            <span class="rating-time">${previews.Easy}</span>
                            <span class="rating-label">Easy</span>
                        </button>
                    </div>
                </div>
                <p class="card-progress">Card ${currentPos} of ${remainingCount} in queue</p>
            `;

            document.querySelectorAll('.rating-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetBtn = e.target.closest('.rating-btn');
                    if (targetBtn) {
                        const rating = targetBtn.dataset.rating;
                        app.submitRating(normalizedCard.id, rating);
                    }
                });
            });
        }
    }
};