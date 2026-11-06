export type Status = 'ok' | 'warn' | 'error'

export interface Thresholds {
  /** Warn above this many bytes. Default: 100 KB, same as Nuxt DevTools. */
  warn: number
  /** Fail above this many bytes. Default: 500 KB, same as Nuxt DevTools. */
  error: number
}

export const DEFAULT_THRESHOLDS: Thresholds = { warn: 100 * 1024, error: 500 * 1024 }

export function checkSize(bytes: number, thresholds: Thresholds = DEFAULT_THRESHOLDS): Status {
  if (bytes > thresholds.error) return 'error'
  if (bytes > thresholds.warn) return 'warn'
  return 'ok'
}

/** `100kb`, `1.5mb`, `2048` → bytes. */
export function parseSize(input: string): number {
  const match = input.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb)?$/)
  if (!match) throw new Error(`Invalid size: "${input}". Use e.g. 100kb, 1mb or 2048.`)
  const unit = { b: 1, kb: 1024, mb: 1024 * 1024 }[(match[2] ?? 'b') as 'b' | 'kb' | 'mb']
  return Math.round(Number(match[1]) * unit)
}
