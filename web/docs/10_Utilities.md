# 10 Utilities

This document catalogs helper functions, call sites, code placement appropriateness, and potential duplications in `ANKI-APP/web`.

---

## 1. Helper Functions Catalog ([`utils/helpers.js`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/helpers.js))

### 1. `utils.generateId()`
- **Purpose**: Generates a cryptographically secure UUID v4 string using `window.crypto.randomUUID()`. Falls back to a custom `Math.random()` hand-rolled UUID string generator if `window.crypto.randomUUID` is unavailable.
- **Call Sites**:
  - `storage.createEmptyLibrary()` ([`services/storage.js:101`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/storage.js#L101))
  - `storage.migrateLegacyData()` ([`services/storage.js:118`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/storage.js#L118))
  - `storage.createDeck()` ([`services/storage.js:218`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/storage.js#L218))
  - `storage.saveCard()` ([`services/storage.js:279`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/storage.js#L279))
  - `deckPortability.readPortableDeckFromFile()` ([`services/deck-portability.js:91`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/deck-portability.js#L91))
  - `deckPortability.applyImportedDeck()` ([`services/deck-portability.js:184`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/deck-portability.js#L184))
- **Placement Assessment**: **Appropriate**. Lives in `utils/helpers.js`. Shared universally by core, storage, and services.

---

### 2. `utils.todayTimestamp()`
- **Purpose**: Returns the Unix timestamp (milliseconds since epoch) for midnight (00:00:00.000) of the current date in local system time.
- **Call Sites**:
  - `utils.addDaysToToday()` ([`utils/helpers.js:32`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/helpers.js#L32))
  - `scheduler.processReview()` ([`core/scheduler.js:44`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/scheduler.js#L44))
  - `app.getCardCounts()` ([`core/app.js:142`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js#L142))
  - `app.getDueCards()` ([`core/app.js:174`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js#L174))
- **Placement Assessment**: **Appropriate**. Ensures consistent day boundary calculations across scheduling and stats.

---

### 3. `utils.addDaysToToday(days)`
- **Purpose**: Calculates timestamp at 00:00:00 N days into the future by adding `days * 86400000` ms to `todayTimestamp()`.
- **Call Sites**:
  - None (Unused helper function).
- **Placement Assessment**: Belongs in `utils/helpers.js`, but currently constitutes dead/unused code.

---

### 4. `utils.formatDate(timestamp)`
- **Purpose**: Converts a numeric Unix timestamp into a standard `YYYY-MM-DD` date string.
- **Call Sites**:
  - None (Unused in main app UI; `pages/library.js` uses an inline `formatDateText` relative date formatter).
- **Placement Assessment**: Belongs in `helpers.js`, but currently unused by the application UI.

---

### 5. `utils.validateCard(cardData)`
- **Purpose**: Validates flashcard data object, ensuring `hanzi`, `pinyin`, and `meaning` are non-empty strings. Returns `{ valid: boolean, errors: string[] }`.
- **Call Sites**:
  - `app.saveCard()` ([`core/app.js:263`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js#L263))
  - `deck-manager.js` row validation ([`components/deck-manager.js:104`, `246`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/deck-manager.js#L104))
  - `card-modal.js` form validation ([`components/card-modal.js:156`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/card-modal.js#L156))
- **Placement Assessment**: **Appropriate**. Consolidates card validation logic in one place.

---

### 6. `utils.findCardById(cards, id)`
- **Purpose**: Helper to find card item inside a array of cards by `card.id`.
- **Call Sites**:
  - None (Unused helper; `app.library.cards` is stored as a dictionary map, allowing direct `cards[id]` lookup).
- **Placement Assessment**: Obsolete utility function due to schema migration from Array to Object Map.

---

## 2. Visual Utility: Iridescence Shader Engine ([`utils/iridescence.js`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/iridescence.js))

- **Purpose**: Encapsulates a WebGL2 fluid animated gradient background rendered onto `#iridescence-bg`.
- **Functions Defined**:
  - `compileShader(source, type)`: Compiles GLSL shaders.
  - `resize()`: Resizes WebGL viewport based on window `devicePixelRatio`.
  - `render(now)`: Runs continuous `requestAnimationFrame` loop binding GL uniforms (`u_colors`, `u_seed`, `u_speed`, `u_time`, `u_resolution`).
- **Placement Assessment**: Currently placed in `utils/iridescence.js`. Self-contained visual effect.

---

## 3. Code Duplication Analysis

1. **Card Id Formatting Logic**: In `services/deck-portability.js` lines 110, 123, 138, 151, and 218, composite card ID fallback formatting (`${card.hanzi}-${card.pinyin}`) is repeated multiple times across `compareImportedDeck`, `existingCardIdKey`, and `applyImportedDeck`.
2. **Date Formatting Discrepancy**: `utils.formatDate` outputs static `YYYY-MM-DD` strings, whereas `pages/library.js` contains a local `formatDateText` helper function that formats timestamps into relative time strings (`"X hours ago"`, `"Y days ago"`).
3. **HTML Sanitization**: Inline `.replace(/"/g, '&quot;')` string replacement is repeated across `components/deck-manager.js` and `components/card-modal.js` instead of using a shared utility function.
