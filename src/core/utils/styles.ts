const token = (name: string): string => `var(--pfa-${name})`

export const colors = {
  primary: token('primary'),
  primaryHover: token('primary-hover'),
  primaryStrong: token('primary-strong'),
  primarySoft: token('primary-soft'),
  success: token('success'),
  danger: token('danger'),
  warning: token('warning'),
  info: token('info'),

  bg: {
    page: token('bg-page'),
    surface: token('bg-surface'),
    card: token('bg-card'),
    elevated: token('bg-elevated'),
    subtle: token('bg-subtle'),
    input: token('bg-input'),
    muted: token('bg-muted'),
    hover: token('bg-hover'),
    active: token('bg-active'),
    overlay: token('bg-overlay'),
    income: token('bg-income'),
    expense: token('bg-expense'),
    refund: token('bg-refund'),
    investment: token('bg-investment'),
    warning: token('bg-warning'),
  },

  text: {
    primary: token('text-primary'),
    secondary: token('text-secondary'),
    muted: token('text-muted'),
    subtle: token('text-subtle'),
    disabled: token('text-disabled'),
    placeholder: token('text-placeholder'),
    inverse: token('text-inverse'),
    error: token('text-error'),
    income: token('text-income'),
    expense: token('text-expense'),
    refund: token('text-refund'),
    investment: token('text-investment'),
    warning: token('text-warning'),
  },

  border: {
    default: token('border'),
    subtle: token('border-subtle'),
    light: token('border-subtle'),
    input: token('border-input'),
    divider: token('border-divider'),
    strong: token('border-strong'),
  },

  chart: [
    token('chart-1'),
    token('chart-2'),
    token('chart-3'),
    token('chart-4'),
    token('chart-5'),
    token('chart-6'),
    token('chart-7'),
    token('chart-8'),
    token('chart-9'),
    token('chart-10'),
  ],

  categoryPicker: [
    token('chart-1'),
    token('chart-2'),
    token('chart-3'),
    token('chart-4'),
    token('chart-5'),
    token('chart-6'),
    token('chart-7'),
    token('chart-8'),
    token('chart-9'),
    token('chart-10'),
    token('chart-6'),
    token('chart-2'),
  ],

  summaryCards: {
    totalIncome: token('text-income'),
    totalExpenses: token('text-expense'),
    netBalance: token('text-investment'),
    transactionCount: token('primary'),
    avgSpending: token('text-secondary'),
  },
}

export const gradients = {
  accent: token('gradient-accent'),
  surface: token('gradient-surface'),
}

export const glow = {
  focus: token('glow'),
}

export const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
  huge: '48px',
  massive: '64px',
}

export const padding = {
  page: '24px',
  pageCompact: '16px',
  card: '20px',
  cardCompact: '16px',
  dialog: '24px',
  dialogLg: '32px',
  input: '8px 10px',
  inputLg: '10px 12px',
  button: '8px 16px',
  buttonLg: '10px 24px',
  buttonXl: '12px 28px',
  buttonHero: '14px 32px',
  tableCell: '10px 12px',
  tableCellSm: '6px 10px',
  badge: '2px 8px',
  chip: '4px 10px',
}

export const borderRadius = {
  sm: '8px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  xxl: '22px',
  full: '999px',
}

export const fontSize = {
  xs: '11px',
  sm: '12px',
  md: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  xxl: '20px',
  xxxl: '22px',
  display: '28px',
  metric: '24px',
  hero: '36px',
  icon: '48px',
}

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

export const shadow = {
  card: token('shadow-card'),
  elevated: token('shadow-elevated'),
  dropdown: token('shadow-dropdown'),
  modal: token('shadow-modal'),
  welcome: token('shadow-welcome'),
  hero: token('shadow-hero'),
}

export const borderWidth = {
  default: '1px',
  thick: '2px',
}

export const zIndex = {
  dropdown: 10,
  sticky: 20,
  modal: 1000,
}

export const sizes = {
  navHeight: '56px',
  sidebarWidth: '232px',
  sidebarCompactWidth: '72px',
  pageMaxWidth: '1440px',
  searchWidth: '220px',
  quickAddWidth: '120px',
  dropdownMinWidth: '160px',
  dialogWidth: '400px',
  dialogMd: '480px',
  dialogLg: '640px',
  dialogWide: '860px',
  formMaxWidth: '480px',
  settingsMaxWidth: '760px',
  chartHeight: '320px',
  installmentListHeight: '260px',
}

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
}
