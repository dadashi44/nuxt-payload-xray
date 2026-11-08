/**
 * Nuxt serializes its payload with devalue: a flat array where objects and
 * arrays point at other entries by index, and entry 0 is the root
 * (`{ data, state, pinia, … }`). Repeated values are stored once.
 *
 * We don't revive the values: for sizing we only need the reference graph.
 */
export type DevalueArray = unknown[]

/** Built-in devalue types whose arguments are literals, not references. */
const LITERAL_TYPES = new Set(['Date', 'RegExp', 'BigInt', 'URL', 'URLSearchParams'])

/** Nuxt reducers that wrap exactly one value: ["Reactive", index]. */
const WRAPPERS = new Set(['Reactive', 'ShallowReactive', 'Ref', 'ShallowRef', 'EmptyRef', 'EmptyShallowRef', 'null'])

const isIndex = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

export function parsePayload(raw: string): DevalueArray {
  const value: unknown = JSON.parse(raw)
  if (!Array.isArray(value)) throw new TypeError('__NUXT_DATA__ is not a devalue array')
  return value
}

/** Indexes referenced by one entry. */
export function references(entry: unknown): number[] {
  if (Array.isArray(entry)) {
    if (typeof entry[0] === 'string') {
      const [type, ...args] = entry
      return LITERAL_TYPES.has(type) ? [] : args.filter(isIndex)
    }
    return entry.filter(isIndex)
  }
  if (entry !== null && typeof entry === 'object') return Object.values(entry).filter(isIndex)
  return []
}

/** Follows Reactive/Ref wrappers down to the value they hold. */
export function unwrap(payload: DevalueArray, index: number): number {
  const seen = new Set<number>()
  let current = index
  for (;;) {
    const entry = payload[current]
    if (seen.has(current) || !Array.isArray(entry) || entry.length !== 2) return current
    if (typeof entry[0] !== 'string' || !WRAPPERS.has(entry[0]) || !isIndex(entry[1])) return current
    seen.add(current)
    current = entry[1]
  }
}

/** Every index reachable from `start`, including itself. */
export function reachable(payload: DevalueArray, start: number): Set<number> {
  const seen = new Set<number>()
  const stack = [start]
  while (stack.length) {
    const index = stack.pop()!
    if (seen.has(index) || index >= payload.length) continue
    seen.add(index)
    // No spread: a large array would exceed V8's argument limit.
    for (const reference of references(payload[index])) stack.push(reference)
  }
  return seen
}

/** Plain object entry (`{ key: index }`) at `index`, after unwrapping. */
export function objectAt(payload: DevalueArray, index: number): Record<string, number> | undefined {
  const entry = payload[unwrap(payload, index)]
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return undefined
  return entry as Record<string, number>
}
