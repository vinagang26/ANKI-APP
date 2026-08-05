/**
 * Deck Manager component.
 * Registers ui.showDeckManager(), ui.showDeckModal(), ui.showMoveCardModal()
 * on the global ui object.
 */

/**
 * Full-screen deck manager modal: inline card editing, add/remove rows.
 * @param {object} deck
 */
ui.showDeckManager = function(deck) {
    const existing = document.getElementById('deck-manager-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'deck-manager-modal';
    modal.className = 'glass-modal-overlay deck-manager-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';

    const deckCards = Array.isArray(deck.cardIds) ? deck.cardIds : [];
    const buildRowMarkup = (card = null, isNew = false) => {
        const cardId = card ? card.id : 'new';
        const hanzi = card ? (card.hanzi || '') : '';
        const pinyin = card ? (card.pinyin || '') : '';
        const meaning = card ? (card.meaning || '') : '';

        return `
            <div class="deck-manager-row ${isNew ? 'is-new' : ''}" data-row-mode="${isNew ? 'new' : 'existing'}" data-card-id="${cardId}">
                <input class="deck-manager-input" data-field="hanzi" data-card-id="${cardId}" value="${hanzi.replace(/"/g, '&quot;')}" aria-label="Hanzi" placeholder="Hanzi" />
                <input class="deck-manager-input" data-field="pinyin" data-card-id="${cardId}" value="${pinyin.replace(/"/g, '&quot;')}" aria-label="Pinyin" placeholder="Pinyin" />
                <input class="deck-manager-input" data-field="meaning" data-card-id="${cardId}" value="${meaning.replace(/"/g, '&quot;')}" aria-label="Meaning" placeholder="Meaning" />
                <button class="deck-manager-more" type="button" data-card-action="menu" data-card-id="${cardId}" aria-label="Card actions">⋮</button>
            </div>
        `;
    };

    const cardMarkup = deckCards.length
        ? deckCards.map(cardId => {
            const card = app.library.cards[cardId];
            return card ? buildRowMarkup(card) : '';
        }).join('')
        : '';

    modal.innerHTML = `
        <div class="deck-manager-dialog">
            <div class="deck-manager-header">
                <div>
                    <h2>${deck.name || 'Deck'}</h2>
                </div>
                <button class="deck-manager-close" aria-label="Close deck manager">×</button>
            </div>

            <div class="deck-manager-list" id="deck-manager-list">
                ${cardMarkup || '<div class="deck-manager-empty">No cards in this deck yet.</div>'}
            </div>

            <div class="deck-manager-footer">
                <button type="button" id="deck-manager-add-card" class="btn btn-primary btn-pill">Add New Card</button>
                <button type="button" id="deck-manager-save" class="btn btn-primary btn-pill">Save</button>
                <button type="button" id="deck-manager-cancel" class="btn btn-secondary btn-pill">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector('.deck-manager-close');
    if (closeButton) {
        closeButton.onclick = () => modal.remove();
    }

    let _mdOverlay1 = false;
    modal.addEventListener('mousedown', (e) => { _mdOverlay1 = e.target === modal; });
    modal.onclick = (e) => {
        if (e.target === modal && _mdOverlay1) modal.remove();
    };

    const listEl = document.getElementById('deck-manager-list');

    const attachDeckManagerRowHandlers = (row, deckRef, modalRef) => {
        const saveRow = (rowEl) => {
            const cardId = rowEl.dataset.cardId || null;
            const isNew = rowEl.dataset.rowMode === 'new';
            const inputs = rowEl.querySelectorAll('.deck-manager-input');
            const values = {};
            inputs.forEach(input => {
                const field = input.dataset.field;
                values[field] = (input.value || '').trim();
            });

            if (!values.hanzi && !values.pinyin && !values.meaning) {
                if (isNew) rowEl.remove();
                return;
            }

            const formData = {
                hanzi: values.hanzi || '',
                pinyin: values.pinyin || '',
                meaning: values.meaning || '',
                exampleSentence: ''
            };

            const validation = utils.validateCard(formData);
            if (!validation.valid) {
                alert('Validation errors:\n' + validation.errors.join('\n'));
                return;
            }

            if (isNew) {
                const saved = storage.saveCard({ ...formData }, deckRef.id);
                if (saved) {
                    app.library = storage.getLibrary();
                    app.progress = storage.getProgress();
                    rowEl.dataset.rowMode = 'existing';
                    rowEl.dataset.cardId = saved.id;
                    rowEl.querySelectorAll('.deck-manager-input').forEach(input => {
                        input.dataset.cardId = saved.id;
                    });
                    const actionButton = rowEl.querySelector('[data-card-action="menu"]');
                    if (actionButton) actionButton.dataset.cardId = saved.id;
                }
            } else {
                const existingCard = app.library.cards[cardId];
                if (existingCard) {
                    app.saveCard({ ...formData, id: existingCard.id }, existingCard.id, deckRef.id);
                    app.library = storage.getLibrary();
                    app.progress = storage.getProgress();
                }
            }
        };

        const hanziInput = row.querySelector('[data-field="hanzi"]');
        const pinyinInput = row.querySelector('[data-field="pinyin"]');
        const meaningInput = row.querySelector('[data-field="meaning"]');

        if (hanziInput && pinyinInput && meaningInput) {
            hanziInput.addEventListener('input', () => {
                const value = hanziInput.value.trim();
                if (value) {
                    app.triggerAutoFill(value, pinyinInput, meaningInput);
                }
            });
        }

        row.querySelectorAll('.deck-manager-input').forEach(input => {
            input.addEventListener('change', () => {
                saveRow(row);
            });
        });

        const actionButton = row.querySelector('[data-card-action="menu"]');
        if (actionButton) {
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = actionButton.dataset.cardId;
                const card = app.library.cards[cardId] || null;
                const existingPopover = document.querySelector('.deck-menu-popover');
                if (existingPopover) existingPopover.remove();
                document.querySelectorAll('.deck-manager-row').forEach(r => r.classList.remove('active-menu'));

                row.classList.add('active-menu');

                const menu = document.createElement('div');
                menu.className = 'deck-menu-popover';
                menu.style.position = 'absolute';
                menu.style.right = '10px';
                menu.style.zIndex = '999999';
                menu.innerHTML = `
                    <button class="menu-option danger" data-menu-action="delete">Delete row</button>
                `;

                row.appendChild(menu);

                const removePopover = () => {
                    menu.remove();
                    row.classList.remove('active-menu');
                };

                const deleteBtn = menu.querySelector('[data-menu-action="delete"]');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        removePopover();
                        if (card) {
                            app.deleteCard(card.id);
                        }
                        row.remove();
                        const remainingRows = listEl.querySelectorAll('.deck-manager-row');
                        if (!remainingRows.length) {
                            listEl.innerHTML = '<div class="deck-manager-empty">No cards in this deck yet.</div>';
                        }
                    });
                }
            });
        }
    };

    const addBlankRow = () => {
        const row = document.createElement('div');
        row.className = 'deck-manager-row is-new';
        row.dataset.rowMode = 'new';
        row.dataset.cardId = `new-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        row.innerHTML = `
            <input class="deck-manager-input" data-field="hanzi" data-card-id="${row.dataset.cardId}" placeholder="Hanzi" aria-label="Hanzi" />
            <input class="deck-manager-input" data-field="pinyin" data-card-id="${row.dataset.cardId}" placeholder="Pinyin" aria-label="Pinyin" />
            <input class="deck-manager-input" data-field="meaning" data-card-id="${row.dataset.cardId}" placeholder="Meaning" aria-label="Meaning" />
            <button class="deck-manager-more" type="button" data-card-action="menu" data-card-id="${row.dataset.cardId}" aria-label="Card actions">⋮</button>
        `;
        listEl.appendChild(row);

        const emptyMessage = listEl.querySelector('.deck-manager-empty');
        if (emptyMessage) emptyMessage.remove();

        attachDeckManagerRowHandlers(row, deck, modal);

        const newHanziInput = row.querySelector('[data-field="hanzi"]');
        if (newHanziInput) {
            newHanziInput.focus();
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    const saveAllRows = () => {
        const rows = listEl.querySelectorAll('.deck-manager-row');
        rows.forEach(rowEl => {
            const cardId = rowEl.dataset.cardId || null;
            const isNew = rowEl.dataset.rowMode === 'new';
            const inputs = rowEl.querySelectorAll('.deck-manager-input');
            const values = {};
            inputs.forEach(input => {
                const field = input.dataset.field;
                values[field] = (input.value || '').trim();
            });

            if (!values.hanzi && !values.pinyin && !values.meaning) {
                return;
            }

            const formData = {
                hanzi: values.hanzi || '',
                pinyin: values.pinyin || '',
                meaning: values.meaning || '',
                exampleSentence: ''
            };

            if (isNew) {
                storage.saveCard({ ...formData }, deck.id);
            } else {
                const existingCard = app.library.cards[cardId];
                if (existingCard) {
                    app.saveCard({ ...formData, id: existingCard.id }, existingCard.id, deck.id);
                }
            }
        });
        app.commit();
    };

    const addCardButton = document.getElementById('deck-manager-add-card');
    if (addCardButton) {
        addCardButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            addBlankRow();
        };
    }

    document.getElementById('deck-manager-save').addEventListener('click', () => {
        saveAllRows();
        modal.remove();
    });

    document.getElementById('deck-manager-cancel').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelectorAll('.deck-manager-row').forEach(row => {
        attachDeckManagerRowHandlers(row, deck, modal);
    });
};

/**
 * Show the Create/Edit Deck modal (the inline deck-modal in index.html).
 * @param {object|null} deck - existing deck to edit, or null to create new
 */
ui.showDeckModal = function(deck = null) {
    const modal = document.getElementById('deck-modal');
    if (!modal) return;

    const titleEl = document.getElementById('deck-modal-title');
    if (titleEl) titleEl.textContent = deck ? 'Edit Deck' : 'Create New Deck';

    const nameInput = document.getElementById('deck-name-input');
    const descInput = document.getElementById('deck-desc-input');
    const authorInput = document.getElementById('deck-author-input');
    const langInput = document.getElementById('deck-lang-input');

    if (nameInput) nameInput.value = deck ? deck.name : '';
    if (descInput) descInput.value = deck ? deck.description || '' : '';
    if (authorInput) authorInput.value = deck ? deck.author || '' : 'User';
    if (langInput) langInput.value = deck ? deck.language || '' : 'zh-CN';

    modal.classList.remove('hidden');

    let _mdOverlay2 = false;
    modal.addEventListener('mousedown', (e) => { _mdOverlay2 = e.target === modal; });
    modal.onclick = (e) => {
        if (e.target === modal && _mdOverlay2) {
            modal.classList.add('hidden');
        }
    };

    const btnImportDeckModal = document.getElementById('btn-import-deck-modal');
    if (btnImportDeckModal) {
        btnImportDeckModal.onclick = () => {
            app.importDeck();
        };
    }

    const btnSave = document.getElementById('btn-save-deck-modal');
    if (btnSave) {
        btnSave.onclick = () => {
            const name = nameInput ? nameInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';
            const author = authorInput ? authorInput.value.trim() : '';
            const language = langInput ? langInput.value.trim() : '';

            if (!name) {
                alert('Deck Name is required.');
                return;
            }

            if (deck) {
                app.updateDeck(deck.id, { name, description, author, language });
            } else {
                app.createDeck({ name, description, author, language });
            }
            modal.classList.add('hidden');
        };
    }

    const btnCancel = document.getElementById('btn-cancel-deck-modal');
    if (btnCancel) {
        btnCancel.onclick = () => {
            modal.classList.add('hidden');
        };
    }
};

// (ui.showMoveCardModal removed — was orphaned: no callers in the codebase.)
