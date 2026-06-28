# Feature Specification: UI Polish & Enhancements

**Feature Branch**: `003-ui-polish-enhancements`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "UI polish and three feature enhancements: 1. Design System & Animations (P1) — Extract hardcoded design tokens into a shared styles.ts with proper theming. Add framer-motion for page transitions, staggered list animations, modal enter/exit, button hover/tap effects, and sidebar nav transitions. Replace hand-rolled modals with a portal-based dialog system. Add toast/snackbar notifications. Keep existing inline style approach. No icon library — keep emoji. 2. Drag-and-Drop Import (P2) — On the Transaction page, allow dragging .xlsx and .csv files onto the page or a drop zone. Visual feedback during drag (highlight, overlay). Dropped file enters the existing import workflow. Reuses all existing FR-001–FR-010 import logic unchanged. 3. Search-Driven Chart Report (P2) — A new report type where user enters a title keyword and gets an interactive chart (bar/pie/line) of matching transactions, grouped by category or month. Bridges transaction search (FR-043) with reporting (FR-031–FR-034). New input on the Reports page. 4. Export-on-Close Warning (P3) — If transactions changed since last export, show a confirmation modal on app close with options: 'Export Now', 'Close Anyway', 'Cancel'. Requires new lastExportTimestamp field in ApplicationSettings."

## Clarifications

### Session 2026-06-28

- Q: Should the Search Report keyword also match category names, or only transaction titles and notes? → A: Yes — keyword matches transaction title, notes, AND category name.
- Q: What should the "Export Now" button in the close warning do? → A: Export all transactions as a CSV file immediately (data dump of raw transactions).
- Q: Should the CSV export from the close warning reset the export timestamp? → A: Yes — the CSV backup export updates `lastExportTimestamp`, so the warning resets until the next change.

## User Scenarios & Testing

### User Story 1 - Design System and Smooth Animations (Priority: P1)

A user opens the application and immediately notices the visual polish: pages transition smoothly when navigating between sections, buttons respond with subtle hover and tap effects, modals fade in and slide up, list items stagger into view, and the sidebar navigation has fluid transitions. The overall look feels cohesive with consistent colors, spacing, and typography across all screens. Toast notifications appear briefly to confirm actions like save, delete, or import.

**Why this priority**: Visual polish and consistent design are the foundation for all other UI enhancements in this spec. Without the design system and animation framework in place, the other features lack a consistent home.

**Independent Test**: A user can navigate between all pages (Dashboard, Transactions, Reports, Categories, Settings), trigger a modal (add/edit/delete transaction, import confirm), and see smooth transitions, consistent spacing/typography, and toast notifications — all without jarring jumps or unanimated state changes.

**Acceptance Scenarios**:

1. **Given** the user is on any page, **When** they navigate to another page via the sidebar, **Then** the page transition animates smoothly (fade or slide) within 300ms.
2. **Given** the user triggers a modal (e.g., Add Transaction, Import Confirm, Category Form), **When** the modal opens, **Then** it fades in with a slight upward slide and the background dims; when closed, it fades out.
3. **Given** a list of items is displayed (e.g., transaction list, category grid), **When** the list loads or updates, **Then** items stagger into view with sequential animation.
4. **Given** any interactive element (button, card, sidebar link), **When** the user hovers over it, **Then** a subtle visual feedback (scale, color shift, or shadow) occurs; when clicked/tapped, a brief press effect plays.
5. **Given** the user performs an action (save transaction, delete category, import data), **When** the action completes, **Then** a toast notification appears for 3 seconds and automatically dismisses, confirming success or showing an error.
6. **Given** the application renders any screen, **When** the user inspects colors, spacing, font sizes, and border radii, **Then** all values are consistent with a unified design token system (no hardcoded random values).
7. **Given** the sidebar navigation is visible, **When** the user hovers or selects a nav item, **Then** the highlight/active indicator transitions smoothly.

---

### User Story 2 - Drag-and-Drop Import (Priority: P2)

A user has a CSV file of their latest bank transactions on their desktop. Instead of clicking the "Import" button and navigating the file dialog, they drag the CSV file from their file explorer directly onto the Transaction page. The page highlights with a dashed border overlay, showing a "Drop file here" indicator. They release the file, and the existing import workflow opens automatically with the file pre-loaded in the preview.

**Why this priority**: Drag-and-drop is a natural and efficient interaction for desktop users. It removes friction from the import flow without requiring any new backend logic.

**Independent Test**: A user can drag a valid `.xlsx` or `.csv` file from the file system onto the Transaction page and complete the full import workflow (preview → map → confirm) without ever clicking the Import button.

