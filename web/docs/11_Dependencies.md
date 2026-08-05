# 11 Dependencies

This document catalogs external libraries, Web/Browser APIs, third-party network services, package manifests, and unused code/asset dependencies in `ANKI-APP/web`.

---

## 1. External Package Dependencies ([`package.json`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/package.json))

| Package Name | Type | Configured Version | Usage Purpose | Usage Status |
| :--- | :--- | :--- | :--- | :--- |
| `electron` | `dependency` | `"latest"` | Desktop app runtime container wrapper. | **Active** (in Desktop build mode). |
| `electron-builder` | `dependency` | `"latest"` | Cross-platform desktop installer packaging tool. | **Active** (in Packaging mode). |

*(Note: The web client frontend contains 0 npm runtime JavaScript dependencies. It relies exclusively on native browser Web APIs).*

---

## 2. Web & Browser APIs Used

| Web API | Call Sites | Purpose |
| :--- | :--- | :--- |
| **Web Crypto API** | `utils.generateId()` ([`utils/helpers.js:8`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/helpers.js#L8)) | Generates cryptographically secure UUID v4 strings via `window.crypto.randomUUID()`. |
| **Web Storage API (LocalStorage)** | `services/storage.js` ([lines 54, 56, 64, 78, 179, 189](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/storage.js#L54)) | Persistent client-side data storage for libraries, decks, cards, progress state, and migration flags. |
| **WebGL2 API** | `utils/iridescence.js` ([lines 11–340](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/iridescence.js#L11)) | Renders dynamic OkLab/LCH color space procedural fragment shader background animation on `#iridescence-bg`. |
| **Fetch API** | `core/app.js` ([line 373](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js#L373)) | Executes asynchronous HTTP GET request to Google Translate API endpoint for Hanzi auto-fill. |
| **FileReader API** | `services/deck-portability.js` ([line 74](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/deck-portability.js#L74)) | Reads imported JSON deck files asynchronously (`readAsText`). |
| **URL Object API** | `services/deck-portability.js` ([lines 62, 69](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/deck-portability.js#L62)) | Generates and revokes temporary Blob download URLs (`createObjectURL`/`revokeObjectURL`) during deck export. |

---

## 3. Desktop Host APIs (PyWebView Integration)

When executed inside the Python PyWebView desktop container, the web application interfaces with native Python host methods via `window.pywebview.api`:

1. `window.pywebview.api.load_cards()`: Asynchronously reads deck library and card progress from native Python storage (`cards.json`).
2. `window.pywebview.api.save_cards(payload)`: Asynchronously persists library and progress state directly to the filesystem.
3. `window.pywebview.api.export_deck(defaultName, jsonStr)`: Invokes native OS file save dialog for deck exports.

---

## 4. Third-Party Network Services

### Google Translate Single GTX Endpoint
- **URL**: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&dt=rm&q={QUERY}`
- **Call Site**: `app.autoFillFromHanzi()` ([`core/app.js:373`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js#L373)).
- **Purpose**: Retrieves English translation (`data[0][0][0]`) and Pinyin transliteration (`data[0][1][3]`) for Chinese Hanzi text.
- **Dependency Type**: External unauthenticated REST API endpoint.

---

## 5. Unused Imports, Packages, Assets, and Dead Elements

| Element | Location | Status / Explanation |
| :--- | :--- | :--- |
| `#screen-form` & `#card-form` | `index.html` (lines 63–68) | Static DOM containers present in HTML but bypassed at runtime in favor of `#card-modal` dynamic glass dialog. |
| `#btn-review` | `pages/home.js` (line 31) | Rendered with `disabled` attribute (`<button id="btn-review" class="btn btn-primary disabled" disabled>`). Users must study via deck cards in library screen. |
| `utils.addDaysToToday()` | `utils/helpers.js` (lines 31–33) | Helper function defined on `utils` object but never invoked across codebase. |
| `utils.formatDate()` | `utils/helpers.js` (lines 38–44) | Date formatting helper function never invoked by UI components. |
| `utils.findCardById()` | `utils/helpers.js` (lines 74–76) | Array search utility rendered obsolete after switching cards collection storage from Array to dictionary Object. |
| `ui.showMoveCardModal()` | Formerly `components/deck-manager.js` | Removed orphaned component method (0 call sites). |
