# Research: UI Polish & Enhancements

**Date**: 2026-06-28
**Plan**: [plan.md](./plan.md)

## Design Decisions

### Decision: Toast notification position — bottom-right

- **Decision**: Toast notifications appear stacked in the bottom-right corner of the application window.
- **Rationale**: Bottom-right is the industry standard for desktop toast notifications (Slack, VS Code, GitHub Desktop). It does not obscure the top navigation bar or page titles, and it is easily noticed without being intrusive.
- **Alternatives considered**: Top-right (competes with window controls), top-center (obscures page title), bottom-center (less conventional).

### Decision: Drag-and-drop implementation — HTML5 Drag and Drop API

- **Decision**: Use the native HTML5 Drag and Drop API with React event handlers (`onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`).
- **Rationale**: Electron's Chromium renderer fully supports the HTML5 DnD API. No additional library is needed. The native file dialog (for clicking Import) remains unchanged. The DnD API provides all necessary events for the drop zone overlay visual feedback.
- **Alternatives considered**: react-dnd library (unnecessary dependency for a simple file drop), Electron's `webContents` file drop events (too low-level).

### Decision: Close event interception — Electron `before-quit` + `window.close` override

- **Decision**: Intercept the window close button via a custom title bar close handler in the renderer (or via Electron's `win.on('close')` event in the main process) that shows the export warning modal before allowing the app to close.
- **Rationale**: Electron's `before-quit` event fires for all close methods (window button, Alt+F4, Cmd+Q). However, showing a modal from the main process requires IPC coordination. A simpler approach is to override the close action in the renderer via `window.addEventListener('beforeunload')` combined with a custom Electron IPC `close-app` channel that the main process listens to after the user confirms.
- **Alternatives considered**: Purely main-process `win.on('close')` with `event.preventDefault()` (works but requires IPC round-trip to show renderer modal).

### Decision: Design token naming convention — semantic tokens with color palette

- **Decision**: Tokens follow a semantic naming pattern: `colorPrimary`, `colorBackground`, `spacingSm`, `spacingMd`, `spacingLg`, `fontSizeBody`, `fontSizeHeading`, `radiusSm`, `radiusMd`, `shadowCard`, etc.
- **Rationale**: Semantic names describe the token's purpose rather than its value (e.g., `colorPrimary` instead of `colorBlue`). This makes it easy to change themes later and keeps the code readable.
- **Alternatives considered**: Atomic/utility tokens (too verbose), value-based tokens (breaks on theming).

### Decision: Search report caching — no client-side cache

- **Decision**: Each search report generation re-queries the transaction list from the Zustand store. No caching layer.
- **Rationale**: The dataset is entirely in memory (Zustand store). Re-filtering is O(n) and instant for up to 10,000 transactions. FR-024 states that changing chart type or grouping updates without re-running the search — the search results (matched transaction IDs) are held in component state, not a separate cache.
- **Alternatives considered**: Redux-style selectors with memoization (overkill for this scale), IndexedDB query layer (adds complexity).

### Decision: Export-on-close timestamp comparison

- **Decision**: Compare `lastExportTimestamp` (from ApplicationSettings) against the dataset's `updatedAt` timestamp. If `dataset.updatedAt > lastExportTimestamp` and the dataset has at least one transaction, show the warning.
- **Rationale**: Simple and reliable. No need to track per-transaction export status. The `updatedAt` timestamp is already maintained by the dataset persistence layer (from spec 002).
- **Details**: On first launch, `lastExportTimestamp` is `null`. If the dataset has any transactions, the warning appears. After an export (CSV, PDF, Excel), the timestamp is updated.

### Decision: Modal portal — ReactDOM.createPortal

- **Decision**: Use `ReactDOM.createPortal` to render modals and toast containers outside the component tree, directly into a dedicated DOM node (`<div id="modal-root">` and `<div id="toast-root">`).
- **Rationale**: Portals avoid z-index and overflow clipping issues. They are the standard React pattern for overlays, dialogs, and toasts.
- **Alternatives considered**: CSS `position: fixed` with high z-index (current approach — causes issues with nested scroll containers), custom portal library (unnecessary).

### Decision: RTL support for animations

- **Decision**: Slide animations must respect the layout direction. In RTL mode, "slide from left" becomes "slide from right" and vice versa. framer-motion supports this via the `dir` attribute and dynamic `x` values based on the i18n direction.
- **Rationale**: RTL is a constitutional requirement (Principle 6). Directional animations must mirror properly.
- **Alternatives considered**: Disable all directional animations in RTL mode (reduces visual quality), use only fade animations globally (less engaging).

## Technology Choices

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| framer-motion | ^12.x | UI animations | Most popular React animation library. Compatible with React 19. Supports AnimatePresence, layout animations, gesture animations, and reduced-motion detection. |
| ReactDOM.createPortal | Built-in | Modal/toast rendering | Standard React API for teleporting content. No extra dependency. |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| framer-motion conflicts with React 19 | Medium | Verify compatibility before adding. React 19 is stable and framer-motion 12.x supports it. |
| Drag-and-drop in Electron behaves differently on macOS vs Windows | Low | HTML5 DnD API is consistent across Chromium on all platforms. Test on all 3 OS. |
| Close event interception fails for some quit methods | Medium | Test all quit methods: X button, Alt+F4, Cmd+Q, taskbar context menu "Close", `process.exit()`. Electron's `before-quit` covers most cases. |
| Animation performance on low-end hardware | Medium | Use GPU-accelerated CSS properties (transform, opacity) only. framer-motion defaults to these. Reduced-motion fallback for accessibility. |
| Toast notifications stack overflow | Low | Limit visible toasts to 5. Queue additional toasts, showing them as earlier ones dismiss. |
