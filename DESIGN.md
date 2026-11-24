# Finance Assistant Design System

This document is the visual contract for the application. It converts the supplied premium dark dashboard direction into concrete rules that can be reused across pages, components, charts, dialogs, and overlays. The system supports complete Dark and Light modes without changing business logic.

## 1. Design principles

1. Premium, not decorative. Use surface contrast, spacing, typography, and restrained color to create hierarchy.
2. Dense but readable. Financial data must remain scannable at the default 1200 by 800 desktop window.
3. One token system. Components consume semantic tokens from `src/core/utils/styles.ts`. Theme values live in one CSS variable layer.
4. Bento where useful. Use varied card spans on overview and analytics pages. Keep dense tables as tables.
5. Bilingual and bidirectional. Every visual rule must work in LTR English and RTL Persian.
6. Quiet motion. Animate only state changes that need feedback. Respect reduced motion.
7. Native first. Keep the existing React inline style convention, Framer Motion, Recharts, and i18next setup. No new UI framework or icon library.

## 2. Theme architecture

### 2.1 Source of truth

- `ApplicationSettings.theme` stores the explicit selection: `dark` or `light`.
- `SettingsService` persists the value in `{userData}/settings.json` with the existing settings conventions.
- `src/renderer/theme.css` defines the semantic CSS variables for both themes.
- `src/core/utils/styles.ts` exports those variables as the token objects already imported by the renderer.
- `useAppStore.setTheme()` updates settings, persists them, and applies `data-theme` to the document root.
- A synchronous preload bridge reads the saved theme before the first React render so the correct palette is applied immediately.

There is no second theme system. Components never read `data-theme` directly. They consume tokens.

### 2.2 Token mapping

Every color token is a CSS variable reference such as `var(--pfa-bg-page)`. When `data-theme` changes, all inline styles, SVG chart fills, dialogs, tooltips, and overlays update together.

| Token group | Dark variable prefix | Light variable prefix |
|---|---|---|
| Surfaces | `--pfa-bg-*` | `--pfa-bg-*` |
| Text | `--pfa-text-*` | `--pfa-text-*` |
| Borders | `--pfa-border*` | `--pfa-border*` |
| Accent | `--pfa-primary*` | `--pfa-primary*` |
| Status | `--pfa-success*`, `--pfa-danger*`, `--pfa-warning*`, `--pfa-info*` | same |
| Effects | `--pfa-shadow-*`, `--pfa-overlay`, `--pfa-glow` | same |

### 2.3 Startup behavior

1. `index.html` declares dark as the safe default on the document root.
2. The preload API returns the saved theme synchronously.
3. An inline startup script sets `data-theme` before the stylesheet paints.
4. React restores language and direction, then renders the shell.
5. Changing theme in the shell writes settings immediately.

### 2.4 Theme toggle

A compact toggle is permanently visible in the application sidebar. It exposes both states with an accessible label and uses tokens for its track, thumb, border, and focus ring. The same behavior is available from Settings for discoverability.

## 3. Color system

### 3.1 Dark palette

| Token | Value | Purpose |
|---|---|---|
| Background | `#080809` | Main application background |
| Surface | `#111113` | Primary card background |
| Surface Elevated | `#18181B` | Dialogs, popovers, hovered panels |
| Surface Subtle | `#202024` | Nested panels, table stripes, input fills |
| Border | `#29292F` | Default card and control border |
| Border Strong | `#3A3A42` | Emphasized boundaries and focus borders |
| Text Primary | `#F5F5F7` | Main content and financial amounts |
| Text Secondary | `#A1A1AA` | Supporting information |
| Text Muted | `#71717A` | Labels, captions, disabled text |
| Primary | `#8B5CF6` | Main violet accent |
| Primary Hover | `#A78BFA` | Hover and highlighted states |
| Primary Strong | `#7C3AED` | Strong emphasis and pressed state |
| Primary Soft | `rgba(139,92,246,0.14)` | Selected backgrounds and subtle glow |
| Success | `#A3E635` | Positive financial state |
| Success Soft | `rgba(163,230,53,0.12)` | Positive badges |
| Danger | `#F04424` | Negative or overdue financial state |
| Danger Soft | `rgba(240,68,36,0.12)` | Negative badges |
| Warning | `#F59E0B` | Warnings and pending state |
| Warning Soft | `rgba(245,158,11,0.12)` | Pending badges |
| Info | `#60A5FA` | Informational state |

