# Finance Assistant

Offline-first personal finance analytics desktop app built with Electron, React, and TypeScript. Track transactions, plan budgets, visualize spending, generate reports, and export data — all stored locally on your machine with zero cloud dependency.

## About

Finance Assistant is a privacy-focused personal finance manager that runs entirely on your desktop. Financial data never leaves the machine: datasets are stored as local `.fina` files, and every write is atomic. The UI is available in English and Persian (Farsi), dates are handled on the Jalali (Solar Hijri) calendar, and amounts are formatted for multiple currencies including Toman.

The one feature that talks to the network is **AI Analysis**, which is opt-in per use and disabled automatically when the app is offline.

## Features

### Dashboard

The landing view summarizes the selected period at a glance.

- **Hero net balance** card, color-coded green for positive and red for negative, with an animated value
- **Summary cards**: Total Income, Total Expenses, Transaction Count, Average Daily Spending, Average Weekly Spending
- **Spending by Category (% of Income)** bar chart — one bar per expense category, showing that category's spend as a percentage of the period's income, sorted highest-first, each bar in its category's own color, with a tooltip giving both the percentage and the raw amount
- **Time period selector** with eight presets: All time, Today, This week, This month, Last month, This quarter, This year, and a Custom range with two Persian date pickers
- **Privacy eye toggle** masks every monetary figure on the page with `***` — the hero value, the transaction count, all summary cards, and the entire category chart
- **Customize dialog** to switch card visibility on or off and to change the time period
- **Quick-add floating action button** for rapid transaction entry, with category-to-type auto-fill
- Empty state with a call to action when no data exists yet

Every dashboard figure — cards, net balance, and the category chart — is computed from the *same* period-filtered transaction set, so the sections can never disagree about the active time period.

### Transaction Management

- Add, edit, delete, and duplicate transactions, with required-field validation
- Batch entry ("Add another") for logging several transactions in a row
- Keyword search across transaction **titles and notes**
- Filtering by date range, category (multi-select), transaction type, and min/max amount
- Sorting by date, title, category, type, or amount, ascending or descending
- Date range defaults to the current Jalali month on first load
- Transaction export to CSV and Excel

### Budget Planning

Allocate this month's income across categories.

- **Per-category sliders** (0-100%) with live percentage and derived amount
- **Enter Amounts mode** — type a currency amount per category and it converts to a percentage
- **Income base** is this Jalali month's income plus refunds; expenses are excluded
- The **summary row** tracks Allocated and Remaining, and flips to a red Over-Budget state when the sum exceeds the base
- Each category is individually capped at 100%, but the total across categories may exceed it
- A pie chart shows the allocation split, with a "Remaining" slice when the total is under 100%
- A full allocation table with per-category and total rows
- Allocations are stored per dataset and auto-saved
- Income-side and placeholder categories are excluded from budgeting

### Receivables Tracking

Track money you are expecting to receive.

- Record a receivable with title, category, source, total amount, ask date, and notes
- Receivables auto-link to income and refund transactions matching the same category **and** the same Jalali month
- Rows are color-coded by how much is still outstanding, and struck through once fully received
- Pay date appears once a receivable is settled
- A detail modal shows a progress bar, a bar chart of received payments, and the full linked-transaction table
- Without a date filter, only receivables with money outstanding are listed

### Categories

- Create, edit, and delete custom categories with a name, color, and icon
- Default categories ship with the app and cannot be deleted
- Deleting a category reassigns its transactions rather than orphaning them
- **Category type mapping** — pin a default transaction type (Income, Expense, Refund, Investment) to a category, so choosing that category auto-fills the type in any transaction form

### Reports & Analytics

**14 built-in reports** in five groups:

| Group | Reports |
|-------|---------|
| Expense | Expense by Category, Daily Spending, Weekly Spending, Monthly Spending, Top Expenses |
| Income | Income by Category, Top Income |
| Investment | Invest by Category, Invest vs Income, Invest vs Expense |
| Comparison | Income vs Expense, All by Category, Spending Trends |
| Search | Search Report — keyword search grouped by category or by month |

- **5 chart types**: Line, Bar, Pie, Donut, Area
- Date-range filtering across all reports
- Currency-formatted axis labels and tooltips
- Search Report matches keywords across transaction titles, notes, **and** category names

**Custom Report Builder** — ad-hoc reports with a configurable date range, category and transaction-type filters, grouping by day/week/month/year, and aggregation by sum/count/average.

**AI Analysis** — sends the current report's data to an OpenAI-compatible chat endpoint and returns a structured Markdown audit: spending patterns, waste detection, cost-reduction opportunities, and a financial scorecard. Includes online/offline detection, retry, and "Print Analysis" to save the result as a styled RTL PDF. See [AI Analysis setup](#ai-analysis-setup).

### Import

- **CSV and Excel (.xlsx)** import — drop a file anywhere on the Transactions page, or pick one, to open the import wizard
- **Automatic column mapping** with real Persian **and** English header support (`تاریخ`/`date`, `مبلغ`/`amount`, `دسته`/`category`, ...); every mapping is editable before import
- **Duplicate detection** against existing transactions, with a review step listing each potential duplicate and a per-row skip toggle
- Amounts are cleaned of stray symbols; Persian type keywords (`درآمد`, `بازگشت`, `سرمایهگذاری`) are recognized

