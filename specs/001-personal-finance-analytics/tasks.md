---

description: "Task list for implementing Personal Finance Analytics feature"
---

# Tasks: Personal Finance Analytics

**Input**: Design documents from `/specs/001-personal-finance-analytics/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as part of the development workflow. Each user story includes test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Desktop app**: `src/main/` (Electron main process), `src/renderer/` (React UI), `src/core/` (business logic), `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Electron + React + TypeScript + Vite project with `npm create electron-vite`
- [X] T002 [P] Install and configure core dependencies: react, react-dom, recharts, xlsx, papaparse, jspdf, html2canvas, zustand, i18next, react-i18next
- [X] T003 [P] Install and configure dev dependencies: vitest, @testing-library/react, @playwright/test, typescript, eslint, prettier
- [X] T004 [P] Configure TypeScript strict mode in tsconfig.json
- [X] T005 [P] Configure Vitest with React Testing Library in vitest.config.ts
- [X] T006 [P] Create project directory structure: src/main/, src/renderer/, src/renderer/components/, src/renderer/pages/, src/renderer/hooks/, src/renderer/i18n/, src/core/models/, src/core/services/, src/core/store/, src/core/utils/, tests/unit/, tests/integration/, tests/fixtures/
- [X] T007 [P] Create Electron main process entry in src/main/index.ts with window creation
- [X] T008 [P] Create Electron preload script in src/main/preload.ts
- [X] T009 Create renderer entry point in src/renderer/index.tsx with React root
- [X] T010 [P] Configure Electron Builder for packaging in electron-builder.yml

**Checkpoint**: Project compiles and Electron window opens showing a blank React app

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Define TypeScript types/interfaces for core entities in src/core/models/types.ts (Transaction, Category, Dataset, ApplicationSettings)
- [X] T012 Define type-safe enums for TransactionType (Income/Expense/Refund) and Language (en/fa) in src/core/models/types.ts
- [X] T013 Implement DatasetService for saving/loading dataset files in src/core/services/DatasetService.ts (JSON serialization, atomic write)
- [X] T014 [P] Implement CategoryService with default category seeding in src/core/services/CategoryService.ts
- [X] T015 [P] Implement TransactionService for CRUD operations on transactions in src/core/services/TransactionService.ts
- [X] T016 [P] Implement StatsService for local statistics calculations in src/core/services/StatsService.ts
- [X] T017 Create Zustand store foundation in src/core/store/useAppStore.ts with dataset, transactions, categories, and settings slices
- [X] T018 [P] Create utility functions for date formatting, number formatting, and ID generation in src/core/utils/format.ts and src/core/utils/id.ts
- [X] T019 [P] Set up i18next configuration with en.json and fa.json translation files in src/renderer/i18n/
- [X] T020 [P] Create initial test fixtures (sample .xlsx and .csv files) in tests/fixtures/

**Checkpoint**: Core types, services, store, and utilities are ready for story implementation

---

## Phase 3: User Story 2 - Start from Scratch with Manual Entry (Priority: P1) 🎯 MVP

**Goal**: First-launch welcome screen with "Create New Dataset" and "Import Data" options. Creating a new dataset opens an empty transaction list with an "Add Transaction" button.

**Independent Test**: User launches the app for the first time, sees the welcome screen, creates a dataset named "My Finances" with USD currency, and is taken to an empty transaction list.

### Implementation for User Story 2

- [X] T021 [P] [US2] Create WelcomePage component in src/renderer/pages/WelcomePage.tsx with "Create New Dataset" and "Import Data" buttons
- [X] T022 [P] [US2] Create CreateDatasetDialog component in src/renderer/components/CreateDatasetDialog.tsx with name and currency fields
- [X] T023 [P] [US2] Create EmptyTransactionList component in src/renderer/components/EmptyTransactionList.tsx with "Add Transaction" button and helpful empty state
- [X] T024 [US2] Implement App routing logic in src/renderer/App.tsx to show WelcomePage on first launch (no dataset) and main app when dataset exists
- [X] T025 [US2] Wire CreateDatasetDialog to DatasetService to persist the new dataset file
- [X] T026 [US2] Add unit tests for WelcomePage and CreateDatasetDialog in tests/unit/

**Checkpoint**: First launch flow working — user can create a dataset and see the empty transaction list

---

