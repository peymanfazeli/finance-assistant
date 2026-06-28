# IPC Channel Contracts: UI Polish & Enhancements

**Date**: 2026-06-28
**Spec**: [spec.md](../spec.md)
**Plan**: [plan.md](../plan.md)

## Overview

Two new IPC channels are added to support the export-on-close warning. All existing IPC channels from spec 002 remain unchanged.

---

## `export:get-last-timestamp`

Renderer requests the last export timestamp on app startup.

**Direction**: Renderer → Main

**Payload** (sent by renderer): None

**Response** (returned by main):
```typescript
{ timestamp: string | null }
```

**Behavior**:
- Main process reads `settings.json` and returns the `lastExportTimestamp` value
- If the field is absent or `null`, returns `null`
- If the file is missing or corrupt, returns `null` (fallback to default)

---

## `export:save-last-timestamp`

Renderer tells the main process to update the export timestamp after a successful export.

**Direction**: Renderer → Main

**Payload** (sent by renderer):
```typescript
{ timestamp: string }
```

**Response** (returned by main):
```typescript
{ success: boolean }
```

**Behavior**:
- Main process writes the new timestamp to `settings.json` atomically
- Returns `{ success: true }` on successful write
- Returns `{ success: false }` on write failure (disk full, permissions)
- Timestamp MUST be an ISO 8601 datetime string
- The write uses the same atomic write pattern (temp file + rename) as existing settings saves

---

## `app:request-close`

Renderer notifies main that the user has confirmed close ("Close Anyway").

**Direction**: Renderer → Main

**Payload**: None

**Behavior**:
- Main process calls `app.quit()` or `win.destroy()` (platform-appropriate)
- No response needed (the app is closing)

---

## `app:cancel-close`

Renderer notifies main that the user cancelled close ("Cancel").

**Direction**: Renderer → Main

**Payload**: None

**Behavior**:
- Main process cancels the close sequence
- No response needed (the app stays open)

---

## Preload API Additions

The existing `contextBridge` in `preload.ts` gains these methods:

```typescript
electronAPI.getLastExportTimestamp(): Promise<{ timestamp: string | null }>
electronAPI.saveLastExportTimestamp(timestamp: string): Promise<{ success: boolean }>
electronAPI.requestClose(): void
electronAPI.cancelClose(): void
```

## Sequence: Export-on-Close Flow

```
User clicks X → Renderer intercepts via beforeunload
  → Checks shouldShowWarning (local store)
  → If false: proceed with close (call app:request-close immediately)
  → If true: show ExportOnCloseDialog modal
    → "Export Now": trigger CSV save → on success call save-last-timestamp → app stays open
    → "Close Anyway": call app:request-close → app quits
    → "Cancel": call app:cancel-close → modal dismissed, app stays open
```
