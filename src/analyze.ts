import { gzipSync } from 'node:zlib'
import { DEFAULT_THRESHOLDS, type Status, type Thresholds, checkSize } from './core/check'
import { extractPayload } from './core/extract'
import { type PayloadReport, measurePayload } from './core/measure'

export type PageResult =
  | ({
    ok: true
    target: string
    /** HTTP status of the page; absent for local files. */
    httpStatus?: number
    htmlBytes: number
    htmlGzipBytes: number
    status: Status
  } & PayloadReport)
  | { ok: false, target: string, reason: string }

/** Everything about one page's payload, from its HTML. */
export function analyzeHtml(
  target: string,
  html: string,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
  httpStatus?: number,
): PageResult {
  const extracted = extractPayload(html)
  if (extracted.kind === 'nuxt2') return { ok: false, target, reason: 'Nuxt 2 page (window.__NUXT__) is not supported' }
  if (extracted.kind === 'none') return { ok: false, target, reason: 'No __NUXT_DATA__ found: not a server-rendered Nuxt 3+ page' }

  let report: PayloadReport
  try {
    report = measurePayload(extracted.raw)
  } catch (error) {
    return { ok: false, target, reason: `Could not parse __NUXT_DATA__: ${(error as Error).message}` }
  }

  return {
    ok: true,
    target,
    httpStatus,
    htmlBytes: Buffer.byteLength(html),
    htmlGzipBytes: gzipSync(html).length,
    status: checkSize(report.bytes, thresholds),
    ...report,
  }
}