**Acceptance Scenarios**:

1. **Given** the user is on the Transaction page, **When** they drag a `.xlsx` or `.csv` file over the page, **Then** a visual drop zone overlay appears with a dashed border and "Drop file here" text.
2. **Given** the drop zone overlay is visible, **When** the user drags the file away from the page, **Then** the overlay disappears and the page returns to normal.
3. **Given** the drop zone overlay is visible, **When** the user releases a valid `.xlsx` or `.csv` file, **Then** the existing import workflow opens with the file pre-loaded in the preview step.
4. **Given** the drop zone overlay is visible, **When** the user releases an unsupported file type or multiple files, **Then** an error toast is shown and no import workflow opens.
5. **Given** the import workflow is already open, **When** the user drags another file, **Then** the existing workflow is unaffected (or the drop is ignored).
6. **Given** the user is on a page other than the Transaction page, **When** they drop a file, **Then** nothing happens (no drop zone appears).

---

### User Story 3 - Search-Driven Chart Report (Priority: P2)

A user wants to visualize their spending at restaurants. On the Reports page, they see a new "Search Report" input. They type "restaurant" and pick "Bar Chart" grouped by "Month". A chart renders showing their restaurant spending trend over time. They can switch the chart type to Pie to see which months had the highest proportion, or switch grouping to "Category" to break down restaurant-adjacent spending.

**Why this priority**: This feature bridges the gap between ad-hoc transaction search (which only shows a list) and the reporting engine (which only works with predefined aggregations). It gives users a quick, visual answer to "show me a chart of transactions matching X keyword."

**Independent Test**: A user can enter any keyword on the Reports page, select a chart type and grouping, and see an interactive chart of matching transactions — without creating a custom report.

**Acceptance Scenarios**:

1. **Given** the user is on the Reports page, **When** they see the report list, **Then** a "Search Report" option is available alongside the built-in report types.
2. **Given** the Search Report is selected, **When** the user enters a keyword (e.g., "restaurant") and clicks "Generate", **Then** a chart is rendered showing only transactions whose title, notes, or category name contain the keyword.
3. **Given** a Search Report chart is displayed, **When** the user switches the grouping between "Category" and "Month", **Then** the chart updates to aggregate data by the selected grouping.
4. **Given** a Search Report chart is displayed, **When** the user selects a different chart type (Bar, Pie, Line, Donut, Area), **Then** the visualization changes without reloading data.
5. **Given** the user enters a keyword with no matching transactions, **When** they generate the report, **Then** a clear "No transactions match your search" message is shown instead of an empty chart.
6. **Given** a Search Report is generated, **When** the user changes the keyword and regenerates, **Then** the chart updates to reflect the new search results.

---

### User Story 4 - Export-on-Close Warning (Priority: P3)

A user has been adding transactions and wants to keep a CSV backup. They close the application window. Before the application exits, a modal appears: "You have unsaved data. Your data is saved in the app, but you haven't exported a CSV backup since your last change. Would you like to export before closing?" They can click "Export Now" to download all transactions as a CSV file, "Close Anyway" to exit, or "Cancel" to stay in the app.

**Why this priority**: This is a safety net for users who might forget to export reports they worked on. It prevents data loss scenarios where the user closes the app thinking they exported, but didn't. It is lower priority because it only triggers on close, which is infrequent.

**Independent Test**: A user can make changes to transactions, close the application, see the warning modal, and choose any of the three options (Export Now / Close Anyway / Cancel) — each behaving correctly.

**Acceptance Scenarios**:

1. **Given** the user has modified transactions (added, edited, or deleted) since the last report export, **When** they attempt to close the application, **Then** a modal appears with three options: "Export Now", "Close Anyway", and "Cancel".
2. **Given** the export-on-close modal is displayed, **When** the user clicks "Export Now", **Then** a file save dialog opens to export all transactions as a CSV file immediately (application does not close).
3. **Given** the export-on-close modal is displayed, **When** the user clicks "Close Anyway", **Then** the application closes without exporting.
4. **Given** the export-on-close modal is displayed, **When** the user clicks "Cancel", **Then** the modal closes and the application remains open.
5. **Given** the user has NOT modified any transactions since the last export (or has never exported and has no changes), **When** they close the application, **Then** no modal appears and the application closes normally.
6. **Given** the user exports any report, **When** the export completes, **Then** the "last export" timestamp is updated so the close warning resets.
7. **Given** the dataset is empty (no transactions), **When** the user closes the application, **Then** no export warning modal appears.

