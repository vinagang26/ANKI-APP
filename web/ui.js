/**
 * UI Coordinator.
 *
 * Defines the global `ui` object with base screen/modal management.
 * All page renderers and component methods are registered onto this object
 * by their own files (loaded after this one via index.html script order):
 *
 *   pages/home.js        → ui.renderHome
 *   pages/library.js     → ui.renderLibrary
 *   components/deck-manager.js  → ui.showDeckManager, ui.showDeckModal, ui.showMoveCardModal
 *   components/card-modal.js    → ui.showCardModal, ui.renderForm
 *   components/import-modal.js  → ui.showImportConflictModal
 *   components/review.js        → ui.renderReview
 */
const ui = {
    /**
     * Show a named screen, hide all others, close any open modals.
     * @param {string} screenName - "home" | "library" | "form" | "review"
     */
    showScreen(screenName) {
        this.closeModals();
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
     * Close/hide all open modal dialogs.
     */
    closeModals() {
        document.querySelectorAll('.glass-modal-overlay').forEach(modal => {
            modal.classList.add('hidden');
        });
    },

    /**
     * Show or hide the auto-fill loading indicator.
     * @param {boolean} isLoading
     */
    showAutoFillLoading(isLoading) {
        const indicator = document.getElementById('auto-fill-indicator');
        if (!indicator) return;
        if (isLoading) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
};
