# 14 Dead Code

This document lists unused functions, dead DOM markup, unreferenced variables, duplicate utility helpers, and commented-out code elements in `ANKI-APP/web`.

---

## 1. Dead Code Catalog

### 1. Unused DOM Containers

- **Target Item**: `#screen-form` and `#card-form` DOM structures.
- **Location**: [`index.html:63-68`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/index.html#L63-L68)
- **Code Snippet**:
  ```html
  <div id="screen-form" class="screen hidden">
      <div class="container">
          <h1 id="form-title">New Card</h1>
          <form id="card-form"></form>
      </div>
  </div>
  ```
- **Why It Is Dead**: When `app.showScreen('form')` or `ui.renderForm()` is executed, the application presents the dynamic glass modal `#card-modal` instead of writing HTML into `#card-form`. `#screen-form` is an abandoned legacy container.

---

### 2. Unused Utility Functions in `utils/helpers.js`

- **Target Item A**: `utils.addDaysToToday(days)`
  - **Location**: [`utils/helpers.js:31-33`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/helpers.js#L31-L33)
  - **Why It Is Dead**: Zero call sites across codebase. Scheduling calculations use `scheduler.processReview` and inline timestamp math (`now + days * 86400 * 1000`).

- **Target Item B**: `utils.formatDate(timestamp)`
  - **Location**: [`utils/helpers.js:38-44`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/helpers.js#L38-L44)
  - **Why It Is Dead**: Zero call sites in UI. `pages/library.js` implements its own relative date calculator (`formatDateText`).

- **Target Item C**: `utils.findCardById(cards, id)`
  - **Location**: [`utils/helpers.js:74-76`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/helpers.js#L74-L76)
  - **Why It Is Dead**: Zero call sites. Flashcards are indexed inside an object map (`app.library.cards`), rendering array-find helpers obsolete.

---

### 3. Orphaned Function Alias `ui.renderForm`

- **Target Item**: `ui.renderForm`
- **Location**: [`components/card-modal.js:199-201`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/card-modal.js#L199-L201)
- **Code Snippet**:
  ```javascript
  ui.renderForm = function(card = null, decks = [], selectedDeckId = '') {
      ui.showCardModal(card, decks, selectedDeckId);
  };
  ```
- **Why It Is Dead**: Redundant wrapper function retained solely for backwards compatibility. All card modal invocations can call `ui.showCardModal` directly.

---

### 4. Orphaned Method Note in `components/deck-manager.js`

- **Target Item**: Comment noting `ui.showMoveCardModal` removal.
- **Location**: [`components/deck-manager.js:350`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/deck-manager.js#L350)
- **Code Snippet**:
  ```javascript
  // (ui.showMoveCardModal removed — was orphaned: no callers in the codebase.)
  ```
- **Why It Is Dead**: Remnant comment referencing a previously removed card relocation modal.

---

### 5. Disabled Primary UI Button

- **Target Item**: `#btn-review` button element.
- **Location**: [`pages/home.js:31`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/pages/home.js#L31)
- **Code Snippet**:
  ```javascript
  <button id="btn-review" class="btn btn-primary disabled" disabled title="Review button disabled">
      Start Due Review (${counts.totalDue})
  </button>
  ```
- **Why It Is Dead**: The button is rendered permanently disabled and lacks event listeners. All study reviews are initiated through the Vocabulary Library screen.

---

### 6. Unused CSS Selectors

- **Target Item**: Legacy CSS rules targeting `#card-form`.
- **Location**: [`styles/forms.css`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/styles/forms.css)
- **Why It Is Dead**: Card creation/editing styles are defined in `styles/modals.css` for `.card-editor-dialog` and `.deck-manager-row`. `forms.css` contains unused form container styles.
