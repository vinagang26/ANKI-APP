const ui = {
    /**
     * Show a screen by ID, hide all others.
     * @param {string} screenName - "home", "library", "form", "review"
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
     * Render library screen with deck-based organization.
     * @param {object} library 
     * @param {object} progressMap 
     * @param {string|null} activeDeckId 
     */
    renderLibrary(library, progressMap, activeDeckId = null) {
        const libraryContent = document.getElementById('library-content');
        const decks = Array.isArray(library.decks) ? [...library.decks] : [];
        const cardsMap = library.cards || {};

        if (!activeDeckId && decks.length > 0) {
            activeDeckId = decks[0].id;
        }

        const selectedDeck = decks.find(d => d.id === activeDeckId) || decks[0] || null;
        const searchQuery = (app.librarySearchQuery || '').toLowerCase();

        const sortDecks = (list) => {
            const sorted = [...list];
            switch (app.librarySortMode) {
                case 'recently-opened':
                    return sorted.sort((a, b) => ((b.lastOpenedAt || b.createdAt || 0) - (a.lastOpenedAt || a.createdAt || 0)));
                case 'a-z':
                    return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                case 'z-a':
                    return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                case 'number':
                    return sorted.sort((a, b) => ((b.cardIds || []).length - (a.cardIds || []).length));
                case 'recently-added':
                default:
                    return sorted.sort((a, b) => ((b.createdAt || b.lastOpenedAt || 0) - (a.createdAt || a.lastOpenedAt || 0)));
            }
        };

        const thumbnailStyle = (index) => {
            const palettes = [
                ['#2DD4BF', '#0EA5E9', '#F59E0B'],
                ['#C084FC', '#F472B6', '#F59E0B'],
                ['#FB7185', '#F97316', '#FACC15'],
                ['#60A5FA', '#34D399', '#A78BFA'],
                ['#F87171', '#F59E0B', '#2DD4BF']
            ];
            const colors = palettes[index % palettes.length];
            return `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 45%, ${colors[2]})`;
        };

        const formatDateText = (value) => {
            if (!value) return 'Recently';
            const delta = Date.now() - Number(value);
            const minutes = Math.max(1, Math.round(delta / 60000));
            if (minutes < 60) return `${minutes} min ago`;
            const hours = Math.round(delta / 3600000);
            if (hours < 24) return `${hours} hours ago`;
            const days = Math.round(delta / 86400000);
            if (days < 30) return `${days} days ago`;
            const months = Math.round(days / 30);
            return `${months} months ago`;
        };

        const getVisibleDecks = () => {
            return sortDecks(decks.filter(deck => {
                if (!searchQuery.trim()) return true;
                const haystack = `${deck.name || ''} ${deck.description || ''} ${deck.author || ''} ${deck.language || ''}`.toLowerCase();
                return haystack.includes(searchQuery.trim());
            }));
        };

        const buildDeckCard = (deck, index) => {
            const count = Array.isArray(deck.cardIds) ? deck.cardIds.length : 0;
            const isActive = selectedDeck && deck.id === selectedDeck.id;
            const deckTitle = deck.name || 'Untitled Deck';
            const deckMeta = deck.author || 'User';
            const lastOpened = deck.lastOpenedAt || deck.createdAt || Date.now();

            return `
                <article class="deck-card ${isActive ? 'active' : ''}" data-deck-id="${deck.id}">
                    <div class="deck-card-media" style="background: ${thumbnailStyle(index)};">
                        <div class="deck-card-media-overlay"></div>
                        <div class="deck-card-duration">${count > 0 ? `${count} cards` : 'New'}</div>
                        <button class="deck-menu-button" data-deck-id="${deck.id}" aria-label="Deck menu">⋮</button>
                    </div>
                    <div class="deck-card-body">
                        <h3>${deckTitle}</h3>
                        <div class="deck-card-meta-row">
                            <span>${deckMeta}</span>
                            <span>${formatDateText(lastOpened)}</span>
                        </div>
                        <p class="deck-card-description">${deck.description || 'No description provided.'}</p>
                        <div class="deck-card-footer">
                            <button class="deck-train-btn" data-deck-id="${deck.id}">Train</button>
                            <div class="deck-card-stats">
                                <span>${count} cards</span>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        };

        const renderDeckGrid = () => {
            const visibleDecks = getVisibleDecks();
            const grid = document.querySelector('.library-grid');
            if (!grid) return;

            if (!visibleDecks.length) {
                grid.innerHTML = `
                    <div class="library-empty">
                        <h3>No decks found</h3>
                        <p>Try another search or create a new deck.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = visibleDecks.map(buildDeckCard).join('');
        };

        let html = `
            <div class="library-shell">
                <div class="library-back-row">
                    <button id="btn-library-back" class="library-back-button" aria-label="Back to home">←</button>
                </div>
                <div class="library-topbar">
                    <div class="library-search-wrap">
                        <input id="library-search" class="library-search" type="text" value="${app.librarySearchQuery || ''}" placeholder="Search decks" aria-label="Search decks">
                    </div>
                    <div class="library-header-actions">
                        <button id="btn-create-deck" class="btn btn-primary">+ Create Deck</button>
                    </div>
                </div>

                <div class="library-filter-row">
                    <button class="filter-pill ${app.librarySortMode === 'recently-added' ? 'active' : ''}" data-sort="recently-added">Recently added</button>
                    <button class="filter-pill ${app.librarySortMode === 'recently-opened' ? 'active' : ''}" data-sort="recently-opened">Recently opened</button>
                    <button class="filter-pill ${app.librarySortMode === 'a-z' ? 'active' : ''}" data-sort="a-z">A-Z</button>
                    <button class="filter-pill ${app.librarySortMode === 'number' ? 'active' : ''}" data-sort="number">#</button>
                </div>

                <div class="library-grid"></div>
        `;

        html += `</div>`;
        libraryContent.innerHTML = html;

        const librarySearch = document.getElementById('library-search');
        if (librarySearch) {
            librarySearch.focus();
            librarySearch.setSelectionRange(librarySearch.value.length, librarySearch.value.length);
            librarySearch.addEventListener('input', (event) => {
                const nextValue = event.target.value || '';
                app.librarySearchQuery = nextValue;
                app.librarySearchCursor = nextValue.length;
                renderDeckGrid();
                bindDeckInteractions();
            });
        }

        const closeDeckMenus = (event) => {
            if (!event.target.closest('.deck-menu-button') && !event.target.closest('.deck-menu-popover')) {
                document.querySelectorAll('.deck-menu-popover').forEach(menu => menu.remove());
            }
        };

        document.removeEventListener('click', closeDeckMenus);
        document.addEventListener('click', closeDeckMenus);

        const btnLibraryBack = document.getElementById('btn-library-back');
        if (btnLibraryBack) {
            btnLibraryBack.addEventListener('click', () => {
                app.showScreen('home');
            });
        }

        const bindDeckInteractions = () => {
            document.querySelectorAll('.filter-pill').forEach(button => {
                button.addEventListener('click', () => {
                    app.setLibrarySortMode(button.dataset.sort || 'recently-added');
                });
            });

            document.querySelectorAll('.deck-card').forEach(card => {
                const deckId = card.dataset.deckId;
                card.addEventListener('click', (event) => {
                    if (event.target.closest('.deck-menu-button') || event.target.closest('.deck-train-btn')) return;
                    app.switchDeck(deckId);
                    app.recordDeckOpen(deckId);
                    app.startReview('due', null, deckId);
                });
            });

            document.querySelectorAll('.deck-train-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const deckId = button.dataset.deckId;
                    app.switchDeck(deckId);
                    app.recordDeckOpen(deckId);
                    app.startReview('due', null, deckId);
                });
            });

            document.querySelectorAll('.deck-menu-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const deckId = button.dataset.deckId;
                    const deck = library.decks.find(item => item.id === deckId);
                    if (!deck) return;

                    const menu = document.createElement('div');
                    menu.className = 'deck-menu-popover';
                    menu.innerHTML = `
                        <button class="menu-option" data-action="edit" data-deck-id="${deck.id}">Edit deck</button>
                        <button class="menu-option" data-action="export" data-deck-id="${deck.id}">Export deck</button>
                        <button class="menu-option danger" data-action="delete" data-deck-id="${deck.id}">Delete deck</button>
                    `;

                    const existing = document.querySelector('.deck-menu-popover');
                    if (existing) existing.remove();
                    button.parentElement.appendChild(menu);

                    menu.querySelector('[data-action="edit"]').addEventListener('click', (menuEvent) => {
                        menuEvent.stopPropagation();
                        menu.remove();
                        ui.showDeckManager(deck);
                    });

                    menu.querySelector('[data-action="export"]').addEventListener('click', (menuEvent) => {
                        menuEvent.stopPropagation();
                        menu.remove();
                        app.exportDeckById(deck.id);
                    });

                    menu.querySelector('[data-action="delete"]').addEventListener('click', (menuEvent) => {
                        menuEvent.stopPropagation();
                        menu.remove();
                        app.deleteDeck(deck.id);
                    });
                });
            });
        };

        renderDeckGrid();
        bindDeckInteractions();

        const btnCreateDeck = document.getElementById('btn-create-deck');
        if (btnCreateDeck) {
            btnCreateDeck.addEventListener('click', () => {
                ui.showDeckModal();
            });
        }
    },

    showDeckManager(deck) {
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
        };

        const addCardButton = document.getElementById('deck-manager-add-card');
        if (addCardButton) {
            addCardButton.onclick = () => {
                addBlankRow();
            };
        }

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
                    if (isNew) {
                        rowEl.remove();
                    }
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
                        app.saveCard({ ...existingCard, ...formData }, existingCard.id, deckRef.id);
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
                actionButton.addEventListener('click', () => {
                    const cardId = actionButton.dataset.cardId;
                    const card = app.library.cards[cardId] || null;
                    const menu = document.createElement('div');
                    menu.className = 'deck-menu-popover';
                    menu.innerHTML = `
                        <button class="menu-option" data-menu-action="remove" data-card-id="${cardId}">Remove card</button>
                        <button class="menu-option" data-menu-action="relocate" data-card-id="${cardId}">Relocate card</button>
                    `;

                    const existing = actionButton.parentElement.querySelector('.deck-menu-popover');
                    if (existing) existing.remove();
                    actionButton.parentElement.appendChild(menu);

                    menu.querySelectorAll('[data-menu-action]').forEach(opt => {
                        opt.addEventListener('click', (event) => {
                            event.stopPropagation();
                            const action = opt.dataset.menuAction;
                            if (action === 'remove') {
                                if (card) {
                                    app.deleteCard(card.id);
                                } else {
                                    row.remove();
                                }
                            } else if (action === 'relocate') {
                                // Placeholder for future relocate behavior.
                            }
                            menu.remove();
                            if (card) {
                                ui.showDeckManager(deckRef);
                            }
                        });
                    });
                });
            }
        };

        document.getElementById('deck-manager-save').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('deck-manager-cancel').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelectorAll('.deck-manager-row').forEach(row => {
            attachDeckManagerRowHandlers(row, deck, modal);
        });
    },

    showDeckModal(deck = null) {
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
    },

    showMoveCardModal(cardId, library, currentDeckId) {
        let modal = document.getElementById('move-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'move-modal';
            modal.className = 'glass-modal-overlay';
            document.body.appendChild(modal);
        }

        const decks = library.decks || [];
        let optionsHtml = '';
        decks.forEach(d => {
            if (d.id !== currentDeckId) {
                optionsHtml += `<option value="${d.id}">${d.name}</option>`;
            }
        });

        if (!optionsHtml) {
            alert('No other decks available to move this card to. Create a new deck first.');
            return;
        }

        modal.innerHTML = `
            <div class="glass-modal">
                <h2>Move Card</h2>
                <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Select target deck for this card:</p>
                <div class="form-group" style="margin-top: 14px;">
                    <select id="target-deck-select" class="glass-select">
                        ${optionsHtml}
                    </select>
                </div>
                <div class="button-group vertical" style="margin-top: 16px;">
                    <button id="btn-confirm-move" class="btn btn-primary btn-pill">Move Card</button>
                    <button id="btn-cancel-move" class="btn btn-secondary btn-pill">Cancel</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

        let _mdOverlay3 = false;
        modal.addEventListener('mousedown', (e) => { _mdOverlay3 = e.target === modal; });
        modal.onclick = (e) => {
            if (e.target === modal && _mdOverlay3) {
                modal.classList.add('hidden');
            }
        };

        document.getElementById('btn-confirm-move').onclick = () => {
            const targetDeckId = document.getElementById('target-deck-select').value;
            app.moveCard(cardId, targetDeckId);
            modal.classList.add('hidden');
        };

        document.getElementById('btn-cancel-move').onclick = () => {
            modal.classList.add('hidden');
        };
    },

    /**
     * Display glass card modal popup (create or edit card).
     * @param {object|null} card 
     * @param {array} decks 
     * @param {string} selectedDeckId 
     */
    showCardModal(card = null, decks = [], selectedDeckId = '') {
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
        const addRow = () => {
            const row = document.createElement('div');
            row.className = 'deck-manager-row card-edit-row';
            row.dataset.rowIndex = String(listEl.children.length);
            row.innerHTML = buildRow({ hanzi: '', pinyin: '', meaning: '' }, listEl.children.length);
            const newRowEl = row.firstElementChild;
            listEl.appendChild(newRowEl);
            const newHanzi = newRowEl.querySelector('[data-field="hanzi"]');
            const newPinyin = newRowEl.querySelector('[data-field="pinyin"]');
            const newMeaning = newRowEl.querySelector('[data-field="meaning"]');
            handleRowAutoFill(newHanzi, newPinyin, newMeaning);
        };

        document.getElementById('deck-manager-add-card').onclick = () => addRow();

        const handleRowAutoFill = (hanziInput, pinyinInput, meaningInput) => {
            if (!hanziInput || !pinyinInput || !meaningInput) return;
            hanziInput.oninput = (event) => {
                const value = event.target.value || '';
                if (value.trim()) {
                    app.triggerAutoFill(value.trim(), pinyinInput, meaningInput);
                }
            };
        };

        listEl.querySelectorAll('.card-edit-row').forEach(row => {
            const hanziInput = row.querySelector('[data-field="hanzi"]');
            const pinyinInput = row.querySelector('[data-field="pinyin"]');
            const meaningInput = row.querySelector('[data-field="meaning"]');
            handleRowAutoFill(hanziInput, pinyinInput, meaningInput);
        });

        const btnSave = document.getElementById('btn-form-save');
        if (btnSave) {
            btnSave.onclick = () => {
                const selectedDeck = document.getElementById('input-deck-id');
                const targetDeckId = selectedDeck && selectedDeck.value ? selectedDeck.value : (selectedDeckValue || app.activeDeckId || (validDecks[0] ? validDecks[0].id : null));
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

                modal.classList.add('hidden');
            };
        }

        const btnCancel = document.getElementById('btn-form-cancel');
        if (btnCancel) {
            btnCancel.onclick = () => {
                modal.classList.add('hidden');
                if (app.currentScreen === 'form') {
                    app.cancelForm();
                }
            };
        }

        const closeButton = modal.querySelector('.deck-manager-close');
        if (closeButton) {
            closeButton.onclick = () => {
                modal.classList.add('hidden');
                if (app.currentScreen === 'form') {
                    app.cancelForm();
                }
            };
        }

        modal.classList.remove('hidden');
        let _mdOverlay4 = false;
        modal.addEventListener('mousedown', (e) => { _mdOverlay4 = e.target === modal; });
        modal.onclick = (e) => {
            if (e.target === modal && _mdOverlay4) {
                modal.classList.add('hidden');
                if (app.currentScreen === 'form') {
                    app.cancelForm();
                }
            }
        };
    },

    renderForm(card = null, decks = [], selectedDeckId = '') {
        this.showCardModal(card, decks, selectedDeckId);
    },

    showImportConflictModal(importResult) {
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
                    <div class="button-group review-complete-actions">
                        <button id="btn-review-home" class="btn btn-primary">Back</button>
                        <button id="btn-practice-again" class="btn">Practice Again</button>
                    </div>
                </div>
            `;
            document.getElementById('btn-review-home').addEventListener('click', () => {
                app.showScreen('library');
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
    }
};