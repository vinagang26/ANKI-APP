/**
 * Review screen component.
 * Registers ui.renderReview() on the global ui object.
 */

/**
 * Render review screen with Anki rating buttons and preview intervals.
 * @param {number} remainingCount
 * @param {number} currentPos
 * @param {object|null} currentCard
 * @param {boolean} revealed
 */
ui.renderReview = function(remainingCount, currentPos, currentCard = null, revealed = false) {
    const reviewContent = document.getElementById('review-content');

    if (!currentCard || remainingCount === 0) {
        reviewContent.innerHTML = `
            <div class="session-complete-card">
                <h2>Session Complete! 🎉</h2>
                <p>All cards in this queue have been reviewed.</p>
                <div class="button-group review-complete-actions">
                    <button id="btn-review-home" class="btn btn-primary">Back</button>
                    <button id="btn-practice-again" class="btn">Practice Again</button>
                </div>
            </div>
        `;
        document.getElementById('btn-review-home').addEventListener('click', () => {
            app.exitReview();
        });
        document.getElementById('btn-practice-again').addEventListener('click', () => {
            app.startReview('practice', null, app.currentReviewDeckId || app.activeDeckId || null);
        });
        return;
    }

    const normalizedCard = scheduler.initCard(currentCard);
    const previews = scheduler.getIntervalPreviews(normalizedCard);

    const toolbarHtml = `
        <div class="review-toolbar">
            <button id="btn-exit-practice" class="btn btn-exit-practice">Exit Practice</button>
        </div>
    `;

    if (!revealed) {
        // Front side
        reviewContent.innerHTML = `
            ${toolbarHtml}
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
            ${toolbarHtml}
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

    const btnExit = document.getElementById('btn-exit-practice');
    if (btnExit) {
        btnExit.addEventListener('click', () => {
            app.exitReview();
        });
    }
};
