# Tasks: UI Polish & Enhancements

**Input**: Design documents from `/specs/003-ui-polish-enhancements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ipc-channels.md

**Tests**: No test tasks included — only implementation tasks.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create foundational reusable components that ALL user stories depend on.

- [ ] T001 Install framer-motion via npm (add `framer-motion` to package.json dependencies)
- [ ] T002 [P] Create shared design tokens file in `src/core/utils/styles.ts` with color palette, spacing, typography, border radii, and shadow tokens extracted from common values across all existing components
- [ ] T003 [P] Create shared `Modal.tsx` portal-based dialog component in `src/renderer/components/Modal.tsx` with framer-motion AnimatePresence enter/exit animations, backdrop dim, focus trapping, and escape-key-to-close behavior
- [ ] T004 [P] Create Toast notification system: `Toast.tsx` (individual toast) and `ToastContainer.tsx` (stack manager) in `src/renderer/components/` with framer-motion enter/exit animations, positioned bottom-right, max 5 visible, 3-second auto-dismiss
- [ ] T005 [P] Create `useBeforeUnload.ts` hook in `src/renderer/hooks/useBeforeUnload.ts` that intercepts Electron close events for the export-on-close warning
- [ ] T006 Create `useReducedMotion.ts` hook in `src/renderer/hooks/useReducedMotion.ts` that reads `prefers-reduced-motion` media query and returns a boolean

**Checkpoint**: Shared infrastructure ready — design tokens, modal, toast, and hooks are available for all user stories.

---

## Phase 2: User Story 1 - Design System & Animations (Priority: P1) 🎯 MVP

**Goal**: Apply design tokens across all pages, add framer-motion page transitions, hover/tap effects, staggered list animations, sidebar nav transitions, refactor all existing dialogs to use shared Modal, and wire toast notifications to all save/delete/import actions.

**Independent Test**: Navigate between all 5 pages, trigger any modal, save/delete a transaction — all transitions animate smoothly, toast appears, and visual styling is consistent.

- [ ] T007 [US1] Apply design tokens from `src/core/utils/styles.ts` to `src/renderer/App.tsx` — replace all hardcoded color/spacing/typography values with token references
- [ ] T008 [P] [US1] Apply design tokens to `src/renderer/pages/DashboardPage.tsx`
- [ ] T009 [P] [US1] Apply design tokens to `src/renderer/pages/TransactionPage.tsx`
- [ ] T010 [P] [US1] Apply design tokens to `src/renderer/pages/ReportsPage.tsx`
- [ ] T011 [P] [US1] Apply design tokens to `src/renderer/pages/CategoryPage.tsx`
- [ ] T012 [P] [US1] Apply design tokens to `src/renderer/pages/SettingsPage.tsx`
- [ ] T013 [P] [US1] Apply design tokens to `src/renderer/pages/CustomReportBuilderPage.tsx`
- [ ] T014 [P] [US1] Apply design tokens to `src/renderer/pages/ImportPage.tsx`
- [ ] T015 [P] [US1] Apply design tokens to `src/renderer/pages/WelcomePage.tsx`
- [ ] T016 [US1] Add framer-motion AnimatePresence page transitions in `src/renderer/App.tsx` — wrap page content in `<AnimatePresence mode="wait">` with `motion.div` fade+slide variants per page change
- [ ] T017 [P] [US1] Add staggered list animation to `src/renderer/components/TransactionList.tsx` using framer-motion `motion.tr` with `staggerChildren`
- [ ] T018 [P] [US1] Add staggered list animation to `src/renderer/components/CategoryList.tsx` using framer-motion `motion.div` with `staggerChildren`
- [ ] T019 [P] [US1] Add hover/tap effects to sidebar nav buttons and all interactive elements in `src/renderer/App.tsx` using framer-motion `whileHover`/`whileTap`
- [ ] T020 [P] [US1] Add hover/tap effects to `src/renderer/components/SummaryCard.tsx`
- [ ] T021 [US1] Refactor `src/renderer/components/CategoryFormDialog.tsx` to use shared `Modal.tsx` component
- [ ] T022 [US1] Refactor `src/renderer/components/CategoryDeleteDialog.tsx` to use shared `Modal.tsx`
- [ ] T023 [US1] Refactor `src/renderer/components/ImportConfirmDialog.tsx` to use shared `Modal.tsx`
- [ ] T024 [US1] Refactor `src/renderer/components/DashboardCustomizationDialog.tsx` to use shared `Modal.tsx`
- [ ] T025 [US1] Refactor `src/renderer/components/CreateDatasetDialog.tsx` to use shared `Modal.tsx`
- [ ] T026 [US1] Mount `ToastContainer.tsx` in `src/renderer/App.tsx` and create a `useToastStore` Zustand store or context for adding toasts from any component
- [ ] T027 [US1] Wire toast notifications to save/delete/import actions in `src/renderer/pages/TransactionPage.tsx` (add success/error toasts for transaction CRUD and import)
- [ ] T028 [US1] Wire toast notifications to save/delete actions in `src/renderer/pages/CategoryPage.tsx`
- [ ] T029 [US1] Implement reduced motion support — wrap all framer-motion animations in `src/renderer/` with `useReducedMotion()` to disable sliding/staggering/scaling when OS preference is set

**Checkpoint**: US1 is fully functional — design tokens, animations, toasts, and shared modals are complete.

---

## Phase 3: User Story 2 - Drag-and-Drop Import (Priority: P2)

**Goal**: Allow users to drag `.xlsx` and `.csv` files onto the Transaction page to start the import workflow.

**Independent Test**: Drag a valid CSV/XLSX file onto the Transaction page, see the drop zone overlay, release to open the import preview — all without clicking the Import button.

- [ ] T030 [P] [US2] Create `DropZone.tsx` component in `src/renderer/components/DropZone.tsx` with HTML5 DnD event handlers (`onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`) and a visual overlay (dashed border, "Drop file here" text, background highlight)
- [ ] T031 [US2] Integrate `DropZone.tsx` into `src/renderer/pages/TransactionPage.tsx` — show overlay on drag, hide on drag leave/drop, call existing import handler on valid file drop
- [ ] T032 [US2] Add error toast display in `DropZone.tsx` for invalid file types and multiple files (via toast store)
- [ ] T033 [US2] Ensure the existing Import button and file dialog work unchanged alongside the drop zone

**Checkpoint**: US2 complete — drag-and-drop import works on the Transaction page.

---

## Phase 4: User Story 3 - Search-Driven Chart Report (Priority: P2)

**Goal**: Add a new "Search Report" option on the Reports page where users enter a keyword and get a chart of matching transactions grouped by category or month.

**Independent Test**: Enter a keyword on the Reports page, select grouping and chart type, click Generate — an interactive chart renders with matching data.

- [ ] T034 [US3] Add "Search Report" option to the report type list in `src/renderer/pages/ReportsPage.tsx` — a new entry alongside the 9 built-in report types
- [ ] T035 [US3] Create Search Report UI section in `src/renderer/pages/ReportsPage.tsx` with: keyword text input, "Generate" button, grouping selector (Category/Month), and chart type switcher
- [ ] T036 [US3] Implement search logic — filter transactions from Zustand store by keyword matching against `title`, `notes`, and category `name` (case-insensitive), using existing `ReportService`-style aggregation for grouping
- [ ] T037 [US3] Wire chart rendering — pass filtered+grouped data to existing recharts components, support chart type switching without re-filtering
- [ ] T038 [US3] Add empty state — when keyword has no matches, show "No transactions match your search" message instead of an empty chart
- [ ] T039 [US3] Integrate with existing date range filter on ReportsPage — the search respects the current `dateFrom`/`dateTo` range

**Checkpoint**: US3 complete — Search Report is a new report type on the Reports page.

---

## Phase 5: User Story 4 - Export-on-Close Warning (Priority: P3)

**Goal**: Show a warning modal when the user closes the app with un-exported data changes, offering to export CSV, close anyway, or cancel.

**Independent Test**: Modify a transaction, close the app, see the warning, choose any option — behavior is correct.

- [ ] T040 [US4] Add `lastExportTimestamp: string | null` field to `ApplicationSettings` interface in `src/core/models/types.ts`
- [ ] T041 [US4] Add `lastExportTimestamp` state to `useAppStore` in `src/core/store/useAppStore.ts` — load from settings, expose get/set actions
- [ ] T042 [US4] Create `ExportOnCloseDialog.tsx` component in `src/renderer/components/ExportOnCloseDialog.tsx` using shared `Modal.tsx` with three buttons: "Export Now" (triggers CSV save), "Close Anyway" (quits app), "Cancel" (dismisses)
- [ ] T043 [US4] Create `useBeforeUnload.ts` (if not yet created in setup) — intercept window/Electron close, check `shouldShowWarning` condition, show dialog
- [ ] T044 [US4] Add IPC handlers in `src/main/preload.ts` and `src/main/ipc-handlers.ts` for `export:get-last-timestamp` and `export:save-last-timestamp` channels (per contracts/ipc-channels.md)
- [ ] T045 [US4] Wire up the close interception in `src/renderer/App.tsx` — mount close handler, check export state, show `ExportOnCloseDialog`, handle all three button outcomes
- [ ] T046 [US4] Implement CSV export on "Export Now" — call existing dialog save IPC to write all transactions as CSV, then update `lastExportTimestamp`

**Checkpoint**: US4 complete — export-on-close warning works.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: i18n translations and final validation.

- [ ] T047 [P] Add toast and export warning modal translation strings to `src/renderer/i18n/en.json`
- [ ] T048 [P] Add toast and export warning modal translation strings to `src/renderer/i18n/fa.json`
- [ ] T049 Run end-to-end validation per `specs/003-ui-polish-enhancements/quickstart.md` — verify all 4 user stories work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 - Animations (Phase 2)**: Depends on all Setup tasks — BLOCKS US4 (needs Modal, Toast, useReducedMotion)
- **US2 - Drag-and-Drop (Phase 3)**: Depends on Setup (needs Toast and design tokens) — independent of US1
- **US3 - Search Report (Phase 4)**: Depends on Setup (needs design tokens) — fully independent of US1/US2/US4
- **US4 - Export-on-Close (Phase 5)**: Depends on Setup (needs Modal, Toast, useBeforeUnload) — independent of US1/US2/US3
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Phase 1 → Phase 2 (no inter-story dependencies)
- **US2 (P2)**: Phase 1 → Phase 3 (no inter-story dependencies)
- **US3 (P2)**: Phase 1 → Phase 4 (no inter-story dependencies)
- **US4 (P3)**: Phase 1 → Phase 5 (no inter-story dependencies)

### Within Each Phase

- Tasks marked `[P]` can run in parallel
- Non-parallel tasks within a phase run sequentially

### Parallel Opportunities

| Phase | Parallel Tasks |
|-------|----------------|
| Phase 1 | T002, T003, T004, T005, T006 can run in parallel |
| Phase 2 | T008-T015 (token application on pages), T017-T020 (animations per component) |
| Phase 3 | None — sequential (DropZone → integrate → error → verify) |
| Phase 4 | None — sequential (UI → logic → chart → empty → filter) |
| Phase 5 | T042, T043, T044 can run in parallel |
| Phase 6 | T047, T048 (i18n files in parallel) |

---

## Parallel Example: Phase 1 Setup

```bash
# Install framer-motion:
npm install framer-motion

# Create all parallel assets simultaneously:
Task: T002 - Create design tokens in src/core/utils/styles.ts
Task: T003 - Create Modal.tsx in src/renderer/components/
Task: T004 - Create Toast.tsx + ToastContainer.tsx in src/renderer/components/
Task: T005 - Create useBeforeUnload.ts in src/renderer/hooks/
Task: T006 - Create useReducedMotion.ts in src/renderer/hooks/
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1: Setup (all tasks)
2. Phase 2: US1 — Design System & Animations
3. **STOP and VALIDATE**: Test animations, design tokens, modals, toasts independently
4. Deploy/demo if ready

### Incremental Delivery

1. Setup complete → Foundation ready (shared components)
2. Add US1 → Design System & Animations (MVP!)
3. Add US2 → Drag-and-Drop Import (independent)
4. Add US3 → Search-Driven Chart Report (independent)
5. Add US4 → Export-on-Close Warning (independent)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together (parallel tasks within Phase 1)
2. Once Setup is done:
   - Developer A: US1 (Design System & Animations) — largest scope
   - Developer B: US2 (Drag-and-Drop) — small, quick win
   - Developer C: US3 (Search Report) — medium scope
3. After US1 completes, Developer A can take US4
4. Polish phase done together at the end
