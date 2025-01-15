import { fnargs } from "./ast/collect"
import type { Node } from "./ast/token"
import { asNumericBase, parseNumberGlsl, parseNumberJs } from "./base2"
import { Bindings, id } from "./binding"
import { GlslContext, GlslHelpers } from "./fn"
import { FNS, OP_BINARY, OP_UNARY } from "./ops2"
import { OP_RAISE } from "./ops2/32/op/pow"
import { FN_IMAG } from "./ops2/64/fn/imag"
import { FN_REAL } from "./ops2/64/fn/real"
import { pickCmp } from "./ops2/64/op/cmp"
import { OP_CDOT } from "./ops2/64/op/mul"
import { OP_AND } from "./ops2/bool/op/and"
import { iterateGlsl, iterateJs, parseIterate } from "./ops2/iterate"
import { VARS } from "./ops2/vars"
import type { SReal } from "./ty"
import { num, real } from "./ty/create"
import type { GlslValue, JsValue } from "./ty2"
import { coerceType, isReal } from "./ty2/coerce"
import { declareGlsl } from "./ty2/decl"
import { TY_INFO } from "./ty2/info"

export interface Props {
  base: SReal
}

export interface PropsJs extends Props {
  /** JS bindings must be values. */
  bindings: Bindings<JsValue>
}

export interface PropsGlsl extends Props {
  ctx: GlslContext
  /** GLSL bindings must contain variable names and be properly typed. */
  bindings: Bindings<GlslValue>
}

export function defaultPropsJs(): PropsJs {
  return {
    base: real(10),
    bindings: new Bindings(),
  }
}

export function defaultPropsGlsl(): PropsGlsl {
  return {
    base: real(10),
    ctx: new GlslContext(new GlslHelpers()),
    bindings: new Bindings(),
  }
}

function jsCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsJs,
): JsValue {
  const fn = FNS[name]

  if (!fn) {
    throw new Error(`The '${name}' function is not supported yet.`)
  }

  return fn.js(...args.map((arg) => js(arg, props)))
}

