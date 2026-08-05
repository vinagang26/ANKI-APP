# 12 Refactor Priority

This document ranks source files that present architectural challenges, high coupling, or maintenance risks, establishing a refactoring priority matrix without suggesting specific implementations.

---

## 1. Refactor Priority Table

| Priority | File Path | Architectural Reason | Complexity Score | Instability ($I$) | Maintenance Risk | Estimated Refactoring Difficulty | Expected Benefit |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **P1** | `core/app.js` | God Object combining state, routing, network I/O, search, deck CRUD, card CRUD, and study logic. | **CRITICAL** (Cyclomatic: 38) | $I = 0.45$ | High | **High** | Decouples state controller from UI and network logic, enabling isolated module testing. |
| **P2** | `services/storage.js` | Combines LocalStorage reads/writes, schema migration, deck/card CRUD, and PyWebView IPC. Uses 5MB quota-limited LocalStorage. | **HIGH** (Cyclomatic: 28) | $I = 0.33$ | Critical (Quota Exceeded) | **Medium** | Prevents LocalStorage 5MB quota crashes by enabling IndexedDB async storage migration. |
| **P3** | `components/deck-manager.js` | Monolithic 351-line file containing two distinct modal renderers, dynamic DOM string generation, inline editing, and event listener leaks. | **HIGH** (Cyclomatic: 26) | $I = 0.80$ | High | **Medium** | Eliminates event listener accumulation, decouples modal creation, improves UI responsiveness. |
| **P4** | `pages/library.js` | Mixes deck searching, filter pill state, relative date math, card grid rendering, and popover menu management in 262 lines. | **MEDIUM** (Cyclomatic: 20) | $I = 0.75$ | Medium | **Medium** | Separates deck searching/sorting logic from DOM generation, reducing render churn. |
| **P5** | `services/deck-portability.js` | Performs synchronous deck diff calculation and payload creation on the main UI thread during import/export. | **HIGH** (Cyclomatic: 22) | $I = 0.33$ | High (UI Freezing) | **Medium** | Offloads large deck import processing to background workers, preventing UI freeze. |
| **P6** | `index.html` | Contains dead DOM containers (`#screen-form`, `#card-form`) and relies on strict script tag ordering for global dependency loading. | **LOW** | $I = 0.00$ | Medium | **Low** | Cleans up abandoned DOM nodes and eliminates implicit global script ordering hazards. |
| **P7** | `utils/iridescence.js` | Continuous unthrottled WebGL `requestAnimationFrame` render loop running at full FPS when window is idle or hidden. | **HIGH** (Cyclomatic: 24) | $I = 1.00$ | Medium (Battery Drain) | **Low** | Reduces CPU/GPU battery consumption when background tab or app is unfocused. |
| **P8** | `components/card-modal.js` | Contains redundant alias wrapper `ui.renderForm`, duplicate element IDs (`#deck-manager-add-card`), and inline HTML string escaping. | **MEDIUM** (Cyclomatic: 16) | $I = 0.80$ | Low | **Low** | Eliminates ID collisions and removes obsolete wrapper aliases. |

---

## 2. Refactoring Rationale Breakdown

### Priority 1: `core/app.js` (Master Controller)
- **Why It Needs Refactoring**: `app.js` is the central architectural bottleneck ($C_in = 6, C_out = 5$). It mixes application state management, navigation routing, deck/card CRUD, network translation requests (`autoFillFromHanzi`), and review queue logic.
- **Risk of Leaving Intact**: Any feature addition or bug fix in `app.js` risks breaking screen navigation, storage synchronization, or study review queues simultaneously.

### Priority 2: `services/storage.js` (Persistence Layer)
- **Why It Needs Refactoring**: Storage writes rely synchronously on `localStorage.setItem()`, which caps total library data at 5MB per origin. Storing thousands of vocabulary cards with SM-2 progress metadata will trigger unhandled `QuotaExceededError` DOMExceptions.
- **Risk of Leaving Intact**: Users with large vocabulary collections suffer silent data persistence failures.

### Priority 3: `components/deck-manager.js` (Inline Modal Editor)
- **Why It Needs Refactoring**: This 351-line file handles inline HTML table construction, auto-fill event binding per input field, row deletion popovers, and full deck metadata saves. It continuously attaches `mousedown` and `click` listeners on every open call.
- **Risk of Leaving Intact**: Memory leaks accumulate over long editing sessions, leading to duplicate event callbacks and degraded application performance.
