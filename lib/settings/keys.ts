import type { ApiKeys } from '@/lib/types'

const STORAGE_KEY = 'swot_api_keys'

export function saveKeys(keys: Partial<ApiKeys>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}

export function loadKeys(): Partial<ApiKeys> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function clearKeys(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
