/**
 * Library page renderer.
 * Registers ui.renderLibrary() on the global ui object.
 *
 * closeDeckMenus is module-level so removeEventListener gets the same
 * reference every call — prevents the listener leak that would occur if
 * it were declared inside renderLibrary.
 */

const closeDeckMenus = (event) => {
    if (!event.target.closest('.deck-menu-button') && !event.target.closest('.deck-menu-popover')) {
        document.querySelectorAll('.deck-menu-popover').forEach(menu => menu.remove());
    }
};

/**
 * Render library screen with deck-based organization.
 * @param {object} library
 * @param {object} progressMap
 * @param {string|null} activeDeckId
 */
ui.renderLibrary = function(library, progressMap, activeDeckId = null) {
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
                <button class="filter-pill ${app.librarySortMode === 'number' ? 'active' : ''}" data-sort="#">#</button>
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

    // Re-register with the stable module-level reference so remove actually works.
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
};
