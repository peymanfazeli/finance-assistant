# Quickstart: UI Polish & Enhancements

**Date**: 2026-06-28
**Plan**: [plan.md](./plan.md)

## Prerequisites

- Application is already running with a dataset containing at least 5 transactions across multiple categories and months
- All existing features (import, transactions, reports, categories, settings) are working

## Validation Scenarios

### 1. Design System Consistency

1. Open the application
2. Inspect any page — note that colors, spacing, typography, and border radii appear consistent across all pages
3. Open the browser DevTools and inspect a button element — verify it uses a token class/property rather than a hardcoded value
4. Navigate between all 5 pages (Dashboard, Transactions, Reports, Categories, Settings) using the sidebar — each transition should animate smoothly (fade or slide) within 300ms

**Expected**: Visual consistency across all pages. Smooth animated page transitions.

---

### 2. Animation Effects

1. Hover over any button, card, or sidebar link — subtle visual feedback (scale, shadow, or color shift) should play
2. Click a button — brief press effect should play
3. Open any modal (e.g., Add Transaction, Category Form) — it should fade in with an upward slide
4. Close the modal — it should fade out
5. Look at the transaction list or category grid — items should stagger into view with sequential animation
6. Perform a save action — a toast notification should appear in the bottom-right corner and auto-dismiss after 3 seconds

**Expected**: All animations smooth and not jarring. Modals use AnimatePresence. Toasts appear and dismiss correctly.

---

### 3. Reduced Motion

1. Enable "Reduce Motion" in your operating system's accessibility settings
2. Relaunch the application
3. Navigate between all pages — transitions should be instant (no sliding/staggering/scaling)
4. Open and close modals — simple fade only, no slide
5. Hover over buttons — no scale/shadow animation

**Expected**: All animations reduced or disabled. Functionality unaffected.

---

### 4. Drag-and-Drop Import

1. Navigate to the Transaction page
2. Drag a valid `.xlsx` or `.csv` file from your file explorer onto the page
3. A dashed-border drop zone overlay with "Drop file here" text should appear
4. Release the file — the existing import workflow opens with the file pre-loaded in preview
5. Complete the import normally (preview → map → confirm)
6. Drag an invalid file type (e.g., `.txt`, `.pdf`) — an error toast appears, no import opens
7. Verify the "Import" button still works as before

**Expected**: Drag-and-drop triggers import workflow. Invalid files rejected with toast. Button import still works.

---

### 5. Search-Driven Chart Report

1. Navigate to the Reports page
2. A "Search Report" option should appear alongside the built-in reports
3. Enter a keyword found in transaction titles, notes, or category names (e.g., "food" to match "Food & Drinks" category)
4. Select "Bar Chart" and grouping "Month"
5. Click Generate — a bar chart appears showing totals by month for matching transactions
6. Switch grouping to "Category" — the chart updates without re-running the search
7. Switch chart type to "Pie" — the visualization changes
8. Enter a keyword with no matches — "No transactions match your search" message appears
9. Apply a date range filter — the search respects the filter

**Expected**: Charts render with correct data. Grouping and chart type switching works. Empty state handled.

---

### 6. Export-on-Close Warning

1. Make a change to a transaction (add, edit, or delete)
2. Close the application (click X button or Alt+F4 / Cmd+Q)
3. A modal should appear: "You have unsaved data... Would you like to export before closing?"
4. Click "Cancel" — modal closes, app stays open
5. Click the close button again — modal appears again
6. Click "Export Now" — file save dialog opens to export all transactions as CSV
7. Save the CSV — app stays open
8. Click close again — **no** warning appears (timestamp updated)
9. Make another change and close again — modal appears
10. Click "Close Anyway" — application closes immediately

**Expected**: Warning appears when changes exist since last export. All three buttons work correctly. Export resets the warning.

---

## Verification Checklist

| Scenario | Pass Criteria | Result |
|----------|--------------|--------|
| Design tokens consistent | Colors/spacing/typography match across all pages | [ ] |
| Page transitions | Smooth animation between all 5 pages | [ ] |
| Modal animations | Fade + slide enter/exit on all modals | [ ] |
| Hover/tap effects | Subtle feedback on all interactive elements | [ ] |
| Staggered list | Items animate in sequentially | [ ] |
| Toast notifications | Appear on action, auto-dismiss in 3s | [ ] |
| Reduced motion | No animations when OS setting enabled | [ ] |
| Drag-and-drop import | File drop works, follows existing import flow | [ ] |
| Search report | Chart renders with keyword/category/date filters | [ ] |
| Export warning modal | Appears on close when changes exist | [ ] |
| Export Now → CSV | File save dialog, resets timestamp | [ ] |
| Close Anyway | App quits | [ ] |
| Cancel | App stays open | [ ] |