### Export

- **Reports** export to **CSV**, **Excel (.xlsx)**, and **PDF**
- Report PDFs embed a rendered image of the chart, plus a title, Jalali generation timestamp, formatted values, and a totals row
- **Transactions** export to CSV and Excel with both Gregorian and Jalali date columns
- **Export-on-close prompt** — if transactions have changed since your last export, closing the app offers to export first

### Internationalization & Calendar

- Complete English and Persian UI with instant switching
- **Jalali (Solar Hijri) calendar** throughout: date pickers, period presets, week/quarter boundaries, and month names
- Bidirectional conversion between Gregorian and Jalali, including leap-year and month-length handling
- Locale-aware currency formatting for USD, EUR, GBP, CAD, AUD, JPY, and Toman
- The native Electron menu is rebuilt in the selected language

### Data & Storage

- Offline-first: all data lives in local `.fina` dataset files
- **Atomic writes** (write to `.tmp`, then rename) to prevent corruption on crash
- Leftover `.tmp` files are cleaned up on startup
- Every mutation triggers a debounced auto-save through a queued writer, so rapid edits cannot interleave
- Datasets are plain JSON — inspect, diff, or back them up with any text editor

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 28 + electron-vite |
| Frontend | React 19, TypeScript 5.7 |
| State management | Zustand 5 |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| i18n | i18next, react-i18next |
| Export | jsPDF, SheetJS (xlsx), html2canvas, marked |
| AI integration | OpenAI-compatible chat completions API |
| Testing | Vitest, Testing Library, jsdom |
| Linting | Prettier |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Clone the repository
git clone https://github.com/<your-username>/finance-assistant.git
cd finance-assistant

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Test

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run)
npm run test:run

# Type check
npm run typecheck
```

## AI Analysis setup

AI Analysis is the only feature that requires network access. It reads its endpoint config from the gitignored `src/Configs/Prompts/promptConf.ts`:

| Variable | Source | Notes |
|----------|--------|-------|
| `GAPGPT_API_URL` | `promptConf.ts` | OpenAI-compatible chat-completions endpoint |
| `GAPGPT_API_KEY` | `VITE_GAPGPT_API_KEY` env var | Never committed |
| `GAPGPT_MODEL` | `promptConf.ts` | Model identifier |

Set the key in a `.env` file at the repo root:

```
VITE_GAPGPT_API_KEY=your-key-here
```

Without it, every other feature still works fully offline — only the Analyze button fails.

> **Note:** `VITE_`-prefixed variables are inlined into the renderer bundle at build time. For a public distribution, proxy the request through the main process instead so the key is not shipped to the client.

## Project Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # App entry, window creation, IPC registration
│   ├── preload.ts                 # Context bridge (window.api)
│   ├── menu.ts                    # Native application menu, rebuilt per language
│   ├── datasetHandlers.ts         # Dataset CRUD (atomic writes)
│   ├── settingsHandlers.ts        # Settings persistence
│   ├── exportHandlers.ts          # File export/save dialogs
│   ├── fileHandlers.ts            # File read operations
│   ├── configHandlers.ts          # Config sync for import defaults
│   └── closeHandlers.ts           # Graceful close with save-before-quit
│
├── core/                          # Shared, framework-agnostic logic
│   ├── models/
│   │   └── types.ts               # All TypeScript types and enums
│   ├── store/
│   │   └── useAppStore.ts         # Zustand global state store
│   ├── services/
│   │   ├── TransactionService.ts  # Transaction CRUD, search, filter, sort
│   │   ├── CategoryService.ts     # Category CRUD, defaults
│   │   ├── ReceivableService.ts   # Receivable CRUD, balance + link tracking
│   │   ├── StatsService.ts        # Dashboard statistics
│   │   ├── ReportService.ts       # Report generation, chart data
│   │   ├── ExportService.ts       # CSV/XLSX/PDF export
│   │   ├── ImportService.ts       # CSV/XLSX import with auto-mapping
│   │   ├── DatasetService.ts      # Dataset serialization (.fina files)
│   │   ├── SettingsService.ts     # Settings persistence + validation
│   │   └── ConfigService.ts       # Default category/receivable configs
│   └── utils/
│       ├── format.ts              # Currency/date formatting
│       ├── jalali.ts              # Jalali conversion, formatting, boundaries
│       ├── dashboardPeriod.ts     # Time-period presets and range resolution
│       ├── id.ts                  # ID generation
│       └── styles.ts              # Design tokens (colors, spacing, etc.)
│
└── renderer/                      # React frontend
    ├── App.tsx                    # Root component, routing, nav, shortcuts
    ├── pages/                     # 9 routed pages + 1 unused
    │   ├── WelcomePage.tsx        # First-run create/import screen
    │   ├── DashboardPage.tsx      # Period summary, cards, category chart
    │   ├── TransactionPage.tsx    # Transaction list, CRUD, search, filter
    │   │                          #   + the live import flow (DropZone + ImportModal)
    │   ├── ReceivablePage.tsx     # Receivable tracking
    │   ├── CategoryPage.tsx       # Category management
    │   ├── BudgetPage.tsx         # Percentage/amount budget allocation
    │   ├── ReportsPage.tsx        # 14 built-in reports with charts
    │   ├── CustomReportBuilderPage.tsx  # Ad-hoc report builder
    │   ├── SettingsPage.tsx       # Language, category type mapping, about
    │   └── ImportPage.tsx         # Unused alternative wizard, nothing imports it
    │
    ├── components/                # 35 reusable UI components
    ├── hooks/                     # useReducedMotion, useBeforeUnload
    └── i18n/                      # en.json + fa.json
```

