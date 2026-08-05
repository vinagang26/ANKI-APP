# 12 Code Smells

This document catalogs architectural code smells, anti-patterns, design compromises, and structural risks in `ANKI-APP/web`.

---

## 1. Architectural Code Smells Directory

### 1. God Objects (`app` and `storage`)

- **Location**: [`core/app.js`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js) and [`services/storage.js`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/services/storage.js)
- **Problem**: 
  - `app` acts as an all-encompassing God Object handling memory state management, screen routing, deck CRUD, card CRUD, deck import/export coordination, external network API fetching (`autoFillFromHanzi`), review session state management, and event handling.
  - `storage` combines LocalStorage I/O, legacy schema migration, default object creation, deck operations, card operations, and Python backend IPC synchronization into a single 374-line object.
- **Why It's Problematic**: Violates the Single Responsibility Principle (SRP). Makes modular testing impossible and increases risk of side effects when modifying unrelated logic.

---

### 2. Implicit Script Order Dependency & Global Scope Pollution

- **Location**: [`index.html:29-41`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/index.html#L29-L41)
- **Problem**: The application lacks standard ES Modules (`import`/`export`) or bundle management. Modules register properties directly onto `window` or rely on previously loaded scripts (`utils`, `storage`, `scheduler`, `ui`, `app`, `window.deckPortability`).
- **Why It's Problematic**: If a developer changes the ordering of script tags in `index.html`, the application will crash at runtime with `ReferenceError: X is not defined`. Globals can also be overwritten by third-party scripts.

---

### 3. Orphaned / Phantom DOM Containers in `index.html`

- **Location**: [`index.html:63-68`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/index.html#L63-L68) (`#screen-form` and `#card-form`)
- **Problem**: `index.html` defines a dedicated screen container `#screen-form` and form `#card-form`. However, when `app.showScreen('form')` or `ui.renderForm()` is executed, the app opens dynamic glass dialog `#card-modal` instead, leaving `#screen-form` as dead, empty DOM structure.
- **Why It's Problematic**: Confuses new developers inspecting the HTML structure, introduces dead markup, and creates false assumptions about layout architecture.

---

### 4. Hardcoded & Unauthenticated External API Endpoint

- **Location**: [`core/app.js:373`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/app.js#L373)
- **Problem**: `autoFillFromHanzi()` fetches directly from Google's unauthenticated GTX single endpoint (`https://translate.googleapis.com/translate_a/single?client=gtx&...`).
- **Why It's Problematic**: The endpoint is an unofficial, undocumented API that can be rate-limited, blocked, or altered by Google at any time without notice. Hardcoding CORS-dependent requests inside application core logic can break card creation if the client loses internet connectivity or if Google blocks the IP.

---

### 5. Continuously Running WebGL Render Loop

- **Location**: [`utils/iridescence.js:431`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/utils/iridescence.js#L431)
- **Problem**: `iridescence.js` starts a `requestAnimationFrame(render)` loop that runs continuously, updating 20 WebGL uniforms and executing WebGL draw calls on every frame (60–144 FPS) without checking if the canvas is visible or if the window is focused/minimized.
- **Why It's Problematic**: Causes high CPU/GPU battery consumption on laptops and mobile devices even when the window is idle in the background.

---

### 6. Event Listener Re-binding & Memory Leak Hazards

- **Location**: [`pages/library.js:175-176`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/pages/library.js#L175) and [`components/deck-manager.js:75`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/deck-manager.js#L75)
- **Problem**: 
  - Every time `ui.renderLibrary()` runs, it calls `document.addEventListener('click', closeDeckMenus)`. Although it attempts `removeEventListener`, dynamic component re-renders frequently re-attach listeners.
  - In `deck-manager.js`, `modal.addEventListener('mousedown', ...)` and `modal.onclick` are re-bound every time the modal is opened.
- **Why It's Problematic**: Multiple listeners accumulate on global DOM nodes, causing duplicate handler execution, sluggish UI response, and memory leaks.

---

### 7. Hardcoded Disabled Primary Action Button

- **Location**: [`pages/home.js:31`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/pages/home.js#L31)
- **Problem**: The main CTA button on the home dashboard (`#btn-review`) is hardcoded with `disabled` attribute (`<button id="btn-review" class="btn btn-primary disabled" disabled title="Review button disabled">`).
- **Why It's Problematic**: Presents a non-functional primary button to users, creating bad UX and misleading UI expectations.

---

### 8. Repeated Escape / HTML Sanitization Patterns

- **Location**: [`components/deck-manager.js:30-32`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/deck-manager.js#L30) and [`components/card-modal.js:27-29`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/components/card-modal.js#L27)
- **Problem**: String values are escaped ad-hoc using inline `.replace(/"/g, '&quot;')` within template string interpolation.
- **Why It's Problematic**: Fragile anti-XSS protection. Misses `<` and `>` characters, leading to possible HTML injection vulnerabilities if card content contains standard HTML characters.
