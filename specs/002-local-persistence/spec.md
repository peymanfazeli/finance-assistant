# Feature Specification: Local Persistence

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Add persistent local storage to the application. The application must automatically save the active dataset after every successful create, edit, delete, import, or settings change. Datasets must be stored as JSON files in the user's operating system application data directory. The application must automatically load the last opened dataset on startup. If no dataset exists, the application must create a default dataset automatically. Application settings (language, dashboard configuration, and future preferences) must persist across restarts. The persistence layer must use Electron's main process with IPC communication. The renderer process must never access the filesystem directly. Saving must be asynchronous, use atomic writes, and never block the UI. The design must support future multiple datasets, backup/restore, and cloud synchronization without major architectural changes."

## Clarifications

### Session 2026-06-27

- Q: Should successive saves be coalesced/debounced or fire immediately? → A: Immediate serialized writes with a concurrency guard. Each mutation triggers an immediate save; concurrent writes are queued and serialized.
- Q: How should save failures be surfaced to users and developers? → A: Log to a file in `{userData}/logs/error.log` plus transient UI toast notifications.

## User Scenarios & Testing

### User Story 1 - Auto-Save After Every Change (Priority: P1)

A user opens the application and adds a new transaction, edits an existing transaction, or deletes an old one. Without clicking any "Save" button, the dataset is automatically persisted to disk. The user experiences no UI freezing or delay — the save happens in the background. Later, the user changes the application language in settings, and the preference is automatically saved.

**Why this priority**: Manual save buttons contradict the Offline First principle. Users expect their data to be safe automatically, especially in a desktop application where crashes or power loss can occur at any time. Auto-save is the core of this feature.

**Independent Test**: A user can add 3 transactions, edit 1 transaction, delete 1 transaction, and change the language — all without clicking any "Save" button — then close and reopen the application and verify all changes are present.

**Acceptance Scenarios**:

1. **Given** the application is open with an active dataset, **When** the user creates a new transaction, **Then** the dataset is automatically saved to disk within 1 second without any user action.
2. **Given** the application is open with an active dataset, **When** the user edits an existing transaction, **Then** the dataset is automatically saved to disk within 1 second.
3. **Given** the application is open with an active dataset, **When** the user deletes a transaction, **Then** the dataset is automatically saved to disk within 1 second.
4. **Given** the application is open with an active dataset, **When** the user imports data, **Then** the dataset is automatically saved to disk within 1 second after the import completes.
5. **Given** the user changes a setting (language, visible dashboard cards), **When** the change is made, **Then** the settings file is automatically saved to disk within 1 second.

---

### User Story 2 - Startup Auto-Load (Priority: P1)

A user closes the application at the end of the day. The next morning, they launch the application again. The previously opened dataset loads automatically, showing the dashboard with up-to-date data. The user can immediately start working without any file selection dialogs.

**Why this priority**: Auto-loading the last dataset is a fundamental usability requirement. Requiring users to manually open their dataset every time contradicts the Local Data Ownership and Offline First principles.

**Independent Test**: A user can close and reopen the application 5 times, and each time the last used dataset loads automatically with all data intact.

**Acceptance Scenarios**:

1. **Given** the user has used the application before and has a dataset, **When** they launch the application, **Then** the last opened dataset loads automatically and the dashboard is displayed.
2. **Given** the last opened dataset file no longer exists (deleted or moved externally), **When** the application launches, **Then** the application gracefully handles the missing file and shows the welcome screen or creates a default dataset.
3. **Given** the last opened dataset file is corrupted, **When** the application attempts to load it, **Then** the application shows an error message and offers to create a new dataset or restore from backup.

---

### User Story 3 - Default Dataset Creation on First Launch (Priority: P1)

A new user installs and launches the application for the first time. No dataset exists on their system. The application automatically creates a default dataset named "My Finances" with USD currency and seeded default categories, saves it to the application data directory, and displays the dashboard. The user can immediately start adding transactions without any setup steps.

**Why this priority**: The Welcome Screen with "Create New Dataset" or "Import Data" choice from the original spec introduces unnecessary friction for first-time users. A seamless first-launch experience aligns with the Offline First and Simplicity First principles.

**Independent Test**: A user launches the application on a clean system (no existing dataset files). The application creates a default dataset, saves it, and shows the dashboard with zero transactions but all default categories available.