## Architecture

The app follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│  Renderer (React)                                       │
│  Pages -> Components -> Zustand Store -> Services       │
└──────────────────────┬──────────────────────────────────┘
                       │ window.api (IPC bridge)
┌──────────────────────▼──────────────────────────────────┐
│  Main Process (Electron)                                │
│  IPC Handlers -> File I/O (atomic writes)               │
│  Datasets: {userData}/datasets/*.fina                   │
│  Settings: {userData}/settings.json                     │
└─────────────────────────────────────────────────────────┘
```

- **Renderer process** holds all UI state in a Zustand store. Mutations trigger an auto-save via a queued writer so rapid successive saves cannot interleave and corrupt a file.
- **Main process** owns all file I/O using atomic writes (write to `.tmp`, then `rename`). Leftover `.tmp` files are removed on startup.
- **Core services** are pure, static utility classes with no framework dependencies, which makes them independently testable without mounting React.

There is no router library: `App.tsx` swaps pages from a `currentPage` state value.

## Data Model

| Type | Description | Key Fields |
|------|-------------|------------|
| `Dataset` | Top-level persistence unit (`.fina` file) | version, name, currency, transactions[], categories[], receivables[], categoryTypeMap, budgetPercentages |
| `Transaction` | A single financial entry | date, title, categoryId, type, amount, notes |
| `Category` | Color-coded transaction category | name, color, icon, isDefault |
| `Receivable` | Expected income tracker | title, categoryId, totalAmount, from, askDate, notes |
| `ApplicationSettings` | User preferences | language, visibleDashboardCards[], lastOpenedDataset, recentDatasets[], lastExportTimestamp |

`TransactionType` is one of **Income, Expense, Refund, Investment**.

Two optional maps hang off the dataset:

- `categoryTypeMap` — `categoryId -> TransactionType`, drives form auto-fill
- `budgetPercentages` — `categoryId -> percent`, drives the Budget page

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Go to the Transactions page |
| `Ctrl/Cmd + S` | Save the current dataset |
| `Ctrl/Cmd + O` | Open Dataset (native menu) |

## Testing

The project has **21 unit test files** covering services, utilities, and components.

```bash
# Run all unit tests
npm run test:run

# Run with coverage
npx vitest run --coverage
```

Test fixtures live in `tests/fixtures/` (sample CSV, XLSX, and a malformed file for import testing).

`npm run test:e2e` is declared in `package.json` but there is no Playwright config or spec suite in the repository yet.

## Build & Distribution

Builds are configured via `electron-builder.yml`:

| Platform | Targets | Output |
|----------|---------|--------|
| Windows | NSIS installer, Portable | `finance-assistant-*-setup.exe`, portable `.exe` |
| macOS | DMG, ZIP | `Finance Assistant.dmg`, `.zip` |
| Linux | AppImage, DEB | `finance-assistant-*.AppImage`, `.deb` |

```bash
# Build for current platform
npm run build

# Output is in dist/
```

## Known limitations

Documented honestly so they are not mistaken for features:

- **Language is not restored on launch.** The saved language is applied to the native menu at startup, but the renderer UI initializes in English and the document `dir` is only set when the language is toggled in Settings.
- **The "Net Balance" card toggle does nothing.** It appears in the Customize dialog and is a valid card id, but no summary card is registered for it — net balance only renders as the hero card, which cannot be hidden.
- **`recentDatasets` is dead data.** It is persisted and validated in the settings model, but no UI reads or writes it. Reopening a dataset relies on `lastOpenedDataset` being auto-loaded at startup.
- **`ImportPage.tsx` is orphaned.** It is a complete, working wizard (file selector, preview, column mapping, duplicate review, confirm) that no module imports. The live import path is `DropZone` + `ImportModal` inside `TransactionPage`. The `nav.import` label is likewise unused.
- **Search Report** matches categories; the Transactions page search does not (titles and notes only).
- **Custom Report Builder PDFs omit the chart image** — only the Reports page passes a chart reference to the exporter.
- **`papaparse` is installed but unused**; the import CSV parser is hand-rolled.
- **ESLint is not currently runnable** — `npm run lint` fails because the repo has no `eslint.config.js` for ESLint 9.
- **No E2E tests** are present despite the script.

## License

MIT
