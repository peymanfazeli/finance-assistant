import { describe, it, expect } from 'vitest'
import {
  gregorianToJalali,
  jalaliToGregorian,
  gregorianDateToJalali,
  jalaliToGregorianDateStr,
  toPersianDigits,
  formatJalaliDate,
  formatJalaliDateEn,
  getJalaliMonthName,
  getJalaliDayNames,
  getTodayJalali,
  getDaysInJalaliMonth,
  JalaliDate
} from '../../src/core/utils/jalali'

describe('gregorianToJalali', () => {
  it('converts 2026-03-21 to 1 Farvardin 1405', () => {
    const result = gregorianToJalali(2026, 3, 21)
    expect(result).toEqual({ jy: 1405, jm: 1, jd: 1 })
  })

  it('converts 2024-03-20 to 1 Farvardin 1403', () => {
    const result = gregorianToJalali(2024, 3, 20)
    expect(result).toEqual({ jy: 1403, jm: 1, jd: 1 })
  })

  it('converts 2026-06-15 correctly', () => {
    const result = gregorianToJalali(2026, 6, 15)
    expect(result.jy).toBe(1405)
    expect(result.jm).toBeGreaterThanOrEqual(3)
    expect(result.jm).toBeLessThanOrEqual(4)
    expect(result.jd).toBeGreaterThanOrEqual(1)
    expect(result.jd).toBeLessThanOrEqual(31)
  })

  it('converts 2025-01-01 correctly', () => {
    const result = gregorianToJalali(2025, 1, 1)
    expect(result.jy).toBe(1403)
    expect(result.jm).toBe(10)
    expect(result.jd).toBe(12)
  })

  it('converts 2000-01-01 correctly', () => {
    const result = gregorianToJalali(2000, 1, 1)
    expect(result.jy).toBe(1378)
    expect(result.jm).toBe(10)
    expect(result.jd).toBe(11)
  })

  it('throws for invalid day', () => {
    expect(() => gregorianToJalali(2026, 2, 30)).toThrow()
  })
})

describe('jalaliToGregorian', () => {
  it('converts 1 Farvardin 1405 to 2026-03-21', () => {
    const result = jalaliToGregorian(1405, 1, 1)
    expect(result).toEqual({ gy: 2026, gm: 3, gd: 21 })
  })

  it('converts 1 Farvardin 1403 to 2024-03-20', () => {
    const result = jalaliToGregorian(1403, 1, 1)
    expect(result).toEqual({ gy: 2024, gm: 3, gd: 20 })
  })

  it('converts 11 Dey 1403 to 2024-12-31', () => {
    const result = jalaliToGregorian(1403, 10, 11)
    expect(result).toEqual({ gy: 2024, gm: 12, gd: 31 })
  })

  it('throws for invalid month', () => {
    expect(() => jalaliToGregorian(1405, 13, 1)).toThrow()
  })

  it('throws for invalid day in month', () => {
    expect(() => jalaliToGregorian(1405, 1, 32)).toThrow()
  })
})

describe('roundtrip: gregorian -> jalali -> gregorian', () => {
  const testDates = [
    [2026, 3, 21],
    [2026, 6, 15],
    [2025, 1, 1],
    [2000, 1, 1],
    [2024, 12, 31],
    [2026, 1, 1],
    [2026, 12, 31],
    [1990, 6, 15],
    [2024, 2, 29],
    [2024, 3, 19],
    [2023, 3, 21],
  ]

  for (const [gy, gm, gd] of testDates) {
    it(`roundtrips ${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`, () => {
      const jalali = gregorianToJalali(gy, gm, gd)
      const back = jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd)
      expect(back.gy).toBe(gy)
      expect(back.gm).toBe(gm)
      expect(back.gd).toBe(gd)
    })
  }
})

describe('roundtrip: jalali -> gregorian -> jalali', () => {
  const testDates: [number, number, number][] = [
    [1405, 1, 1],
    [1405, 6, 15],
    [1403, 12, 29],
    [1403, 1, 1],
    [1400, 1, 1],
    [1395, 6, 31],
    [1378, 10, 11],
  ]

  for (const [jy, jm, jd] of testDates) {
    it(`roundtrips ${jy}/${jm}/${jd}`, () => {
      const gregorian = jalaliToGregorian(jy, jm, jd)
      const back = gregorianToJalali(gregorian.gy, gregorian.gm, gregorian.gd)
      expect(back.jy).toBe(jy)
      expect(back.jm).toBe(jm)
      expect(back.jd).toBe(jd)
    })
  }
})

