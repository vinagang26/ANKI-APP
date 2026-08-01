/**
 * Home page renderer.
 * Registers ui.renderHome() on the global ui object.
 */

/**
 * Render home screen with Anki stats badges (New, Learning, Review).
 * @param {object} counts - { total, newCards, learningCards, reviewCards, totalDue }
 */
ui.renderHome = function(counts) {
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
            <button id="btn-review" class="btn btn-primary disabled" disabled title="Review button disabled">
                Start Due Review (${counts.totalDue})
            </button>
            <button id="btn-new-card" class="btn">New Card</button>
            <button id="btn-library" class="btn">Library</button>
        </div>
    `;

    document.getElementById('btn-new-card').addEventListener('click', () => {
        app.showScreen('form');
    });

    document.getElementById('btn-library').addEventListener('click', () => {
        app.showScreen('library');
    });
};
