# nuxt-payload-xray

[English](./README.md) · **Русский** · [简体中文](./README.zh-CN.md) · [Português (Brasil)](./README.pt-BR.md)

Показывает, что лежит в payload Nuxt на любой странице: размер каждого ключа
`useState`, `useAsyncData` и Pinia — прямо по URL. Без доступа к коду и без
dev-сервера.

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

## Зачем

Страница Nuxt с серверным рендерингом передаёт своё состояние браузеру внутри
HTML, в `<script id="__NUXT_DATA__">`. Всё, что попало в `useState`,
`useAsyncData` или Pinia-стор, сериализуется туда на **каждой** странице, и
браузер должен скачать и разобрать это, прежде чем приложение станет
интерактивным. HTML браузер не кэширует, поэтому это повторяется при каждом
заходе.

Payload растёт незаметно. В продакшен-приложении, над которым я работал, в
`useState` лежал целый словарь переводов: 218 КБ в payload каждой страницы.
Когда его вынесли в отдельный кэшируемый файл, payload уменьшился с
**256 КБ до 47 КБ**.

Это не редкость. Проверка 36 сайтов с серверным рендерингом из
[витрины Nuxt](https://nuxt.com/showcase) (ноябрь 2026): медиана payload —
**93 КБ**, у 17 сайтов он больше 100 КБ, у 6 — больше 500 КБ. Чаще всего
виноваты словари переводов и данные CMS в состоянии.

## Использование

```bash
npx nuxt-payload-xray <url | file.html> [...ещё]
```

| Опция | По умолчанию | |
|---|---|---|
| `--top <n>` | `10` | сколько ключей показать на страницу |
| `--warn <size>` | `100kb` | предупреждать, если payload больше |
| `--max <size>` | `500kb` | падать, если payload больше |
| `--json` | | вывести результат в JSON |
| `--timeout <ms>` | `20000` | таймаут запроса |

Размеры можно писать как `2048`, `100kb`, `1.5mb`. Пороги по умолчанию
совпадают с предупреждениями Nuxt DevTools.

### В CI

Код выхода `1`, если хотя бы одна страница больше `--max`. Так можно
проверять задеплоенное превью:

```yaml
- run: npx nuxt-payload-xray "$PREVIEW_URL" "$PREVIEW_URL/blog" --max 150kb
```

### Как библиотека

```ts
import { analyzeHtml, loadSource } from 'nuxt-payload-xray'

const { html } = await loadSource('https://example.com')
const result = analyzeHtml('https://example.com', html)
if (result.ok) console.log(result.items.slice(0, 5))
```

## Как это работает

Nuxt сериализует payload через [devalue](https://github.com/Rich-Harris/devalue):
это плоский массив, где значения ссылаются друг на друга по индексу, а элемент
`0` — корень (`{ data, state, pinia, … }`). Инструмент разворачивает обёртки
Nuxt `Reactive` / `Ref`, проходит по ссылкам от каждого ключа и суммирует байты
всего, до чего дошёл.

Devalue хранит повторяющиеся значения один раз. Значение, общее для двух
ключей, засчитывается обоим, поэтому сумма по ключам может быть больше всего
payload.

## Ограничения

- Nuxt 3 и 4 с SSR. У Nuxt 2 (`window.__NUXT__`) и страниц без серверного
  рендеринга нет встроенного payload, который можно прочитать.
- С `payloadExtraction` (`nuxt generate`) данные лежат в файлах
  `_payload.json`; для них есть
  [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer).
- Большой ключ — не обязательно ошибка: иногда странице нужны эти данные.
  Присмотреться стоит, когда большая их часть на странице не показывается.

## Похожие инструменты

- [Nuxt DevTools](https://devtools.nuxt.com): вкладка Payload показывает
  размеры по ключам во время разработки.
- [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer):
  проверки при сборке для извлечённых файлов `_payload.json`.

## Лицензия

[MIT](./LICENSE)