## Phase 4: User Story 4 - Manage Transactions (Priority: P1)

**Goal**: Full transaction CRUD with create, edit, delete, duplicate, search, filter, sort, Quick Add, and batch entry chaining.

**Independent Test**: User creates a transaction, edits it, duplicates it, deletes it, searches by title, filters by category, and adds multiple transactions in sequence — all from the transaction list.

### Implementation for User Story 4

- [X] T027 [P] [US4] Create TransactionList component in src/renderer/components/TransactionList.tsx with sortable columns and inline editing
- [X] T028 [P] [US4] Create TransactionForm component in src/renderer/components/TransactionForm.tsx with all fields (date, title, category, type, amount, notes)
- [X] T029 [P] [US4] Create QuickAdd component in src/renderer/components/QuickAdd.tsx with minimal input (amount, category) for dashboard
- [X] T030 [P] [US4] Create SearchBar component in src/renderer/components/SearchBar.tsx with keyword search across title and notes
- [X] T031 [P] [US4] Create FilterPanel component in src/renderer/components/FilterPanel.tsx with date range, category, type, and amount range filters
- [X] T032 [US4] Create TransactionPage in src/renderer/pages/TransactionPage.tsx composing TransactionList, SearchBar, and FilterPanel
- [X] T033 [US4] Implement "Add Transaction" flow — form submission creates transaction via store and updates list
- [X] T034 [US4] Implement "Edit Transaction" flow — inline edit or modal edit that updates store
- [X] T035 [US4] Implement "Delete Transaction" with confirmation dialog
- [X] T036 [US4] Implement "Duplicate Transaction" — copies values into a new transaction
- [X] T037 [US4] Implement Quick Add from dashboard — saves with current date, Expense type default
- [X] T038 [US4] Implement batch entry chaining — form stays open with previous values after save
- [X] T039 [US4] Implement search — filter transaction list by keyword in title/notes
- [X] T040 [US4] Implement filters — date range, category, type, amount range simultaneously
- [X] T041 [US4] Implement sort — click column header to sort asc/desc
- [X] T042 [US4] Add unit tests for TransactionList, TransactionForm, SearchBar, FilterPanel in tests/unit/

**Checkpoint**: Full transaction management works — list, create, edit, delete, duplicate, search, filter, sort, Quick Add, batch entry

---

## Phase 5: User Story 3 - View Dashboard and Financial Summaries (Priority: P1)

**Goal**: Dashboard displays summary cards for Total Income, Total Expenses, Net Balance, Number of Transactions, Average Daily Spending, and Average Weekly Spending. Cards can be shown/hidden.

**Independent Test**: User with 20+ transactions across categories navigates to dashboard and sees all 6 summary cards with correct calculations. User hides "Average Weekly Spending" and it disappears.

### Implementation for User Story 3

- [X] T043 [P] [US3] Create DashboardPage component in src/renderer/pages/DashboardPage.tsx
- [X] T044 [P] [US3] Create SummaryCard component in src/renderer/components/SummaryCard.tsx with label, value, and optional icon
- [X] T045 [P] [US3] Create SummaryCardGrid component in src/renderer/components/SummaryCardGrid.tsx that renders visible cards
- [X] T046 [P] [US3] Create DashboardCustomizationDialog component in src/renderer/components/DashboardCustomizationDialog.tsx for toggling card visibility
- [X] T047 [US3] Implement summary calculation logic in src/core/services/StatsService.ts (total income, expenses, balance, count, avg daily, avg weekly)
- [X] T048 [US3] Wire dashboard to Zustand store — subscribe to transaction changes and recalculate
- [X] T049 [US3] Persist visible card preferences in ApplicationSettings
- [X] T050 [US3] Add empty state handling — show zero values or "No transactions yet" when dataset is empty
- [X] T051 [US3] Add unit tests for SummaryCard and summary calculations in tests/unit/

**Checkpoint**: Dashboard shows live-updating summary cards that can be customized

---

## Phase 6: User Story 1 - Import Financial Data from Spreadsheets (Priority: P1)

**Goal**: Import Excel (.xlsx) and CSV files with file validation, data preview, column mapping, duplicate detection, and import confirmation.

**Independent Test**: User imports an Excel file with 10+ rows, sees preview with auto-detected column mappings, adjusts a mapping, reviews flagged duplicates, confirms, and transactions appear in the list.