---

### Edge Cases

- **Rapid page navigation**: Very fast page switching should not cause animation queue buildup or visual glitches. Animations should be interruptible or skip stale transitions.
- **Reduced motion preference**: If the user's operating system has "Reduce Motion" or "Prefers Reduced Motion" enabled, all animations should be disabled or reduced to fade-only (no sliding, staggering, or scaling).
- **Large drop zone during drag**: The drop zone overlay should not interfere with the file dialog — clicking "Import" button should continue to open the native file dialog normally.
- **Multiple window close attempts**: If the user rapidly clicks close multiple times, the modal should appear only once and additional close attempts should be ignored while the modal is open.
- **Search report with very broad keyword**: A keyword matching hundreds of transactions should render the chart within reasonable time (same performance target as existing reports).
- **Changing export state externally**: If the dataset is modified and then immediately modified back (net zero change), the last-modified timestamp still advances; the warning modal will appear even though data is effectively unchanged — this is acceptable behavior.
- **First-time user with no export history**: On first launch, `lastExportTimestamp` is null. If the user makes no changes, close proceeds normally. If they make changes, the modal appears since no export has ever been done.

## Requirements

### Functional Requirements

#### Design System & Animations

- **FR-001**: System MUST define and use a shared set of design tokens (colors, spacing, typography, border radii, shadows) extracted from all hardcoded values into a single `styles.ts` module.
- **FR-002**: Page transitions (sidebar navigation between Dashboard, Transactions, Reports, Categories, Settings) MUST animate smoothly using framer-motion, completing within 300ms.
- **FR-003**: All modals (transaction form, category form, import confirm, delete confirm) MUST animate enter (fade + slide up) and exit (fade out) using framer-motion's AnimatePresence.
- **FR-004**: System MUST play a subtle hover animation (scale, color shift, or shadow) on all interactive elements (buttons, cards, sidebar links, list rows).
- **FR-005**: List views (transaction list, category grid) MUST animate items into view with a staggered sequential animation on initial load and after filter/sort changes.
- **FR-006**: Toast notifications MUST appear for all success and error actions (save, delete, import, export) with a 3-second auto-dismiss and a manual close button.
- **FR-007**: Toast notifications MUST use framer-motion for enter (slide from top or bottom) and exit animations.
- **FR-008**: The sidebar navigation active indicator and hover states MUST transition smoothly (background color, width, or underline).
- **FR-009**: System MUST respect the operating system's "Reduce Motion" accessibility setting. When enabled, all animations MUST be disabled or reduced to simple fades with no sliding, staggering, or scaling.

#### Drag-and-Drop Import

- **FR-010**: System MUST accept `.xlsx` and `.csv` files dropped onto the Transaction page.
- **FR-011**: When a file is dragged over the Transaction page, a drop zone overlay MUST appear with visual feedback (dashed border, background highlight, "Drop file here" text).
- **FR-012**: When the dragged file leaves the window boundary or is cancelled, the drop zone overlay MUST disappear.
- **FR-013**: When a valid file is dropped, the existing import workflow (preview → column mapping → confirm) MUST open with the file pre-loaded in the preview step. No existing FR-001–FR-010 import logic is modified.
- **FR-014**: When an invalid file type or multiple files are dropped, a toast error MUST be shown and no import workflow opens.
- **FR-015**: The drag-and-drop zone MUST NOT activate on any page other than the Transaction page (Dashboard, Reports, Categories, Settings — ignored).
- **FR-016**: The existing "Import" button and file dialog MUST continue to work as before; drag-and-drop is an additional entry point, not a replacement.

#### Search-Driven Chart Report

- **FR-017**: A new "Search Report" option MUST appear in the list of available reports on the Reports page.
- **FR-018**: The Search Report MUST provide a text input for entering a keyword and a "Generate" button.
- **FR-019**: The Search Report MUST provide a grouping selector with options: "Category" and "Month" (with future extensibility).
- **FR-020**: The Search Report MUST provide a chart type switcher supporting all existing chart types (Line, Bar, Pie, Donut, Area).
- **FR-021**: When generated, the Search Report MUST search all transaction titles, notes, and category names (case-insensitive contains match) and chart the matching transactions aggregated by the selected grouping.
- **FR-022**: When "Category" grouping is selected, the chart MUST show total amount per category for matching transactions.
- **FR-023**: When "Month" grouping is selected, the chart MUST show total amount per month for matching transactions.
- **FR-024**: Changing the chart type or grouping MUST update the chart without re-running the search query.
- **FR-025**: If no transactions match the keyword, a clear "No matching transactions" message MUST be displayed instead of an empty chart.
- **FR-026**: The Search Report MUST respect the existing date range filter on the Reports page (if one is set).

