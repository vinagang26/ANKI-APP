# Chinese Vocab App — Deep Architectural Static Analysis (Phase 2)

Welcome to the **Phase 2 Deep Static Analysis Index** for `ANKI-APP/web`.

This documentation suite provides a complete, quantitative architectural analysis of the codebase, covering module dependencies, function call graphs, lines of code (LOC), coupling metrics (Fan-In / Fan-Out / Instability), global variable maps, event pipelines, DOM mappings, rendering paths, and complexity rankings.

---

## 📊 Phase 2 Analysis Reports Index

| # | Analysis Chapter | Primary Metrics & Focus Area |
| :--- | :--- | :--- |
| **01** | [**Module Dependency Graph**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/01_Module_Dependency_Graph.md) | Module imports/exports, script load dependencies, shared globals, Web APIs, Mermaid dependency graph, adjacency list, and hub/leaf classifications. |
| **02** | [**Function Call Graph**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/02_Function_Call_Graph.md) | Call relationships for all primary functions, parameters, return values, callers, callees, side effects, async status, DOM access, and storage operations. |
| **03** | [**File Metrics**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/03_File_Metrics.md) | Quantitative metrics table for all 15 source files: LOC (3,098 total), function counts (124 total), event listeners (45 total), DOM queries (60 total), and max function sizes. |
| **04** | [**Coupling Analysis**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/04_Coupling_Analysis.md) | Fan-In ($C_{in}$), Fan-Out ($C_{out}$), and Instability ($I = \frac{C_{out}}{C_{in} + C_{out}}$) scores across all files, highlighting hubs, leaves, and bottlenecks. |
| **05** | [**Global State Map**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/05_Global_State_Map.md) | Inventory of all global variables (`app`, `ui`, `storage`, `scheduler`, `utils`, `window.deckPortability`), owners, readers, writers, lifetimes, and mutation counts. |
| **06** | [**Event Flow**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/06_Event_Flow.md) | Event listener registry documenting DOM events (`click`, `input`, `change`), callback handlers, business logic, storage sync, and render update sequence diagrams. |
| **07** | [**DOM Map**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/07_DOM_Map.md) | Catalog of all DOM containers, creation points, renderers, removals, attached event listeners, duplicate selector collisions (`#deck-manager-add-card`), and dead DOM markup (`#screen-form`). |
| **08** | [**LocalStorage Access Map**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/08_LocalStorage_Access_Map.md) | Access matrix for LocalStorage keys (`library-v2`, `progress-v2`, `migrated-v2`, legacy key), line numbers, call graphs, readers/writers, and sample payloads. |
| **09** | [**Rendering Pipeline**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/09_Rendering_Pipeline.md) | Step-by-step rendering paths for `renderHome`, `renderLibrary`, `showDeckManager`, `showCardModal`, `showImportConflictModal`, and `renderReview`. |
| **10** | [**Execution Paths**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/10_Execution_Paths.md) | Sequence diagrams for primary execution flows: Startup Sequence, Card Creation, Study Session Review, and Search/Filtering. |
| **11** | [**Complexity Ranking**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/11_Complexity_Ranking.md) | Complexity ranking table for files and Top 20 most complex functions sorted by Cyclomatic Complexity, LOC, max nesting depth, and DOM/Storage operations. |
| **12** | [**Refactor Priority**](file:///C:/Users/Admin/OneDrive/Tài liệu/GitHub/ANKI-APP/web/docs/analysis/12_Refactor_Priority.md) | Ranked refactoring priority matrix (Priority, Reason, Complexity, Coupling, Risk, Difficulty, Expected Benefit) without suggesting implementation code. |

---

## 📈 System Metrics Overview

```
Total Source Volume : 3,098 Lines of Code
Total Functions     : 124 Functions
Total Globals       : 18 Global Variables / Properties
Total Event Listeners: 45 Bound Listeners
Most Complex File   : core/app.js (Cyclomatic Complexity: 38)
Most Complex Func   : scheduler.processReview() (124 LOC, Cyclomatic: 16)
Most Stable Module  : utils/helpers.js (Instability I = 0.00)
Central Hub Module  : core/app.js (Fan-In: 6, Fan-Out: 5)
```
