import { describe, expect, it } from 'vitest'
import { analyzeHtml } from '../src/analyze'
import { checkSize, parseSize } from '../src/core/check'
import { extractPayload } from '../src/core/extract'
import { measurePayload } from '../src/core/measure'
import { nuxtPage, nuxtPayload, reactive } from './helpers'

const bigDictionary = Object.fromEntries(
  Array.from({ length: 500 }, (_, i) => [`key_${i}`, `Translated text number ${i}`]),
)

describe('extractPayload', () => {
  it('finds __NUXT_DATA__ regardless of attribute order', () => {
    const html = `<script id="__NUXT_DATA__" type="application/json">[1]</script>`
    expect(extractPayload(html)).toEqual({ kind: 'payload', raw: '[1]' })
  })

  it('recognises Nuxt 2 pages', () => {
    expect(extractPayload('<script>window.__NUXT__={}</script>').kind).toBe('nuxt2')
  })

  it('reports pages without a payload', () => {
    expect(extractPayload('<html></html>').kind).toBe('none')
  })
})

describe('measurePayload', () => {
  it('breaks data, state and pinia down by key, largest first', () => {
    const raw = nuxtPayload({
      data: reactive({ 'home-page': { title: 'Hello' } }),
      state: reactive({ $stranslations: bigDictionary, $slang: 'en' }),
      pinia: { user: { name: 'Ann' } },
      serverRendered: true,
    })
    const { items } = measurePayload(raw)

    expect(items[0]).toMatchObject({ section: 'state', key: 'translations' })
    expect(items.map((i) => `${i.section}:${i.key}`)).toEqual(
      expect.arrayContaining(['data:home-page', 'state:lang', 'pinia:user', 'serverRendered:']),
    )
  })

  it('strips the $s prefix only from useState keys', () => {
    const raw = nuxtPayload({ state: { $sfoo: 1 }, data: { $sbar: 1 } })
    const keys = measurePayload(raw).items.map((i) => i.key)
    expect(keys).toContain('foo')
    expect(keys).toContain('$sbar')
  })

  it('a large key accounts for most of the payload', () => {
    const raw = nuxtPayload({ state: reactive({ $sdict: bigDictionary, $sflag: true }) })
    const report = measurePayload(raw)
    const dict = report.items.find((i) => i.key === 'dict')!
    expect(dict.bytes / report.bytes).toBeGreaterThan(0.9)
  })

  it('counts a value shared by two keys towards both', () => {
    const shared = { list: Array.from({ length: 100 }, (_, i) => `item ${i}`) }
    const raw = nuxtPayload({ data: { a: shared, b: shared } })
    const [a, b] = measurePayload(raw).items.filter((i) => i.section === 'data')
    expect(a.bytes).toBe(b.bytes)
    expect(a.bytes).toBeGreaterThan(500)
  })

  it('survives dates, sets and maps inside data', () => {
    const raw = nuxtPayload({ data: { x: { at: new Date(0), tags: new Set(['a']), m: new Map([['k', 1]]) } } })
    expect(measurePayload(raw).items[0].bytes).toBeGreaterThan(0)
  })
})

describe('analyzeHtml', () => {
  it('flags pages over the thresholds', () => {
    const html = nuxtPage({ state: { $sdict: bigDictionary } })
    const result = analyzeHtml('page.html', html, { warn: 1024, error: 4 * 1024 })
    expect(result.ok && result.status).toBe('error')
  })

  it('returns a reason instead of throwing on broken payloads', () => {
    const result = analyzeHtml('broken.html', '<script id="__NUXT_DATA__">not json</script>')
    expect(result.ok).toBe(false)
  })
})

describe('sizes', () => {
  it.each([
    ['2048', 2048],
    ['100kb', 102400],
    ['1.5mb', 1572864],
    [' 50 KB ', 51200],
  ])('parseSize(%s) = %d', (input, bytes) => {
    expect(parseSize(input)).toBe(bytes)
  })

  it('rejects nonsense', () => {
    expect(() => parseSize('big')).toThrow()
  })

  it('checkSize uses DevTools-like defaults', () => {
    expect(checkSize(50 * 1024)).toBe('ok')
    expect(checkSize(200 * 1024)).toBe('warn')
    expect(checkSize(600 * 1024)).toBe('error')
  })
})
