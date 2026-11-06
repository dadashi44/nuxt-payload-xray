export type ExtractResult =
  | { kind: 'payload', raw: string }
  | { kind: 'nuxt2' }
  | { kind: 'none' }

const NUXT_DATA = /<script\b[^>]*\bid=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
const NUXT2 = /window\.__NUXT__\s*=/

/**
 * Pulls the serialized payload out of a server-rendered Nuxt page.
 *
 * Nuxt 3+ inlines it as `<script type="application/json" id="__NUXT_DATA__">`.
 * Nuxt 2 used `window.__NUXT__ = …`, a different format that is reported but not parsed.
 */
export function extractPayload(html: string): ExtractResult {
  const match = html.match(NUXT_DATA)
  if (match) return { kind: 'payload', raw: match[1] }
  if (NUXT2.test(html)) return { kind: 'nuxt2' }
  return { kind: 'none' }
}