### Implementation for User Story 1

- [X] T052 [P] [US1] Create ImportPage component in src/renderer/pages/ImportPage.tsx
- [X] T053 [P] [US1] Create FileSelector component in src/renderer/components/FileSelector.tsx with file type filter (.xlsx, .csv)
- [X] T054 [P] [US1] Create ImportPreview component in src/renderer/components/ImportPreview.tsx showing parsed data table (5+ rows)
- [X] T055 [P] [US1] Create ColumnMapping component in src/renderer/components/ColumnMapping.tsx with dropdowns to map detected columns to fields
- [X] T056 [P] [US1] Create DuplicateReview component in src/renderer/components/DuplicateReview.tsx highlighting potential duplicates with per-row skip/include toggle
- [X] T057 [P] [US1] Create ImportConfirmDialog component in src/renderer/components/ImportConfirmDialog.tsx showing row count summary
- [X] T058 [US1] Implement Excel parsing service in src/core/services/ImportService.ts using SheetJS (xlsx) — read .xlsx, detect columns, parse rows
- [X] T059 [US1] Implement CSV parsing in ImportService using PapaParse — auto-detect delimiter, detect columns, parse rows
- [X] T060 [US1] Implement auto-detection of column mappings in ImportService — match headers to Transaction fields
- [X] T061 [US1] Implement duplicate detection in ImportService — match by date+title+type+amount against existing transactions
- [X] T062 [US1] Wire import confirmation — append non-duplicate checked rows to dataset via store
- [X] T063 [US1] Implement error handling — malformed file detection, invalid date/amount errors during preview
- [X] T064 [US1] Add unit tests for ImportService (Excel parse, CSV parse, column mapping, duplicate detection) in tests/unit/
- [X] T065 [US1] Add test fixture files (sample.xlsx, sample.csv, malformed.csv) in tests/fixtures/

**Checkpoint**: Full import flow works — file selection, preview, column mapping, duplicate review, confirm, data appended

---

## Phase 7: User Story 8 - Manage Categories (Priority: P3)

**Goal**: Default categories on first launch. Users can create custom categories with name, color, and icon. Rename, recolor, delete with transaction reassignment.

**Independent Test**: User creates a "Pet Care" category with green color and paw icon, edits its name, and uses it in a new transaction.

### Implementation for User Story 8

- [X] T066 [P] [US8] Create CategoryPage component in src/renderer/pages/CategoryPage.tsx
- [X] T067 [P] [US8] Create CategoryList component in src/renderer/components/CategoryList.tsx with color dot, icon, and name
- [X] T068 [P] [US8] Create CategoryFormDialog component in src/renderer/components/CategoryFormDialog.tsx with name, color picker, and icon selector
- [X] T069 [P] [US8] Create CategoryDeleteDialog component in src/renderer/components/CategoryDeleteDialog.tsx with transaction reassignment
- [X] T070 [US8] Implement custom category creation — save to store and persist
- [X] T071 [US8] Implement category rename and recolor — update store and persist
- [X] T072 [US8] Implement category delete with reassignment — move transactions to chosen category
- [X] T073 [US8] Seed default categories on first dataset creation
- [X] T074 [US8] Add unit tests for category CRUD in tests/unit/

**Checkpoint**: Full category management — default categories on launch, custom CRUD with color/icon, deletion reassigns transactions

---

## Phase 8: User Story 5 - Generate Reports and Charts (Priority: P2)

**Goal**: Nine built-in reports (Expense by Category, Income by Category, Daily/Weekly/Monthly Spending, Income vs Expense, Top Expenses, Top Income, Spending Trends) with interactive Recharts visualizations and chart type switching.

**Independent Test**: User navigates to any built-in report, sees an interactive chart, switches between Line/Bar/Pie/Donut/Area types, and sees correct data.

### Implementation for User Story 5

