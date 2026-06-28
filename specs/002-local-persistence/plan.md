# Implementation Plan: Local Persistence

**Branch**: `002-local-persistence` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-local-persistence/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add persistent local storage to the Electron desktop application. Datasets auto-save to the OS application data directory after every create, edit, delete, import, or settings change. The application auto-loads the last dataset on startup and creates a default dataset on first launch. All filesystem access is confined to the main process via IPC; the renderer never touches the filesystem directly. Saves are asynchronous, atomic, and non-blocking. The design supports future multi-dataset, backup/restore, and cloud sync.

## Technical Context

**Language/Version**: TypeScript 5.x with Electron 28.x

**Primary Dependencies**: Existing: React 19.x, Zustand 5.x, `fs` (main process). New: None — all work reuses Node.js built-in `fs` module with existing IPC infrastructure.

**Storage**: JSON files (`.fina` for datasets, `settings.json` for preferences) in the OS application data directory (`app.getPath('userData')`). Atomic writes via temp-file-then-rename pattern.

**Testing**: Vitest (unit), Playwright (e2e). Existing test infrastructure reused.

**Target Platform**: Windows 10+, macOS 12+, Linux (major distributions). Desktop application via Electron.

**Project Type**: Desktop application (cross-platform Electron + React).

**Performance Goals**: Auto-save completes within 1 second of user action. Cold startup with auto-load completes within 3 seconds. Save operation never blocks UI (verified via UI responsiveness during save).

**Constraints**: Fully offline. Renderer has zero filesystem access. All I/O must be async/non-blocking from the renderer's perspective. Atomic writes to prevent corruption. Concurrent saves must be serialized or debounced.

**Scale/Scope**: Single-user desktop app. One dataset open at a time. Dataset size up to ~10 MB (10,000 transactions). Settings file <10 KB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| 1. Offline First | ✅ PASS | All persistence is local. No network calls. Settings and datasets stored entirely on the local filesystem. |
| 2. Simplicity First | ✅ PASS | Uses existing Node.js `fs` module. No new databases or external dependencies. IPC reuse of established channels. |
| 3. Data-Driven Design | ✅ PASS (neutral) | Persistence is infrastructure, not user-facing analytics. Does not conflict with data-driven design. |
| 4. Import Before Manual Entry | ✅ PASS (neutral) | Auto-save applies equally to imported and manually entered data. No workflow impact. |
| 5. Meaningful Visualization | ✅ PASS (neutral) | No impact on visualization. |
| 6. Bilingual Support | ✅ PASS | Settings persistence preserves language preference across restarts. |
| 7. Modern User Experience | ✅ PASS | Auto-save eliminates manual save buttons. Auto-load removes file-selection friction. First-launch default removes setup friction. |
| 8. Local Data Ownership | ✅ PASS | All data stays on the local filesystem in the OS app data directory. No external transmission. Atomic writes protect data integrity. |
| 9. Extensible Architecture | ✅ PASS | Modular IPC handlers. Design explicitly supports future multi-dataset, backup/restore, and cloud sync without architectural changes (FR-021–023). |
| 10. Exportability | ✅ PASS (neutral) | No impact on export. |
| 11. Flexible Data Model | ✅ PASS (neutral) | No impact on data model flexibility. |

## Project Structure

### Documentation (this feature)

```text
specs/002-local-persistence/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main/                # Electron main process
│   ├── index.ts         # App entry — registers all handlers
│   ├── preload.ts       # Context bridge — exposes IPC APIs
│   ├── datasetHandlers.ts   # Existing: dataset:save/load + dialog handlers
│   ├── settingsHandlers.ts  # NEW: settings:save/load IPC handlers
│   ├── fileHandlers.ts      # Existing: file import handlers
│   └── exportHandlers.ts    # Existing: export handlers
├── renderer/            # UI layer
│   ├── App.tsx          # Updated: auto-load startup, auto-save wiring
│   └── api.d.ts         # Updated: window.api.settings type declarations
├── core/                # Business logic
│   ├── services/
│   │   ├── DatasetService.ts   # Existing: serialize, deserialize, create
│   │   └── SettingsService.ts  # NEW: default settings factory, migration
│   └── store/
│       └── useAppStore.ts      # Updated: auto-save middleware on CRUD + settings
```

**Structure Decision**: Single project, no structural changes. All new code goes into `src/main/` (new `settingsHandlers.ts`), `src/core/services/` (new `SettingsService.ts`), and modifications to existing files. No new directories needed.

## Complexity Tracking

> No Constitution violations detected. All principles are satisfied. Complexity tracking is not required.
