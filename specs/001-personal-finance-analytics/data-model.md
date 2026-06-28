# Data Model: Personal Finance Analytics

**Date**: 2026-06-27
**Spec**: [spec.md](./spec.md)

## Entities

### Transaction

A single financial record. The fundamental unit of data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier (v4) |
| `date` | ISO 8601 date | Yes | Transaction date |
| `title` | string (1–200 chars) | Yes | Short description |
| `categoryId` | UUID | Yes | Reference to a Category |
| `type` | enum | Yes | `income` \| `expense` \| `refund` |
| `amount` | number (positive) | Yes | Monetary value in dataset currency |
| `notes` | string (0–2000 chars) | No | Free-text notes |
| `createdAt` | ISO 8601 datetime | Yes | When transaction was added |
| `updatedAt` | ISO 8601 datetime | Yes | Last modification timestamp |

**Validation rules**:
- Amount must be > 0
- For `refund` type, the original transaction may be referenced (optional)
- `date` must not be in the far future (allow up to today)
- Duplicate detection key: `(date + title + type + amount)`  — use for import preview flagging

**Indexes**: `date DESC`, `categoryId`, `type`, `(title, notes)` full-text

---

### Category

A classification label for grouping transactions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `name` | string (1–50 chars) | Yes | Display name |
| `color` | hex color string | Yes | e.g., `#FF6B6B` |
| `icon` | string | Yes | Icon identifier (e.g., Material icon name) |
| `isDefault` | boolean | Yes | `true` for system-provided categories |
| `createdAt` | ISO 8601 datetime | Yes | When created |

**Default categories** (seeded on first launch):
`Food & Drinks`, `Transportation`, `Internet`, `Shopping`, `Education`, `Software & Subscriptions`, `Bills`, `Investment`, `Other`

**Validation rules**:
- Name must be unique (case-insensitive)
- Default categories cannot be deleted; custom categories can
- Deleting a custom category → prompt user to reassign transactions to another category

---

### Dataset

A self-contained file representing all user data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | Yes | Schema version (starts at 1) |
| `name` | string | Yes | User-given name for the dataset |
| `currency` | ISO 4217 code | Yes | e.g., `USD`, `EUR`, `IRR` |
| `createdAt` | ISO 8601 datetime | Yes | When dataset was created |
| `updatedAt` | ISO 8601 datetime | Yes | Last save timestamp |
| `transactions` | Transaction[] | Yes | All transactions (may be empty) |
| `categories` | Category[] | Yes | All categories (seeded with defaults) |

**File format**: Single JSON file with `.fina` extension (or `.json`).
**Atomic save**: Write to `dataset.fina.tmp` → rename to `dataset.fina`.

---

### Application Settings

User preferences persisted across sessions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `language` | enum | Yes | `en` \| `fa` |
| `visibleDashboardCards` | string[] | Yes | List of visible card IDs |
| `lastOpenedDataset` | string (path) | No | Path to last opened file |
| `recentDatasets` | string[] | No | List of recently opened file paths |

**Storage**: Persisted in Electron `app.getPath('userData')` as `settings.json`.

## Relationships

```
Dataset 1 ──── * Transaction
Dataset 1 ──── * Category
Category 1 ──── * Transaction
```

- A Dataset owns its transactions and categories
- Each Transaction belongs to exactly one Category
- Deleting a Category reassigns its transactions to a replacement category

## State Transitions

### Transaction lifecycle

```
[User creates] → active → [User edits] → active
                         → [User deletes] → removed
```

Transactions are hard-deleted (no soft delete for v1).

### Dataset lifecycle

```
[User creates] → saved
[User imports] → saved (appended)
[User saves]  → saved (atomic write)
[User opens]  → loaded into memory
[User backs up] → copied to backup path
[User restores] → replaced from backup path
```
