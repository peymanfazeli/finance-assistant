# Finance Assistant

Offline-first personal finance analytics desktop app built with Electron, React, and TypeScript. Track transactions, visualize spending, generate reports, and export data — all stored locally on your machine.

## Features

- **Multi-currency support** with locale-aware formatting (Rial, IRR: 0 decimals; JPY: 0 decimals; others: 2 decimals, thousands-separated)
- **Transaction management** — add, edit, delete, and search transactions with filterable lists
- **Category management** — color-coded income, expense, and refund categories
- **Dashboard** — summary cards with income/expense/balance overview
- **Reports** — line, area, bar, pie, and donut charts with date-range filtering, exportable to CSV, XLSX, and PDF (with chart image)
- **Custom report builder** — build ad-hoc reports with grouping, sorting, and aggregation
- **CSV/XLSX import** with auto-detection of column mappings, duplicate detection and review
- **Bilingual UI** — English and Persian (RTL) with instant language switching
- **Local persistence** — datasets saved as `.fina` files in app user data directory
- **Export** — transactions and reports to CSV, XLSX, and PDF

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 28 + electron-vite |
| Frontend | React 19, TypeScript |
| State | Zustand |
| Charts | Recharts |
| i18n | i18next, react-i18next |
| Export | jsPDF, xlsx, html2canvas, papaparse |
| Test | Vitest, Playwright, Testing Library |

## Getting Started

```bash
# clone
git clone https://github.com/<your-username>/finance-assistant.git
cd finance-assistant

# install
npm install

# dev
npm run dev

# build
npm run build

# type-check
npm run typecheck

# test
npm test
Project Structure
src/
├── main/           # Electron main process (menu, IPC, file I/O)
├── renderer/       # React UI (pages, components, i18n)
├── core/           # Shared logic (services, store, utils)
│   ├── services/   # Export, Import, Report logic
│   ├── store/      # Zustand app store
│   ├── utils/      # Formatting, ID generation
│   └── types/      # TypeScript types
specs/              # Design specs and research docs
License
MIT

---