describe('gregorianDateToJalali', () => {
  it('parses YYYY-MM-DD string', () => {
    const result = gregorianDateToJalali('2026-03-21')
    expect(result).toEqual({ jy: 1405, jm: 1, jd: 1 })
  })

  it('throws for invalid format', () => {
    expect(() => gregorianDateToJalali('2026/03/21')).toThrow()
  })
})

describe('jalaliToGregorianDateStr', () => {
  it('returns YYYY-MM-DD string', () => {
    const result = jalaliToGregorianDateStr({ jy: 1405, jm: 1, jd: 1 })
    expect(result).toBe('2026-03-21')
  })

  it('pads single digits', () => {
    const result = jalaliToGregorianDateStr({ jy: 1403, jm: 10, jd: 11 })
    expect(result).toBe('2024-12-31')
  })
})

describe('toPersianDigits', () => {
  it('converts number to Persian digits', () => {
    expect(toPersianDigits(123)).toBe('۱۲۳')
  })

  it('converts string to Persian digits', () => {
    expect(toPersianDigits('456')).toBe('۴۵۶')
  })

  it('handles zero', () => {
    expect(toPersianDigits(0)).toBe('۰')
  })
})

describe('formatJalaliDate', () => {
  it('formats with Persian digits by default', () => {
    const result = formatJalaliDate('2026-03-21')
    expect(result).toContain('۱۴۰۵')
    expect(result).toContain('فروردین')
    expect(result).toContain('۱')
  })

  it('formats with ASCII digits when specified', () => {
    const result = formatJalaliDate('2026-03-21', false)
    expect(result).toContain('1405')
    expect(result).toContain('فروردین')
    expect(result).toContain('1')
  })
})

describe('formatJalaliDateEn', () => {
  it('formats with English month names', () => {
    const result = formatJalaliDateEn('2026-03-21')
    expect(result).toBe('1 Farvardin 1405')
  })
})

describe('getJalaliMonthName', () => {
  it('returns Persian name for fa', () => {
    expect(getJalaliMonthName(1, 'fa')).toBe('فروردین')
    expect(getJalaliMonthName(12, 'fa')).toBe('اسفند')
  })

  it('returns English name for en', () => {
    expect(getJalaliMonthName(1, 'en')).toBe('Farvardin')
    expect(getJalaliMonthName(12, 'en')).toBe('Esfand')
  })
})

describe('getJalaliDayNames', () => {
  it('returns 7 Persian day names for fa', () => {
    const names = getJalaliDayNames('fa')
    expect(names).toHaveLength(7)
    expect(names[0]).toBe('شنبه')
    expect(names[6]).toBe('جمعه')
  })

  it('returns 7 English day names for en', () => {
    const names = getJalaliDayNames('en')
    expect(names).toHaveLength(7)
    expect(names[0]).toBe('Sat')
    expect(names[6]).toBe('Fri')
  })
})

describe('getDaysInJalaliMonth', () => {
  it('returns 31 for first 6 months', () => {
    for (let m = 1; m <= 6; m++) {
      expect(getDaysInJalaliMonth(1405, m)).toBe(31)
    }
  })

  it('returns 30 for months 7-11', () => {
    for (let m = 7; m <= 11; m++) {
      expect(getDaysInJalaliMonth(1405, m)).toBe(30)
    }
  })

  it('returns 29 for Esfand in non-leap year', () => {
    expect(getDaysInJalaliMonth(1405, 12)).toBe(29)
  })

  it('returns 30 for Esfand in leap year', () => {
    expect(getDaysInJalaliMonth(1403, 12)).toBe(30)
  })
})

describe('getTodayJalali', () => {
  it('returns a valid JalaliDate', () => {
    const today = getTodayJalali()
    expect(today.jy).toBeGreaterThanOrEqual(1300)
    expect(today.jy).toBeLessThanOrEqual(1500)
    expect(today.jm).toBeGreaterThanOrEqual(1)
    expect(today.jm).toBeLessThanOrEqual(12)
    expect(today.jd).toBeGreaterThanOrEqual(1)
    expect(today.jd).toBeLessThanOrEqual(31)
  })
})

describe('leap year detection', () => {
  it('1403 is a leap year (remainder 1)', () => {
    expect(getDaysInJalaliMonth(1403, 12)).toBe(30)
  })

  it('1405 is not a leap year (remainder 3)', () => {
    expect(getDaysInJalaliMonth(1405, 12)).toBe(29)
  })

  it('1404 is not a leap year (remainder 1)', () => {
    expect(getDaysInJalaliMonth(1404, 12)).toBe(29)
  })
})
