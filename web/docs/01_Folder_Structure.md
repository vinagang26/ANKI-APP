# 01 Folder Structure

This document provides a comprehensive mapping of the file and directory structure of `ANKI-APP/web`.

```
web/
├── components/
│   ├── card-modal.js
│   ├── deck-manager.js
│   ├── import-modal.js
│   └── review.js
├── core/
│   ├── app.js
│   └── scheduler.js
├── pages/
│   ├── home.js
│   └── library.js
├── services/
│   ├── deck-portability.js
│   └── storage.js
├── styles/
│   ├── base.css
│   ├── buttons.css
│   ├── forms.css
│   ├── library.css
│   ├── modals.css
│   ├── responsive.css
│   └── review.css
├── utils/
│   ├── helpers.js
│   └── iridescence.js
├── index.html
├── package.json
├── package-lock.json
└── ui.js
```

---

## Folder Responsibilities

| Directory | Purpose & Responsibility |
| :--- | :--- |
| **`/` (Root)** | Main entry point (`index.html`), UI coordinator (`ui.js`), and desktop packaging metadata (`package.json`). |
| **`/components`** | Dynamic modal dialogs and specialized view components attached onto the global `ui` coordinator. |
| **`/core`** | Central business logic, application state manager (`app.js`), and SM-2 spaced repetition algorithm (`scheduler.js`). |
| **`/pages`** | Top-level screen view renderers (`home.js`, `library.js`). |
| **`/services`** | Data persistence engines, LocalStorage wrappers, PyWebView desktop bridges, and import/export deck portability tools. |
| **`/styles`** | Modular CSS stylesheets covering base layout, components, glassmorphism modals, forms, and responsive rules. |
| **`/utils`** | Shared general-purpose helper functions (`helpers.js`) and WebGL2 shader visual background engine (`iridescence.js`). |

---

## Detailed File Specifications

### Root Files

#### [`index.html`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\index.html)
- **Why it exists**: Serves as the single SPA entry point, defines HTML view containers (`#screen-home`, `#screen-library`, `#screen-form`, `#screen-review`), modal overlays, and enforces script execution order via `<script defer>`.
- **What it exports**: DOM element structures.
- **What imports it**: Browser engine / PyWebView host window.
- **Usage Status**: **Active**. *(Note: Container `#screen-form` / `#card-form` is unused runtime markup fallback).*

#### [`ui.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\ui.js)
- **Why it exists**: Establishes the global `const ui = {}` object as a central UI Coordinator for screen switching and modal controls.
- **What it exports**: Global `ui` object with `showScreen()`, `closeModals()`, `showAutoFillLoading()`.
- **What imports it**: `pages/home.js`, `pages/library.js`, `components/*`, `core/app.js`.
- **Usage Status**: **Active**.

#### [`package.json`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\package.json)
- **Why it exists**: Configuration file for Electron desktop app building (`main: "main.js"`, scripts: `dev`, `build`).
- **What it exports**: Package metadata and build instructions.
- **What imports it**: `npm`, `electron`, `electron-builder`.
- **Usage Status**: **Active** (for Electron wrapper).

---

### `/core` Directory

#### [`core/app.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\core\app.js)
- **Why it exists**: Central application controller and reactive state hub (`const app = {}`).
- **What it exports**: Global `app` object managing state (`library`, `progress`, `activeDeckId`, `reviewQueue`), navigation methods, CRUD handlers, auto-fill triggering, review queue management.
- **What imports it**: Event handlers inside `pages/*` and `components/*`.
- **Usage Status**: **Active**.

#### [`core/scheduler.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\core\scheduler.js)
- **Why it exists**: Encapsulates the Anki SM-2 spaced repetition scheduling algorithm.
- **What it exports**: Global `scheduler` object with `initCard()`, `processReview()`, `getIntervalPreviews()`.
- **What imports it**: `core/app.js`, `components/review.js`.
- **Usage Status**: **Active**.

---

### `/services` Directory

#### [`services/storage.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\services\storage.js)
- **Why it exists**: Handles all persistent data read/write operations, LocalStorage caching, legacy schema migration, and Python backend synchronization.
- **What it exports**: Global `storage` object (`loadLibrary()`, `getLibrary()`, `saveLibrary()`, `createDeck()`, `saveCard()`, `syncToPython()`, etc.).
- **What imports it**: `core/app.js`.
- **Usage Status**: **Active**.

