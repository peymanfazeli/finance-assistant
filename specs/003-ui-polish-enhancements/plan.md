# Implementation Plan: UI Polish & Enhancements

**Branch**: `003-ui-polish-enhancements` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ui-polish-enhancements/spec.md`

## Summary

Add a unified design system (shared `styles.ts` tokens), framer-motion animations across all UI, a portal-based modal system, toast notifications, drag-and-drop import on the Transaction page, a search-driven chart report on the Reports page, and an export-on-close warning modal. 34 functional requirements across 4 user stories.

## Technical Context

**Language/Version**: TypeScript 5.x with Electron 34.x

**Primary Dependencies**: framer-motion (new) for all animations; recharts (existing) for charts; React 19, Zustand, i18next (existing).

**Storage**: No new storage layer. One new field `lastExportTimestamp` added to existing `settings.json` in ApplicationSettings. All other entities are transient UI state.

**Testing**: Vitest (unit + component tests), Playwright (e2e tests), React Testing Library — same as existing project.

**Target Platform**: Windows 10+, macOS 12+, Linux (major distributions). Desktop application via Electron.

**Project Type**: Desktop application (cross-platform Electron + React).

**Performance Goals**: Page transitions complete within 300ms. Search Report chart renders within 2 seconds for 1,000 transactions. Toast auto-dismisses at 3 seconds. Drag-and-drop overlay appears instantly (<50ms).

**Constraints**: Keep existing inline `style={}` approach (no Tailwind). No icon library — continue using emoji for icons. No new chart types — reuse existing recharts components. Fully offline. Single-user desktop app.

**Scale/Scope**: 4 user stories, 34 functional requirements. UI-only feature — no changes to core dataset schema. Single new field in ApplicationSettings.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| 1. Offline First | ✅ PASS | All features are local. No network calls. |
| 2. Simplicity First | ✅ PASS | Each feature solves a clear user problem. No scope bloat. |
| 3. Data-Driven Design | ✅ PASS | Search report provides new data visualization path. |
| 4. Import Before Manual Entry | ✅ PASS | Drag-and-drop enhances the import workflow. |
| 5. Meaningful Visualization | ✅ PASS | Search-driven chart adds a new visualization entry point. |
| 6. Bilingual Support | ✅ PASS | Design tokens and animations are language-agnostic; RTL-aware layout unaffected. |
| 7. Modern User Experience | ✅ PASS | Core focus — animations, modals, toasts, consistent design. |
| 8. Local Data Ownership | ✅ PASS | All data stays local. Export is a local file save. |
| 9. Extensible Architecture | ✅ PASS | Design tokens, modal system, and toast system are modular and extensible. |
| 10. Exportability | ✅ PASS | Export-on-close warning directly encourages export. CSV export added. |
| 11. Flexible Data Model | ✅ PASS | No core data model changes. One settings field addition. |

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-polish-enhancements/
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
├── core/
│   ├── store/
│   │   └── useAppStore.ts          # Updated: lastExportTimestamp state
│   └── utils/
│       └── styles.ts               # NEW: Shared design tokens (colors, spacing, typography, radii, shadows)
├── renderer/
│   ├── components/
│   │   ├── Toast.tsx               # NEW: Portal-based toast notification system
│   │   ├── ToastContainer.tsx      # NEW: Toast stack manager
│   │   ├── Modal.tsx               # NEW: Reusable portal-based modal with AnimatePresence
│   │   ├── DropZone.tsx            # NEW: Drag-and-drop overlay for Transaction page
│   │   └── ExportOnCloseDialog.tsx # NEW: Close warning modal with Export/Close/Cancel
│   ├── pages/
│   │   ├── TransactionPage.tsx     # MODIFIED: Add DropZone, framer-motion page transition
│   │   ├── ReportsPage.tsx         # MODIFIED: Add Search Report section
│   │   ├── DashboardPage.tsx       # MODIFIED: framer-motion page transition
│   │   ├── CategoryPage.tsx        # MODIFIED: framer-motion page transition
│   │   └── SettingsPage.tsx        # MODIFIED: framer-motion page transition
│   ├── App.tsx                     # MODIFIED: AnimatePresence for page routes, ToastContainer mount
│   ├── hooks/
│   │   └── useBeforeUnload.ts      # NEW: Intercept close events for export warning
│   └── i18n/
│       └── locales/                # MODIFIED: Toast and warning modal messages
├── main/
│   └── ipc-handlers.ts            # MODIFIED: Handle lastExportTimestamp read/write
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

**Structure Decision**: Single project layout maintained. All new components live in `src/renderer/components/`. Design tokens extracted to `src/core/utils/styles.ts`. The main process IPC handlers get one small addition for the new settings field.

## Complexity Tracking

> No Constitution violations detected. All principles are satisfied. Complexity tracking is not required.
