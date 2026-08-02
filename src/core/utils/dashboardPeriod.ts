import {
  JalaliDate,
  getTodayJalali,
  jalaliToGregorianDateStrFromParts,
  jalaaliMonthLength
} from './jalali'

export type DashboardPeriodKey =
  | 'all'
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom'

export interface DashboardPeriod {
  preset: DashboardPeriodKey
  customFrom?: string
  customTo?: string
}

export interface ResolvedPeriod {
  from?: string
  to?: string
}

export const DASHBOARD_PERIOD_KEYS: DashboardPeriodKey[] = [
  'all',
  'today',
  'thisWeek',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  'custom'
]

const QUARTER_START_MONTHS: Record<number, number> = { 1: 1, 2: 4, 3: 7, 4: 10 }

function startOfWeek(today: JalaliDate): JalaliDate {
  const iso = jalaliToGregorianDateStrFromParts(today.jy, today.jm, today.jd)
  const day = (new Date(iso).getDay() + 1) % 7
  const jd = today.jd - day
  if (jd >= 1) return { ...today, jd }
  const prev = today.jm > 1 ? { jy: today.jy, jm: today.jm - 1 } : { jy: today.jy - 1, jm: 12 }
  return { jy: prev.jy, jm: prev.jm, jd: jalaaliMonthLength(prev.jy, prev.jm) + jd }
}

function startOfMonth(jy: number, jm: number): JalaliDate {
  return { jy, jm, jd: 1 }
}

function startOfQuarter(today: JalaliDate): JalaliDate {
  const quarter = Math.ceil(today.jm / 3)
  return { jy: today.jy, jm: QUARTER_START_MONTHS[quarter], jd: 1 }
}

function startOfYear(today: JalaliDate): JalaliDate {
  return { jy: today.jy, jm: 1, jd: 1 }
}

function prevMonthBounds(today: JalaliDate): { from: JalaliDate; to: JalaliDate } {
  if (today.jm > 1) {
    const jm = today.jm - 1
    return { from: { jy: today.jy, jm, jd: 1 }, to: { jy: today.jy, jm, jd: jalaaliMonthLength(today.jy, jm) } }
  }
  return { from: { jy: today.jy - 1, jm: 12, jd: 1 }, to: { jy: today.jy - 1, jm: 12, jd: jalaaliMonthLength(today.jy - 1, 12) } }
}

export function resolveDashboardPeriod(period: DashboardPeriod, today?: JalaliDate): ResolvedPeriod {
  const now = today ?? getTodayJalali()

  switch (period.preset) {
    case 'all':
      return {}
    case 'today':
      return {
        from: jalaliToGregorianDateStrFromParts(now.jy, now.jm, now.jd),
        to: jalaliToGregorianDateStrFromParts(now.jy, now.jm, now.jd)
      }
    case 'thisWeek': {
      const from = startOfWeek(now)
      return {
        from: jalaliToGregorianDateStrFromParts(from.jy, from.jm, from.jd),
        to: jalaliToGregorianDateStrFromParts(now.jy, now.jm, now.jd)
      }
    }
    case 'thisMonth': {
      const from = startOfMonth(now.jy, now.jm)
      return {
        from: jalaliToGregorianDateStrFromParts(from.jy, from.jm, from.jd),
        to: jalaliToGregorianDateStrFromParts(now.jy, now.jm, now.jd)
      }
    }
    case 'lastMonth': {
      const { from, to } = prevMonthBounds(now)
      return {
        from: jalaliToGregorianDateStrFromParts(from.jy, from.jm, from.jd),
        to: jalaliToGregorianDateStrFromParts(to.jy, to.jm, to.jd)
      }
    }
    case 'thisQuarter': {
      const from = startOfQuarter(now)
      return {
        from: jalaliToGregorianDateStrFromParts(from.jy, from.jm, from.jd),
        to: jalaliToGregorianDateStrFromParts(now.jy, now.jm, now.jd)
      }
    }
    case 'thisYear': {
      const from = startOfYear(now)
      return {
        from: jalaliToGregorianDateStrFromParts(from.jy, from.jm, from.jd),
        to: jalaliToGregorianDateStrFromParts(now.jy, now.jm, now.jd)
      }
    }
    case 'custom':
      return {
        from: period.customFrom,
        to: period.customTo
      }
  }
}

export function isValidCustomRange(period: DashboardPeriod): boolean {
  if (!period.customFrom || !period.customTo) return false
  return period.customFrom <= period.customTo
}
