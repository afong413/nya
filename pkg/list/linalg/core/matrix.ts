import type { GlslValue, JsValue, SReal } from "@/eval/ty"
import { num, real } from "@/eval/ty/create"
import { add, mul } from "@/eval/ty/ops"
import { vr32Add, vr32Dot, vr32Neg } from "./vector"
import type { TyWrite } from "@/eval/ty/display"
import { CmdMatrix } from "@/field/cmd/math/matrix"
import { Block } from "@/field/model"
import { L, R } from "@/field/dir"
import type { PropsGlsl } from "@/eval/glsl"
import { js } from "@/eval/ast/tx"
import type { PropsJs } from "@/eval/js"
import { coerceValueJs } from "@/eval/ty/coerce"
import type { Node } from "@/eval/ast/token"
import { issue } from "@/eval/ops/issue"

export const glslIssue = issue("Matrices are not supported in shaders yet.")

export const WRITE_MATRIX: TyWrite<SReal[][]> = {
  isApprox(value) {
    return value.some((x) => x.some((x) => x.type === "approx"))
  },
  display(value, props) {
    if (value.length === 0) {
      new CmdMatrix(0, []).insertAt(props.cursor, L)
      return
    }
    new CmdMatrix(
      value[0]!.length,
      value.flat().map((x) => {
        const block = new Block(null)

        props.at(block.cursor(R)).num(x)

        return block
      }),
    ).insertAt(props.cursor, L)
  },
}

export function matrixJs(cols: number, valuesRaw: Node[], props: PropsJs): JsValue {
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
      type: "vr32",
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
    type: "mr32",
    list: false,
    value: values,
  }
}

export function matrixGlsl(
  cols: number,
  valuesRaw: Node[],
  props: PropsGlsl,
): GlslValue {
  return glslIssue()
}

/**
 * @param a A matrix
 * @returns The additive inverse
 */
export function mr32Neg(a: SReal[][]): SReal[][] {
  return a.map(vr32Neg)
}

/**
 * @param a A matrix
 * @returns The transpose
 */
export function mr32Transpose(a: SReal[][]): SReal[][] {
  if (!a.length) throw new Error("Cannot take the transpose of an empty matrix")

  return a[0]!.map((_, j) => a.map((row) => row[j]!))
}

/**
 * @param a A matrix
 * @param b A matrix
 * @returns The sum
 */
export function mr32Add(a: SReal[][], b: SReal[][]): SReal[][] {
  if (!a.length || !b.length) throw new Error("Cannot add empty matrices.")

  if (a.length !== b.length || a[0]!.length !== b[0]!.length)
    throw new Error("Can only add matrices of the same size.")

  return a.map((row, i) => vr32Add(row, b[i]!))
}

// AIDEN/TODO: Implement Strassen Algorithm
/**
 * The width of `a` must be equal to the height of the `b`.
 *
 * @param a A matrix of size i x j
 * @param b A matrix of size j x k
 * @returns The product
 */
export function mr32Mul(a: SReal[][], b: SReal[][]): SReal[][] {
  if (!a.length || !b.length) throw new Error("Cannot multiply empty matrices.")

  if (a[0]!.length !== b.length)
    throw new Error(
      "To multiply matrices, the width of the first matrix must be equal to the height of the second matrix.",
    )

  const bT = mr32Transpose(b)

  return a.map((row) => b[0]!.map((_, j) => vr32Dot(row, bT[j]!)))
}

/**
 * `a` and `b` must be the same size.
 *
 * @param a A matrix
 * @param b A matrix
 * @returns The Hadamard product
 */
export function mr32Hadamard(a: SReal[][], b: SReal[][]): SReal[][] {
  if (!a.length || !b.length)
    throw new Error("Cannot take the Hadamard product of empty matrices.")

  if (a.length !== b.length || a[0]!.length !== b[0]!.length)
    throw new Error(
      "To take the Hadamard product of two matrices, they must be the same size.",
    )

  return a.map((row, i) => row.map((x, j) => mul(x, b[i]![j]!)))
}

export function mr32ScalMul(a: SReal[][], b: SReal): SReal[][] {
  return a.map((row) => row.map((x) => mul(b, x)))
}

export function mr32Det(a: SReal[][]): SReal {
  if (!a.length) return real(NaN)

  if (a.length !== a[0]!.length)
    throw new Error("Cannot take the determinant of a non-square matrix.")

  if (a.length === 1) return a[0]![0]!

  return a[0]!
    .map((x, i) =>
      mul(
        real(i % 2 ? -1 : 1),
        mul(
          x,
          mr32Det(
            a
              .slice(1, a.length)
              .map((row) => row.slice(0, i).concat(row.slice(i + 1))),
          ),
        ),
      ),
    )
    .reduce(add)
}

/**
 * `a` and `b` must be the same size.
 *
 * @param a A matrix
 * @param b A matrix
 * @returns `true` if the coorsponding elements are equal and `false` otherwise
 */
export function mr32Eq(a: SReal[][], b: SReal[][]): boolean {
  if (!a.length || !b.length)
    throw new Error("Cannot compare empty matrice(s).")

  if (a.length !== b.length || a[0]!.length !== b[0]!.length)
    throw new Error("Cannot compare matrices of different sizes.")

  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a[0]!.length; j++)
      if (num(a[i]![j]!) !== num(b[i]![j]!)) return false

  return true
}

// AIDEN/TODO: Prevent approximate values when possible
export function mr32Inv(a: SReal[][]): SReal[][] {
  if (a.length !== a[0]!.length)
    throw new Error("Can only take the inverse of a square matrix.")

  let b = a.map((row) => row.map((x) => num(x)))

  let c = mr32Id(b.length).map((row) => row.map((x) => num(x)))

  for (let i = 0; i < b.length; i++) {
    let k = i
    while (b[i]![k]! === 0) {
      k++
      if (k >= b.length) throw new Error("Matrix is not invertable.")
    }
    b.splice(i, 0, b.splice(k, 1)[0]!)
    c.splice(i, 0, c.splice(k, 1)[0]!)

    for (let j = 0; j < b.length; j++) {
      if (i === j) continue

      const x = b[j]![i]! / b[i]![i]!

      for (let k = 0; k < b.length; k++) {
        b[j]![k]! -= x * b[i]![k]!
        c[j]![k]! -= x * c[i]![k]!
      }
    }
  }

  return c.map((row, i) => row.map((x) => real(x / b[i]![i]!)))
}

// AIDEN/TODO: Implement Jordon cananonical form
export function mr32Pow(a: SReal[][], b: SReal): SReal[][] {
  if (a.length !== a[0]!.length)
    throw new Error("Can only take the power of a square matrix.")

  const B = num(b)

  if (!Number.isInteger(B))
    throw new Error("Can only take integer powers of a matrix.")

  if (!B) return mr32Id(a.length)

  function mr32PowHelper(a: SReal[][], b: number): SReal[][] {
    if (b === 1) return a

    if (b % 2) {
      const A = mr32PowHelper(a, (b - 1) / 2)
      return mr32Mul(a, mr32Mul(A, A))
    } else {
      const A = mr32PowHelper(a, b / 2)
      return mr32Mul(A, A)
    }
  }

  return B < 0 ? mr32PowHelper(mr32Inv(a), -B) : mr32PowHelper(a, B)
}

export function mr32Id(n: number): SReal[][] {
  return Array.apply(null, Array(n)).map((_, i) =>
    Array.apply(null, Array(n)).map((_, j) => real(+(i === j))),
  )
}