export function js(node: Node, props: PropsJs): JsValue {
  switch (node.type) {
    case "num":
      return parseNumberJs(
        node.value,
        node.sub ? asNumericBase(js(node.sub, props)) : props.base,
      )
    case "op":
      if (!node.b) {
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.js(js(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return js(node.a, {
            ...props,
            base:
              (
                node.b.type == "var" &&
                node.b.kind == "var" &&
                !node.b.sub &&
                !node.b.sup &&
                (node.b.value == "mrrp" || node.b.value == "meow")
              ) ?
                real(10)
              : asNumericBase(js(node.b, { ...props, base: real(10) })),
          })
        case ".":
          if (node.b.type == "var" && !node.b.sub && node.b.kind == "var") {
            const value =
              node.b.value == "x" || node.b.value == "real" ?
                FN_REAL.js(js(node.a, props))
              : node.b.value == "y" || node.b.value == "imag" ?
                FN_IMAG.js(js(node.a, props))
              : null

            if (value == null) {
              break
            }

            if (node.b.sup) {
              return OP_RAISE.js(value, js(node.b.sup, props))
            } else {
              return value
            }
          }
          break
        case "with":
        case "withseq": {
          throw new Error("no with yet")
          // return props.bindings.withAll(
          //   withBindingsJs(node.b, node.kind == "withseq", props),
          //   () => js(node.a, props),
          // )
        }
      }
      const op = OP_BINARY[node.kind]
      if (op) {
        return op.js(js(node.a, props), js(node.b, props))
      }
      throw new Error(`The operator '${node.kind}' is not supported yet.`)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        return js(node.value, props)
      }
      if (node.lhs == "[" && node.rhs == "]") {
        throw new Error("no lists yet")
        // const args = commalist(node.value).map((item) => js(item, props))
        // if (args.length == 0) {
        //   return {
        //     type: "bool",
        //     list: 0,
        //     value: [],
        //   }
        // }
        // if (args.every((x) => x.list === false)) {
        //   return listJs(args)
        // }
        // throw new Error("Cannot store a list inside another list.")
      }
      if (node.lhs == "|" && node.rhs == "|") {
        throw new Error("no abs yet")
        // return ABS.js(js(node.value, props))
      }
      break
    case "call":
      if (
        !node.on &&
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        const args = fnargs(node.args)
        if (node.on) {
          args.unshift(node.on)
        }
        return jsCall(node.name.value, args, !!node.on, props)
      }
      break
    case "juxtaposed":
      return OP_CDOT.js(js(node.a, props), js(node.b, props))
    case "var": {
      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return OP_RAISE.js(value, js(node.sup, props))
        } else {
          return value
        }
      }

      builtin: {
        if (node.sub) break builtin

        const value = VARS[node.value]?.js
        if (!value) break builtin

        if (!node.sup) return value
        return OP_RAISE.js(value, js(node.sup, props))
      }

      throw new Error(`The variable '${node.value}' is not defined.`)
    }
    case "frac":
      throw new Error("no frac yet")
    // return DIV.js(js(node.a, props), js(node.b, props))
    case "raise":
      return OP_RAISE.js(js(node.base, props), js(node.exponent, props))
    case "cmplist":
      return node.ops
        .map((op, i) => {
          const a = js(node.items[i]!, props)
          const b = js(node.items[i + 1]!, props)
          return pickCmp(op).js(a, b)
        })
        .reduce((a, b) => OP_AND.js(a, b))
    case "piecewise":
      throw new Error(
        "Piecewise functions are not supported outside of shaders yet.",
      )
    case "root":
      throw new Error("no root yet")
    // if (node.root) {
    //   return POW.js(
    //     js(node.contents, props),
    //     DIV.js(vreal(1), js(node.root, props)),
    //   )
    // } else {
    //   return SQRT.js(js(node.contents, props))
    // }
    case "error":
      throw new Error(node.reason)
    case "magicvar":
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        const { data, count } = iterateJs(parsed, { eval: props, seq: false })
        if (parsed.retval == "count") {
          return { type: "r64", list: false, value: real(count) }
        } else {
          return data[parsed.retval!.id]!
        }
      }
      break
    case "void":
      throw new Error("Empty expression.")
    case "index": {
      const on = js(node.on, props)
      if (!on.list) {
        throw new Error("Cannot index on a non-list.")
      }
      const index = js(node.index, props)
      if (index.list !== false) {
        throw new Error("Cannot index with a list yet.")
      }
      if (!isReal(index)) {
        throw new Error("Indexes must be numbers for now.")
      }
      const value = num(index.value) - 1
      return {
        ...on,
        list: false,
        value: on.value[value] ?? TY_INFO[on.type].garbage.js,
      } as any
    }
    case "commalist":
      throw new Error("Lists must be surrounded by square brackets.")
    case "sub":
      throw new Error("Invalid subscript.")
    case "sup":
      throw new Error("Lone superscript.")
    case "mixed":
      throw new Error("no mixed yet")
    // return OP_ADD.js1(
    //   parseNumberJs(node.integer, props.base),
    // ) {
    //   type: "real",
    //   list: false,
    //   value: ADD.real(
    //     parseNumberJs(node.integer, props.base),
    //     DIV.real(
    //       parseNumberJs(node.a, props.base),
    //       parseNumberJs(node.b, props.base),
    //     ),
    //   ),
    // }
    case "num16":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "factorial":
    case "punc":
  }

  throw new Error(`Node type '${node.type}' is not implemented yet.`)
}

function glslCall(
  name: string,
  args: Node[],
  _asMethod: boolean,
  props: PropsGlsl,
): GlslValue {
  const fn = FNS[name]

  if (!fn) {
    throw new Error(`The '${name}' function is not supported in shaders yet.`)
  }

  return fn.glsl(props.ctx, ...args.map((arg) => glsl(arg, props)))
}

