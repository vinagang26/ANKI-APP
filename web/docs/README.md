# Chinese Vocab App — Architecture Documentation Index

Welcome to the comprehensive architecture documentation for **Chinese Vocab App** (`ANKI-APP/web`).

This documentation suite provides a complete, factual, and detailed technical breakdown of the application architecture, data structures, state management patterns, and scheduling algorithms before reading source code.

---

## 📚 Documentation Index

| # | Chapter Document | Focus Area & Description |
| :--- | :--- | :--- |
| **MAP** | [**Developer Codebase Map**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/CODEBASE_MAP.md) | **Start Here!** Mental model of the application, architecture summary, and 30-minute onboarding guide. |
| **00** | [**Project Overview**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/00_Project_Overview.md) | High-level system architecture, major features, tech stack, script execution sequence, and overall startup lifecycle. |
| **01** | [**Folder Structure**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/01_Folder_Structure.md) | Exhaustive directory tree mapping every file and folder purpose, responsibilities, exported symbols, and consumer usages. |
| **02** | [**Application Flow**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/02_Application_Flow.md) | Detailed operational lifecycle from script load, PyWebView host handshake, LocalStorage migration, event handling, to UI render. |
| **03** | [**Routing**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/03_Routing.md) | In-memory SPA screen switching mechanism (`app.showScreen` & `ui.showScreen`), route matrix, fallback guards, and navigation transitions. |
| **04** | [**State Management**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/04_State_Management.md) | Global singletons (`app`, `storage`, `ui`, `scheduler`), memory state schemas, reader/writer matrices, and `app.commit()` pattern. |
| **05** | [**LocalStorage**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/05_LocalStorage.md) | Complete LocalStorage key dictionary (`chinese-vocab-library-v2`, `progress-v2`, `migrated-v2`, legacy key), JSON schemas, and migration routine. |
| **06** | [**Modules**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/06_Modules.md) | JavaScript file breakdown, exported global singletons, script order dependency graph, and module responsibilities. |
| **07** | [**Function Call Graph**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/07_Function_Call_Graph.md) | Comprehensive call matrix mapping callers, callees, inputs, outputs, side-effects, and Mermaid sequence diagrams for review and auto-fill. |
| **08** | [**Data Flow**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/08_Data_Flow.md) | End-to-end trace flowcharts for key features: study rating submission, card creation auto-fill, and deck import conflict resolution. |
| **09** | [**UI Components**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/09_UI_Components.md) | Detailed documentation of screens (`home`, `library`, `review`) and dynamic glass dialogs (`deck-modal`, `deck-manager`, `card-modal`, `import-conflict`). |
| **10** | [**Utilities**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/10_Utilities.md) | Analysis of helper functions in `helpers.js` and WebGL2 shader background renderer in `iridescence.js`, call sites, and duplication analysis. |
| **11** | [**Dependencies**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/11_Dependencies.md) | Catalog of Web APIs (Crypto, LocalStorage, WebGL2, Fetch, FileReader), Electron/PyWebView host IPC, Google Translate GTX API, and package manifest. |
| **12** | [**Code Smells**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/12_Code_Smells.md) | Critical architectural code smell analysis: God objects (`app`/`storage`), script order fragility, dead DOM elements, listener leaks, unthrottled WebGL loop. |
| **13** | [**Technical Debt**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/13_Technical_Debt.md) | Categorized maintenance risks ranked by impact level (Critical, High, Medium, Low): LocalStorage 5MB cap, lack of ES modules, zero unit tests. |
| **14** | [**Dead Code**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/14_Dead_Code.md) | Inventory of unused elements: `#screen-form` DOM markup, `utils.addDaysToToday`, `utils.formatDate`, `utils.findCardById`, disabled `#btn-review` button. |
| **15** | [**Glossary**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/15_Glossary.md) | Domain terminology definitions: Anki SM-2 Algorithm, Ease Factor, Interval, Lapses, Learning Steps, Card States, Deck, Library, Progress, PyWebView Bridge. |

---

## 🛠 Project Architecture Summary

```
                      +----------------------------------+
                      |            index.html            |
                      +----------------------------------+
                                       |
                 +---------------------+---------------------+
                 |                                           |
    +-------------------------+                 +-------------------------+
    | Global Utilities        |                 | Visual Engine           |
    | - utils/helpers.js      |                 | - utils/iridescence.js  |
    +-------------------------+                 +-------------------------+
                 |
    +-------------------------+
    | Services & Engine       |
    | - services/storage.js   |
    | - services/deck-port.js |
    | - core/scheduler.js     |
    +-------------------------+
                 |
    +-------------------------+
    | UI Coordinator & Views  |
    | - ui.js                 |
    | - pages/*               |
    | - components/*          |
    +-------------------------+
                 |
    +-------------------------+
    | Controller & State      |
    | - core/app.js           |
    +-------------------------+
```
