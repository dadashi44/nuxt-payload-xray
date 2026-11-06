import { readFile } from 'node:fs/promises'

export interface Source {
  /** What the user passed: a URL or a file path. */
  target: string
  html: string
  status?: number
}

const USER_AGENT = 'nuxt-payload-xray (+https://github.com/dadashi44/nuxt-payload-xray)'

export const isUrl = (target: string) => /^https?:\/\//i.test(target)

export async function loadSource(target: string, { timeout = 20_000 } = {}): Promise<Source> {
  if (!isUrl(target)) return { target, html: await readFile(target, 'utf8') }

  const response = await fetch(target, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  })
  return { target, html: await response.text(), status: response.status }
}
