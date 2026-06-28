# Data Model: UI Polish & Enhancements

**Date**: 2026-06-28
**Spec**: [spec.md](./spec.md)

## Entities

### ApplicationSettings — Updated (settings.json)

The existing `ApplicationSettings` entity from specs 001 and 002 gains one new field.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `lastExportTimestamp` | string \| null | No | `null` | ISO 8601 datetime of the most recent export (report or CSV data backup). Compared against dataset `updatedAt` on close. |

**Validation rules**:
- If present, must be a valid ISO 8601 datetime string
- `null` means never exported

**Storage**:
- File: `{app.getPath('userData')}/settings.json` (same as existing)
- The field is added to the existing JSON; backward compatible with older settings files (field absent = null).

---

### SearchReportConfig (Transient — not persisted)

A local UI state object, never written to disk.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keyword` | string | Yes | User-entered search keyword |
| `grouping` | enum | Yes | `category` \| `month` |
| `chartType` | enum | Yes | `line` \| `bar` \| `pie` \| `donut` \| `area` |

**Validation rules**:
- `keyword` must be non-empty to generate
- Searches are case-insensitive substring matches against transaction title, notes, and category name

---

### ExportState (Transient — computed on close)

A transient state computed at close-time, not persisted.

| Check | Source | Purpose |
|-------|--------|---------|
| `datasetHasTransactions` | Store | If false → no warning regardless |
| `lastExportTimestamp` | Settings | Null → never exported |
| `datasetUpdatedAt` | Store | Last modification time |
| `shouldShowWarning` | Computed | `datasetHasTransactions && (lastExportTimestamp === null \|\| datasetUpdatedAt > lastExportTimestamp)` |

---

### Event Payloads

| Event | Source | Destination | Payload |
|-------|--------|-------------|---------|
| `request-close` | Renderer (user clicks X) | Main process | none |
| `close-app` | Renderer (user clicks "Close Anyway") | Main process | none |
| `cancel-close` | Renderer (user clicks "Cancel") | Main process | none |
| `save-last-export-timestamp` | Renderer (after CSV export) | Main process | `{ timestamp: string }` |
| `get-last-export-timestamp` | Renderer (on app load) | Main process | → `{ timestamp: string \| null }` |

## State Transitions

### Export timestamp lifecycle

```
[Fresh install] → lastExportTimestamp = null
[Any export] → lastExportTimestamp = now
[Dataset modified after export] → dataset.updatedAt > lastExportTimestamp
[Close attempted] → check condition → show warning or close
```

### Search report UI lifecycle

```
[User selects Search Report] → config.keyword = ""
[User types keyword] → config.keyword updates
[User clicks Generate] → filter transactions → chart renders
[User changes grouping/chartType] → update chart (no re-filter)
[User changes keyword] → must click Generate again
```

## Relationships

```
ApplicationSettings 1 ──── 0..1 lastExportTimestamp
Dataset 1 ──── 1 updatedAt (compared against lastExportTimestamp on close)
SearchReportConfig: transient, no persistence, no relationships
```

## Versioning

| Artifact | Current Version | Change |
|----------|----------------|--------|
| Settings schema | 1 → 2 | Added `lastExportTimestamp` field (optional, null = never exported) |
| Dataset schema | 1 | Unchanged |