### 3.2 Light palette

| Token | Value | Purpose |
|---|---|---|
| Background | `#F6F5F9` | Soft off-white application background |
| Surface | `#FFFFFF` | Cards and main panels |
| Surface Elevated | `#FFFFFF` | Dialogs with stronger elevation |
| Surface Subtle | `#F1EFF6` | Nested panels and hovered rows |
| Border | `#E4E1EA` | Default card and control border |
| Border Strong | `#CFC9DA` | Emphasized boundaries |
| Text Primary | `#1B1624` | Main content and financial amounts |
| Text Secondary | `#5D5669` | Supporting information |
| Text Muted | `#858094` | Labels, captions, disabled text |
| Primary | `#7C3AED` | Same violet identity, tuned for light |
| Primary Hover | `#6D28D9` | Hover and highlighted states |
| Primary Strong | `#5B21B6` | Strong emphasis and pressed state |
| Primary Soft | `rgba(124,58,237,0.10)` | Selected backgrounds |
| Success | `#3F8F16` | Accessible positive state |
| Success Soft | `rgba(63,143,22,0.10)` | Positive badges |
| Danger | `#D93A1E` | Accessible negative state |
| Danger Soft | `rgba(217,58,30,0.10)` | Negative badges |
| Warning | `#B45309` | Accessible warning state |
| Warning Soft | `rgba(180,83,9,0.10)` | Pending badges |
| Info | `#2563EB` | Informational state |

### 3.3 Color rules

- Violet is reserved for identity, selection, links, primary actions, and active navigation.
- Status colors carry meaning. Never use success or danger color only for decoration.
- Category colors come from the dataset and remain data. The shared palette only supplies defaults and chart fallbacks.
- Never hardcode hex values in renderer components. Add or reuse a token instead.
- Text on colored backgrounds must use the matching inverse token, never a literal white or black.

## 4. Typography

### 4.1 Font stack

Use the platform UI stack already available in Chromium, with Persian fallbacks:

`Inter, "Segoe UI", Tahoma, Arial, sans-serif, "Noto Sans Persian"`

Do not download fonts. Do not add a font dependency.

### 4.2 Scale

| Level | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| Caption | 11px | 500 | 1.4 | Metadata, row counters |
| Small | 12px | 500 | 1.45 | Labels, table headers |
| Body compact | 13px | 400 | 1.5 | Dense table cells |
| Body | 14px | 400 | 1.5 | Forms, descriptions |
| Subtitle | 16px | 600 | 1.4 | Card titles, section headings |
| Page title | 20px | 600 | 1.3 | Page headings |
| Metric | 24px | 650 | 1.2 | Bento financial figures |
| Display | 30px | 700 | 1.15 | Hero balances |

Tabular numbers use `font-variant-numeric: tabular-nums` where available. Financial amounts are right aligned in LTR tables and left aligned in RTL tables through the existing table direction.

### 4.3 Localization

- Preserve i18next for all new visible strings.
- Preserve Jalali dates and Persian digits in Persian.
- Do not convert financial values to new formats. Reuse `formatCurrency`.
- Direction sensitive padding and borders use logical CSS properties where possible.

## 5. Layout and spacing

### 5.1 Application shell

- Sidebar width: 232px expanded, 72px at narrow widths.
- Top of sidebar: brand mark and application title.
- Middle: grouped navigation items with active state.
- Bottom: theme toggle and close dataset action.
- Main surface: remaining width, its own scroll container.
- Page content max width: 1440px, centered.
- Default page padding: 24px. Compact pages use 16px.

### 5.2 Spacing scale

Use the existing tokens: 4, 8, 12, 16, 20, 24, 32, 48, 64 px.

- Card padding: 20px.
- Compact card padding: 16px.
- Grid gap: 16px.
- Section gap: 24px.
- Table cell padding: 10px 12px.
- Dialog padding: 24px.

