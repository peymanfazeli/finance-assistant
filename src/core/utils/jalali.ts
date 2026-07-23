export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

const JALALI_MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

const JALALI_MONTHS_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'
]

const JALALI_DAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
const JALALI_DAYS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]

function div(a: number, b: number): number {
  return ~~(a / b)
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b
}

interface JalCalCore {
  gy: number
  march: number
  jump: number
  n: number
}

function jalCalCore(jy: number): JalCalCore {
  const gy = jy + 621
  let leapJ = -14
  let jp: number = BREAKS[0]
  let jm = 0
  let jump = 0

  for (let i = 1; i < BREAKS.length; i += 1) {
    jm = BREAKS[i] as number
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  const n = jy - jp

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150

  const march = 20 + leapJ - leapG

  return { gy, march, jump, n }
}

function leapFromCycle(jump: number, n: number): number {
  let adjusted = n
  if (jump - n < 6) {
    adjusted = n - jump + div(jump + 4, 33) * 33
  }
  let leap = mod(mod(adjusted + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return leap
}

function jalCalLeap(jy: number): number {
  let jp: number = BREAKS[0]
  let jm = 0
  let jump = 0
  for (let i = 1; i < BREAKS.length; i += 1) {
    jm = BREAKS[i] as number
    jump = jm - jp
    if (jy < jm) break
    jp = jm
  }
  return leapFromCycle(jump, jy - jp)
}

function jalCalShort(jy: number): { gy: number; march: number } {
  const { gy, march } = jalCalCore(jy)
  return { gy, march }
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const { gy, march, jump, n } = jalCalCore(jy)
  return { leap: leapFromCycle(jump, n), gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCalShort(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)

  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  if (gm < 1 || gm > 12) throw new Error(`Invalid Gregorian month: ${gm}`)
  const daysInMonth = [31, gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (gd < 1 || gd > daysInMonth[gm - 1]) throw new Error(`Invalid Gregorian day: ${gd} for month ${gm}`)
  return d2j(g2d(gy, gm, gd))
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  if (jm < 1 || jm > 12) throw new Error(`Invalid Jalali month: ${jm}`)
  if (jd < 1 || jd > jalaaliMonthLength(jy, jm)) throw new Error(`Invalid Jalali day: ${jd} for ${jy}/${jm}`)
  return d2g(j2d(jy, jm, jd))
}

export function isLeapJalaaliYear(jy: number): boolean {
  return jalCalLeap(jy) === 0
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isLeapJalaaliYear(jy) ? 30 : 29
}

export function gregorianDateToJalali(dateStr: string): JalaliDate {
  const parts = dateStr.split('-')
  if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}`)
  const gy = parseInt(parts[0], 10)
  const gm = parseInt(parts[1], 10)
  const gd = parseInt(parts[2], 10)
  return gregorianToJalali(gy, gm, gd)
}

export function jalaliToGregorianDateStr(jalali: JalaliDate): string {
  const { gy, gm, gd } = jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd)
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
}

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

export function formatJalaliDate(dateStr: string, usePersianDigits = true): string {
  const jalali = gregorianDateToJalali(dateStr)
  const jd = usePersianDigits ? toPersianDigits(jalali.jd) : jalali.jd.toString()
  const jy = usePersianDigits ? toPersianDigits(jalali.jy) : jalali.jy.toString()
  return `${jd} ${JALALI_MONTHS_FA[jalali.jm - 1]} ${jy}`
}

export function formatJalaliDateEn(dateStr: string): string {
  const jalali = gregorianDateToJalali(dateStr)
  return `${jalali.jd} ${JALALI_MONTHS_EN[jalali.jm - 1]} ${jalali.jy}`
}

export function getJalaliMonthName(jm: number, lang: 'fa' | 'en' = 'fa'): string {
  return lang === 'fa' ? JALALI_MONTHS_FA[jm - 1] : JALALI_MONTHS_EN[jm - 1]
}

export function getJalaliDayNames(lang: 'fa' | 'en' = 'fa'): string[] {
  return lang === 'fa' ? JALALI_DAYS_FA : JALALI_DAYS_EN
}

export function getTodayJalali(): JalaliDate {
  const now = new Date()
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function getDaysInJalaliMonth(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm)
}

export function jalaliToGregorianDateStrFromParts(jy: number, jm: number, jd: number): string {
  return jalaliToGregorianDateStr({ jy, jm, jd })
}
