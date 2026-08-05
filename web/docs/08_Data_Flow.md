# 08 Data Flow

This document tracks how data flows through `ANKI-APP/web` during major user interaction pipelines.

---

## 1. Feature 1: Flashcard Study & Rating Data Flow

```mermaid
flowchart TD
    A[User clicks Rating Button e.g. Good] --> B[Event Listener in components/review.js]
    B --> C[Extract data-rating attribute 'Good']
    C --> D[Call app.submitRating cardId, 'Good']
    D --> E[Fetch card content from app.library.cards]
    E --> F[Fetch progress metadata from app.progress]
    F --> G[Pass card to scheduler.processReview card, 'Good']
    G --> H[Compute SM-2 new easeFactor, interval, repetition, nextReviewAt]
    H --> I[Separate progress fields from card content]
    I --> J[Call storage.updateCardProgress cardId, progressFields]
    J --> K[Write JSON to LocalStorage 'chinese-vocab-progress-v2']
    J --> L[Trigger async syncToPython to pywebview host]
    D --> M[Update app.reviewQueue array]
    M --> N[Pop current card from app.reviewQueue]
    N --> O{queue.length > 0?}
    O -- Yes --> P[Set app.currentReviewCard = reviewQueue[0]]
    O -- No --> Q[Set app.currentReviewCard = null]
    P --> R[Call ui.renderReview with next card]
    Q --> S[Call ui.renderReview showing Session Complete view]
    R --> T[Update DOM #review-content HTML]
    S --> T
```

---

## 2. Feature 2: Card Creation & Auto-Fill Data Flow

```mermaid
flowchart TD
    A[User types Hanzi in input field] --> B[Input Event Listener fires]
    B --> C[Call app.triggerAutoFill hanzi, pinyinTarget, meaningTarget]
    C --> D[Debounce 400ms timer via app.autoFillTimeout]
    D --> E[Call app.autoFillFromHanzi]
    E --> F[ui.showAutoFillLoading true -> Show spinner]
    E --> G[HTTP GET Google Translate GTX Endpoint]
    G --> H[Parse JSON Response Data Array]
    H --> I[Extract Pinyin string data[0][1][3] & Meaning string data[0][0][0]]
    I --> J[Populate DOM target values: pinyinTarget.value, meaningTarget.value]
    J --> K[ui.showAutoFillLoading false -> Hide spinner]
    
    K --> L[User Clicks Save Card Button]
    L --> M[Extract Form Data hanzi, pinyin, meaning]
    M --> N[Call utils.validateCard formData]
    N --> O{valid == true?}
    O -- No --> P[Display Alert with errors array]
    O -- Yes --> Q[Call app.saveCard formData, cardId, targetDeckId]
    Q --> R[Call storage.saveCard]
    R --> S[Generate UUID v4 via utils.generateId if new card]
    S --> T[Update storage.cachedLibrary.cards map & deck.cardIds array]
    T --> U[Initialize card progress: state='new', step=0, easeFactor=2.5]
    U --> V[Save to LocalStorage & Sync to PyWebView]
    V --> W[Call app.commit -> Refresh UI]
```

---

## 3. Feature 3: Deck Import & Conflict Resolution Data Flow

```mermaid
flowchart TD
    A[User Clicks Import Deck] --> B[Trigger Browser File Input Picker .json]
    B --> C[User selects file] --> D[FileReader reads JSON string]
    D --> E[Call deckPortability.readPortableDeckFromFile]
    E --> F[Parse JSON & Validate type == 'chinese-anki-deck']
    F --> G[Call deckPortability.compareImportedDeck]
    G --> H[Compare imported cards against library.cards by ID/Hanzi-Pinyin key]
    H --> I[Categorize cards: newCards[], modifiedCards[], removedCards[]]
    I --> J[Generate human readable summary text]
    J --> K{Target deck exists?}
    
    K -- Yes --> L[Call ui.showImportConflictModal]
    L --> M[Render Conflict Modal with Update, Merge, Replace, Cancel buttons]
    M --> N[User clicks resolution button e.g. 'Update']
    N --> O[Call app.handleImportResolution 'update', importResult]
    
    K -- No --> O
    
    O --> P[Call deckPortability.applyImportedDeck]
    P --> Q[Mutate library.decks array & library.cards dictionary]
    Q --> R[Call storage.saveLibrary]
    R --> S[Write to LocalStorage & Sync Python]
    S --> T[Call app.commit]
    T --> U[Re-render Library Grid UI with updated cards count]
```
