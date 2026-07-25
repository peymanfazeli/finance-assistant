const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
}

const CURRENCY_CONFIG: Record<string, { decimals: number }> = {
  USD: { decimals: 2 },
  EUR: { decimals: 2 },
  GBP: { decimals: 2 },
  toman: { decimals: 0 },
  CAD: { decimals: 2 },
  AUD: { decimals: 2 },
  JPY: { decimals: 0 }
}

export function formatCurrency(amount: number, currency: string, locale = 'en-US'): string {
  const isToman = currency === 'toman'
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG['USD']

  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  }).format(amount)

  if (isToman) {
    return `${formatted} تومان`
  }

  const symbol = CURRENCY_SYMBOLS[currency]
  if (symbol) {
    return amount < 0
      ? `-${symbol}${formatted.replace(/^-/, '')}`
      : `${symbol}${formatted}`
  }

  return `${formatted} ${currency}`
}

export function formatCompactNumber(amount: number, locale = 'en-US'): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
  }
  if (abs >= 1_000_000) {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
  }
  if (abs >= 10_000) {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
  }
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateStr: string, locale = 'en-US'): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatPersianDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function toPersianDigits(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)])
}