export function glsl(node: Node, props: PropsGlsl): GlslValue {
  switch (node.type) {
    case "num":
      return parseNumberGlsl(
        node.value,
        node.sub ?
          asNumericBase(js(node.sub, { ...props, bindings: new Bindings() }))
        : props.base,
      )
    case "op":
      if (!node.b) {
        const op = OP_UNARY[node.kind]
        if (op) {
          return op.glsl(props.ctx, glsl(node.a, props))
        }
        throw new Error(`The operator '${node.kind}' is not supported yet.`)
      }
      switch (node.kind) {
        case "base":
          return glsl(node.a, {
            ...props,
            base:
              (
                node.b.type == "var" &&
                node.b.kind == "var" &&
                !node.b.sub &&
                !node.b.sup &&
                (node.b.value == "mrrp" || node.b.value == "meow")
              ) ?
                real(10)
              : asNumericBase(
                  js(node.b, {
                    ...props,
                    base: real(10),
                    bindings: new Bindings(),
                  }),
                ),
          })
        case "with":
        case "withseq": {
          throw new Error("no with yet")
          // return props.bindings.withAll(
          //   withBindingsGlsl(node.b, node.kind == "withseq", props),
          //   () => glsl(node.a, props),
          // )
        }
        case ".":
          if (node.b.type == "var" && !node.b.sub && node.b.kind == "var") {
            const value =
              node.b.value == "x" || node.b.value == "real" ?
                FN_REAL.glsl(props.ctx, glsl(node.a, props))
              : node.b.value == "y" || node.b.value == "imag" ?
                FN_IMAG.glsl(props.ctx, glsl(node.a, props))
              : null

            if (value == null) {
              break
            }

            if (node.b.sup) {
              return OP_RAISE.glsl(props.ctx, value, glsl(node.b.sup, props))
            } else {
              return value
            }
          }
      }
      const op = OP_BINARY[node.kind]
      if (op) {
        return op.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
      }
      throw new Error(`The operator '${node.kind}' is not supported yet.`)
    case "group":
      if (node.lhs == "(" && node.rhs == ")") {
        return glsl(node.value, props)
      }
      break // TODO:
    // if (node.lhs == "[" && node.rhs == "]") {
    //   const args = commalist(node.value).map((item) => glsl(item, props))
    //   if (args.some((x) => x.list !== false)) {
    //     throw new Error("Cannot store a list inside another list.")
    //   }
    //   return listGlsl(props.ctx, args)
    // }
    // if (node.lhs == "|" && node.rhs == "|") {
    //   return ABS.glsl(props.ctx, glsl(node.value, props))
    // }
    // break
    case "call":
      if (
        !node.on &&
        node.name.type == "var" &&
        node.name.kind == "prefix" &&
        !node.name.sub &&
        !node.name.sup
      ) {
        const args = fnargs(node.args)
        if (node.on) {
          args.unshift(node.on)
        }
        return glslCall(node.name.value, args, !!node.on, props)
      }
      break
    case "juxtaposed":
      return OP_CDOT.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
    case "var": {
      const value = props.bindings.get(id(node))
      if (value) {
        if (node.sup) {
          return OP_RAISE.glsl(props.ctx, value, glsl(node.sup, props))
        } else {
          return value
        }
      }

      builtin: {
        if (node.sub) break builtin

        const value = VARS[node.value]?.glsl
        if (!value) break builtin

        if (!node.sup) return value
        return OP_RAISE.glsl(props.ctx, value, glsl(node.sup, props))
      }

      throw new Error(`The variable '${node.value}' is not defined.`)
    }
    case "frac":
      throw new Error("no frac yet")
    // return DIV.glsl(props.ctx, glsl(node.a, props), glsl(node.b, props))
    case "raise":
      return OP_RAISE.glsl(
        props.ctx,
        glsl(node.base, props),
        glsl(node.exponent, props),
      )
    case "cmplist":
      return node.ops
        .map((op, i) => {
          const a = glsl(node.items[i]!, props)
          const b = glsl(node.items[i + 1]!, props)
          return pickCmp(op).glsl(props.ctx, a, b)
        })
        .reduce((a, b) => OP_AND.glsl(props.ctx, a, b))
    case "piecewise": {
      const name = props.ctx.name()

      let isDefinitelyAssigned = false
      const pieces = node.pieces.map(({ value, condition }, index) => {
        if (index == node.pieces.length - 1 && condition.type == "void") {
          isDefinitelyAssigned = true
          condition = { type: "var", kind: "var", value: "true" }
        }

        const ctxCond = props.ctx.fork()
        const cond = glsl(condition, { ...props, ctx: ctxCond })
        if (cond.list !== false) {
          throw new Error(
            "Lists cannot be used as the condition for a piecewise function yet.",
          )
        }
        if (cond.type != "bool") {
          throw new Error(
            "The 'if' clause in a piecewise function must be a condition like z = 2.",
          )
        }

        const ctxValue = props.ctx.fork()
        const val = glsl(value, { ...props, ctx: ctxValue })

        return { ctxCond, ctxValue, value: val, cond }
      })

      const ret = coerceType(pieces.map((x) => x.value))!

      props.ctx.push`${declareGlsl(ret, name)};\n`
      let closers = ""
      throw new Error("no piecewises yet")
      // for (const { ctxCond, cond, ctxValue, value } of pieces) {
      // props.ctx.block += ctxCond.block
      // props.ctx.push`if (${cond.expr}) {\n`
      // props.ctx.block += ctxValue.block
      // props.ctx.push`${name} = ${coerceValueGlsl(props.ctx, value, ret)};\n`
      // props.ctx.push`} else {\n`
      // closers += "}"
      // }
      if (!isDefinitelyAssigned) {
        throw new Error("piecewises without definite assignment?? not yet")
        // props.ctx.push`${name} = ${garbageValueGlsl(props.ctx, ret)};\n`
      }
      props.ctx.block += closers + "\n"

      return { ...ret, expr: name }
    }
    case "error":
      throw new Error(node.reason)
    case "magicvar":
      if (node.value == "iterate") {
        const parsed = parseIterate(node, { source: "expr" })
        const { data, count } = iterateGlsl(parsed, { eval: props, seq: false })
        if (parsed.retval == "count") {
          return count
        } else {
          return data[parsed.retval!.id]!
        }
      }
      break
    case "void":
      throw new Error("Empty expression.")
    case "index":
      throw new Error("no index yet")
    // const on = glsl(node.on, props)
    // if (on.list === false) {
    //   throw new Error("Cannot index on a non-list.")
    // }
    // const indexVal = js(node.index, { ...props, bindings: new Bindings() })
    // if (indexVal.list) {
    //   throw new Error("Cannot index with a list yet.")
    // }
    // if (!isReal(indexVal)) {
    //   throw new Error("Indices must be numbers for now.")
    // }
    // const index = num(indexVal.value)
    // if (index != Math.floor(index) || index <= 0 || index > on.list) {
    //   throw new Error(
    //     `Index ${index} is out-of-bounds on list of length ${on.list}.`,
    //   )
    // }
    // return {
    //   type: on.type,
    //   list: false,
    //   expr: `${on.expr}[${index - 1}]`,
    // }
    case "commalist":
      throw new Error("Lists must be surrounded by square brackets.")
    case "sub":
      throw new Error("Invalid subscript.")
    case "sup":
      throw new Error("Lone superscript.")
    case "mixed":
      throw new Error("no mixed yet")
    // return {
    //   ...ADD.glsl1(
    //     props.ctx,
    //     { expr: parseNumberGlsl(node.integer, props.base), type: "real" },
    //     DIV.glsl1(
    //       props.ctx,
    //       { expr: parseNumberGlsl(node.a, props.base), type: "real" },
    //       { expr: parseNumberGlsl(node.b, props.base), type: "real" },
    //     ),
    //   ),
    //   list: false,
    // }
    case "num16":
    case "for":
    case "matrix":
    case "bigsym":
    case "big":
    case "root":
    case "factorial":
    case "punc":
  }

  throw new Error(
    `Node type '${node.type}' is not implemented for shaders yet.`,
  )
}
