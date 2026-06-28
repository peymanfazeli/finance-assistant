import { ApplicationSettings, Language } from '../models/types'

const SETTINGS_VERSION = 1

const defaultSettings: ApplicationSettings = {
  language: Language.En,
  visibleDashboardCards: [
    'totalIncome',
    'totalExpenses',
    'netBalance',
    'transactionCount',
    'avgDailySpending',
    'avgWeeklySpending'
  ],
  lastOpenedDataset: null,
  recentDatasets: []
}

export class SettingsService {
  static createDefault(): ApplicationSettings {
    return { ...defaultSettings }
  }

  static serialize(settings: ApplicationSettings): string {
    return JSON.stringify({ ...settings, settingsVersion: SETTINGS_VERSION }, null, 2)
  }

  static deserialize(content: string): ApplicationSettings {
    const data = JSON.parse(content)

    if (data.settingsVersion == null) {
      throw new Error('Invalid settings file: missing settingsVersion field')
    }

    const validated: ApplicationSettings = {
      language: Object.values(Language).includes(data.language) ? data.language : Language.En,
      visibleDashboardCards: Array.isArray(data.visibleDashboardCards) ? data.visibleDashboardCards : defaultSettings.visibleDashboardCards,
      lastOpenedDataset: typeof data.lastOpenedDataset === 'string' ? data.lastOpenedDataset : null,
      recentDatasets: Array.isArray(data.recentDatasets) ? data.recentDatasets : []
    }

    return validated
  }

  static validate(settings: unknown): settings is ApplicationSettings {
    if (!settings || typeof settings !== 'object') return false
    const s = settings as Record<string, unknown>
    return (
      Object.values(Language).includes(s.language as Language) &&
      Array.isArray(s.visibleDashboardCards) &&
      (s.lastOpenedDataset === null || typeof s.lastOpenedDataset === 'string') &&
      Array.isArray(s.recentDatasets)
    )
  }
}