#### Export-on-Close Warning

- **FR-027**: System MUST track the timestamp of the last report export in a new `lastExportTimestamp` field in ApplicationSettings.
- **FR-028**: When the user attempts to close the application (via window close button, Alt+F4, or Cmd+Q), the system MUST compare `lastExportTimestamp` against the dataset's `updatedAt` timestamp.
- **FR-029**: If `updatedAt > lastExportTimestamp` (or `lastExportTimestamp` is null and dataset has transactions), a modal MUST appear with three options: "Export Now", "Close Anyway", and "Cancel".
- **FR-030**: Clicking "Export Now" MUST close the modal, open a file save dialog to export all transactions as a CSV file, and keep the application open after the export completes.
- **FR-031**: Clicking "Close Anyway" MUST close/quit the application immediately regardless of export state.
- **FR-032**: Clicking "Cancel" MUST dismiss the modal and keep the application open at the current page.
- **FR-033**: If the dataset has no transactions, the export warning MUST NOT appear regardless of `lastExportTimestamp` state.
- **FR-034**: After any successful report export (any format: PDF, Excel, CSV) OR a CSV data export from the close warning, the `lastExportTimestamp` MUST be updated to the current time.

### Key Entities

- **DesignToken**: A named constant in `styles.ts` defining a single visual property (color, spacing unit, font size, border radius, shadow). Used consistently across all components to replace hardcoded values.
- **Toast**: A transient notification component that appears at the top or bottom of the screen to confirm actions or show errors. Has a type (success/error/info), a message, and an auto-dismiss timer.
- **Modal/Dialog**: A portal-based overlay component with framer-motion enter/exit animations, backdrop dim, focus trapping, and escape-key-to-close behavior. Replaces all hand-rolled fixed-position overlays.
- **SearchReportConfig**: The configuration for a Search-Driven Chart Report — includes keyword, grouping (category/month), and chart type. Exists only as a local UI state (not persisted).
- **ExportTimestamp**: A new field in ApplicationSettings (`lastExportTimestamp`) — an ISO 8601 datetime string or null. Set on each export, compared against dataset `updatedAt` on close.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user can navigate between all 5 main pages (Dashboard, Transactions, Reports, Categories, Settings) and see smooth page transitions, with all animations completing within 300ms.
- **SC-002**: A user can trigger any modal (add/edit/delete transaction, import confirm, category form) and the enter/exit animation completes smoothly without visual glitches.
- **SC-003**: A user can drag a `.xlsx` or `.csv` file onto the Transaction page and complete the import workflow in the same number of clicks as the button-based import (preview → map → confirm).
- **SC-004**: A user can generate a Search Report by entering a keyword, selecting a grouping and chart type, and see an interactive chart within 2 seconds on a dataset of up to 1,000 transactions.
- **SC-005**: A user can close the application after modifying transactions, see the export warning modal, and decide to export, close, or cancel — all three options work correctly on first try.
- **SC-006**: A user with "Reduce Motion" enabled in their OS settings can use the application with no animations (only simple fades if any) and all functionality remains fully accessible.
- **SC-007**: After a toast notification appears (success/error), it auto-dismisses within 3 seconds and the user can also manually dismiss it at any time.

## Assumptions

- The existing import workflow (FR-001–FR-010), report engine (FR-031–FR-034), and transaction search (FR-043) are already implemented and stable.
- framer-motion is added as a new dependency and does not conflict with existing dependencies.
- The application uses React 19 and the animation library is compatible.
- The "Reduce Motion" OS-level accessibility preference is detectable via a CSS media query (`prefers-reduced-motion`) or a JavaScript API.
- The export-on-close warning respects platform-appropriate quit methods (window close button, Alt+F4 on Windows, Cmd+Q on macOS). The specific implementation of intercepting these events is handled by the Electron main process.
- Dataset `updatedAt` is already tracked in the existing data model (from spec 001).
- The Search Report uses the same chart components and chart types as the existing report system — no new chart types are created.
- Users who have never exported anything are assumed to have "unsaved exports" if they have any transactions (lastExportTimestamp = null).
- The drag-and-drop feature does not require new file parsing logic — it feeds the dropped file path into the existing import parser.
- All visual enhancements (design tokens, animations, modals, toasts) apply globally across all existing pages without requiring page-specific changes beyond component wrapping.