### 5.3 Breakpoints

Electron windows are treated as responsive containers:

- Above 1180px: 12 column bento grid, sidebar visible.
- 860px to 1180px: 8 column bento grid, sidebar visible.
- 700px to 860px: 4 column grid, compact sidebar.
- Below 700px: single column, horizontal navigation scrolling.

### 5.4 Scroll behavior

- The shell owns vertical page scrolling.
- Cards never force the page to grow beyond a reasonable dashboard height.
- Long installment lists scroll inside their card with a sticky header.
- Dialogs have a fixed header, scrollable body, and fixed footer.
- Scroll containers use `overscroll-behavior: contain`.

## 6. Bento card system

### 6.1 Base card

A bento card uses the shared `BentoCard` component.

- Background: `colors.bg.card`.
- Border: 1px `colors.border.default`.
- Radius: 18px.
- Padding: 16px or 20px.
- Shadow: subtle `shadow.card`, no layered shadows.
- Hover: border moves toward `colors.border.strong`. No scale animation.
- Interior surfaces use `colors.bg.subtle`.

### 6.2 Variants

| Variant | Purpose |
|---|---|
| `metric` | Financial summary with label, value, and optional delta or badge |
| `chart` | Recharts visualization with header and legend |
| `table` | Compact data table inside a card |
| `list` | Short scrollable list with sticky header |
| `empty` | Empty or loading state with icon and call to action |
| `actions` | Compact group of controls or quick actions |

### 6.3 Spans

Cards accept `span` values from 1 to 12 in the 12 column grid. Common patterns:

- Metric: 3 columns on wide screens, 6 on medium, 12 on narrow.
- Chart: 8 columns with a 4 column side panel.
- List: 6 columns paired with a summary card.
- Table: full width.

### 6.4 Content rules

- Every card has a short title. Descriptions are optional.
- Card actions appear in the header and never wrap into the metric value.
- Loading state keeps the card height stable.
- Empty state explains why there is no data and offers an action when one exists.

## 7. Component rules

### 7.1 Buttons

| Variant | Appearance |
|---|---|
| Primary | Violet background, inverse text, subtle glow on hover |
| Secondary | Subtle surface, strong border, primary text |
| Ghost | Transparent, muted text, subtle surface on hover |
| Danger | Danger soft background, danger text, danger border |
| Icon | Square, 34px minimum hit area, clear focus ring |

States: hover raises contrast, active lowers it, disabled reduces opacity and removes pointer feedback, focus uses a 2px primary ring with offset.

### 7.2 Inputs and selects

- Background: `colors.bg.input`.
- Border: `colors.border.input`.
- Radius: 10px.
- Height: compact 34px, regular 40px.
- Placeholder: `colors.text.muted`.
- Focus: primary border plus soft glow.
- Invalid: danger border and helper text.
- Persian calendar controls inherit the same visual treatment.

### 7.3 Search and filters

Search fields use a leading icon slot, transparent or subtle background, and the same focus ring as inputs. Filter chips are compact pill controls. Selected chips use primary soft background and primary text.

### 7.4 Tabs and segmented controls

Use a subtle container with a selected segment in surface elevated plus primary text. Do not use underlines on dark surfaces because they compete with table borders.

### 7.5 Dropdowns and popovers

- Surface elevated background.
- Strong border.
- 14px radius.
- Dropdown shadow token.
- Keyboard focus visible.
- Portal or high z-index layer so nested scroll containers do not clip them.

### 7.6 Dialogs and modals

- Overlay: `colors.bg.overlay`, subtle blur when supported.
- Dialog width: 400px default, 640px wide, 860px for detail dialogs.
- Maximum height: 90vh.
- Header: fixed, 20px padding, title and close button.
- Body: scrollable, 24px padding.
- Footer: fixed, right aligned in LTR and left aligned in RTL.
- Destructive actions use danger styling and explicit labels.

### 7.7 Tables

- Header text: small, muted, semibold.
- Row separators: border subtle only.
- No full grid borders.
- Numeric columns use tabular numbers and align by locale.
- Hovered row uses surface subtle.
- Status badges are compact and semantic.
- Sticky headers use surface card so scrolling does not blend text.

