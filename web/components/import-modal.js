/**
 * Import Conflict Modal component.
 * Registers ui.showImportConflictModal() on the global ui object.
 */

/**
 * Show deck import conflict modal with resolution options.
 * @param {object} importResult - { importedDeck, targetDeck, comparison, summaryText, hasExistingDeck }
 */
ui.showImportConflictModal = function(importResult) {
    const modal = document.getElementById('import-conflict-modal');
    if (!modal) return;

    const title = document.getElementById('import-conflict-title');
    const summary = document.getElementById('import-conflict-summary');
    const details = document.getElementById('import-conflict-details');
    const actions = document.getElementById('import-conflict-actions');

    if (title) title.textContent = importResult.hasExistingDeck ? 'Deck Conflict' : 'Import Deck';
    if (summary) summary.textContent = importResult.summaryText;
    if (details) details.innerHTML = `<p><strong>${importResult.importedDeck.name}</strong> by ${importResult.importedDeck.author || 'User'}</p><p>${importResult.importedDeck.description || 'No description provided.'}</p>`;

    const descriptions = window.deckPortability.getActionDescriptions();
    actions.innerHTML = '';
    Object.entries({
        update: 'Update',
        merge: 'Merge',
        replace: 'Replace',
        cancel: 'Cancel'
    }).forEach(([value, label]) => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary btn-pill';
        button.textContent = label;
        button.onclick = () => {
            app.handleImportResolution(value, importResult);
            modal.classList.add('hidden');
        };
        const note = document.createElement('p');
        note.className = 'small-muted';
        note.textContent = descriptions[value];
        actions.appendChild(button);
        actions.appendChild(note);
    });

    modal.classList.remove('hidden');
};
