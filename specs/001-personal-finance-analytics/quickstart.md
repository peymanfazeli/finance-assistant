# Quickstart: Personal Finance Analytics

**Date**: 2026-06-27
**Data Model**: [data-model.md](./data-model.md)
**Plan**: [plan.md](./plan.md)

## Prerequisites

- Node.js 20.x+
- npm 10.x+

## Setup

```bash
git clone <repo-url>
cd financeAssistant
npm install
```

## Validation Scenarios

Run these scenarios to verify the feature works end-to-end.

### Scenario 1: First Launch & Manual Entry

1. Start the application: `npm run dev`
2. Verify the welcome screen shows **"Create New Dataset"** and **"Import Data"** as equally prominent options
3. Choose **"Create New Dataset"**, enter a name (e.g., "Test Finances"), select currency (e.g., "USD")
4. Verify you see an empty transaction list with an **"Add Transaction"** button
5. Click **"Add Transaction"** and fill in: date=today, title="Test Expense", category="Food & Drinks", type=Expense, amount=25.00, notes="Lunch"
6. Click Save
7. Verify the transaction appears in the list
8. Verify the dashboard (navigate to Home) shows: Total Expenses = $25.00, Net Balance = -$25.00, Transaction Count = 1

### Scenario 2: Import from Excel

1. Prepare a sample Excel file (`test-data/sample.xlsx`) with columns: Date, Title, Category, Type, Amount, Notes
2. Add 3 rows of test data
3. In the app, navigate to **Import** → select the file
4. Verify preview shows the 3 rows with auto-detected column mappings
5. Adjust a column mapping (e.g., map "Description" to "Title" )
6. Click **Confirm Import**
7. Verify the transaction list now shows 4 total transactions (1 manual + 3 imported)

### Scenario 3: Import Duplicate Detection

1. Import the same Excel file again
2. Verify the preview highlights potential duplicate rows
3. Uncheck (skip) the duplicate row and confirm
4. Verify no duplicate transaction was added (total should remain 4)

### Scenario 4: Reports & Charts

1. Navigate to **Reports** → **Expense by Category**
2. Verify a chart renders showing spending proportions
3. Click the chart type switcher → select **Bar Chart**
4. Verify the chart changes to a bar chart without reloading
5. Navigate to **Income vs Expense** and verify both series appear

### Scenario 5: Export

1. From any report, click **Export** → **PDF**
2. Verify a PDF file is saved containing the chart image and data table
3. Return to the report, click **Export** → **Excel**
4. Verify an `.xlsx` file is saved with structured columns

### Scenario 6: Language Switching

1. Open **Settings** → change Language to **Persian**
2. Verify all UI text switches to Persian instantly
3. Verify layout mirrors to RTL (sidebar on the right, text right-aligned)
4. Verify dates show in Persian format and numbers use Persian digits

### Scenario 7: Data Persistence

1. Save the dataset (`Ctrl+S` or File → Save)
2. Close and reopen the application
3. Click **Open Dataset** → select the saved `.fina` file
4. Verify all transactions, categories, and dashboard data are intact

## Expected Outcomes

| Scenario | Pass Condition |
|----------|---------------|
| 1 | Transaction appears in list and dashboard updates |
| 2 | Imported rows appear alongside existing transactions |
| 3 | Duplicate rows are flagged and skipped on user choice |
| 4 | Chart renders and switches type correctly |
| 5 | PDF includes chart image; Excel has structured columns |
| 6 | Full RTL layout with Persian text, dates, and digits |
| 7 | All data persists across app restart |

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## Debugging

- Dataset files are stored at user-selected paths with `.fina` extension
- Settings file is at Electron's `userData/settings.json`
- App logs to `userData/logs/` (if implemented)
