# 11 Complexity Ranking

This document ranks source files and functions by static code complexity metrics (Cyclomatic Complexity, Line Count, Max Nesting, Parameter Count, DOM Manipulation, Storage Operations, Global References).

---

## 1. File Complexity Ranking

Files sorted from **most complex** to **least complex** based on combined metric scoring:

| Rank | File Path | Cyclomatic Complexity | LOC | Max Nesting | Functions | DOM Queries | Storage Calls | Global Refs | Overall Complexity Score |
| --: | :--- | --: | --: | --: | --: | --: | --: | --: | :--- |
| **1** | `core/app.js` | **38** | 497 | 4 | 25 | 4 | 14 | 5 | **CRITICAL** |
| **2** | `services/storage.js` | **28** | 374 | 4 | 14 | 0 | 8 | 4 | **HIGH** |
| **3** | `components/deck-manager.js` | **26** | 351 | 5 | 14 | 16 | 2 | 4 | **HIGH** |
| **4** | `utils/iridescence.js` | **24** | 433 | 6 | 19 | 1 | 0 | 2 | **HIGH** |
| **5** | `services/deck-portability.js` | **22** | 276 | 4 | 10 | 2 | 0 | 3 | **HIGH** |
| **6** | `pages/library.js` | **20** | 262 | 4 | 10 | 9 | 0 | 3 | **MEDIUM** |
| **7** | `core/scheduler.js` | **18** | 207 | 5 | 3 | 0 | 0 | 2 | **MEDIUM** |
| **8** | `components/card-modal.js` | **16** | 202 | 4 | 10 | 12 | 0 | 4 | **MEDIUM** |
| **9** | `components/review.js` | **12** | 127 | 3 | 5 | 6 | 0 | 3 | **MEDIUM** |
| **10** | `utils/helpers.js` | **8** | 78 | 3 | 6 | 0 | 0 | 2 | **LOW** |
| **11** | `pages/home.js` | **4** | 47 | 2 | 3 | 3 | 0 | 2 | **LOW** |
| **12** | `components/import-modal.js` | **3** | 47 | 2 | 2 | 5 | 0 | 3 | **LOW** |
| **13** | `ui.js` | **3** | 58 | 2 | 3 | 2 | 0 | 1 | **LOW** |

---

## 2. Top 20 Most Complex Functions

| Rank | Function Name | Source File | LOC | Cyclomatic Complexity | Max Nesting | Params | DOM Operations | Storage Calls |
| --: | :--- | :--- | --: | --: | --: | --: | --: | --: |
| **1** | `scheduler.processReview()` | `core/scheduler.js:41` | 124 | **16** | 4 | 2 | 0 | 0 |
| **2** | `storage.loadLibrary()` | `services/storage.js:13` | 86 | **12** | 4 | 0 | 0 | 4 |
| **3** | `deckPortability.compareImportedDeck()` | `services/deck-portability.js:108` | 42 | **10** | 3 | 3 | 0 | 0 |
| **4** | `deckPortability.applyImportedDeck()` | `services/deck-portability.js:173` | 88 | **10** | 4 | 4 | 0 | 0 |
| **5** | `ui.showDeckManager()` | `components/deck-manager.js:11` | 270 | **10** | 5 | 1 | 14 | 2 |
| **6** | `ui.renderLibrary()` | `pages/library.js:22` | 240 | **9** | 4 | 3 | 8 | 0 |
| **7** | `app.autoFillFromHanzi()` | `core/app.js:362` | 48 | **9** | 3 | 3 | 2 | 0 |
| **8** | `ui.showCardModal()` | `components/card-modal.js:12` | 183 | **8** | 4 | 3 | 10 | 0 |
| **9** | `storage.migrateLegacyData()` | `services/storage.js:117` | 44 | **8** | 3 | 1 | 0 | 0 |
| **10** | `app.submitRating()` | `core/app.js:456` | 34 | **7** | 2 | 2 | 1 | 1 |
| **11** | `app.startReview()` | `core/app.js:418` | 30 | **7** | 2 | 3 | 1 | 0 |
| **12** | `app.getDueCards()` | `core/app.js:172` | 25 | **7** | 3 | 1 | 0 | 0 |
| **13** | `ui.renderReview()` | `components/review.js:13` | 114 | **6** | 3 | 4 | 6 | 0 |
| **14** | `app.showScreen()` | `core/app.js:57` | 27 | **5** | 2 | 1 | 2 | 0 |
| **15** | `deckPortability.exportDeckToFile()` | `services/deck-portability.js:38` | 33 | **5** | 3 | 3 | 1 | 0 |
| **16** | `storage.saveCard()` | `services/storage.js:276` | 47 | **5** | 2 | 2 | 0 | 2 |
| **17** | `app.saveCard()` | `core/app.js:262` | 27 | **5** | 2 | 3 | 1 | 1 |
| **18** | `ui.showDeckModal()` | `components/deck-manager.js:286` | 63 | **5** | 3 | 1 | 6 | 0 |
| **19** | `utils.validateCard()` | `utils/helpers.js:51` | 19 | **4** | 2 | 1 | 0 | 0 |
| **20** | `app.getCardCounts()` | `core/app.js:140` | 31 | **4** | 3 | 0 | 0 | 0 |
