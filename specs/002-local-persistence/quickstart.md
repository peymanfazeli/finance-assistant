# Quickstart: Local Persistence

**Date**: 2026-06-27
**Spec**: [spec.md](./spec.md)

## Prerequisites

- Node.js 20+
- npm dependencies installed (`npm install`)
- Electron app builds and runs (`npm run dev`)

## Setup Commands

```bash
# From project root
npm install
npm run dev
```

## Validation Scenarios

### Scenario 1: Auto-Save After Adding a Transaction

1. Launch the app (`npm run dev`)
2. On first launch, verify default dataset is created automatically (dashboard shown, no welcome screen)
3. Open DevTools console (`Ctrl+Shift+I`)
4. Add a new transaction via the UI
5. Verify the dataset file is written to `{app.getPath('userData')}/datasets/default.fina`
6. Read the file and confirm the new transaction appears in the JSON
7. **Expected**: File created within 1 second of adding the transaction

### Scenario 2: Settings Persist Across Restarts

1. Change the application language from English to Persian
2. Hide a dashboard card (e.g., "Average Daily Spending")
3. Close the application
4. Verify `{app.getPath('userData')}/settings.json` contains the updated language and hidden cards
5. Reopen the application
6. **Expected**: Interface shows Persian language; hidden card remains hidden
7. Repeat with a second restart cycle
8. **Expected**: Settings persist across multiple restart cycles

### Scenario 3: Auto-Load Last Dataset on Startup

1. Launch the app and add 3 transactions with distinct titles ("Test A", "Test B", "Test C")
2. Close the application
3. Verify `settings.json` contains `lastOpenedDataset` pointing to the correct path
4. Reopen the application
5. **Expected**: Dashboard loads within 3 seconds; all 3 transactions are present
6. Repeat 5 times
7. **Expected**: Dataset loads correctly every time

### Scenario 4: Auto-Save on Edit and Delete

1. Launch the app (dataset loads automatically)
2. Edit an existing transaction's amount
3. Close the app and reopen
4. **Expected**: Edited amount is persisted
5. Delete a transaction
6. Close the app and reopen
7. **Expected**: Deleted transaction is gone; remaining transactions are intact

### Scenario 5: Atomic Write Crash Safety

1. Launch the app
2. Add a transaction and note the dataset file size
3. Simulate a crash: kill the Electron process (`Ctrl+C` in terminal) during a save operation
   - To reliably trigger this, set a breakpoint in `datasetHandlers.ts` on `writeFileSync`
4. Restart the app
5. **Expected**: App starts without corruption; dataset file is either the old version or the new version (never a partial write)

### Scenario 6: First Launch (Clean System)

1. Delete or rename the existing `settings.json` and `datasets/` directory in `{app.getPath('userData')}`
2. Launch the app
3. **Expected**: Default dataset "My Finances" is created with USD currency and all default categories
4. **Expected**: Dashboard is shown immediately (no welcome screen, no dialogs)
5. **Expected**: `settings.json` is created with default settings
6. **Expected**: `datasets/default.fina` is created with valid JSON content

### Scenario 7: Missing Dataset File Graceful Handling

1. Launch the app to create a dataset
2. Close the app
3. Manually delete `datasets/default.fina` (but keep `settings.json`)
4. Reopen the app
5. **Expected**: App shows an error message or creates a new default dataset — does not crash
6. Close the app
7. Restore or let the app create a new dataset
8. **Expected**: App recovers and is usable

### Scenario 8: No UI Freeze During Save

1. Launch the app
2. Open DevTools Performance tab
3. Rapidly add 5 transactions in succession
4. **Expected**: UI remains responsive; no input lag or freeze
5. **Expected**: All 5 transactions are persisted (verify by reopening)

## Test Commands

```bash
# Unit tests
npm run test:run

# TypeScript check
npm run typecheck

# Lint
npm run lint
```

## Reference

- [Data Model](./data-model.md) — Settings and dataset file schemas
- [IPC Contracts](./contracts/ipc-channels.md) — Channel definitions and payload contracts
- [Spec](./spec.md) — Full feature specification
- [Existing Data Model](../001-personal-finance-analytics/data-model.md) — Dataset entity definition
