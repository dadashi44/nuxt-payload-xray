import { stringify } from 'devalue'

/**
 * Builds a real `__NUXT_DATA__` string the way Nuxt does: devalue with
 * reducers for reactive wrappers. Wrap a value in `reactive()` / `shallow()`
 * to get `["Reactive", i]` / `["ShallowReactive", i]` in the output.
 */
class Reactive { constructor(readonly value: unknown) {} }
class ShallowReactive { constructor(readonly value: unknown) {} }

export const reactive = (value: unknown) => new Reactive(value)
export const shallow = (value: unknown) => new ShallowReactive(value)

export function nuxtPayload(root: Record<string, unknown>): string {
  return stringify(shallow(root), {
    Reactive: (v) => v instanceof Reactive && v.value,
    ShallowReactive: (v) => v instanceof ShallowReactive && v.value,
  })
}

export function nuxtPage(root: Record<string, unknown>): string {
  return `<!DOCTYPE html><html><body><div id="__nuxt"></div>`
    + `<script type="application/json" data-nuxt-data="nuxt-app" data-ssr="true" id="__NUXT_DATA__">${nuxtPayload(root)}</script>`
    + `</body></html>`
}
