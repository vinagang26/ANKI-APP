# 07 DOM Map

This document catalogs every DOM element selector, creation point, rendering logic, removal triggers, attached events, duplicate selectors, and dead DOM containers in `ANKI-APP/web`.

---

## 1. Top-Level DOM Elements Inventory ([`index.html`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/index.html))

| ID / Selector | Purpose | Defined In | Rendered / Controlled By | Events Attached | Usage Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `#iridescence-bg` | Canvas container for WebGL background | `index.html:44` | `utils/iridescence.js` | None | **Active** |
| `#app` | Main SPA container | `index.html:45` | Static HTML | None | **Active** |
| `#screen-home` | Home screen section container | `index.html:47` | `ui.showScreen('home')` | None | **Active** |
| `#home-content` | Home dashboard content wrapper | `index.html:50` | `ui.renderHome()` | Buttons (`#btn-review`, `#btn-new-card`, `#btn-library`) | **Active** |
| `#screen-library` | Library screen section container | `index.html:54` | `ui.showScreen('library')` | None | **Active** |
| `#library-content` | Library grid content wrapper | `index.html:58` | `ui.renderLibrary()` | Search, filters, cards, menu buttons | **Active** |
| `#screen-form` | Form screen section container | `index.html:63` | `ui.showScreen('form')` | None | **DEAD DOM** |
| `#card-form` | Form container element | `index.html:66` | Unused | None | **DEAD DOM** |
| `#screen-review` | Review screen section container | `index.html:70` | `ui.showScreen('review')` | None | **Active** |
| `#review-content` | Review study view wrapper | `index.html:74` | `ui.renderReview()` | Reveal, rating buttons, exit | **Active** |
| `#deck-modal` | Deck metadata create/edit modal | `index.html:80` | `ui.showDeckModal()` | Save, cancel, import buttons | **Active** |
| `#import-conflict-modal` | Import conflict resolution modal | `index.html:109` | `ui.showImportConflictModal()`| Resolution strategy buttons | **Active** |
| `#card-modal` | Flashcard editor glass modal | `index.html:120` | `ui.showCardModal()` | Save, cancel, add row buttons | **Active** |

---

## 2. Dynamically Injected DOM Components

### 1. Deck Manager Overlay (`#deck-manager-modal`)
- **Created In**: [`components/deck-manager.js:15`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/deck-manager.js#L15)
- **Selector**: `#deck-manager-modal`, `.deck-manager-overlay`
- **Rendered By**: `ui.showDeckManager(deck)`
- **Removed By**: `modal.remove()`, close button click, cancel button click, outside overlay click.
- **Events Attached**:
  - `click` on `.deck-manager-close`
  - `click` on `#deck-manager-add-card`
  - `click` on `#deck-manager-save`
  - `click` on `#deck-manager-cancel`
  - `change` / `input` on `.deck-manager-input`

### 2. Deck Context Menu Popover (`.deck-menu-popover`)
- **Created In**: [`pages/library.js:219`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/pages/library.js#L219) & [`components/deck-manager.js:166`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/deck-manager.js#L166)
- **Selector**: `.deck-menu-popover`
- **Rendered By**: `.deck-menu-button` click or row menu button click.
- **Removed By**: `closeDeckMenus` click listener on document or option selection.
- **Events Attached**:
  - `click` on `[data-action="edit"]`
  - `click` on `[data-action="export"]`
  - `click` on `[data-action="delete"]`

---

## 3. Duplicate Selectors & Dead DOM Detection

### Duplicate Selector Issues

1. **`#deck-manager-add-card`**: Same element ID is used in both `components/deck-manager.js` (line 59) and `components/card-modal.js` (line 57). If both modal structures exist in the DOM simultaneously, `document.getElementById('deck-manager-add-card')` will collide.
2. **`[data-card-action="menu"]`**: Used in both `deck-manager.js` and `card-modal.js` for row context menus.

### Dead DOM Container Analysis

- **Container**: `#screen-form` and `#card-form` ([`index.html:63-68`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/index.html#L63-L68))
- **Finding**: `#screen-form` is toggled visible by `ui.showScreen('form')`, but `ui.renderForm()` immediately opens `#card-modal` instead of writing content into `#card-form`. `#screen-form` remains an empty container that serves no rendering purpose.
