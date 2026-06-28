# Data Model: Local Persistence

**Date**: 2026-06-27
**Spec**: [spec.md](./spec.md)

## Entities

### ApplicationSettings (settings.json)

Persisted user preferences. Stored as `settings.json` in the OS application data directory.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `settingsVersion` | number | Yes | 1 | Schema version for future migrations |
| `language` | enum | Yes | `en` | `en` \| `fa` |
| `visibleDashboardCards` | string[] | Yes | `[totalIncome, totalExpenses, netBalance, transactionCount, avgDailySpending, avgWeeklySpending]` | Ordered list of visible card IDs |
| `lastOpenedDataset` | string \| null | No | `null` | Absolute path to the last opened dataset file |
| `recentDatasets` | string[] | Yes | `[]` | Ordered list of recently opened dataset paths (most recent first, max 10) |

**Validation rules**:
- `settingsVersion` must be present; unknown versions trigger migration logic
- `language` must be a supported value
- `lastOpenedDataset` must be a valid absolute path or null
- Unknown fields in the JSON are preserved (forward compatibility)

**Storage**:
- File: `{app.getPath('userData')}/settings.json`
- Format: UTF-8 JSON with 2-space indentation
- Atomic write: same temp-file-then-rename pattern as datasets

---

### Dataset File (persisted on disk)

See `specs/001-personal-finance-analytics/data-model.md` for the full Dataset entity definition. The persistence layer does not change the dataset schema — it only handles reading and writing the file.

**Storage conventions** (new for this feature):
- Directory: `{app.getPath('userData')}/datasets/`
- Default filename: `default.fina`
- User-created filenames: Derived from dataset name (sanitized), e.g., `My Finances` → `my-finances.fina`
- Format: UTF-8 JSON with 2-space indentation
- Atomic write: temp-file-then-rename pattern

---

### Persistence Service (Main Process)

Not a data entity but a design artifact: a main-process module that owns all filesystem I/O.

| Responsibility | Description |
|----------------|-------------|
| Save dataset | Atomic write of dataset JSON to dataset directory |
| Load dataset | Read and deserialize dataset JSON from file |
| Save settings | Atomic write of settings JSON to `settings.json` |
| Load settings | Read and deserialize settings JSON from `settings.json` |
| Get default paths | Resolve `settings.json` path, dataset directory, default dataset path |
| Cleanup temp files | Scan for orphaned `.tmp` files on startup and remove them |
| Create default dataset | On first launch, create `default.fina` with seeded categories |

## File Layout in Application Data Directory

```
{app.getPath('userData')}/
├── settings.json              # Application settings (always present after first launch)
├── datasets/                  # Dataset storage directory
│   ├── default.fina           # Default dataset (created on first launch)
│   └── ... (additional .fina files for user-created datasets)
└── *.tmp                      # Orphaned temp files (cleaned on startup)
```

## State Transitions

### Save lifecycle

```
[Mutation occurs] → store state updated → [Call saveDataset/saveSettings via IPC]
  → main process: serialize to JSON → writeFileSync(.tmp) → renameSync(.tmp → target)
  → [success] done
  → [failure] log error, original file intact (atomic write)
```

### Startup lifecycle

```
[App launches] → main process: read settings.json
  → [settings exists] → get lastOpenedDataset → load via IPC
    → [file exists] → deserialize → send to renderer → dashboard shown
    → [file missing/corrupt] → log error → create default dataset → dashboard shown
  → [settings missing (first launch)] → create default settings + default dataset → dashboard shown
```

## Relationships

```
Application Settings 1 ──── 0..1 Dataset (via lastOpenedDataset path)
Application Data Directory 1 ──── * Dataset File
Application Data Directory 1 ──── 1 Settings File
```

- The settings file references zero or one dataset as "last opened"
- Multiple dataset files can exist in the datasets directory (future multi-dataset support)
- Only one dataset is active at a time

## Versioning

| Artifact | Current Version | Strategy |
|----------|----------------|----------|
| Dataset schema | 1 (defined in 001) | `version` field in file; migration on read |
| Settings schema | 1 (this feature) | `settingsVersion` field; migration on read |
| File format | JSON | Forward-compatible: unknown fields preserved |
