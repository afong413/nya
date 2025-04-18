import type { SReal } from "@/eval/ty"
import { num, real } from "@/eval/ty/create"
import { add, mul } from "@/eval/ty/ops"
import { v32Add, v32Dot, v32Neg } from "./vector"

/**
 * @param a A matrix
 * @returns The additive inverse
 */
export function m32Neg(a: SReal[][]): SReal[][] {
  return a.map(v32Neg)
}

/**
 * @param a A matrix
 * @returns The transpose
 */
export function m32Transpose(a: SReal[][]): SReal[][] {
  if (!a.length) throw new Error("Cannot take the transpose of an empty matrix")

  return a[0]!.map((_, j) => a.map((row) => row[j]!))
}

/**
 * @param a A matrix
 * @param b A matrix
 * @returns The sum
 */
export function m32Add(a: SReal[][], b: SReal[][]): SReal[][] {
  if (!a.length || !b.length) throw new Error("Cannot add empty matrices.")

  if (a.length !== b.length || a[0]!.length !== b[0]!.length)
    throw new Error("Can only add matrices of the same size.")

  return a.map((row, i) => v32Add(row, b[i]!))
}

// AIDEN/TODO: Implement Strassen Algorithm
/**
 * The width of `a` must be equal to the height of the `b`.
 *
 * @param a A matrix of size i x j
 * @param b A matrix of size j x k
 * @returns The product
 */
export function m32Mul(a: SReal[][], b: SReal[][]): SReal[][] {
  if (!a.length || !b.length) throw new Error("Cannot multiply empty matrices.")

  if (a[0]!.length !== b.length)
    throw new Error(
      "To multiply matrices, the width of the first matrix must be equal to the height of the second matrix.",
    )

  const bT = m32Transpose(b)

  return a.map((row) => b[0]!.map((_, j) => v32Dot(row, bT[j]!)))
}

/**
 * `a` and `b` must be the same size.
 *
 * @param a A matrix
 * @param b A matrix
 * @returns The Hadamard product
 */
export function m32Hadamard(a: SReal[][], b: SReal[][]): SReal[][] {
  if (!a.length || !b.length)
    throw new Error("Cannot take the Hadamard product of empty matrices.")

  if (a.length !== b.length || a[0]!.length !== b[0]!.length)
    throw new Error(
      "To take the Hadamard product of two matrices, they must be the same size.",
    )

  return a.map((row, i) => row.map((x, j) => mul(x, b[i]![j]!)))
}

export function m32ScalMulRight(a: SReal[][], b: SReal): SReal[][] {
  return a.map((row) => row.map((x) => mul(b, x)))
}

export function m32Det(a: SReal[][]): SReal {
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
          m32Det(
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
export function m32Eq(a: SReal[][], b: SReal[][]): boolean {
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
export function m32Inv(a: SReal[][]): SReal[][] {
  if (a.length !== a[0]!.length)
    throw new Error("Can only take the inverse of a square matrix.")

  let b = a.map((row) => row.map((x) => num(x)))

  let c = m32Id(b.length).map((row) => row.map((x) => num(x)))

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
export function m32Pow(a: SReal[][], b: SReal): SReal[][] {
  if (a.length !== a[0]!.length)
    throw new Error("Can only take the power of a square matrix.")

  const B = num(b)

  if (!Number.isInteger(B))
    throw new Error("Can only take integer powers of a matrix.")

  if (!B) return m32Id(a.length)

  function m32PowHelper(a: SReal[][], b: number): SReal[][] {
    if (b === 1) return a

    if (b % 2) {
      const A = m32PowHelper(a, (b - 1) / 2)
      return m32Mul(a, m32Mul(A, A))
    } else {
      const A = m32PowHelper(a, b / 2)
      return m32Mul(A, A)
    }
  }

  return B < 0 ? m32PowHelper(m32Inv(a), -B) : m32PowHelper(a, B)
}

export function m32Id(n: number): SReal[][] {
  return Array.apply(null, Array(n)).map((_, i) =>
    Array.apply(null, Array(n)).map((_, j) => real(+(i === j))),
  )
}
