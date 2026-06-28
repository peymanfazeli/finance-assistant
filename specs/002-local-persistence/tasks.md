---
description: "Task list for local persistence feature implementation"
---

# Tasks: Local Persistence

**Input**: Design documents from `specs/002-local-persistence/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ipc-channels.md

**Tests**: Not requested in spec. Validation follows the independent test scenarios in spec.md and quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the project builds and establish conventions for new code.

**⚠️ This project has no new npm dependencies — all work reuses Node.js built-in `fs` and existing Electron IPC infrastructure.**

- [x] T001 Verify project builds and lint passes: `npm run build && npm run lint`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create SettingsService in `src/core/services/SettingsService.ts` — factory for default settings (`ApplicationSettings` with `settingsVersion: 1`), JSON serialization/deserialization, migration stub, and settings validation
- [x] T003 [P] Create `src/main/settingsHandlers.ts` — register `settings:load` and `settings:save` IPC handlers using atomic write pattern (same as datasetHandlers). Load reads from `{userData}/settings.json`, save writes via temp-file-then-rename.
- [x] T004 Update `src/main/preload.ts` — expose `window.api.settings` with `load()` and `save(content)` methods via `contextBridge.exposeInMainWorld`
- [x] T005 Update `src/renderer/api.d.ts` — add `settings: { load: ..., save: ... }` to the `Window.api` interface declaration
- [x] T006 Register `settingsHandlers` in `src/main/index.ts` inside `app.whenReady()` alongside existing handlers; call `registerSettingsHandlers()`

**Checkpoint**: Settings IPC layer is functional — preload exposes `window.api.settings.load()` and `.save()`. Ready for user story wiring.

---

## Phase 3: User Story 1 - Auto-Save After Every Change (Priority: P1) 🎯 MVP

**Goal**: Dataset auto-saves to disk after every transaction create/edit/delete without blocking the UI. Auto-save is immediate and serialized (concurrency guard). Save failures surface as log entries plus UI toast notifications.

**⚠️ Verification note**: The spec's Independent Test for US1 includes a "close and reopen" step which requires US4 (Settings) and US2 (Auto-Load) to be complete. For standalone MVP validation without those stories, verify by reading the dataset file from disk directly after each mutation.

**Independent Test**: Add 3 transactions, edit 1, delete 1 via the UI. After each action, manually inspect `{app.getPath('userData')}/datasets/default.fina` to confirm the file is updated within 1 second. No "Save" button is clicked. UI remains responsive throughout.

### Implementation for User Story 1

- [x] T007 Implement save concurrency guard in `src/core/store/useAppStore.ts` — wrap `saveDataset()` with a promise chain so concurrent calls are queued and executed serially (not debounced)
- [x] T008 [P] [US1] Call `saveDataset()` at the end of `addTransaction` in `useAppStore.ts`
- [x] T009 [P] [US1] Call `saveDataset()` at the end of `updateTransaction` in `useAppStore.ts`
- [x] T010 [P] [US1] Call `saveDataset()` at the end of `deleteTransaction` in `useAppStore.ts`
- [x] T011 [P] [US1] Call `saveDataset()` at the end of `duplicateTransaction` in `useAppStore.ts`
- [x] T012 [P] [US1] Wire dataset save after import completes in `useAppStore.ts` (import actions already exist, add `saveDataset()` call after successful import)
- [x] T013 [US1] Add `before-quit` handler in `src/main/index.ts` — wait for pending save to complete (with 5-second timeout) before allowing app to close, preventing data loss
- [x] T014 [US1] Implement save failure handling — catch errors from `window.api.dataset.save()`, log to `{userData}/logs/error.log`, and dispatch a transient UI notification (toast)

**Checkpoint**: Every dataset mutation triggers an automatic save. Concurrent saves are serialized. Failed saves produce a log entry and UI toast. App waits for pending saves on close.

---

## Phase 4: User Story 4 - Settings Persistence Across Restarts (Priority: P1)

**Goal**: Language preference, visible dashboard cards, and the `lastOpenedDataset` / `recentDatasets` fields survive application restarts. Corrupted settings files fall back to defaults without crashing and overwrite the corrupt file.

**Independent Test**: Change language to Persian, hide 2 dashboard cards, close & reopen the app. Interface is Persian; hidden cards remain hidden. Repeat 3 times — settings persist unchanged.

### Implementation for User Story 4

- [x] T015 [P] [US4] Call `window.api.settings.save()` after every `setLanguage()` call in `useAppStore.ts` — serialize current settings via `SettingsService.serialize()`
- [x] T016 [P] [US4] Call `window.api.settings.save()` after every `updateSettings()` call in `useAppStore.ts` — persist any settings diff (visibleDashboardCards, lastOpenedDataset, recentDatasets)
- [x] T017 [US4] Load settings on application startup in `src/main/index.ts` — before renderer loads, read `settings.json`, validate via `SettingsService.validate()`. On corruption: overwrite with defaults and log. On missing file: treat as first launch (return null, let US3 handle).
- [x] T018 [US4] Pass loaded settings to renderer via IPC on startup — send settings data over a `settings:initial` event or pass during window creation. The store should hydrate from this payload.

**Checkpoint**: Settings changes persist across restarts. Corrupt settings are replaced with defaults (with logging). First-launch detection works.

---

## Phase 5: User Story 3 - Default Dataset Creation on First Launch (Priority: P1)

**Goal**: On first-ever launch (no settings.json exists), the application creates a default dataset named "My Finances" with USD currency and seeded default categories (Food & Drinks, Transportation, Internet, Shopping, Education, Software & Subscriptions, Bills, Investment, Other). No welcome screen or dialogs — user sees the dashboard immediately.

**Independent Test**: Delete `{userData}/settings.json` and `{userData}/datasets/` directory. Launch the app. Dashboard appears within 3 seconds. Navigate to categories — all 9 default categories are present. Close & reopen — dataset reloads.

### Implementation for User Story 3

- [x] T019 [US3] Add IPC handler `dataset:createDefault` in `src/main/datasetHandlers.ts` (or a new dedicated file) — calls `DatasetService.create('My Finances', 'USD', defaultCategories)`, writes atomically to `{userData}/datasets/default.fina`, returns the path
- [x] T020 [US3] Add `window.api.dataset.createDefault()` to preload and `api.d.ts` — preload exposes the new channel, type declarations reflect it
- [x] T021 [US3] Implement first-launch detection in `src/renderer/App.tsx` — on mount, if no settings exist (settings.load returns null) AND no dataset is loaded, call `window.api.dataset.createDefault()`, then set the returned path as the active dataset
- [x] T022 [US3] Ensure `{userData}/datasets/` directory exists before writing — create it if missing (in main process handler)

**Checkpoint**: First-ever launch creates a complete default dataset. All 9 default categories are present. No user interaction required.

---

## Phase 6: User Story 2 - Startup Auto-Load (Priority: P1)

**Goal**: On application startup, the last opened dataset loads automatically. If the dataset file is missing or corrupted, the app shows a friendly error and offers to create a new default dataset or restore. If the file is accessible, the dashboard displays with all data intact within 3 seconds.

**Independent Test**: Add 3 transactions, close & reopen the app 5 times. Each time the dataset loads automatically with all data intact. Then manually delete the dataset file, reopen — app handles gracefully (no crash, creates new default or shows error message).

### Implementation for User Story 2

- [x] T023 [US2] Fix startup load in `src/renderer/App.tsx` — replace `DatasetService.load(lastPath)` call with `window.api.dataset.load(lastPath)` via IPC. Remove any direct filesystem access from renderer startup.
- [x] T024 [US2] Implement auto-load flow in `src/renderer/App.tsx` — on mount: read `lastOpenedDataset` from loaded settings → if path exists, call `dataset:load` → on success, hydrate store → on failure (missing/corrupt), show error UI with options (create new default, restore from backup)
- [x] T025 [US2] Implement error-handling UI for missing/corrupted dataset — show a lightweight dialog with "Create New Dataset" and "Restore from Backup" buttons (backup restore is a stub for future implementation)
- [x] T026 [US2] Update `lastOpenedDataset` in settings after any dataset load/create — call `updateSettings({ lastOpenedDataset: newPath })` after loading or creating a dataset, which triggers settings persistence (US4)

**Checkpoint**: App auto-loads last dataset on every startup. Missing/corrupted datasets are handled gracefully. `lastOpenedDataset` is updated after every load/create.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error logging infrastructure, edge case hardening, and end-to-end validation.

- [x] T027 Create error logging infrastructure — write failure events to `{userData}/logs/error.log` with timestamps (from settingsHandlers and datasetHandlers). Log format: `[ISO timestamp] ERROR [context]: message`
- [x] T028 [P] Handle edge case: disk full during save — the atomic write temp-file-then-rename pattern already protects the original file; ensure the error is caught, logged, and a UI toast is shown
- [x] T029 [P] Handle edge case: `{userData}` directory deleted externally — catch directory-not-found on save, recreate directory automatically, then retry the write
- [x] T030 [P] Handle edge case: orphaned `.tmp` file cleanup on startup — verify `cleanupTempFiles()` in `datasetHandlers.ts` correctly cleans `{userData}/*.tmp` and `cwd/*.tmp`
- [x] T031 Run `npm run build` and `npm run lint` — fix any build/lint errors
- [x] T032 Run quickstart.md validation scenarios — manually verify all 8 scenarios pass

**Checkpoint**: All edge cases handled. Error logging operational. Quickstart scenarios verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 - Auto-Save (Phase 3)**: Depends on Foundational (only uses existing `dataset:save` IPC, does not need US4/US3/US2). 🎯 **MVP candidate**
- **US4 - Settings (Phase 4)**: Depends on Foundational. Has no dependency on US1.
- **US3 - Default Dataset (Phase 5)**: Depends on Foundational. Can run in parallel with US1 and US4.
- **US2 - Auto-Load (Phase 6)**: Depends on US4 (needs `lastOpenedDataset` from settings). Depends on US3 (needs default dataset creation fallback).
- **Polish (Phase 7)**: Depends on all user stories being complete.

### User Story Dependencies

| Story | Dependencies | Can Start After |
|-------|-------------|-----------------|
| US1 (Auto-Save) | Foundational | Phase 2 |
| US4 (Settings Persist) | Foundational | Phase 2 |
| US3 (Default Dataset) | Foundational | Phase 2 |
| US2 (Auto-Load) | US4, US3 | Phase 4 + Phase 5 |

### Within Each User Story

- Core implementation before edge cases
- IPC handlers before preload bridge
- Preload bridge before store wiring
- Store wiring before error handling

### Parallel Opportunities

- T002 and T003 can run in parallel (SettingsService + settingsHandlers are independent files)
- T008-T012 (save wiring per CRUD action) can run in parallel — each modifies a different method in `useAppStore.ts`
- T015 and T016 can run in parallel (setLanguage + updateSettings wiring)
- T028-T030 (edge cases) can run in parallel
- **All user stories (US1, US4, US3) can be implemented in parallel** after Phase 2 completes, by different developers
- US2 must wait until US4 and US3 are complete

---

## Parallel Example: User Story 1

```bash
# Launch all CRUD save-wiring tasks together:
Task: "Call saveDataset in addTransaction (src/core/store/useAppStore.ts)"
Task: "Call saveDataset in updateTransaction (src/core/store/useAppStore.ts)"
Task: "Call saveDataset in deleteTransaction (src/core/store/useAppStore.ts)"
Task: "Call saveDataset in duplicateTransaction (src/core/store/useAppStore.ts)"
Task: "Wire save after import (src/core/store/useAppStore.ts)"

# Then implement concurrency guard + error handling sequentially:
Task: "Concurrency guard (src/core/store/useAppStore.ts)"
Task: "Save failure logging + toast (src/core/store/useAppStore.ts + src/main/)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Auto-Save)
4. **STOP and VALIDATE**: Verify auto-save works by inspecting dataset file after each CRUD action
5. Deploy/demo: Users get automatic data safety, no more manual save

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Auto-Save) → Test: mutations persist to disk → **MVP!**
3. Add US4 (Settings Persistence) → Test: settings survive restart
4. Add US3 (Default Dataset) → Test: first launch creates default
5. Add US2 (Auto-Load) → Test: reopen app, last dataset loads
6. Add Polish → Test: all edge cases handled

### Parallel Team Strategy

With multiple developers:
1. Team completes Phase 1 + Phase 2 together
2. Once Foundational is done:
   - Developer A: US1 (Auto-Save)
   - Developer B: US4 (Settings) + US3 (Default Dataset)
   - Developer C: US2 (Auto-Load) — starts after US4 + US3 land
3. All stories integrate independently after their phases complete

---

## Notes

- [P] tasks = different files, no dependencies within their phase
- [US1] through [US4] map to user stories in spec.md for traceability
- Each user story is independently completable and testable once its dependencies are met
- The spec's clarifications (immediate serialized saves, log file + toast for errors) are reflected in T007 and T014
- Commit after each task or logical group for clean history
- Stop at any checkpoint to validate the story independently
