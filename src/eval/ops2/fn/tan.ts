import { FnDist } from "../../fn/dist"
import { approx, num } from "../../ty/create"
import { declareDiv, divPt } from "../op/div"
import { cosPt, declareCos } from "./cos"
import { declareSin, sinPt } from "./sin"

export const FN_TAN = new FnDist("tan")
  .add(
    ["r32"],
    "r32",
    (a) => approx(Math.tan(num(a.value))),
    (_, a) => `tan(${a.expr})`,
  )
  .add(
    ["c32"],
    "c32",
    (a) => divPt(sinPt(a.value), cosPt(a.value)),
    (ctx, a) => {
      declareDiv(ctx)
      declareSin(ctx)
      declareCos(ctx)
      ctx.glsl`vec2 _helper_tan(vec2 a) {
  return _helper_div(_helper_sin(a), _helper_cos(a));
}
`
      return `_helper_tan(${a.expr})`
    },
  )
