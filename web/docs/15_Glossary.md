# 15 Glossary

This document defines project-specific terminology, domain concepts, data structures, and architectural shorthand used in `ANKI-APP/web`.

---

## Terminology Directory

### **Anki SM-2 Algorithm**
A modified variant of SuperMemo 2 (SM-2) spaced repetition memory algorithm. Calculates review intervals and ease factors for flashcards based on study response quality ratings (**Again**, **Hard**, **Good**, **Easy**). Implemented in [`core/scheduler.js`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/scheduler.js).

### **Card**
The fundamental flashcard unit. Consists of content properties (`id`, `deckId`, `hanzi`, `pinyin`, `meaning`, `exampleSentence`) and SM-2 progress metadata (`state`, `step`, `easeFactor`, `interval`, `repetition`, `lapses`, `nextReviewAt`, `lastReviewedAt`).

### **Deck**
A named collection of flashcards. Represented as a metadata object containing `id`, `name`, `author`, `description`, `language`, `createdAt`, `lastOpenedAt`, and `cardIds` (an array of card UUID strings).

### **Ease Factor (EF)**
A floating-point multiplier (default `2.50`, minimum `1.30`) representing card difficulty in the SM-2 algorithm. Increased when user rates card **Easy** (+0.15) and decreased on **Hard** (-0.15) or **Again** (-0.20). Higher ease factors result in exponentially longer intervals between reviews.

### **Interval**
The duration (in days) between card reviews once a card has graduated to the `review` state.

### **Lapses**
The cumulative count of times a user rates a card as **Again** while the card is in the `review` state. Increases lapse count and resets card to `relearning` state.

### **Learning Steps**
Intra-day review intervals (in minutes) for new cards before graduating to daily review intervals. Defined in `scheduler.js` as `[1, 10]` (Step 0 = 1 minute, Step 1 = 10 minutes).

### **Library**
The top-level container object storing all user vocabulary decks and card content. Schema: `{ decks: Array<Deck>, cards: Record<String, Card> }`.

### **Progress**
The relational dictionary map storing SM-2 scheduling metadata per card ID. Schema: `Record<String, ProgressObject>`.

### **PyWebView Bridge**
The desktop host IPC API interface exposed via `window.pywebview.api`. Enables client-side JavaScript to invoke native Python file storage methods (`load_cards`, `save_cards`, `export_deck`).

### **State (Card State)**
The current SM-2 status of a flashcard:
- `new`: Unstudied card.
- `learning`: Card currently completing initial learning steps (1m / 10m).
- `review`: Graduated card undergoing long-term spaced repetition.
- `relearning`: Previously graduated card that suffered a lapse (rated **Again**).

### **UI Coordinator (`ui`)**
The global singleton object defined in `ui.js` responsible for top-level screen switching (`showScreen`), hiding modals (`closeModals`), and controlling loading spinners.

### **App Controller (`app`)**
The master JavaScript singleton object defined in `core/app.js` holding active in-memory state, coordinating services, handling UI actions, and executing state commits (`app.commit()`).
