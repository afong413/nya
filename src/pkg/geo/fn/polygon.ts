import { FnList } from "../../../eval/ops/list"

function glsl(): never {
  throw new Error("Cannot construct polygons in shaders.")
}

export const FN_POLYGON = new FnList(
  "polygon",
  "constructs a polygon from a set of points",
).addSpread(
  "point32",
  1,
  "polygon",
  (...args) => args.map((x) => x.value),
  glsl,
)