- [X] T075 [P] [US5] Create ReportsPage component in src/renderer/pages/ReportsPage.tsx with report type navigation
- [X] T076 [P] [US5] Create ReportCard component in src/renderer/components/ReportCard.tsx with chart and data table
- [X] T077 [P] [US5] Create ChartSwitcher component in src/renderer/components/ChartSwitcher.tsx with buttons for Line/Bar/Pie/Donut/Area
- [X] T078 [P] [US5] Create DateRangePicker component in src/renderer/components/DateRangePicker.tsx
- [X] T079 [US5] Implement report data computation for all 9 built-in reports in src/core/services/ReportService.ts
- [X] T080 [US5] Implement chart rendering with Recharts in src/renderer/components/ReportChart.tsx (supports all 5 chart types)
- [X] T081 [US5] Implement chart type switching — re-render chart without reloading data
- [X] T082 [US5] Implement date range filtering on reports
- [X] T083 [US5] Implement report data table alongside chart
- [X] T084 [US5] Add unit tests for ReportService calculations in tests/unit/

**Checkpoint**: All 9 built-in reports render with interactive charts and type switching

---

## Phase 9: User Story 6 - Build Custom Reports (Priority: P3)

**Goal**: Custom Report Builder where users select date range, categories, transaction types, grouping (Day/Week/Month/Year), and chart type. Results display as chart and table.

**Independent Test**: User configures a custom report with date range + "Food & Drinks" category + Expense type + weekly grouping + line chart, and sees matching data visualized.

### Implementation for User Story 6

- [X] T085 [P] [US6] Create CustomReportBuilderPage component in src/renderer/pages/CustomReportBuilderPage.tsx
- [X] T086 [P] [US6] Create ReportFilterPanel component in src/renderer/components/ReportFilterPanel.tsx with date range, category multi-select, type selector, grouping selector
- [X] T087 [P] [US6] Create GroupingSelector component in src/renderer/components/GroupingSelector.tsx with Day/Week/Month/Year options
- [X] T088 [US6] Implement custom report query logic in ReportService — filter, group, aggregate based on user selections
- [X] T089 [US6] Wire CustomReportBuilderPage to ReportService and Recharts for live preview
- [X] T090 [US6] Implement empty state — show message when no data matches filters
- [X] T091 [US6] Implement auto-regenerate on filter change or "Generate" button
- [X] T092 [US6] Add unit tests for custom report query logic in tests/unit/

**Checkpoint**: Custom report builder works — filters, grouping, chart display, empty state

---

## Phase 10: User Story 7 - Export Reports (Priority: P3)

**Goal**: Export reports as PDF (with charts), Excel (.xlsx), and CSV. All exports include structured data; PDF includes chart image.

**Independent Test**: User generates any report, clicks "Export as PDF", and receives a PDF file containing the report title, chart image, and data table.

### Implementation for User Story 7

- [X] T093 [P] [US7] Create ExportButton component in src/renderer/components/ExportButton.tsx with dropdown for PDF/Excel/CSV
- [X] T094 [US7] Implement PDF export in src/core/services/ExportService.ts using jsPDF + html2canvas — capture chart as image, build PDF with title + table + chart
- [X] T095 [US7] Implement Excel export in ExportService using SheetJS — write report data to structured .xlsx
- [X] T096 [US7] Implement CSV export in ExportService — write report data to CSV
- [X] T097 [US7] Wire export to Electron save dialog for file path selection
- [X] T098 [US7] Implement empty/no-data check — prevent export of empty reports with helpful message
- [X] T099 [US7] Add unit tests for ExportService in tests/unit/

**Checkpoint**: All three export formats work from any report; PDF includes chart image

---

## Phase 11: User Story 9 - Switch Application Language (Priority: P3)

**Goal**: Bilingual support for English (LTR) and Persian (RTL) with instant language switching, localized dates/numbers, and RTL layout mirroring.

**Independent Test**: User switches from English to Persian — all UI text changes instantly, layout flips to RTL, dates use Persian format, numbers use Persian digits.

### Implementation for User Story 9

- [X] T100 [P] [US9] Create complete English translation file in src/renderer/i18n/en.json with all UI strings
- [X] T101 [P] [US9] Create complete Persian (Farsi) translation file in src/renderer/i18n/fa.json with all UI strings
- [X] T102 [P] [US9] Create LanguageSelector component in src/renderer/components/LanguageSelector.tsx with dropdown (English / فارسی)
- [X] T103 [P] [US9] Create SettingsPage component in src/renderer/pages/SettingsPage.tsx with language setting
- [X] T104 [US9] Implement RTL layout switching — apply dir="rtl" to root element, mirror layout with CSS logical properties
- [X] T105 [US9] Implement Persian date formatting in src/core/utils/format.ts — use Persian calendar or localized Gregorian
- [X] T106 [US9] Implement Persian digit display in src/core/utils/format.ts — convert to ۰-۱۲۳۴۵ digits
- [X] T107 [US9] Wire language preference to ApplicationSettings for persistence
- [X] T108 [US9] Add unit tests for Persian date/number formatting in tests/unit/

