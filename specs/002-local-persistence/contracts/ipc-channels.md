# IPC Channel Contracts

**Date**: 2026-06-27
**Spec**: [spec.md](../spec.md)

## Overview

All communication between the renderer and main process flows through Electron IPC via `contextBridge`-exposed APIs. The renderer never accesses the filesystem directly.

## Existing Channels (used by this feature)

### dataset:save

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Save dataset to a file path
- **Handler**: `datasetHandlers.ts`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | `string` | Yes | Absolute path to the dataset file |
| `content` | `string` | Yes | Serialized JSON content of the dataset |

**Returns**:
```typescript
{ success: boolean; error?: string }
```

**Behavior**: Writes `content` to `filePath.tmp`, then atomically renames to `filePath`.

---

### dataset:load

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Load and deserialize a dataset from a file path
- **Handler**: `datasetHandlers.ts`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | `string` | Yes | Absolute path to the dataset file |

**Returns**:
```typescript
{ success: boolean; data?: Dataset; error?: string }
```

**Behavior**: Reads file, validates JSON, deserializes via `DatasetService.deserialize()`.

---

### dialog:open

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Show native open-file dialog for datasets
- **Handler**: `datasetHandlers.ts`

**Returns**: `Electron.OpenDialogReturnValue`

---

### dialog:save

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Show native save-file dialog for datasets
- **Handler**: `datasetHandlers.ts`

**Returns**: `Electron.SaveDialogReturnValue`

---

## New Channels (added by this feature)

### settings:load

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Load application settings from disk
- **Handler**: `settingsHandlers.ts`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| None | — | — | Settings are loaded from the fixed path `{userData}/settings.json` |

**Returns**:
```typescript
{ success: boolean; data?: ApplicationSettings; error?: string }
```

**Behavior**: Reads `settings.json` from `app.getPath('userData')`. If the file doesn't exist, returns `{ success: true, data: null }` (caller handles first-launch logic). Corrupted files are reported as errors.

---

### settings:save

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Persist application settings to disk
- **Handler**: `settingsHandlers.ts`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `string` | Yes | Serialized JSON content of the settings |

**Returns**:
```typescript
{ success: boolean; error?: string }
```

**Behavior**: Writes to `settings.json.tmp`, then atomically renames to `settings.json`. Both files are in `app.getPath('userData')`.

---

### dataset:getDefaultPath

- **Direction**: Renderer → Main (invoke)
- **Purpose**: Get the default dataset file path for first-launch creation
- **Handler**: `settingsHandlers.ts` or `datasetHandlers.ts`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| None | — | — | Path is derived from `{userData}/datasets/default.fina` |

**Returns**:
```typescript
{ success: boolean; path: string }
```

**Behavior**: Returns the absolute path for the default dataset location.

---

## Preload API Shape

The `window.api` object is extended with a `settings` property:

```typescript
interface Window {
  api: {
    // ... existing properties (dataset, file, export, send, on, receive) ...
    settings: {
      load: () => Promise<{ success: boolean; data?: ApplicationSettings; error?: string }>
      save: (content: string) => Promise<{ success: boolean; error?: string }>
    }
    dataset: {
      // ... existing dataset methods ...
      getDefaultPath: () => Promise<{ success: boolean; path: string }>
    }
  }
}
```

## Error Handling

All IPC handlers follow the same error contract:

| Condition | Behavior |
|-----------|----------|
| Success | `{ success: true, ...data }` |
| File not found | `{ success: false, error: "File not found: {path}" }` |
| Permission denied | `{ success: false, error: "Permission denied: {path}" }` |
| Corrupt JSON | `{ success: false, error: "Failed to parse: {details}" }` |
| Disk full | `{ success: false, error: "No space left on device" }` |
| Unknown error | `{ success: false, error: "{error message}" }` |
