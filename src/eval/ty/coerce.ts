import {
  listTy,
  type GlslVal,
  type GlslValue,
  type JsVal,
  type JsValue,
  type Ty,
  type TyName,
  type Type,
} from "."
import type { GlslContext } from "../fn"
import { pt, real } from "./create"
import { garbageValJs } from "./garbage"

/**
 * `null` means there were zero arguments. Any other coercion error will be
 * thrown.
 */
export function coerceTy(tys: Ty[]): Ty | null {
  if (!tys.length) {
    return null
  }

  const encountered: Partial<Record<TyName, number>> = Object.create(null)

  for (const ty of tys) {
    encountered[ty.type] = (encountered[ty.type] || 0) + 1
  }

  if (Object.keys(encountered).length == 1) {
    return { type: Object.keys(encountered)[0] as TyName }
  }

  if (encountered.real && !encountered.complex && !encountered.color) {
    return { type: "real" }
  }

  if (encountered.complex && !encountered.color) {
    return { type: "complex" }
  }

  throw new Error(`Cannot coerce ${listTy(tys)}.`)
}

export function coerceValJs(val: JsVal, to: Ty): JsVal {
  if (val.type == to.type) {
    return val
  }

  if (val.type == "bool" && to.type == "real") {
    if (val.value) {
      return { type: "real", value: real(1) }
    } else {
      return garbageValJs(to)
    }
  }

  if (val.type == "bool" && to.type == "complex") {
    if (val.value) {
      return { type: "complex", value: pt(real(1), real(0)) }
    } else {
      return garbageValJs(to)
    }
  }

  if (val.type == "real" && to.type == "complex") {
    return {
      type: "complex",
      value: { type: "point", x: val.value, y: real(0) },
    }
  }

  throw new Error(`Cannot coerce ${val.type} to ${to}.`)
}

export function coerceValGlsl(val: GlslVal, to: Ty): string {
  if (val.type == to.type) {
    return val.expr
  }

  if (val.type == "bool" && to.type == "real") {
    return `(${val.expr} ? 1.0 : 0.0/0.0)`
  }

  if (val.type == "bool" && to.type == "complex") {
    return `(${val.expr} ? vec2(1, 0) : vec2(0.0/0.0))`
  }

  if (val.type == "real" && to.type == "complex") {
    return `vec2(${val.expr}, 0)`
  }

  throw new Error(`Cannot coerce ${val.type} to ${to}.`)
}

export function listJs(vals: JsVal[]): JsValue {
  if (vals.length == 0) {
    return { type: "real", list: true, value: [] }
  }

  const ty = coerceTy(vals)!

  return {
    type: ty.type,
    list: true,
    value: vals.map(
      (val) => coerceValJs(val, ty).value,
    ) satisfies JsVal["value"][] as any,
  }
}

export function listGlsl(vals: GlslVal[]): GlslValue {
  if (vals.length == 0) {
    return { type: "real", list: 0, expr: "[]" }
  }

  const ty = coerceTy(vals)!

  return {
    type: ty.type,
    list: vals.length,
    expr: "[" + vals.map((val) => coerceValGlsl(val, ty)).join(", ") + "]",
  }
}

/**
 * `null` means there were zero arguments. Any other coercion error will be
 * thrown.
 */
export function coerceType(types: Type[]): Type | null {
  if (!types.length) {
    return null
  }

  const ty = coerceTy(types.filter((x) => x.list !== 0))!

  // Everything is length zero, so we can pick any type
  if (ty == null) {
    return { list: 0, type: types[0]!.type }
  }

  if (types.every((x) => x.list === false)) {
    return { list: false, type: ty.type }
  }

  // Non-lists get coerced to lists of length 1
  const lens = types.map((x) =>
    x.list === false ? 1
    : x.list === true ? true
    : x.list,
  )

  const firstLen = lens[0]!

  const len = lens.every((x) => x === firstLen) ? firstLen : true

  return { list: len, type: ty.type }
}

export function coerceValueJs(value: JsValue, to: Type): JsValue {
  if (to.list === false) {
    if (value.list) {
      throw new Error("Cannot coerce from a list to a non-list.")
    }

    return { ...coerceValJs(value, to), list: false }
  }

  if (to.list === true) {
    if (value.list && value.value.length === 0) {
      return { ...to, value: [] } as any
    }

    const values = value.list ? value.value : [value.value]

    return {
      ...to,
      value: values.map(
        (item) =>
          coerceValJs({ type: value.type, value: item } as any, to).value,
      ),
    } as any
  }

  if (to.list === 0) {
    if (!value.list || value.value.length) {
      throw new Error("Cannot shrink the size of a list.")
    }

    return { list: true, type: to.type, value: [] }
  }

  const values = value.list ? value.value : [value.value]

  if (values.length != to.list) {
    throw new Error("List sizes are different.")
  }

  return {
    ...to,
    value: values.map(
      (item) => coerceValJs({ type: value.type, value: item } as any, to).value,
    ),
  } as any
}

export function coerceValueGlsl(
  ctx: GlslContext,
  value: GlslValue,
  to: Type,
): string {
  if (to.list === false) {
    if (value.list !== false) {
      throw new Error("Cannot coerce from a list to a non-list.")
    }

    return coerceValGlsl(value, to)
  }

  if (to.list === true || value.list === true) {
    throw new Error("Dynamically sized lists are not supported in shaders.")
  }

  if (to.list === 0) {
    if (value.list !== 0) {
      throw new Error("Cannot shrink the size of a list.")
    }

    return "[]"
  }

  if (value.list === false) {
    if (to.list === 1) {
      return `[${coerceValGlsl(value, to)}]`
    }

    throw new Error("List sizes are different.")
  }

  if (value.list !== to.list) {
    throw new Error("List sizes are different.")
  }

  return ctx.map(value as any, to, (item) =>
    coerceValGlsl({ expr: item, type: value.type }, to),
  )
}