**Acceptance Scenarios**:

1. **Given** the application is launched for the first time with no dataset files in the application data directory, **When** the application initializes, **Then** a default dataset named "My Finances" with currency USD and all default categories is created automatically.
2. **Given** a default dataset was just created, **When** the dashboard is displayed, **Then** the transaction list is empty with an empty state and an "Add Transaction" button.
3. **Given** a default dataset was just created, **When** the user navigates to categories, **Then** all default categories are present (Food & Drinks, Transportation, Internet, Shopping, Education, Software & Subscriptions, Bills, Investment, Other).

---

### User Story 4 - Settings Persistence Across Restarts (Priority: P1)

A user sets the application language to Persian and hides the "Average Daily Spending" card on the dashboard. They close the application. The next day, they reopen it and find the language is still Persian and the "Average Daily Spending" card is still hidden. All preferences are preserved exactly as configured.

**Why this priority**: Settings persistence is a basic expectation for any desktop application. Losing preferences on restart makes the application unusable for bilingual users and frustrates dashboard customization.

**Independent Test**: A user can change any combination of settings (language + visible dashboard cards), close the application, reopen it, and verify all settings are restored exactly as configured.

**Acceptance Scenarios**:

1. **Given** the user changes the language from English to Persian, **When** they close and reopen the application, **Then** the interface is displayed in Persian.
2. **Given** the user hides 3 summary cards from the dashboard, **When** they close and reopen the application, **Then** those 3 cards remain hidden.
3. **Given** the user has configured settings, **When** the settings file is corrupted on load, **Then** the application falls back to default settings without crashing, overwrites the corrupted file with defaults, and logs the corruption to `{userData}/logs/error.log`.

### Edge Cases

- What happens when the user makes multiple rapid changes (e.g., adds 5 transactions in quick succession)? Saves fire immediately after each mutation. A concurrency guard queues writes that arrive while a previous save is still in progress, ensuring serialized execution. Each mutation produces its own write — redundant writes are accepted in favor of simplicity and never losing state.
- What happens if a save is triggered while a previous save is still in progress? The second save is queued behind the first; writes are serialized via a concurrency guard to prevent file corruption.
- What happens when the user closes the application while a save is pending? The application waits for the pending save to complete (with a timeout) before closing, ensuring no data loss.
- What happens if the disk is full during a save? The atomic write fails before replacing the original file, leaving the original intact; the application shows an error notification and logs the failure to `{userData}/logs/error.log`.
- What happens if the application data directory is deleted externally while the application is running? The next save operation recreates the directory automatically before writing.
- How does the system handle multiple instances of the application writing to the same dataset? This is not supported — only one instance should run at a time. No cross-instance locking is provided in this version.

## Requirements

### Functional Requirements

#### Auto-Save

- **FR-001**: The system MUST automatically persist the active dataset to disk after every successful transaction create operation.
- **FR-002**: The system MUST automatically persist the active dataset to disk after every successful transaction edit operation.
- **FR-003**: The system MUST automatically persist the active dataset to disk after every successful transaction delete operation.
- **FR-004**: The system MUST automatically persist the active dataset to disk after every successful data import operation.
- **FR-005**: The system MUST automatically persist application settings to disk after every settings change (language, visible dashboard cards, and any future preference).
- **FR-006**: Auto-save MUST be asynchronous and non-blocking — the user interface MUST remain responsive during save operations.
- **FR-007**: Auto-save MUST use an atomic write strategy: write to a temporary file first, then replace the original file on success. A crash during the write MUST leave the original file intact.

#### Storage Location

- **FR-008**: Datasets MUST be stored as JSON files in the operating system's application data directory.
- **FR-009**: Application settings MUST be stored as a separate JSON file (`settings.json`) in the same application data directory as datasets.
- **FR-010**: The default dataset file name MUST follow a consistent naming convention (e.g., `default.fina` or a name derived from the application data directory).
- **FR-011**: The system MUST provide an IPC channel for the renderer to retrieve the application data directory path when needed (e.g., for display in a settings UI).

#### Startup Behavior

