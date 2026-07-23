import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  gregorianDateToJalali,
  jalaliToGregorianDateStrFromParts,
  getTodayJalali,
  getDaysInJalaliMonth,
  getJalaliMonthName,
  getJalaliDayNames,
  toPersianDigits,
  formatJalaliDate,
  JalaliDate
} from '../../core/utils/jalali'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth, shadow } from '../../core/utils/styles'

interface PersianCalendarProps {
  value: string
  onChange: (dateStr: string) => void
  placeholder?: string
  compact?: boolean
}

function getFirstDayOfMonthJalali(jy: number, jm: number): number {
  const gregorian = (() => {
    const jy2 = jy
    const jm2 = jm
    const jd2 = 1
    return jalaliToGregorianDateStrFromParts(jy2, jm2, jd2)
  })()
  const parts = gregorian.split('-')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  let day = d.getDay()
  day = (day + 1) % 7
  return day
}

function PersianCalendar({ value, onChange, placeholder, compact = false }: PersianCalendarProps): JSX.Element {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'fa' ? 'fa' : 'en'
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = getTodayJalali()

  let initialJalali: JalaliDate
  try {
    initialJalali = value ? gregorianDateToJalali(value) : today
  } catch {
    initialJalali = today
  }

  const [viewYear, setViewYear] = useState(initialJalali.jy)
  const [viewMonth, setViewMonth] = useState(initialJalali.jm)

  useEffect(() => {
    if (value) {
      try {
        const j = gregorianDateToJalali(value)
        setViewYear(j.jy)
        setViewMonth(j.jm)
      } catch {
        // keep current view
      }
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleDayClick = useCallback((day: number): void => {
    const dateStr = jalaliToGregorianDateStrFromParts(viewYear, viewMonth, day)
    onChange(dateStr)
    setOpen(false)
  }, [viewYear, viewMonth, onChange])

  const prevMonth = (): void => {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = (): void => {
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = (): void => {
    setViewYear(today.jy)
    setViewMonth(today.jm)
    const dateStr = jalaliToGregorianDateStrFromParts(today.jy, today.jm, today.jd)
    onChange(dateStr)
    setOpen(false)
  }

  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth)
  const firstDayOffset = getFirstDayOfMonthJalali(viewYear, viewMonth)
  const dayNames = getJalaliDayNames(lang)
  const monthName = getJalaliMonthName(viewMonth, lang)

  let selectedJalali: JalaliDate | null = null
  if (value) {
    try {
      selectedJalali = gregorianDateToJalali(value)
    } catch {
      selectedJalali = null
    }
  }

  const displayText = value ? formatJalaliDate(value, lang === 'fa') : (placeholder || '')

  const calendarGrid: (number | null)[] = []
  for (let i = 0; i < firstDayOffset; i++) {
    calendarGrid.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarGrid.push(d)
  }
  while (calendarGrid.length % 7 !== 0) {
    calendarGrid.push(null)
  }

  const weekRows: (number | null)[][] = []
  for (let i = 0; i < calendarGrid.length; i += 7) {
    weekRows.push(calendarGrid.slice(i, i + 7))
  }

  const jyDisplay = lang === 'fa' ? toPersianDigits(viewYear) : viewYear.toString()
  const jmDisplay = lang === 'fa' ? toPersianDigits(viewMonth) : viewMonth.toString()

  return (
    <div ref={containerRef} style={{ position: 'relative', width: compact ? '100%' : '150px' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          ...styles.input,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          backgroundColor: open ? colors.bg.active : colors.bg.input,
        }}
      >
        {displayText || <span style={{ color: colors.text.placeholder }}>{placeholder || 'yyyy/mm/dd'}</span>}
        <span style={styles.calendarIcon}>📅</span>
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <button type="button" onClick={prevMonth} style={styles.navBtn}>◀</button>
            <div style={styles.headerCenter}>
              <span style={styles.monthYear}>
                {monthName} {jyDisplay}
              </span>
              <button type="button" onClick={goToToday} style={styles.todayBtn}>
                {lang === 'fa' ? 'امروز' : 'Today'}
              </button>
            </div>
            <button type="button" onClick={nextMonth} style={styles.navBtn}>▶</button>
          </div>

          <div style={styles.dayNamesRow}>
            {dayNames.map((name) => (
              <div key={name} style={styles.dayNameCell}>{name}</div>
            ))}
          </div>

          <div style={styles.grid}>
            {weekRows.map((week, wi) => (
              <div key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  if (day === null) {
                    return <div key={di} style={styles.emptyCell} />
                  }

                  const isSelected = selectedJalali !== null &&
                    selectedJalali.jy === viewYear &&
                    selectedJalali.jm === viewMonth &&
                    selectedJalali.jd === day

                  const isToday = today.jy === viewYear &&
                    today.jm === viewMonth &&
                    today.jd === day

                  const displayDay = lang === 'fa' ? toPersianDigits(day) : day.toString()

                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      style={{
                        ...styles.dayBtn,
                        ...(isSelected ? styles.dayBtnSelected : {}),
                        ...(isToday && !isSelected ? styles.dayBtnToday : {}),
                      }}
                    >
                      {displayDay}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  input: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    fontSize: fontSize.base,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    cursor: 'pointer',
    boxSizing: 'border-box',
    lineHeight: '1.4',
  },
  calendarIcon: {
    fontSize: '14px',
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.lg,
    boxShadow: shadow.dropdown,
    zIndex: 50,
    padding: spacing.md,
    minWidth: '280px',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: spacing.xs,
    color: colors.text.secondary,
    borderRadius: borderRadius.sm,
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYear: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  todayBtn: {
    fontSize: fontSize.xs,
    color: colors.primary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: borderRadius.sm,
  },
  dayNamesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: spacing.xs,
  },
  dayNameCell: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    padding: '4px 0',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  emptyCell: {
    width: '100%',
    aspectRatio: '1',
  },
  dayBtn: {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    transition: 'background-color 0.1s',
  },
  dayBtnSelected: {
    backgroundColor: colors.primary,
    color: colors.text.inverse,
    fontWeight: fontWeight.semibold,
  },
  dayBtnToday: {
    border: `${borderWidth.thick} solid ${colors.primary}`,
    fontWeight: fontWeight.semibold,
  },
}

export default PersianCalendar
