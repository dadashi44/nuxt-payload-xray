# nuxt-payload-xray

[English](./README.md) · [Русский](./README.ru.md) · **简体中文** · [Português (Brasil)](./README.pt-BR.md)

[![npm](https://img.shields.io/npm/v/nuxt-payload-xray)](https://www.npmjs.com/package/nuxt-payload-xray) [![CI](https://github.com/dadashi44/nuxt-payload-xray/actions/workflows/ci.yml/badge.svg)](https://github.com/dadashi44/nuxt-payload-xray/actions/workflows/ci.yml) [![license](https://img.shields.io/npm/l/nuxt-payload-xray)](./LICENSE)

查看任意页面的 Nuxt payload 里装了什么：直接通过 URL 显示每个 `useState`、
`useAsyncData` 和 Pinia 键的大小。无需访问源码，也无需开发服务器。

![nuxt-payload-xray demo](./.github/assets/demo.gif)

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

## 为什么需要它

服务端渲染的 Nuxt 页面会把状态放在 HTML 中的
`<script id="__NUXT_DATA__">` 里传给浏览器。凡是进入 `useState`、
`useAsyncData` 或 Pinia store 的数据，都会在**每一个**页面中被序列化，浏览器必须先下载并解析它，应用才能变得可交互。浏览器不会缓存 HTML，所以每次访问都要付出这个代价。

payload 会在不知不觉中变大。在我参与的一个生产应用中，整本翻译词典被放进了
`useState`：每个页面的 payload 都多出 218 KB。把它移到一个单独可缓存的文件后，payload 从 **256 KB 降到了 47 KB**。

这种情况并不少见。对 [Nuxt 展示页](https://nuxt.com/showcase) 中 36 个服务端渲染网站的扫描（2026 年 11 月）显示：payload 中位数为 **93 KB**，其中 17 个超过 100 KB，6 个超过 500 KB。最常见的原因是放在状态里的翻译词典和 CMS 数据。

## 用法

```bash
npx nuxt-payload-xray <url | file.html> [...更多]
```

| 选项 | 默认值 | |
|---|---|---|
| `--top <n>` | `10` | 每个页面显示多少个键 |
| `--warn <size>` | `100kb` | payload 超过该大小时发出警告 |
| `--max <size>` | `500kb` | payload 超过该大小时失败 |
| `--json` | | 以 JSON 输出结果 |
| `--timeout <ms>` | `20000` | 请求超时时间 |

大小可以写成 `2048`、`100kb`、`1.5mb`。默认阈值与 Nuxt DevTools 的警告一致。

### 在 CI 中

只要有任一页面超过 `--max`，退出码就是 `1`，因此可以用来检查已部署的预览环境：

```yaml
- run: npx nuxt-payload-xray "$PREVIEW_URL" "$PREVIEW_URL/blog" --max 150kb
```

### 作为库使用

```ts
import { analyzeHtml, loadSource } from 'nuxt-payload-xray'

const { html } = await loadSource('https://example.com')
const result = analyzeHtml('https://example.com', html)
if (result.ok) console.log(result.items.slice(0, 5))
```

## 工作原理

Nuxt 使用 [devalue](https://github.com/Rich-Harris/devalue) 序列化 payload：它是一个扁平数组，值之间通过索引相互引用，第 `0` 项是根对象（`{ data, state, pinia, … }`）。本工具会展开 Nuxt 的 `Reactive` / `Ref` 包装，从每个键出发沿着引用遍历，并累加所到达的全部字节。

devalue 对重复的值只存储一次。被两个键共享的值会同时计入这两个键，因此各键之和可能大于整个 payload。

## 限制

- 支持启用 SSR 的 Nuxt 3 和 4。Nuxt 2（`window.__NUXT__`）以及纯客户端页面没有可读取的内联 payload。
- 启用 `payloadExtraction`（`nuxt generate`）时，数据位于 `_payload.json` 文件中；这种情况请使用
  [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer)。
- 体积大的键不一定是错误：有时页面确实需要这些数据。当其中大部分内容从未在页面上显示时，才值得仔细检查。

## 相关工具

- [Nuxt DevTools](https://devtools.nuxt.com)：开发时在 Payload 标签页中按键显示大小。
- [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer)：在构建时检查提取出的 `_payload.json` 文件。

## 许可证

[MIT](./LICENSE)