- **FR-012**: On application startup, the system MUST read the settings file to determine the last opened dataset path.
- **FR-013**: If a last opened dataset path exists and the file is accessible, the system MUST load that dataset automatically.
- **FR-014**: If the last opened dataset path exists but the file is missing or corrupted, the system MUST handle the error gracefully: log the error, show a user-friendly message, and either create a default dataset or offer options (create new, import, or restore from backup).
- **FR-015**: If no last opened dataset path exists (first launch), the system MUST automatically create a default dataset with a sensible name, default currency (USD), seeded default categories, and save it to the application data directory.
- **FR-016**: The default dataset MUST be created in the main process via IPC — the renderer MUST NOT create files directly.

#### IPC Communication

- **FR-017**: All filesystem operations MUST be performed in the Electron main process.
- **FR-018**: The renderer process MUST communicate with the main process exclusively through IPC channels (via `contextBridge`/`preload`).
- **FR-019**: The secure communication bridge MUST expose a settings API alongside the existing dataset API, with methods for saving and loading settings.
- **FR-020**: The main process MUST register IPC handlers for reading and writing settings, and for resolving the default dataset path.

#### Extensibility

- **FR-021**: The persistence layer MUST be designed to support multiple datasets in the future without major architectural changes. This means datasets are identified by filename, and the settings file stores the last opened path (a list of recent paths is already available).
- **FR-022**: The atomic write mechanism MUST be reusable for backup/restore operations — a backup is a file copy, a restore is a file copy in reverse.
- **FR-023**: The IPC handler registration MUST be modular, allowing future sync providers (cloud sync) to be added as additional handlers without modifying existing save/load logic.

### Key Entities

- **Dataset File**: A JSON file (`*.fina` or `*.json`) stored in the OS application data directory. Contains the full dataset schema (version, name, currency, timestamps, transactions, categories). Written atomically (temp file + rename).
- **Settings File**: A JSON file (`settings.json`) stored in the OS application data directory. Contains `language`, `visibleDashboardCards`, `lastOpenedDataset`, `recentDatasets`, and any future preferences. Written atomically.
- **Application Data Directory**: The OS-specific directory returned by Electron's `app.getPath('userData')`. On Windows: `%APPDATA%/finance-assistant`. On macOS: `~/Library/Application Support/finance-assistant`. On Linux: `~/.config/finance-assistant`. This directory is the single source of truth for all persisted data.
- **Persistence Service (Main Process)**: A main-process module that owns all filesystem operations: saving datasets with atomic writes, loading datasets, saving/loading settings, determining default paths, and cleaning up temp files on startup.

## Success Criteria

### Measurable Outcomes

- **SC-001**: After creating, editing, or deleting a transaction, the dataset file on disk is updated within 1 second (measured from user action completion to file write confirmation).
- **SC-002**: After changing any application setting, the settings file on disk is updated within 1 second.
- **SC-003**: On cold application startup, the last opened dataset is loaded and the dashboard is displayed within 3 seconds on standard consumer hardware.
- **SC-004**: On first-ever launch (no existing data files), a default dataset is created and the dashboard is displayed within 3 seconds without requiring any user interaction.
- **SC-005**: A simulated application crash during a save operation (process killed mid-write) leaves the original dataset file intact and the application recovers gracefully on next launch.
- **SC-006**: The user interface remains fully responsive (no freeze, no input lag) during any save operation, verified by the ability to interact with the UI during a save-triggering operation.
- **SC-007**: A user can close the application, manually delete the dataset file, reopen the application, and the application handles the missing file gracefully (shows error or creates default) rather than crashing.
- **SC-008**: A developer can add a new setting key to the settings schema and have it persist across restarts without modifying any IPC handlers or main-process code (only updating the schema type and store).

## Assumptions

- The application has exactly one active dataset open at a time (multi-dataset is a future concern).
- The default currency for auto-created datasets is USD. Users who prefer another currency can create a new dataset with their preferred currency.
- Users who already have datasets from the previous version (manual save flow) will have those datasets migrated automatically on first launch — their last opened path will be loaded from settings.
- The application data directory is writable by the application. If it is not (permissions issue), the application shows an error and falls back gracefully.
- The `settings.json` file is small (less than 10 KB) and can be read/written in a single operation.
- Dataset files up to 10 MB (approximately 10,000 transactions) are expected.
- The atomic write pattern (write to `.tmp` then rename) works reliably on all supported operating systems (Windows, macOS, Linux). On Windows, `renameSync` atomically replaces an existing file.
- Temp file cleanup on startup handles orphaned `.tmp` files from previously interrupted saves.
