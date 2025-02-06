import type { GlslContext } from "../../lib/fn"
import type { SReal } from "../../ty"
import { approx, frac, num } from "../../ty/create"
import { FnDist } from "../dist"
import { declareCmpR64 } from "../fn/cmp"
import { declareSubR64 } from "./sub"

// TODO: could be exact for pythag triples
export function abs(v: SReal): SReal {
  if (v.type == "exact") {
    return frac(Math.abs(v.n), v.d)
  } else {
    return approx(Math.abs(v.value))
  }
}

// TODO: perf could probs be drastically improved
export function abs64(ctx: GlslContext, x: string) {
  declareCmpR64(ctx)
  declareSubR64(ctx)
  ctx.glsl`vec2 _helper_abs_r64(vec2 x) {
  if (_helper_cmp_r64(vec2(0), x) == -1.0) {
    x = _helper_sub_r64(vec2(0), x);
  }
  return x;
}
`
  return `_helper_abs_r64(${x})`
}

export const OP_ABS = new FnDist(
  "abs",
  "takes the absolute value of a number, or gets the magnitude of a complex number",
)
  .add(
    ["r64"],
    "r64",
    (a) => abs(a.value),
    (ctx, a) => abs64(ctx, a.expr),
  )
  .add(
    ["r32"],
    "r32",
    (a) => abs(a.value),
    (_, a) => `abs(${a.expr})`,
  )
  .add(
    ["c32"],
    "r32",
    // TODO: this is exact for some values
    (a) => approx(Math.hypot(num(a.value.x), num(a.value.y))),
    (_, a) => `length(${a.expr})`,
  )
  .add(
    ["point32"],
    "r32",
    // TODO: this is exact for some values
    (a) => approx(Math.hypot(num(a.value.x), num(a.value.y))),
    (_, a) => `length(${a.expr})`,
  )
