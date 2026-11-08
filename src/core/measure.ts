import { gzipSync } from 'node:zlib'
import { type DevalueArray, objectAt, parsePayload, reachable } from './parse'

export type Section = 'data' | 'state' | 'pinia' | (string & {})

export interface PayloadItem {
  section: Section
  /** Key inside the section; empty for top-level entries like `_errors`. */
  key: string
  bytes: number
}

export interface PayloadReport {
  bytes: number
  gzipBytes: number
  /** Largest first. */
  items: PayloadItem[]
}

/** Sections whose keys are reported one by one. */
const GROUPS = new Set(['data', 'state', 'pinia'])

/**
 * Size of one entry as devalue wrote it. `JSON.parse` decodes the escapes
 * devalue adds for embedding in a `<script>` (`<` as `\u003C`, U+2028, U+2029)
 * and `JSON.stringify` doesn't put them back, so re-add them: otherwise every
 * `<` in HTML content would lose 5 bytes.
 */
function entrySize(entry: unknown): number {
  const json = JSON.stringify(entry ?? null)
    .replace(/[<\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
  return Buffer.byteLength(json)
}

function sizeOf(payload: DevalueArray, indexes: Set<number>): number {
  let bytes = 0
  // +1 for the comma that separates entries in the serialized array.
  for (const index of indexes) bytes += entrySize(payload[index]) + 1
  return bytes
}

/** `useState` keys are stored as `$s<key>`. */
const displayKey = (section: string, key: string) => (section === 'state' ? key.replace(/^\$s/, '') : key)

/**
 * Size of every key in the payload.
 *
 * A key's size is the bytes of every array entry reachable from it. Entries
 * shared by several keys (devalue stores repeats once) count towards each of
 * them, so the items can add up to more than the payload itself.
 */
export function measurePayload(raw: string): PayloadReport {
  const payload = parsePayload(raw)
  const root = objectAt(payload, 0) ?? {}
  const items: PayloadItem[] = []

  for (const [section, index] of Object.entries(root)) {
    const group = GROUPS.has(section) ? objectAt(payload, index) : undefined
    if (group) {
      for (const [key, child] of Object.entries(group)) {
        items.push({ section, key: displayKey(section, key), bytes: sizeOf(payload, reachable(payload, child)) })
      }
    } else {
      items.push({ section, key: '', bytes: sizeOf(payload, reachable(payload, index)) })
    }
  }

  items.sort((a, b) => b.bytes - a.bytes)
  return { bytes: Buffer.byteLength(raw), gzipBytes: gzipSync(raw).length, items }
}
