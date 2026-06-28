# Research: Personal Finance Analytics

**Date**: 2026-06-27
**Plan**: [plan.md](./plan.md)

## Desktop Framework

### Decision: Electron + TypeScript + Vite

**Rationale**: Electron provides the most mature cross-platform desktop framework with:
- Largest npm ecosystem — all key dependencies (SheetJS, Recharts, jsPDF) are JavaScript packages that work without extra bindings
- Consistent Chromium rendering across Windows/macOS/Linux — critical for pixel-perfect charts and RTL layout
- Mature auto-update (electron-updater), code signing, and crash reporting infrastructure
- Zero learning curve for Rust (vs Tauri) — the entire stack remains TypeScript

**Alternatives considered**:
- **Tauri v2** — smaller binaries (5-15MB vs 150MB+), less RAM, but requires Rust for backend commands and has WebView rendering inconsistencies across platforms that would complicate RTL + chart rendering
- **Neutralino** — too limited in native API surface

### Language: TypeScript 5.x

**Rationale**: Type safety for complex data transformations (import parsing, report calculations). Strict mode catches null/undefined in transaction handling.

## UI Framework

### Decision: React 18+ with TypeScript

**Rationale**: Largest component ecosystem. Recharts, react-i18next, and most chart/export libraries have first-class React support. Server-side rendering not needed (desktop app).

## Chart Library

### Decision: Recharts

**Rationale**:
- 27k+ GitHub stars, 48M+ weekly npm downloads
- SVG-based — charts render as DOM elements, which enables:
  - Accessibility (screen readers can read SVG elements)
  - PDF export via html2canvas (captures charts as images)
  - CSS styling for theming
- React-native component API — clean integration
- Supports all required chart types: Line, Bar, Pie, Donut, Area

**Alternatives considered**:
- **Chart.js (react-chartjs-2)** — canvas-based, better for 10k+ data points but harder to capture for PDF and less React-native
- **Nivo** — beautiful defaults but heavier bundle

## Excel & CSV

### Decision: SheetJS (xlsx) + PapaParse

| Library | Purpose | Rationale |
|---------|---------|-----------|
| `xlsx` (SheetJS) | Read/write .xlsx | Industry standard, 15k stars, 5.5M weekly downloads, supports cell styles, column mapping |
| `papaparse` | Parse CSV | Auto-delimiter detection, streaming, header row mapping |

## PDF Generation

### Decision: jsPDF + html2canvas

**Rationale**:
- **jsPDF**: Most popular JS PDF library, generates PDFs client-side offline
- **html2canvas**: Captures chart DOM elements (Recharts SVGs) as images embedded in PDF
- Combined workflow: render report → capture chart images via html2canvas → build PDF with jsPDF

**Alternatives considered**:
- **pdfmake** — JSON-based PDF, but lacks native chart image embedding
- **Puppeteer** — requires Chromium binary (200MB+), not suitable for offline desktop app

## Excel Export

### Decision: SheetJS (xlsx) write

**Rationale**: Same library as import — write structured data to .xlsx files. Supports cell formatting and column widths.

## Localization

### Decision: i18next + react-i18next

**Rationale**: Industry standard for React i18n. Supports:
- Instant language switching without restart
- RTL detection and layout switching
- Interpolation and pluralization for both English and Persian
- JSON-based translation files (en.json, fa.json)

## State Management

### Decision: Zustand

**Rationale**: Lightweight (1KB), TypeScript-first, no boilerplate. Perfect for a desktop app where state is primarily:
- Transaction list
- Dashboard summary data
- UI preferences (language, visible cards)

## Testing

### Decision: Vitest (unit) + Playwright (e2e)

| Layer | Tool | Rationale |
|-------|------|-----------|
| Unit tests | Vitest | Vite-native, fast, TypeScript support, good mocking |
| Component tests | Vitest + React Testing Library | Test React components in isolation |
| E2E tests | Playwright | Cross-platform Electron testing, file system interactions |

## Storage

### Decision: Local JSON file with atomic writes

**Rationale**:
- JSON is human-readable, debuggable, and directly portable (user can open in any editor)
- Atomic write strategy (write to temp file → replace on success) prevents corruption (per clarification Q2)
- Single `.json` file per dataset is simple to backup/restore
- No external database dependency — keeping binary size down

**Alternatives considered**:
- **SQLite** (better-sqlite3) — more complex, native binary dependency, harder to backup manually
- **IndexedDB** — browser-only, not suitable for Electron file-based data management

## Currency

### Decision: Single currency per dataset, selected at creation

**Rationale**: Confirmed via clarification Q3. User picks currency (USD, EUR, IRR, etc.) when creating a dataset. All amounts in that dataset are in that currency.

## Summary of Dependencies

| Purpose | Package | Version (approx) |
|---------|---------|-------------------|
| Desktop framework | electron | 34.x |
| UI | react, react-dom | 18.x |
| Language | typescript | 5.x |
| Build | vite | 6.x |
| Charts | recharts | 2.x |
| Excel parse/write | xlsx (SheetJS) | 0.20.x |
| CSV parse | papaparse | 5.x |
| PDF generation | jspdf + html2canvas | latest |
| Localization | i18next, react-i18next | 24.x / 14.x |
| State management | zustand | 5.x |
| Unit testing | vitest | 3.x |
| E2E testing | @playwright/test | latest |
| UI testing | @testing-library/react | 16.x |
