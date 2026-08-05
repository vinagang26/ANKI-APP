# 03 File Metrics

This document provides quantitative file metrics for every source file in `ANKI-APP/web`.

---

## 1. Source Code Metrics Table

| File Path | LOC | Functions | Classes | Imports | Exports | Event Listeners | DOM Queries | Storage Calls | Avg Func Size | Max Func Size | Max Nesting | Globals Ref |
| :--- | --: | --------: | ------: | ------: | ------: | --------------: | ----------: | ------------: | ------------: | ------------: | ----------: | ----------: |
| `index.html` | 125 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 lines | 0 lines | 3 | 0 |
| `ui.js` | 58 | 3 | 0 | 0 | 1 | 0 | 2 | 0 | 12 lines | 15 lines | 2 | 1 (`ui`) |
| `package.json` | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 lines | 0 lines | 1 | 0 |
| `core/app.js` | 497 | 25 | 0 | 0 | 1 | 2 | 4 | 14 | 18 lines | 42 lines | 4 | 5 |
| `core/scheduler.js` | 207 | 3 | 0 | 0 | 1 | 0 | 0 | 0 | 60 lines | 124 lines | 5 | 2 |
| `services/storage.js` | 374 | 14 | 0 | 0 | 1 | 1 | 0 | 8 | 24 lines | 86 lines | 4 | 4 |
| `services/deck-portability.js` | 276 | 10 | 0 | 0 | 1 | 0 | 2 | 0 | 25 lines | 88 lines | 4 | 3 |
| `pages/home.js` | 47 | 3 | 0 | 0 | 1 | 2 | 3 | 0 | 14 lines | 36 lines | 2 | 2 |
| `pages/library.js` | 262 | 10 | 0 | 0 | 1 | 9 | 9 | 0 | 24 lines | 66 lines | 4 | 3 |
| `components/deck-manager.js` | 351 | 14 | 0 | 0 | 2 | 14 | 16 | 2 | 22 lines | 72 lines | 5 | 4 |
| `components/card-modal.js` | 202 | 10 | 0 | 0 | 2 | 10 | 12 | 0 | 18 lines | 44 lines | 4 | 4 |
| `components/import-modal.js` | 47 | 2 | 0 | 0 | 1 | 1 | 5 | 0 | 20 lines | 35 lines | 2 | 3 |
| `components/review.js` | 127 | 5 | 0 | 0 | 1 | 4 | 6 | 0 | 22 lines | 74 lines | 3 | 3 |
| `utils/helpers.js` | 78 | 6 | 0 | 0 | 1 | 0 | 0 | 0 | 11 lines | 15 lines | 3 | 2 |
| `utils/iridescence.js` | 433 | 19 | 0 | 0 | 0 | 2 | 1 | 0 | 21 lines | 78 lines | 6 | 2 |
| **Total** | **3,098** | **124** | **0** | **0** | **13** | **45** | **60** | **24** | **21 lines** | **124 lines** | **6** | **N/A** |

---

## 2. Summary Highlights

- **Total Source Code Volume**: 3,098 lines of JavaScript and HTML across 15 project source files.
- **Function Inventory**: 124 functions, with an average length of 21 lines per function.
- **Largest Single Function**: `scheduler.processReview()` in [`core/scheduler.js`](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/core/scheduler.js#L41-L164) (124 lines).
- **Maximum Nesting Depth**: 6 levels inside `utils/iridescence.js` fragment shader calculation loop.
- **Event Listeners**: 45 DOM event listeners bound dynamically across UI pages and components.
- **DOM Queries**: 60 explicit calls to `document.getElementById` or `document.querySelectorAll`.
- **Storage Operations**: 24 direct interactions with Web LocalStorage or PyWebView IPC bridges.
