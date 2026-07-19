# Finance Assistant

Offline-first personal finance analytics desktop app built with Electron, React, and TypeScript. Track transactions, visualize spending, generate reports, and export data — all stored locally on your machine with zero cloud dependency.

## About

Finance Assistant is a privacy-focused personal finance manager that runs entirely on your desktop. Your financial data never leaves your machine — all datasets are stored as local `.fina` files. The app supports English and Persian (Farsi) with full RTL layout, multi-currency formatting, and an AI-powered financial analysis feature for actionable insights.

## Features

### Transaction Management
- Add, edit, delete, and duplicate transactions
- Quick-add for rapid entry
- Search by keyword across titles, notes, and categories
- Advanced filtering by date range, category, type (income/expense/refund), and amount range
- Sort by date, title, amount, type, or category
- Duplicate detection during both manual entry and import

### Dashboard
- Customizable summary cards: Total Income, Total Expenses, Net Balance, Transaction Count, Average Daily Spending, Average Weekly Spending
- Toggle card visibility to focus on what matters to you
- Real-time stats that update with every transaction change

### Reports & Analytics
- **11 built-in reports**: Expense by Category, Income by Category, All by Category, Daily/Weekly/Monthly Spending, Income vs Expense, Top Expenses, Top Income, Spending Trends, Search Report
- **5 chart types**: Line, Bar, Pie, Donut, Area — all interactive with tooltips and legends
- **Custom report builder**: Ad-hoc reports with configurable date range, category/type filters, grouping (day/week/month/year), and aggregation (sum/count/average)
- **AI-powered analysis**: Get GPT-powered financial insights in Persian with a 12-section audit dashboard covering spending patterns, waste detection, cost reduction opportunities, and a financial scorecard
- Date-range filtering across all reports

### Import & Export
- **CSV/XLSX import** with automatic column mapping detection (supports English and Persian headers)
- Import wizard with preview, column mapping, duplicate review, and confirmation steps
- **Export to CSV, Excel (.xlsx), and PDF** — reports include chart images, formatted tables, and totals
- Export-on-close dialog to prevent data loss

### Receivables Tracking
- Track expected income (salary, payments, etc.) with linked transactions
- Visualize received vs. remaining amounts with progress bars
- Payment history charts for each receivable

### Internationalization
- Full English and Persian (Farsi) UI with instant language switching
- RTL layout support for Persian
- Locale-aware currency formatting (USD, EUR, GBP, CAD, AUD, JPY, Toman)
- Language preference persisted and synced with the native Electron menu

### Data & Storage
- Offline-first: all data stored locally in `.fina` dataset files
- Atomic writes (temp file + rename) for crash safety
- Multiple datasets with recent-dataset history
- Graceful shutdown with save-before-close prompting
- Keyboard shortcuts: `Ctrl+N` (new transaction), `Ctrl+S` (save)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 28 + electron-vite |
| Frontend | React 19, TypeScript 5.7 |
| State management | Zustand 5 |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| i18n | i18next, react-i18next |
| Export | jsPDF, SheetJS (xlsx), html2canvas, papaparse |
| AI integration | GPT API (via `marked` for Markdown rendering) |
| Testing | Vitest, Playwright, Testing Library |
| Linting | ESLint, Prettier |

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

# End-to-end tests
npm run test:e2e

# All tests
npm run test:all

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # App entry, window creation, IPC registration
│   ├── preload.ts                 # Context bridge (window.api)
│   ├── menu.ts                    # Native application menu
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
│   │   ├── ReceivableService.ts   # Receivable CRUD, balance tracking
│   │   ├── StatsService.ts        # Dashboard statistics
│   │   ├── ReportService.ts       # Report generation, chart data
│   │   ├── ExportService.ts       # CSV/XLSX/PDF export
│   │   ├── ImportService.ts       # CSV/XLSX import with auto-mapping
│   │   ├── DatasetService.ts      # Dataset serialization (.fina files)
│   │   ├── SettingsService.ts     # Settings persistence
│   │   └── ConfigService.ts       # Default category/receivable configs
│   └── utils/
│       ├── format.ts              # Currency/date formatting
│       ├── id.ts                  # ID generation
│       └── styles.ts              # Design tokens (colors, spacing, etc.)
│
└── renderer/                      # React frontend
    ├── App.tsx                    # Root component, routing, nav
    ├── pages/                     # 9 page components
    │   ├── WelcomePage.tsx        # First-run create/import screen
    │   ├── DashboardPage.tsx      # Summary cards with customizable visibility
    │   ├── TransactionPage.tsx    # Transaction list, CRUD, search, filter
    │   ├── ReceivablePage.tsx     # Receivable tracking
    │   ├── CategoryPage.tsx       # Category management
    │   ├── ReportsPage.tsx        # 11 built-in reports with charts
    │   ├── CustomReportBuilderPage.tsx  # Ad-hoc report builder
    │   ├── ImportPage.tsx         # CSV/XLSX import wizard
    │   └── SettingsPage.tsx       # Language, dataset management
    ├── components/                # 32 reusable UI components
    ├── hooks/                     # useReducedMotion, useBeforeUnload
    └── i18n/                      # English + Persian translations
```

## Architecture

The app follows a clean three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│  Renderer (React)                                       │
│  Pages → Components → Zustand Store → Services          │
└──────────────────────┬──────────────────────────────────┘
                       │ window.api (IPC bridge)
┌──────────────────────▼──────────────────────────────────┐
│  Main Process (Electron)                                │
│  IPC Handlers → File I/O (atomic writes)                │
│  Datasets: {userData}/datasets/*.fina                   │
│  Settings: {userData}/settings.json                     │
└─────────────────────────────────────────────────────────┘
```

- **Renderer process** holds all UI state in a Zustand store. Every mutation triggers an auto-save via a queued save function that serializes and writes through Electron IPC.
- **Main process** handles all file I/O using atomic writes (write to `.tmp`, then `rename`) to prevent data corruption. On startup, leftover `.tmp` files are cleaned up.
- **Core services** are pure, static utility classes with no framework dependencies, making them independently testable.

## Data Model

| Type | Description | Key Fields |
|------|-------------|------------|
| `Dataset` | Top-level persistence unit (`.fina` file) | name, currency, transactions[], categories[], receivables[] |
| `Transaction` | A single financial entry | date, title, categoryId, type (Income/Expense/Refund), amount, notes |
| `Category` | Color-coded transaction category | name, color, icon, isDefault |
| `Receivable` | Expected income tracker | title, categoryId, totalAmount, from, notes |
| `ApplicationSettings` | User preferences | language, visibleDashboardCards[], lastOpenedDataset, recentDatasets[] |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Navigate to Transactions page |
| `Ctrl/Cmd + S` | Save current dataset |

## Testing

The project has **16 unit test files** covering services and components, plus E2E tests via Playwright.

```bash
# Run all unit tests
npm run test:run

# Run with coverage
npx vitest run --coverage

# Run E2E tests
npm run test:e2e
```

Test fixtures are located in `tests/fixtures/` (sample CSV, XLSX, and malformed files for import testing).

## Build & Distribution

Builds are configured via `electron-builder.yml` for all three platforms:

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

## License

MIT
