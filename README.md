# nuxt-payload-xray

**English** · [Русский](./README.ru.md) · [简体中文](./README.zh-CN.md) · [Português (Brasil)](./README.pt-BR.md)

See what's inside the Nuxt payload of any page: the size of every `useState`,
`useAsyncData` and Pinia key, straight from the URL. No access to the code,
no dev server.

```bash
npx nuxt-payload-xray https://nuxt.com
```

```
⚠ https://nuxt.com
  payload 196.6 KB (gzip 51.3 KB) · 36% of HTML (546.3 KB)
  ├─ data: navigation:4.x     77.7 KB  40% ████████████████████
  ├─ data: index              49.6 KB  25% █████████████
  ├─ data: official-modules   40.4 KB  21% ██████████
  ├─ data: showcase           13.2 KB   7% ███
  ├─ data: sponsors-home       1.9 KB   1% █
  └─ … 16 more (use --top)
```

## Why

A server-rendered Nuxt page ships its state to the browser inside the HTML,
in `<script id="__NUXT_DATA__">`. Whatever ends up in `useState`,
`useAsyncData` or a Pinia store is serialized there, on **every** page, and
the browser has to download and parse it before the app becomes interactive.
HTML is not cached by the browser, so this is paid on every visit.

It grows quietly. On a production app I worked on, a whole translation
dictionary sat in `useState`: 218 KB in the payload of every page. Moving it
to a separately cached file took the payload from **256 KB to 47 KB**.

It's not rare. Scanning 36 server-rendered sites from the
[Nuxt showcase](https://nuxt.com/showcase) (November 2026): the median payload
is **93 KB**, 17 are over 100 KB and 6 are over 500 KB. Translation
dictionaries and CMS data in state are the usual suspects.

## Usage

```bash
npx nuxt-payload-xray <url | file.html> [...more]
```

| Option | Default | |
|---|---|---|
| `--top <n>` | `10` | keys to show per page |
| `--warn <size>` | `100kb` | warn above this payload size |
| `--max <size>` | `500kb` | fail above this payload size |
| `--json` | | print results as JSON |
| `--timeout <ms>` | `20000` | request timeout |

Sizes accept `2048`, `100kb`, `1.5mb`. Default thresholds match the warnings in
Nuxt DevTools.

### In CI

The exit code is `1` when any page is over `--max`, so you can guard a
deployed preview:

```yaml
- run: npx nuxt-payload-xray "$PREVIEW_URL" "$PREVIEW_URL/blog" --max 150kb
```

### As a library

```ts
import { analyzeHtml, loadSource } from 'nuxt-payload-xray'

const { html } = await loadSource('https://example.com')
const result = analyzeHtml('https://example.com', html)
if (result.ok) console.log(result.items.slice(0, 5))
```

## How it works

Nuxt serializes the payload with [devalue](https://github.com/Rich-Harris/devalue):
a flat array where values point at each other by index, and entry `0` is the
root (`{ data, state, pinia, … }`). The tool unwraps Nuxt's `Reactive` / `Ref`
wrappers, walks the references from every key and adds up the bytes it reaches.

Devalue stores repeated values once. A value shared by two keys counts towards
both, so the keys can add up to more than the whole payload.

## Limits

- Nuxt 3 and 4 with SSR. Nuxt 2 (`window.__NUXT__`) and client-only pages
  have no inline payload to read.
- With `payloadExtraction` (`nuxt generate`) the data lives in `_payload.json`
  files; for those, see [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer).
- A big key is not automatically a mistake: sometimes the page needs that data.
  It's worth a look when most of it never shows up on the page.

## Related

- [Nuxt DevTools](https://devtools.nuxt.com): the Payload tab shows sizes per
  key during development.
- [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer):
  build-time checks for extracted `_payload.json` files.

## License

[MIT](./LICENSE)
