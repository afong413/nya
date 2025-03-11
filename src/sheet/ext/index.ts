import type { GlslHelpers, GlslResult } from "../../eval/lib/fn"
import type { Expr } from "../ui/expr"
import type { Paper } from "../ui/paper"
import type { Plottable } from "../ui/paper3/item"

/** A possible result of a math expression. */
export interface Ext<T extends {}, U> {
  /**
   * Attempts to use this extension on a {@linkcode Expr}. May result in:
   *
   * - A nullish value to skip this extension
   * - A non-nullish value to claim the {@linkcode Expr} by this extension
   * - A thrown error to display an error under the expression
   */
  data(expr: Expr): T | null | undefined

  destroy?(data: NoInfer<T>): void
  aside?(data: NoInfer<T>): HTMLElement | undefined
  el?(data: NoInfer<T>): HTMLElement | undefined
  svg?(data: NoInfer<T>, paper: Paper): void
  plot?: Plottable<T, U>

  // TODO: remove plotGl as a special-cased function; it should be delegated to 'shader'
  plotGl?(data: NoInfer<T>, helpers: GlslHelpers): GlslResult | undefined
}

export type AnyExt = Ext<{}, unknown>

export function defineExt<T extends {}, U>(ext: Ext<T, U>) {
  return ext
}

export class Exts {
  constructor(readonly exts: AnyExt[] = []) {}

  add(ext: AnyExt) {
    this.exts.push(ext)
    return this
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.exts)
    return this
  }
}

/**
 * Useful for persisting values which should only be initialized once per
 * {@linkcode Expr}. Essentially a thin wrapper over {@linkcode WeakMap} with
 * auto-initialization designed specifically for {@linkcode Expr}.
 */
export class Store<T extends {}, U extends WeakKey = Expr> {
  data = new WeakMap<U, T>()

  constructor(readonly init: (key: U) => T) {}

  get(key: U) {
    const data = this.data.get(key)
    if (data == null) {
      const data = this.init(key)
      this.data.set(key, data)
      return data
    }
    return data
  }
}

/**
 * A wrapped around a {@linkcode Store} which stores an arbitrary property and
 * re-renders the paper when it changes.
 */
export class Prop<T> {
  private store = new Store((expr) => {
    let value = this.init(expr)

    return {
      get() {
        return value
      },
      set(v: T) {
        if (value != v) {
          value = v
          expr.sheet.paper.queue()
        }
      },
    }
  })

  constructor(readonly init: (expr: Expr) => T) {}

  get(expr: Expr) {
    return this.store.get(expr).get()
  }

  set(expr: Expr, value: T) {
    this.store.get(expr).set(value)
  }
}
