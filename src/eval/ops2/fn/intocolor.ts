import { FnDist } from "../../fn/dist"
import { FN_DEBUGQUADRANT } from "./debugquadrant"
import { FN_HSV } from "./hsv"

function err(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

export const FN_INTOCOLOR = new FnDist("intocolor")
  .add(
    ["bool"],
    "color",
    err,
    (_, a) =>
      `(${a.expr} ? vec4(vec3(0x2d, 0x70, 0xb3) / 255.0, 1.0) : vec4(0))`,
  )
  .add(["color"], "color", err, (_, a) => a.expr)
  .add(
    ["r32"],
    "color",
    err,
    (ctx, a) =>
      FN_HSV.glsl1(
        ctx,
        a,
        { type: "r32", expr: "1.0" },
        { type: "r32", expr: "1.0" },
      ).expr,
  )
  .add(["c32"], "color", err, (ctx, a) => FN_DEBUGQUADRANT.glsl1(ctx, a).expr)
