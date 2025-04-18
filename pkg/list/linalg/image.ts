import type { Package } from "#/types"
import type { Tys } from "@/eval/ty"
import { OP_CDOT, OP_CROSS, OP_JUXTAPOSE } from "../core/ops"
import { imageShaderError } from "../image"
import { mr32Mul } from "./core/matrix"

/**
 * @param m A 2x2 matrix
 * @param img An `image2d`
 * @returns The image of `img` under the linear transformation
 */
export function mr32TransformImage(
  m: Tys["mr32"],
  img: Tys["image2d"],
): Tys["image2d"] {
  if (m.length !== 2 || m[0]!.length !== 2)
    throw new Error("Can only transform an image with a 2x2 matrix.")

  const p1 = [[img.p1.x], [img.p1.y]]
  const p2 = [[img.p2.x], [img.p2.y]]
  const p3 = [[img.p3.x], [img.p3.y]]
  const q1 = mr32Mul(m, p1).flat()
  const q2 = mr32Mul(m, p2).flat()
  const q3 = mr32Mul(m, p3).flat()

  return {
    data: img.data,
    p1: { type: "point", x: q1[0]!, y: q1[1]! },
    p2: { type: "point", x: q2[0]!, y: q2[1]! },
    p3: { type: "point", x: q3[0]!, y: q3[1]! },
  }
}

export default {
  name: "linear algebra images",
  label: null,
  category: "linear algebra",
  deps: ["core/ops", "num/real", "linalg/core", "geo/image"],
  load() {
    OP_JUXTAPOSE.add(
      ["mr32", "image2d"],
      "image2d",
      (m, img) => mr32TransformImage(m.value, img.value),
      imageShaderError,
      "",
    )

    OP_CDOT.add(
      ["mr32", "image2d"],
      "image2d",
      (m, img) => mr32TransformImage(m.value, img.value),
      imageShaderError,
      "",
    )

    OP_CROSS.add(
      ["mr32", "image2d"],
      "image2d",
      (m, img) => mr32TransformImage(m.value, img.value),
      imageShaderError,
      "",
    )
  },
} satisfies Package
