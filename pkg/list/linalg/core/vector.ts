import type { SReal } from "@/eval/ty"
import { add, mul, neg, sub } from "@/eval/ty/ops"
import { sqrt } from "./util"
import { real } from "@/eval/ty/create"
import { mr32Mul } from "./matrix"
import type { TyWrite } from "@/eval/ty/display"
import { CmdMatrix } from "@/field/cmd/math/matrix"
import { Block } from "@/field/model"
import { L, R } from "@/field/dir"

export const WRITE_VECTOR: TyWrite<SReal[]> = {
  isApprox(value) {
    return value.some((x) => x.type === "approx")
  },
  display(value, props) {
    new CmdMatrix(
      1,
      value.map((x) => {
        const block = new Block(null)

        props.at(block.cursor(R)).num(x)

        return block
      }),
    ).insertAt(props.cursor, L)
  },
}

/**
 * @param a A vector
 * @returns The additive inverse
 */
export function vr32Neg(a: SReal[]): SReal[] {
  return a.map(neg)
}

/**
 * `a` and `b` must have the same dimension.
 *
 * @param a A vector
 * @param b A vector
 * @returns The sum
 */
export function vr32Add(a: SReal[], b: SReal[]): SReal[] {
  if (a.length != b.length)
    throw new Error("Can only add vectors of the same size.")

  return a.map((x, i) => add(x, b[i]!))
}

/**
 * @param a A vector
 * @param b A scaler
 * @returns The product
 */
export function vr32ScalMul(a: SReal[], b: SReal): SReal[] {
  return a.map((x) => mul(x, b))
}

/**
 * `a` and `b` must have the same dimension.
 *
 * @param a A vector
 * @param b A vector
 * @returns The Euclidean inner product
 */
export function vr32Dot(a: SReal[], b: SReal[]): SReal {
  if (a.length != b.length)
    throw new Error(
      "To take the dot product of two vectors, they must be the same size.",
    )

  return a.map((x, i) => mul(x, b[i]!)).reduce(add)
}

/**
 * @param a A vector
 * @returns The Euclidean norm
 */
export function vr32Norm(a: SReal[]): SReal {
  return sqrt(vr32Dot(a, a))
}

/**
 * The cross product is defined only on 3- and 7-dimensional vector spaces (see
 * Hurwitz's Theorem).
 *
 * @param a A 3-dimensional vector
 * @param b A 3-dimensional vector
 * @returns The cross product
 */
export function vr32Cross(a: SReal[], b: SReal[]): SReal[] {
  if (a.length === 3 && b.length === 3)
    return [
      sub(mul(a[1]!, b[2]!), mul(a[2]!, b[1]!)),
      sub(mul(a[2]!, b[0]!), mul(a[0]!, b[2]!)),
      sub(mul(a[0]!, b[1]!), mul(a[1]!, b[0]!)),
    ]
  if (a.length === 7 && b.length === 7) {
    const m = [
      [real(0), neg(a[3]!), neg(a[6]!), a[1]!, neg(a[5]!), a[4]!, a[2]!],
      [a[3]!, real(0), neg(a[4]!), neg(a[0]!), a[2]!, neg(a[6]!), a[5]!],
      [a[6]!, a[4]!, real(0), neg(a[5]!), neg(a[1]!), a[3]!, neg(a[0]!)],
      [neg(a[1]!), a[0]!, a[5]!, real(0), neg(a[6]!), neg(a[2]!), a[4]!],
      [a[5]!, neg(a[2]!), a[1]!, a[6]!, real(0), neg(a[0]!), neg(a[3]!)],
      [neg(a[4]!), a[6]!, neg(a[3]!), a[2]!, a[0]!, real(0), neg(a[1]!)],
      [neg(a[2]!), neg(a[5]!), a[0]!, neg(a[4]!), a[3]!, a[1]!, real(0)],
    ]

    return mr32Mul(
      m,
      b.map((x) => [x]),
    ).flat()
  }
  throw new Error(
    "Can only take the cross product of two 3- or two 7-dimensional vectors.",
  )
}
