(function () {
    const FORMAT_VERSION = 1;
    const DECK_FILE_TYPE = 'chinese-anki-deck';

    function sanitizeFileName(name) {
        return (name || 'deck')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'deck';
    }

    function createPortableDeck(deck, cardsMap) {
        const cardIds = Array.isArray(deck.cardIds) ? deck.cardIds : [];
        const portableCards = cardIds
            .map(cardId => cardsMap[cardId])
            .filter(Boolean)
            .map(card => ({
                id: card.id || cardId,
                hanzi: card.hanzi || '',
                pinyin: card.pinyin || '',
                meaning: card.meaning || ''
            }));

        return {
            formatVersion: FORMAT_VERSION,
            type: DECK_FILE_TYPE,
            deck: {
                id: deck.id,
                name: deck.name || 'Imported Deck',
                author: deck.author || 'User',
                description: deck.description || '',
                language: deck.language || 'zh-CN',
                cards: portableCards
            }
        };
    }

    function exportDeckToFile(deck, cardsMap, fileName = null) {
        const payload = createPortableDeck(deck, cardsMap);
        const jsonStr = JSON.stringify(payload, null, 2);
        const defaultName = `${sanitizeFileName(fileName || deck.name || 'deck')}.json`;

        const tryNativeExport = () => {
            try {
                if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.export_deck === 'function') {
                    const result = window.pywebview.api.export_deck(defaultName, jsonStr);
                    if (result !== false) {
                        return true;
                    }
                }
            } catch (error) {
                console.warn('Native deck export failed, falling back to browser download.', error);
            }
            return false;
        };

        if (tryNativeExport()) {
            return;
        }

        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = defaultName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    function readPortableDeckFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(reader.result);
                    if (!parsed || parsed.type !== DECK_FILE_TYPE) {
                        throw new Error('The selected file is not a supported deck export.');
                    }

                    const deck = parsed.deck || {};
                    if (!deck || typeof deck !== 'object') {
                        throw new Error('The selected file is missing deck data.');
                    }

                    const cards = Array.isArray(deck.cards) ? deck.cards : [];
                    resolve({
                        formatVersion: parsed.formatVersion || 1,
                        deck: {
                            id: deck.id || utils.generateId(),
                            name: deck.name || 'Imported Deck',
                            author: deck.author || 'User',
                            description: deck.description || '',
                            language: deck.language || 'zh-CN',
                            cards
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Unable to read the selected file.'));
            reader.readAsText(file);
        });
    }

    function compareImportedDeck(importedDeck, existingDeck, cardsMap) {
        const importedCards = Array.isArray(importedDeck.cards) ? importedDeck.cards : [];
        const importedCardIds = importedCards.map(card => card.id || `${card.hanzi}-${card.pinyin}`);
        const existingCardIds = Array.isArray(existingDeck?.cardIds) ? existingDeck.cardIds : [];

        const existingCardsById = new Map();
        existingCardIds.forEach(cardId => {
            const card = cardsMap[cardId];
            if (card) {
                existingCardsById.set(card.id || cardId, card);
            }
        });

        const newCards = importedCards.filter(card => !existingCardsById.has(card.id || `${card.hanzi}-${card.pinyin}`));
        const modifiedCards = importedCards.filter(card => {
            const key = card.id || `${card.hanzi}-${card.pinyin}`;
            const existingCard = existingCardsById.get(key);
            if (!existingCard) {
                return false;
            }

            return (
                existingCard.hanzi !== (card.hanzi || '') ||
                existingCard.pinyin !== (card.pinyin || '') ||
                existingCard.meaning !== (card.meaning || '')
            );
        });
        const removedCards = existingCardIds.filter(cardId => {
            const existingCard = cardsMap[cardId];
            if (!existingCard) return false;
            const existingKey = existingCard.id || existingCardIdKey(existingCard);
            return !importedCardIds.includes(existingKey);
        });

        return {
            hasExistingDeck: Boolean(existingDeck),
            newCards,
            modifiedCards,
            removedCards,
            summaryText: buildSummaryText({ newCount: newCards.length, modifiedCount: modifiedCards.length, removedCount: removedCards.length })
        };
    }

    function existingCardIdKey(card) {
        return card && (card.id || `${card.hanzi || ''}-${card.pinyin || ''}`);
    }

    function buildSummaryText(summary) {
        const lines = [];
        if (summary.newCount > 0) lines.push(`+ ${summary.newCount} new card${summary.newCount === 1 ? '' : 's'}`);
        if (summary.modifiedCount > 0) lines.push(`~ ${summary.modifiedCount} modified card${summary.modifiedCount === 1 ? '' : 's'}`);
        if (summary.removedCount > 0) lines.push(`- ${summary.removedCount} removed card${summary.removedCount === 1 ? '' : 's'}`);
        if (lines.length === 0) lines.push('No changes detected.');
        return lines.join('\n');
    }

    function getActionDescriptions() {
        return {
            update: 'Update matching cards and add any new cards, while keeping cards not present in the import.',
            merge: 'Keep the current deck intact and only add new cards from the import. Existing cards are not overwritten.',
            replace: 'Replace the current deck entirely with the imported deck and remove cards that are not in the import.',
            cancel: 'Cancel the import and leave the current deck unchanged.'
        };
    }

    function applyImportedDeck(library, importedDeck, action, existingDeckId = null) {
        if (!importedDeck || !library) return null;

        const normalizedLibrary = library;
        let deck = null;

        if (existingDeckId) {
            deck = normalizedLibrary.decks.find(candidate => candidate.id === existingDeckId);
        }

        if (!deck) {
            const importedDeckId = importedDeck.id || utils.generateId();
            deck = normalizedLibrary.decks.find(candidate => candidate.id === importedDeckId);
        }

        if (!deck) {
            const newDeck = {
                id: importedDeck.id || utils.generateId(),
                name: importedDeck.name || 'Imported Deck',
                author: importedDeck.author || 'User',
                description: importedDeck.description || '',
                language: importedDeck.language || 'zh-CN',
                cardIds: []
            };
            normalizedLibrary.decks.push(newDeck);
            deck = newDeck;
        }

        const importedCards = Array.isArray(importedDeck.cards) ? importedDeck.cards : [];
        const newCardIds = [];

        if (action === 'replace') {
            const oldCardIds = Array.isArray(deck.cardIds) ? [...deck.cardIds] : [];
            oldCardIds.forEach(cardId => {
                delete normalizedLibrary.cards[cardId];
            });
            deck.cardIds = [];
        }

        deck.name = importedDeck.name || deck.name || 'Imported Deck';
        deck.author = importedDeck.author || deck.author || 'User';
        deck.description = importedDeck.description || deck.description || '';
        deck.language = importedDeck.language || deck.language || 'zh-CN';

        importedCards.forEach(card => {
            const cardId = card.id || `${card.hanzi || ''}-${card.pinyin || ''}-${Date.now()}`;
            const existingCard = normalizedLibrary.cards[cardId];

            if (action === 'merge' && existingCard) {
                return;
            }

            normalizedLibrary.cards[cardId] = {
                id: cardId,
                deckId: deck.id,
                hanzi: card.hanzi || '',
                pinyin: card.pinyin || '',
                meaning: card.meaning || '',
                exampleSentence: ''
            };

            if (!deck.cardIds.includes(cardId)) {
                deck.cardIds.push(cardId);
            }

            if (!existingCard) {
                newCardIds.push(cardId);
            }
        });

        if (action === 'update') {
            const existingCardIds = Array.isArray(deck.cardIds) ? [...deck.cardIds] : [];
            importedCards.forEach(card => {
                const cardId = card.id || `${card.hanzi || ''}-${card.pinyin || ''}-${Date.now()}`;
                if (!existingCardIds.includes(cardId)) {
                    return;
                }
                normalizedLibrary.cards[cardId] = {
                    id: cardId,
                    deckId: deck.id,
                    hanzi: card.hanzi || '',
                    pinyin: card.pinyin || '',
                    meaning: card.meaning || '',
                    exampleSentence: ''
                };
            });
        }

        return { deck, newCardIds };
    }

    window.deckPortability = {
        FORMAT_VERSION,
        DECK_FILE_TYPE,
        exportDeckToFile,
        readPortableDeckFromFile,
        compareImportedDeck,
        applyImportedDeck,
        buildSummaryText,
        getActionDescriptions
    };
})();