### 7.8 Charts

- Use the shared chart palette tokens.
- Grid lines use border subtle at low opacity.
- Axis labels use text muted.
- Tooltips use surface elevated and strong border.
- Pie and donut strokes use surface card.
- No heavy gradients inside data marks.
- Respect reduced motion by disabling entrance animation where supported.

### 7.9 Navigation

- Active item: primary soft background, primary text, 2px accent indicator on the inline start edge.
- Inactive item: muted text, transparent background.
- Hover: surface subtle.
- Icons and labels keep consistent spacing in both directions.

### 7.10 Empty states, notifications, and loading

- Empty state: short title, one supporting line, optional action.
- Toast: surface elevated, semantic border on the inline start edge, 3 second duration, maximum 5 items.
- Loading: stable dimensions, shimmer only when the wait exceeds one frame.
- Error: danger text with a clear recovery action.

## 8. Payables page contract

### 8.1 Page structure

1. Page header with title, one line description, date filter, and Add Payable action.
2. Financial overview bento with six metrics derived only from existing data:
   - Total payable amount.
   - Remaining unpaid amount.
   - Amount due this Jalali month.
   - Overdue payable amount.
   - Active payable count.
   - Pending installment count.
3. Main bento grid:
   - Payables list card, full width or 8 columns.
   - Installment overview card, 4 columns on wide screens.
   - Overdue and upcoming installment card when data exists.
4. Payable detail modal.

No invented metrics are allowed. All values come from `PayableService` and `PayableInstallmentService`.

### 8.2 Payables list

Keep the table. Improve it with:

- Clear remaining amount emphasis.
- Semantic status badges instead of saturated full-row colors.
- Recipient, due date, and payment progress visible.
- Contextual edit and delete actions.
- Compact empty state.

### 8.3 Installment overview

- Summary values stay pinned above the list.
- The installment list scrolls independently with a sticky header.
- Long schedules never expand the dashboard indefinitely.
- Paid, pending, and overdue states keep the same semantics as elsewhere.
- Existing calculations, editing, and paid toggles remain unchanged.

### 8.4 Add Payable modal

- Fixed visible header.
- Scrollable form body.
- Fixed visible footer with Cancel and Save.
- Installment schedule editor keeps its own scroll area.
- Works at 900 by 600 and larger window sizes.
- Validation feedback uses tokens and remains inside the dialog.

## 9. Other pages

Apply the same tokens, typography, spacing, borders, radius, buttons, forms, dialogs, navigation, and theme behavior everywhere.

| Page | Layout direction |
|---|---|
| Dashboard | Hero bento, metric grid, chart panel, quick action |
| Transactions | Toolbar plus dense table, filters in a collapsible panel |
| Receivables | Summary bento plus table, detail modal |
| Categories | Responsive card grid |
| Budget | Allocation summary, chart, slider table |
| Reports | Report rail, chart panel, data table |
| Custom Reports | Form panel, chart panel, table |
| Settings | Sectioned cards for language, theme, wallets, mapping, about |
| Welcome | Centered premium panel with two primary actions |

## 10. Motion

- Page transitions: 160ms fade with small vertical offset.
- Card hover: border and background only.
- Button press: subtle scale, disabled when reduced motion is active.
- Dialog: 180ms fade and small translate.
- Toast: 180ms slide and fade.
- No infinite animations except explicit loading indicators.

## 11. Accessibility and interaction

- Minimum text contrast follows WCAG AA in both themes.
- Focus is always visible.
- Icon only controls have aria labels.
- Modals expose `role="dialog"` and `aria-modal`.
- Tables use semantic headers.
- Color is never the only status signal.
- Disabled controls do not advertise hover feedback.

## 12. Implementation boundaries

- Preserve Electron main process architecture and IPC conventions.
- Preserve Zustand store structure and autoloading behavior.
- Preserve all calculations and data structures.
- Preserve offline-first local storage.
- Preserve i18next and Jalali utilities.
- Do not modify generated output under `out/`.
- Do not add a component library, CSS framework, icon library, or chart library.
- Do not use the em dash character in any generated content.
