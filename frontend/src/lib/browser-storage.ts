export function readBrowserArray<T>(
  key: string,
  fallback: T[],
  isValid: (value: unknown) => value is T,
): T[] {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback

    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValid)
      ? parsed
      : fallback
  } catch {
    return fallback
  }
}

export function readBrowserValue<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback

    const parsed: unknown = JSON.parse(stored)
    return isValid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function writeBrowserValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable or full; the page remains usable in memory.
  }
}
