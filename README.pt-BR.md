# nuxt-payload-xray

[English](./README.md) · [Русский](./README.ru.md) · [简体中文](./README.zh-CN.md) · **Português (Brasil)**

Veja o que tem dentro do payload do Nuxt em qualquer página: o tamanho de cada
chave de `useState`, `useAsyncData` e Pinia, direto pela URL. Sem acesso ao
código e sem servidor de desenvolvimento.

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

## Por quê

Uma página Nuxt renderizada no servidor envia seu estado ao navegador dentro do
HTML, em `<script id="__NUXT_DATA__">`. Tudo o que vai para `useState`,
`useAsyncData` ou uma store do Pinia é serializado ali, em **todas** as
páginas, e o navegador precisa baixar e interpretar isso antes de o app ficar
interativo. O navegador não faz cache do HTML, então esse custo se repete a
cada visita.

O payload cresce sem ninguém perceber. Em uma aplicação em produção em que
trabalhei, um dicionário de traduções inteiro estava em `useState`: 218 KB no
payload de cada página. Ao movê-lo para um arquivo separado e cacheável, o
payload caiu de **256 KB para 47 KB**.

Isso não é raro. Analisando 36 sites renderizados no servidor da
[vitrine do Nuxt](https://nuxt.com/showcase) (novembro de 2026): a mediana do
payload é **93 KB**, 17 passam de 100 KB e 6 passam de 500 KB. Dicionários de
tradução e dados de CMS no estado são os suspeitos de sempre.

## Uso

```bash
npx nuxt-payload-xray <url | file.html> [...mais]
```

| Opção | Padrão | |
|---|---|---|
| `--top <n>` | `10` | quantas chaves mostrar por página |
| `--warn <size>` | `100kb` | avisar acima deste tamanho de payload |
| `--max <size>` | `500kb` | falhar acima deste tamanho de payload |
| `--json` | | imprimir o resultado em JSON |
| `--timeout <ms>` | `20000` | tempo limite da requisição |

Os tamanhos aceitam `2048`, `100kb`, `1.5mb`. Os limites padrão são os mesmos
dos avisos do Nuxt DevTools.

### No CI

O código de saída é `1` quando alguma página passa de `--max`, então dá para
proteger um preview já publicado:

```yaml
- run: npx nuxt-payload-xray "$PREVIEW_URL" "$PREVIEW_URL/blog" --max 150kb
```

### Como biblioteca

```ts
import { analyzeHtml, loadSource } from 'nuxt-payload-xray'

const { html } = await loadSource('https://example.com')
const result = analyzeHtml('https://example.com', html)
if (result.ok) console.log(result.items.slice(0, 5))
```

## Como funciona

O Nuxt serializa o payload com o [devalue](https://github.com/Rich-Harris/devalue):
um array plano em que os valores apontam uns para os outros por índice, e a
posição `0` é a raiz (`{ data, state, pinia, … }`). A ferramenta desembrulha os
wrappers `Reactive` / `Ref` do Nuxt, percorre as referências a partir de cada
chave e soma os bytes de tudo o que alcança.

O devalue guarda valores repetidos uma única vez. Um valor compartilhado por
duas chaves conta para as duas, então a soma das chaves pode passar do tamanho
total do payload.

## Limitações

- Nuxt 3 e 4 com SSR. O Nuxt 2 (`window.__NUXT__`) e páginas só no cliente não
  têm payload embutido para ler.
- Com `payloadExtraction` (`nuxt generate`) os dados ficam em arquivos
  `_payload.json`; para esses casos, veja o
  [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer).
- Uma chave grande não é necessariamente um erro: às vezes a página precisa
  desses dados. Vale investigar quando a maior parte deles nunca aparece na
  página.

## Relacionados

- [Nuxt DevTools](https://devtools.nuxt.com): a aba Payload mostra o tamanho de
  cada chave durante o desenvolvimento.
- [nuxt-payload-analyzer](https://github.com/Barbapapazes/nuxt-payload-analyzer):
  verificações em tempo de build para arquivos `_payload.json` extraídos.

## Licença

[MIT](./LICENSE)
