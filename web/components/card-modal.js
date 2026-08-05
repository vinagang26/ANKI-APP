/**
 * Card Modal component.
 * Registers ui.showCardModal() and ui.renderForm() on the global ui object.
 */

/**
 * Display glass card modal popup (create or edit card).
 * @param {object|null} card
 * @param {array} decks
 * @param {string} selectedDeckId
 */
ui.showCardModal = function(card = null, decks = [], selectedDeckId = '') {
    const modal = document.getElementById('card-modal');
    if (!modal) return;

    const validDecks = Array.isArray(decks) ? decks : [];
    const selectedDeckValue = card ? card.deckId : (selectedDeckId || app.activeDeckId || (validDecks[0] ? validDecks[0].id : ''));
    const modalTitle = card ? 'Edit Card' : 'New Card';

    const buildRow = (rowCard = null, rowIndex = 0) => {
        const rowHanzi = rowCard ? (rowCard.hanzi || '') : '';
        const rowPinyin = rowCard ? (rowCard.pinyin || '') : '';
        const rowMeaning = rowCard ? (rowCard.meaning || '') : '';

        return `
            <div class="deck-manager-row card-edit-row" data-row-index="${rowIndex}">
                <input class="deck-manager-input" data-field="hanzi" type="text" value="${rowHanzi.replace(/"/g, '&quot;')}" placeholder="Hanzi" aria-label="Hanzi" />
                <input class="deck-manager-input" data-field="pinyin" type="text" value="${rowPinyin.replace(/"/g, '&quot;')}" placeholder="Pinyin" aria-label="Pinyin" />
                <input class="deck-manager-input" data-field="meaning" type="text" value="${rowMeaning.replace(/"/g, '&quot;')}" placeholder="Meaning" aria-label="Meaning" />
                <button class="deck-manager-more" type="button" data-row-action="menu" aria-label="Row actions">⋮</button>
            </div>
        `;
    };

    const initialRows = card ? [card] : [{ hanzi: '', pinyin: '', meaning: '' }];

    modal.innerHTML = `
        <div class="deck-manager-dialog card-editor-dialog">
            <div class="deck-manager-header">
                <div>
                    <h2>${modalTitle}</h2>
                    <div class="card-modal-deck-select-wrap">
                        <label class="card-modal-deck-label">Deck</label>
                        <select id="input-deck-id" class="card-modal-deck-select">
                            ${validDecks.map(deck => `<option value="${deck.id}" ${deck.id === selectedDeckValue ? 'selected' : ''}>${deck.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button class="deck-manager-close" aria-label="Close card editor">×</button>
            </div>

            <div id="card-editor-list" class="deck-manager-list">
                ${initialRows.map((row, index) => buildRow(row, index)).join('')}
            </div>

            <div class="deck-manager-footer">
                <button type="button" id="deck-manager-add-card" class="btn btn-primary btn-pill">Add New Card</button>
                <button type="button" id="btn-form-save" class="btn btn-primary btn-pill">Save Card</button>
                <button type="button" id="btn-form-cancel" class="btn btn-secondary btn-pill">Cancel</button>
            </div>
        </div>
    `;

    const listEl = document.getElementById('card-editor-list');

    const handleRowAutoFill = (hanziInput, pinyinInput, meaningInput) => {
        if (!hanziInput || !pinyinInput || !meaningInput) return;
        hanziInput.oninput = (event) => {
            const value = event.target.value || '';
            if (value.trim()) {
                app.triggerAutoFill(value.trim(), pinyinInput, meaningInput);
            }
        };
    };

    const bindRowActions = (row) => {
        const hanziInput = row.querySelector('[data-field="hanzi"]');
        const pinyinInput = row.querySelector('[data-field="pinyin"]');
        const meaningInput = row.querySelector('[data-field="meaning"]');
        handleRowAutoFill(hanziInput, pinyinInput, meaningInput);

        const actionBtn = row.querySelector('[data-row-action="menu"]');
        if (actionBtn) {
            actionBtn.onclick = (e) => {
                e.stopPropagation();
                const existingPopover = document.querySelector('.deck-menu-popover');
                if (existingPopover) existingPopover.remove();
                document.querySelectorAll('.deck-manager-row').forEach(r => r.classList.remove('active-menu'));

                row.classList.add('active-menu');

                const menu = document.createElement('div');
                menu.className = 'deck-menu-popover';
                menu.style.position = 'absolute';
                menu.style.right = '10px';
                menu.style.zIndex = '999999';
                menu.innerHTML = `<button class="menu-option danger" data-menu-action="delete">Delete row</button>`;
                row.appendChild(menu);

                const deleteBtn = menu.querySelector('[data-menu-action="delete"]');
                if (deleteBtn) {
                    deleteBtn.onclick = (event) => {
                        event.stopPropagation();
                        menu.remove();
                        row.classList.remove('active-menu');
                        row.remove();
                    };
                }
            };
        }
    };

    const addRow = () => {
        const rowIndex = listEl.children.length;
        const wrapper = document.createElement('div');
        wrapper.className = 'deck-manager-row-wrapper';
        wrapper.dataset.rowIndex = String(rowIndex);
        wrapper.innerHTML = buildRow({ hanzi: '', pinyin: '', meaning: '' }, rowIndex);
        const newRowEl = wrapper.firstElementChild;
        listEl.appendChild(newRowEl);
        bindRowActions(newRowEl);
    };

    document.getElementById('deck-manager-add-card').onclick = () => addRow();

    listEl.querySelectorAll('.card-edit-row').forEach(row => {
        bindRowActions(row);
    });

    const btnSave = document.getElementById('btn-form-save');
    if (btnSave) {
        btnSave.onclick = () => {
            const selectedDeck = document.getElementById('input-deck-id');
            const targetDeckId = selectedDeck && selectedDeck.value
                ? selectedDeck.value
                : (selectedDeckValue || app.activeDeckId || (validDecks[0] ? validDecks[0].id : null));
            const rows = [...listEl.querySelectorAll('.card-edit-row')];
            const cardsToSave = rows.map(row => {
                const fields = row.querySelectorAll('.deck-manager-input');
                const data = { hanzi: '', pinyin: '', meaning: '' };
                fields.forEach(input => {
                    const field = input.dataset.field;
                    if (field && data[field] !== undefined) {
                        data[field] = input.value.trim();
                    }
                });
                return data;
            }).filter(item => item.hanzi || item.pinyin || item.meaning);

            if (!cardsToSave.length) {
                alert('Please add at least one card before saving.');
                return;
            }

            cardsToSave.forEach((formData) => {
                const validation = utils.validateCard(formData);
                if (!validation.valid) {
                    alert('Validation errors:\n' + validation.errors.join('\n'));
                    return;
                }
                app.saveCard(formData, card ? card.id : null, targetDeckId);
            });

            // Re-sync local library state so subsequent card adds pick up existing items correctly
            app.library = storage.getLibrary();
            app.progress = storage.getProgress();

            modal.classList.add('hidden');
            if (app.currentScreen === 'library') {
                app.commit();
            }
        };
    }

    const closeModal = () => {
        modal.classList.add('hidden');
        if (app.currentScreen === 'form') {
            app.cancelForm();
        }
    };

    const btnCancel = document.getElementById('btn-form-cancel');
    if (btnCancel) btnCancel.onclick = closeModal;

    const closeButton = modal.querySelector('.deck-manager-close');
    if (closeButton) closeButton.onclick = closeModal;

    modal.classList.remove('hidden');
    let _mdOverlay4 = false;
    modal.addEventListener('mousedown', (e) => { _mdOverlay4 = e.target === modal; });
    modal.onclick = (e) => {
        if (e.target === modal && _mdOverlay4) closeModal();
    };
};

/**
 * Alias kept for backwards compat — routes to showCardModal.
 */
ui.renderForm = function(card = null, decks = [], selectedDeckId = '') {
    ui.showCardModal(card, decks, selectedDeckId);
};