**Checkpoint**: Instant language switching with full RTL layout and Persian locale support

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T109 [P] Add error boundary components for each page in src/renderer/components/ErrorBoundary.tsx
- [X] T110 [P] Add loading states and progress indicators for import and report generation
- [X] T111 [P] Add keyboard shortcuts (Ctrl+N for new transaction, Ctrl+S for save, Ctrl+O for open)
- [X] T112 [P] Add window menu bar with File, Edit, View, Help menus in src/main/menu.ts
- [X] T113 [P] Add application icon and window title
- [X] T114 Implement crash recovery detection — check for orphaned .tmp files on startup
- [ ] T115 Run through quickstart.md validation scenarios end-to-end
- [X] T116 Final code cleanup and TypeScript strict mode compliance check

**Checkpoint**: All user stories implemented, validated against quickstart scenarios, and polished

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–11)**: All depend on Foundational phase completion
  - User stories can proceed in priority order or in parallel if staffed
- **Polish (Phase 12)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Blocks |
|-------|-----------|--------|
| US2 - Start from Scratch (P1) | Phase 2 | US1, US3, US4 |
| US4 - Manage Transactions (P1) | US2 (dataset exists) | US3, US5 |
| US3 - Dashboard (P1) | US4 (transactions in store) | — |
| US1 - Import Data (P1) | US2 (dataset exists) | — |
| US8 - Manage Categories (P3) | Phase 2 | — (independent) |
| US5 - Reports & Charts (P2) | US4 (transactions data) | US6, US7 |
| US6 - Custom Reports (P3) | US5 (report infrastructure) | — |
| US7 - Export (P3) | US5 (report to export) | — |
| US9 - Language (P3) | Phase 2 | — (independent but touches all UI) |

### Within Each User Story

- Models before services
- Components before integration
- Core implementation before polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- **US8 (Categories)** and **US9 (Language)** can run in parallel with any other story
- **US1 (Import)** and **US4 (Transactions)** can run in parallel after US2
- **US5 (Reports)** and **US3 (Dashboard)** can run in parallel after US4
- Components within a story marked [P] can be built in parallel
- Different independent stories can be worked on by different developers

---

## Parallel Example: User Story 4 (Manage Transactions)

```bash
# Launch all UI components for US4 together:
Task: "Create TransactionList component in src/renderer/components/TransactionList.tsx"
Task: "Create TransactionForm component in src/renderer/components/TransactionForm.tsx"
Task: "Create QuickAdd component in src/renderer/components/QuickAdd.tsx"
Task: "Create SearchBar component in src/renderer/components/SearchBar.tsx"
Task: "Create FilterPanel component in src/renderer/components/FilterPanel.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1-3 Only)

1. Complete Phase 1: Setup (Electron + React + TypeScript project running)
2. Complete Phase 2: Foundational (core types, services, store)
3. Complete Phase 3: US2 — Welcome + Create Dataset + Empty Transaction List
4. **STOP and VALIDATE**: User sees welcome screen, creates a dataset, sees empty state
5. Deploy/demo the shell

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US2 (Start from Scratch) → Dataset creation works → **MVP milestone**
3. US4 (Manage Transactions) → Core data entry works → **Alpha milestone**
4. US3 (Dashboard) → Financial overview visible
5. US1 (Import) → Bulk data import works → **Beta milestone**
6. US5 (Reports) → Charts and analytics
7. US8 (Categories) + US6 (Custom Reports) + US7 (Export) + US9 (Language) → Feature complete → **Release**

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 + Phase 2 together
2. Once Foundational is done:
   - Developer A: US2 (Start from Scratch) + US4 (Transactions)
   - Developer B: US8 (Categories) + US9 (Language)
   - Developer C: US3 (Dashboard) + US1 (Import)
3. After US4 + US3 complete:
   - Developer A: US5 (Reports) + US6 (Custom Reports)
   - Developer B: US7 (Export)
4. All stories integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
