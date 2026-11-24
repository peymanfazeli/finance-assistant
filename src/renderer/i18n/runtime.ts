import { Language } from '../../core/models/types'
import i18n from './index'

export function applyLanguage(language: Language): void {
  void i18n.changeLanguage(language)
  document.documentElement.lang = language
  document.documentElement.dir = language === Language.Fa ? 'rtl' : 'ltr'
}
