# 10 Execution Paths

This document provides end-to-end execution paths with Mermaid sequence diagrams for all primary application operations in `ANKI-APP/web`.

---

## 1. Execution Path 1: Application Startup Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant App as app.js
    participant Storage as storage.js
    participant PyAPI as PyWebView Host
    participant UI as ui.js

    User->>Browser: Opens app (index.html)
    Browser->>App: DOMContentLoaded event
    App->>App: app.init()
    alt Desktop Shell Mode
        App->>PyAPI: Await 'pywebviewready' event
    end
    App->>Storage: storage.loadLibrary()
    alt PyWebView API available
        Storage->>PyAPI: pywebview.api.load_cards()
        PyAPI-->>Storage: Return JSON library
    else Fallback Browser LocalStorage
        Storage->>Storage: Read 'chinese-vocab-library-v2' & 'progress-v2'
    end
    opt Migration Required
        Storage->>Storage: migrateLegacyData('chinese-vocab-cards')
    end
    Storage-->>App: Return { library, progress }
    App->>App: Set activeDeckId = library.decks[0].id
    App->>UI: app.showScreen('home')
    UI->>Browser: Hide all .screen, show #screen-home
    UI->>UI: app.renderHome() -> ui.renderHome(counts)
    UI->>Browser: Inject stats HTML into #home-content
```

---

## 2. Execution Path 2: Card Creation & Storage Save Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Form as Card Modal UI
    participant App as app.js
    participant Utils as utils/helpers.js
    participant Storage as storage.js
    participant LS as LocalStorage

    User->>Form: Fill Hanzi, Pinyin, Meaning and click "Save Card"
    Form->>App: app.saveCard(formData, null, targetDeckId)
    App->>Utils: utils.validateCard(formData)
    alt Validation Fails
        Utils-->>App: { valid: false, errors: [...] }
        App->>Form: alert('Validation errors...')
    else Validation Succeeds
        Utils-->>App: { valid: true, errors: [] }
        App->>Storage: storage.saveCard(cardData, targetDeckId)
        Storage->>Utils: utils.generateId()
        Utils-->>Storage: Return new card UUID
        Storage->>Storage: Update cachedLibrary.cards & deck.cardIds
        Storage->>Storage: Initialize progress: { state: 'new', easeFactor: 2.5 }
        Storage->>LS: saveLibrary() -> setItem('chinese-vocab-library-v2')
        Storage->>LS: saveProgress() -> setItem('chinese-vocab-progress-v2')
        Storage->>Storage: syncToPython()
        Storage-->>App: Return saved card object
        App->>App: app.commit()
        App->>Form: ui.renderLibrary() / app.renderHome()
    end
```

---

## 3. Execution Path 3: Study Session Review & SM-2 Rating Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant ReviewUI as Review Screen DOM
    participant App as app.js
    participant Sched as scheduler.js
    participant Storage as storage.js
    participant UI as ui.js

    User->>ReviewUI: Click "Reveal Answer" button
    ReviewUI->>App: app.revealCard()
    App->>UI: ui.renderReview(queue.length, pos, card, true)
    UI->>ReviewUI: Render Card Back + Rating Buttons with interval previews
    User->>ReviewUI: Click "Good" rating button
    ReviewUI->>App: app.submitRating(cardId, "Good")
    App->>Sched: scheduler.initCard(currentCard)
    App->>Sched: scheduler.processReview(currentCard, "Good")
    Sched->>Sched: Compute new interval, ease, nextReviewAt timestamp
    Sched-->>App: Return updatedCard object
    App->>Storage: storage.updateCardProgress(cardId, progressFields)
    Storage->>Storage: saveProgress() -> LocalStorage & syncToPython()
    App->>App: Update reviewQueue (remove finished or requeue learning)
    alt reviewQueue has cards remaining
        App->>App: Set currentReviewCard = reviewQueue[0]
        App->>UI: ui.renderReview(queue.length, 1, currentReviewCard, false)
    else reviewQueue empty
        App->>App: Set currentReviewCard = null
        App->>UI: ui.renderReview(0, 0, null, false) -> Render Session Complete Card
    end
    UI->>ReviewUI: Update #review-content DOM
```

---

## 4. Execution Path 4: Search & Filter Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SearchInput as Library Search Input
    participant App as app.js
    participant LibUI as pages/library.js

    User->>SearchInput: Types query "HSK"
    SearchInput->>App: Input Event -> app.librarySearchQuery = "hsk"
    App->>LibUI: renderDeckGrid()
    LibUI->>LibUI: getVisibleDecks() -> Filter decks by name/desc containing "hsk"
    LibUI->>LibUI: sortDecks() -> Sort visible decks by librarySortMode
    LibUI->>SearchInput: Replace innerHTML of .library-grid
    LibUI->>LibUI: bindDeckInteractions() -> Re-attach card event handlers
```
