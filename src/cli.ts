import { parseArgs } from 'node:util'
import { type PageResult, analyzeHtml } from './analyze'
import { DEFAULT_THRESHOLDS, parseSize } from './core/check'
import { formatPage } from './report'
import { loadSource } from './sources'

const HELP = `
nuxt-payload-xray — see what's inside the Nuxt payload of any page

Usage
  npx nuxt-payload-xray <url | file.html> [...more]

Options
  --top <n>        keys to show per page (default 10)
  --warn <size>    warn above this payload size (default 100kb)
  --max <size>     fail above this payload size (default 500kb)
  --json           print results as JSON
  --timeout <ms>   request timeout (default 20000)
  -h, --help       show this help

Exit code is 1 when any page is over --max, so it can gate CI.

Examples
  npx nuxt-payload-xray https://nuxt.com
  npx nuxt-payload-xray https://preview.example.com --max 150kb
`

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      top: { type: 'string', default: '10' },
      warn: { type: 'string' },
      max: { type: 'string' },
      json: { type: 'boolean', default: false },
      timeout: { type: 'string', default: '20000' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  if (values.help || positionals.length === 0) {
    console.log(HELP)
    return positionals.length === 0 && !values.help ? 1 : 0
  }

  const thresholds = {
    warn: values.warn ? parseSize(values.warn) : DEFAULT_THRESHOLDS.warn,
    error: values.max ? parseSize(values.max) : DEFAULT_THRESHOLDS.error,
  }

  const results: PageResult[] = []
  for (const target of positionals) {
    try {
      const source = await loadSource(target, { timeout: Number(values.timeout) })
      results.push(analyzeHtml(target, source.html, thresholds, source.status))
    } catch (error) {
      results.push({ ok: false, target, reason: (error as Error).message })
    }
    if (!values.json) console.log(formatPage(results.at(-1)!, { top: Number(values.top) }))
  }

  if (values.json) console.log(JSON.stringify(results, null, 2))
  return results.some((r) => r.ok && r.status === 'error') ? 1 : 0
}

main().then(
  (code) => { process.exitCode = code },
  (error) => {
    console.error((error as Error).message)
    process.exitCode = 2
  },
)
