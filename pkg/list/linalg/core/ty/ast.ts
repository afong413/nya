import type { Node, Nodes } from "@/eval/ast/token"
import { js, NO_DRAG, NO_SYM, type TxrAst } from "@/eval/ast/tx"
import { glslIssue } from "./etc"
import type { PropsJs } from "@/eval/js"
import type { GlslValue, JsValue, SReal } from "@/eval/ty"
import { real } from "@/eval/ty/create"
import { coerceValueJs } from "@/eval/ty/coerce"
import type { PropsGlsl } from "@/eval/glsl"

function matrixJs(cols: number, valuesRaw: Node[], props: PropsJs): JsValue {
  let values1D = valuesRaw.map((rawValue) => {
    if (rawValue.type === "void") {
      return real(0)
    }

    const value = js(rawValue, props)
    return coerceValueJs(value, {
      type: "r32",
      list: false,
    }).value as SReal
  })

  // Create Vector
  if (cols === 1) {
    return {
      type: "v32",
      list: false,
      value: values1D,
    }
  }

  let values: SReal[][] = []
  while (values1D.length) values.push(values1D.splice(0, cols))

  if (values[values.length - 1]!.length < cols) {
    throw new Error("Matrix must be rectangular.")
  }

  return {
    type: "m32",
    list: false,
    value: values,
  }
}

function matrixGlsl(
  cols: number,
  valuesRaw: Node[],
  props: PropsGlsl,
): GlslValue {
  return glslIssue()
}

export const matrixAst = {
  label: "parse matrices",
  sym: NO_SYM,
  js(node, props) {
    return matrixJs(node.cols, node.values, props)
  },
  glsl(node, props) {
    return matrixGlsl(node.cols, node.values, props)
  },
  drag: NO_DRAG,
  deps(node, deps) {
    for (const value of node.values) {
      deps.add(value)
    }
  },
} satisfies TxrAst<Nodes["matrix"]>