#### [`services/deck-portability.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\services\deck-portability.js)
- **Why it exists**: Implements deck export/import parsing, difference calculation, conflict summary generation, and merge/replace actions.
- **What it exports**: `window.deckPortability` object (`exportDeckToFile()`, `readPortableDeckFromFile()`, `compareImportedDeck()`, `applyImportedDeck()`).
- **What imports it**: `core/app.js`, `components/import-modal.js`.
- **Usage Status**: **Active**.

---

### `/pages` Directory

#### [`pages/home.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\pages\home.js)
- **Why it exists**: Home dashboard view renderer.
- **What it exports**: Attaches `ui.renderHome()` onto global `ui`.
- **What imports it**: `core/app.js` via `app.renderHome()`.
- **Usage Status**: **Active**.

#### [`pages/library.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\pages\library.js)
- **Why it exists**: Vocabulary Library view renderer displaying grid of deck cards, search bar, sort filters, and deck popover actions.
- **What it exports**: Attaches `ui.renderLibrary()` onto global `ui`.
- **What imports it**: `core/app.js` (`app.showScreen('library')`, `app.commit()`).
- **Usage Status**: **Active**.

---

### `/components` Directory

#### [`components/deck-manager.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\components\deck-manager.js)
- **Why it exists**: Full-screen glass modal for inline card editing table per deck, and deck creation/editing dialog.
- **What it exports**: Attaches `ui.showDeckManager()` and `ui.showDeckModal()` onto global `ui`.
- **What imports it**: `pages/library.js`, `core/app.js`.
- **Usage Status**: **Active**. *(Note: `ui.showMoveCardModal` was removed as orphaned code).*

#### [`components/card-modal.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\components\card-modal.js)
- **Why it exists**: Dynamic dialog component for creating and editing individual flashcards.
- **What it exports**: Attaches `ui.showCardModal()` and fallback alias `ui.renderForm()` onto global `ui`.
- **What imports it**: `core/app.js`.
- **Usage Status**: **Active**.

#### [`components/import-modal.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\components\import-modal.js)
- **Why it exists**: Renders conflict resolution modal when importing existing decks.
- **What it exports**: Attaches `ui.showImportConflictModal()` onto global `ui`.
- **What imports it**: `core/app.js` (`app.importDeck()`).
- **Usage Status**: **Active**.

#### [`components/review.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\components\review.js)
- **Why it exists**: Flashcard study review view displaying card front/back, rating buttons, and interval previews.
- **What it exports**: Attaches `ui.renderReview()` onto global `ui`.
- **What imports it**: `core/app.js` (`app.startReview()`, `app.revealCard()`, `app.submitRating()`).
- **Usage Status**: **Active**.

---

### `/utils` Directory

#### [`utils/helpers.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\utils\helpers.js)
- **Why it exists**: Common utility functions (UUID v4 generator, timestamp operations, date formatting, card data validation).
- **What it exports**: Global `utils` object (`generateId()`, `todayTimestamp()`, `formatDate()`, `validateCard()`, `findCardById()`).
- **What imports it**: `services/storage.js`, `services/deck-portability.js`, `core/scheduler.js`, `core/app.js`, `components/deck-manager.js`, `components/card-modal.js`.
- **Usage Status**: **Active**.

#### [`utils/iridescence.js`](file:///C:/Users/Admin/OneDrive/Tài liệu\GitHub\ANKI-APP\web\utils\iridescence.js)
- **Why it exists**: Self-contained WebGL2 animated background effect.
- **What it exports**: Self-executing `DOMContentLoaded` canvas animation loop attached to `#iridescence-bg`.
- **What imports it**: `index.html`.
- **Usage Status**: **Active**.

---

### `/styles` Directory

| File | Responsibilities | Usage Status |
| :--- | :--- | :--- |
| `styles/base.css` | CSS variables, typography, reset rules, WebGL container layer, `#app` layout shell. | **Active** |
| `styles/buttons.css` | Base `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-pill`, rating button styling. | **Active** |
| `styles/forms.css` | Glass input fields (`.glass-input`), form labels, layout groups. | **Active** |
| `styles/library.css` | Library search topbar, filter pills, deck cards grid layout, menu popover styling. | **Active** |
| `styles/modals.css` | Glassmorphism modal overlays (`.glass-modal-overlay`), deck manager overlay, dialog boxes. | **Active** |
| `styles/review.css` | Review container, flashcard display, front/back transitions, state badges, rating buttons. | **Active** |
| `styles/responsive.css` | Responsive media query breakpoints for mobile viewports. | **Active** |
