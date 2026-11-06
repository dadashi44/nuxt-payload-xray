import type { PageResult } from './analyze'

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code: number) => (text: string) => (useColor ? `\x1B[${code}m${text}\x1B[0m` : text)
const dim = paint(2)
const bold = paint(1)
const red = paint(31)
const yellow = paint(33)
const green = paint(32)
const cyan = paint(36)

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const STATUS = {
  ok: green('✔'),
  warn: yellow('⚠'),
  error: red('✖'),
}

export function formatPage(result: PageResult, { top = 10 } = {}): string {
  if (!result.ok) return `\n${dim('–')} ${bold(result.target)}\n  ${dim(result.reason)}`

  const share = Math.round((100 * result.bytes) / result.htmlBytes)
  // A 404 or 500 page has a small payload too: don't let it pass as a healthy one.
  const httpError = result.httpStatus !== undefined && (result.httpStatus < 200 || result.httpStatus >= 300)
  const icon = httpError ? red('!') : STATUS[result.status]
  const lines = [
    `\n${icon} ${bold(result.target)}${httpError ? ` ${red(`HTTP ${result.httpStatus}`)}` : ''}`,
    `  payload ${bold(formatBytes(result.bytes))} ${dim(`(gzip ${formatBytes(result.gzipBytes)})`)}`
    + ` · ${share}% of HTML ${dim(`(${formatBytes(result.htmlBytes)})`)}`,
  ]

  const shown = result.items.slice(0, top)
  const largest = shown[0]?.bytes || 1
  const width = Math.min(48, Math.max(...shown.map((item) => label(item).length), 10))

  shown.forEach((item, i) => {
    const branch = i === shown.length - 1 && result.items.length <= top ? '└─' : '├─'
    const percent = Math.round((100 * item.bytes) / result.bytes)
    const bar = '█'.repeat(Math.max(1, Math.round((20 * item.bytes) / largest)))
    lines.push(
      `  ${dim(branch)} ${label(item).slice(0, width).padEnd(width)} ${formatBytes(item.bytes).padStart(9)} ${String(percent).padStart(3)}% ${cyan(bar)}`,
    )
  })
  if (result.items.length > top) lines.push(`  ${dim(`└─ … ${result.items.length - top} more (use --top)`)}`)
  return lines.join('\n')
}

function label(item: { section: string, key: string }): string {
  return item.key ? `${item.section}: ${item.key}` : item.section
}
