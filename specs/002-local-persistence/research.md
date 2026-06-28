# Research: Local Persistence

**Date**: 2026-06-27
**Plan**: [plan.md](./plan.md)

## Existing Architecture

### Dataset Save/Load (src/main/datasetHandlers.ts)

The project already implements the fundamental save/load operations:
- **Save**: Writes to `filePath.tmp` using `writeFileSync`, then atomically renames using `renameSync`. This is the temp-file-then-rename pattern specified in FR-007.
- **Load**: Reads file using `readFileSync`, deserializes via `DatasetService.deserialize()`.
- **Dialogs**: `dialog:save` and `dialog:open` handlers for user-initiated file selection.

### Preload Bridge (src/main/preload.ts)

The `window.api` object exposes:
- `dataset.save(filePath, content)` — IPC invoke to main process
- `dataset.load(filePath)` — IPC invoke to main process
- `file.read(filePath)` — for import files
- `export.saveFile(filePath, content)` — for export
- Generic `send`, `on`, `receive` channels

**Gap**: No `settings` methods exist yet.

### Application Settings (src/core/models/types.ts)

```typescript
interface ApplicationSettings {
  language: Language
  visibleDashboardCards: string[]
  lastOpenedDataset: string | null
  recentDatasets: string[]
}
```

**Gap**: Settings are in-memory only via Zustand store. No persistence to disk.

### Zustand Store (src/core/store/useAppStore.ts)

The store has `saveDataset()` which calls `window.api.dataset.save()`, but **no CRUD operation calls it**. Mutations (`addTransaction`, `updateTransaction`, `deleteTransaction`, `duplicateTransaction`, `addCategory`, `updateCategory`, `deleteCategory`, `setLanguage`, `updateSettings`) modify in-memory state only.

**Gap**: Auto-save is not wired into any mutation.

### Startup Loading (src/renderer/App.tsx)

Lines 24-33 show startup logic that reads `lastOpenedDataset` from in-memory settings (which will be empty on fresh launch) and attempts to load via `DatasetService.load()` directly. **This bypasses IPC** — it calls `DatasetService` from the renderer, which in a sandboxed Electron environment would fail. This must be changed to use IPC.

**Gap**: Startup load goes through an incorrect path. Must use `window.api.dataset.load()` via IPC.

## Atomic Writes on Windows

`fs.renameSync(src, dest)` on Windows atomically replaces `dest` if it exists, provided both are on the same volume. The pattern `writeFileSync(tmpPath) → renameSync(tmpPath, filePath)` is the standard approach:

1. Write new content to `filePath.tmp` (if the process crashes here, `filePath` remains intact)
2. Rename `filePath.tmp` to `filePath` (atomic on same filesystem — if the process crashes here, either the old or new file exists, never a partial write)

**Risk**: On Windows, `renameSync` will fail with `EXDEV` if tmp and target are on different volumes. Since both are in `app.getPath('userData')`, they are always on the same volume. This is safe.

## Settings Handler Design

Best practice for Electron settings persistence:
- Use `app.getPath('userData')` for the settings directory
- Store as `settings.json` in that directory
- Use the same atomic write pattern as datasets
- Load synchronously on startup (before renderer loads)
- Expose via IPC with `settings:load` and `settings:save` channels

## Auto-Save Strategy

Two common approaches for auto-save in Zustand:

1. **Immediate save after every mutation**: Simplest approach. Add `saveDataset()` and `saveSettings()` call at the end of each store action. Risk of rapid successive writes.

2. **Debounced/throttled save**: Use a debounce (e.g., 500ms) to coalesce rapid changes into a single write. Better for performance but adds complexity.

**Recommendation**: Use approach 1 (immediate save) with a simple guard against concurrent saves. The Zustand store already has `saveDataset()` which can be called at the end of every mutation. For rapid changes, the atomic write guarantees consistency, and file write times for <10 MB JSON are <50ms, well within the 1-second target. If performance issues arise, a debounce can be added later.

## Existing Temp File Cleanup

`datasetHandlers.ts` already has `cleanupTempFiles()` which scans `userData` and `cwd` for `.tmp` files on startup and deletes them. This is already registered in `index.ts`.

## Dependency Summary

| Purpose | Approach | Rationale |
|---------|----------|-----------|
| File writing | Node.js `fs.writeFileSync` | Atomic writes need synchronous write-to-tmp before rename. Writes are fast (<50ms). |
| Settings file location | `app.getPath('userData')`/settings.json | Standard Electron practice. Same dir as datasets. |
| IPC for settings | `ipcMain.handle('settings:load/save')` | Follows existing `dataset:load/save` pattern exactly. |
| Preload for settings | Extend `window.api` with `settings` object | Follows existing `dataset`/`file`/`export` pattern. |
| Settings schema | `ApplicationSettings` interface | Already defined. No changes needed. Add `settingsVersion` for future migrations. |
| State management | Zustand middleware or action wrappers | Simplest: call save at end of each action. |
| Debouncing | Not needed initially | JSON <10 MB writes in <50ms. Can add later if profiling shows issues. |
| Default dataset | `DatasetService.create()` in main process via IPC | Already has all required logic: name, currency, default categories. |
| APP data dir detection | `app.getPath('userData')` | Built into Electron. Platform-aware automatically. |
