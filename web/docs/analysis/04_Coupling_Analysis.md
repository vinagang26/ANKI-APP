# 04 Coupling Analysis

This document measures structural coupling, Fan-In, Fan-Out, and Instability scores across modules in `ANKI-APP/web`.

---

## 1. Coupling Metrics Formula

- **Fan-In ($C_in$)**: The number of external modules that depend on this file.
- **Fan-Out ($C_out$)**: The number of external modules this file depends on.
- **Instability ($I$)**: Computed as:
  $$I = \frac{\text{Fan-Out}}{\text{Fan-In} + \text{Fan-Out}}$$
  - $I = 0.0$: Maximum Stability (Highly depended upon, relies on nothing).
  - $I = 1.0$: Maximum Instability (Relies on many modules, nothing depends on it).

---

## 2. Module Coupling Metrics Table

| Module File | Fan-In ($C_in$) | Fan-Out ($C_out$) | Instability ($I$) | Classification | Architectural Role |
| :--- | --: | --: | --: | :--- | :--- |
| `utils/helpers.js` | 5 | 0 | **0.00** | Highly Stable | Core Utility Leaf |
| `ui.js` | 7 | 1 | **0.13** | Stable Hub | Central UI Coordinator |
| `services/storage.js` | 2 | 1 | **0.33** | Stable Service | Persistence Manager |
| `core/scheduler.js` | 2 | 1 | **0.33** | Stable Engine | Math Engine Leaf |
| `services/deck-portability.js` | 2 | 1 | **0.33** | Stable Service | Portability Service Leaf |
| `core/app.js` | 6 | 5 | **0.45** | Balanced Hub | Master Controller |
| `components/deck-manager.js` | 1 | 4 | **0.80** | Unstable Component | Modal Editor Component |
| `components/card-modal.js` | 1 | 4 | **0.80** | Unstable Component | Card Modal Component |
| `components/review.js` | 1 | 3 | **0.75** | Unstable Component | Study View Component |
| `pages/library.js` | 1 | 3 | **0.75** | Unstable Page | Library Page View |
| `components/import-modal.js` | 1 | 3 | **0.75** | Unstable Component | Import Modal Component |
| `pages/home.js` | 1 | 2 | **0.67** | Unstable Page | Home Page View |
| `utils/iridescence.js` | 0 | 1 | **1.00** | Fully Isolated | Visual Shader Engine |

---

## 3. Instability Spectrum Visualization

```
Stable (I = 0.0)                                                    Unstable (I = 1.0)
|-------------------------------------------------------------------------------------|
[utils/helpers.js] (0.00)
       [ui.js] (0.13)
              [storage.js] (0.33)
              [scheduler.js] (0.33)
              [deck-portability.js] (0.33)
                     [core/app.js] (0.45)
                            [pages/home.js] (0.67)
                                   [pages/library.js] (0.75)
                                   [components/review.js] (0.75)
                                   [components/import-modal.js] (0.75)
                                          [components/deck-manager.js] (0.80)
                                          [components/card-modal.js] (0.80)
                                                 [utils/iridescence.js] (1.00)
```

---

## 4. Architectural Highlights & Coupling Bottlenecks

### 1. Tightly Coupled Hub: `core/app.js`
- `app.js` has a Fan-In of 6 and Fan-Out of 5 ($I = 0.45$).
- It acts as the central bottleneck of the system. Any breaking change to `app.js` method signatures (`saveCard`, `startReview`, `commit`, `showScreen`) breaks 6 consumer components simultaneously.

### 2. High Reuse Foundation: `utils/helpers.js` & `ui.js`
- `utils/helpers.js` ($I = 0.00$) is the most stable file in the codebase. 5 modules rely directly on `utils.generateId` and `utils.validateCard`.
- `ui.js` ($I = 0.13$) is depended upon by 7 modules. It acts as the anchor point for view registration.

### 3. Tight Bidirectional Component Coupling
- All page and component files (`library.js`, `deck-manager.js`, `card-modal.js`, `review.js`) feature tight bidirectional coupling with `app.js`. They are registered by `app.js` via `ui`, yet their inner event handlers call back directly into `app.*` global methods.
