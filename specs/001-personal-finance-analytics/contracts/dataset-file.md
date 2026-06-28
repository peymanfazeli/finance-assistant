# Dataset File Contract

**Date**: 2026-06-27
**Format**: JSON
**Extension**: `.fina` (recommended) or `.json`
**Version**: 1

## Schema

```json
{
  "version": 1,
  "name": "My Finances 2026",
  "currency": "USD",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T15:30:00.000Z",
  "categories": [
    {
      "id": "a1b2c3d4-...",
      "name": "Food & Drinks",
      "color": "#FF6B6B",
      "icon": "restaurant",
      "isDefault": true
    }
  ],
  "transactions": [
    {
      "id": "e5f6g7h8-...",
      "date": "2026-06-27",
      "title": "Weekly groceries",
      "categoryId": "a1b2c3d4-...",
      "type": "expense",
      "amount": 85.50,
      "notes": "Costco run",
      "createdAt": "2026-06-27T14:00:00.000Z",
      "updatedAt": "2026-06-27T14:00:00.000Z"
    }
  ]
}
```

## Guarantees

1. **Atomic writes**: File is written to `.tmp` then renamed. Partial file is never exposed.
2. **Backward compatibility**: Extra fields in root are ignored (future-proof).
3. **Self-contained**: No external references. A `.fina` file is fully portable.
4. **Encoding**: UTF-8 without BOM.

## File Operations

| Operation | Contract |
|-----------|----------|
| Read | Parse JSON. Validate schema version. Fail with descriptive error on malformed input. |
| Write | Atomic temp-file strategy. Write entire in-memory state. |
| Backup | Copy file to user-chosen path. |
| Restore | Copy backup file to dataset directory. |

## Error Handling

- Corrupt JSON → show error with file path, don't crash
- Version mismatch → show migration prompt (future versions)
- Missing required fields → auto-fill with defaults for backward compat
