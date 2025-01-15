import { declareR64 } from ".."
import type { GlslContext } from "../../../fn"
import { FnDist } from "../../../fn/dist"
import type { SReal } from "../../../ty"
import { approx, frac, num, pt } from "../../../ty/create"
import type { JsVal } from "../../../ty2"
import { safe } from "../../../util"

export function add(a: SReal, b: SReal) {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    const s3 = a.d * b.d
    if (!safe(s3)) break a
    const s4 = s1 + s2
    if (!safe(s4)) break a
    return frac(s4, s3)
  }

  return approx(num(a) + num(b))
}

export function declareAddR64(ctx: GlslContext) {
  declareR64(ctx)
  ctx.glsl`
vec2 _helper_add_r64(vec2 dsa, vec2 dsb) {
  vec2 dsc;
  float t1, t2, e;

  t1 = r64_add(dsa.x, dsb.x);
  e = r64_sub(t1, dsa.x);
  t2 = r64_add(
    r64_add(
      r64_add(r64_sub(dsb.x, e), r64_sub(dsa.x, r64_sub(t1, e))),
      dsa.y
    ),
    dsb.y
  );
  dsc.x = r64_add(t1, t2);
  dsc.y = r64_sub(t2, r64_sub(dsc.x, t1));
  return dsc;
}
`
}

function r64(ctx: GlslContext, a: string, b: string) {
  declareAddR64(ctx)
  return `_helper_add_r64(${a}, ${b})`
}

function complex(a: JsVal<"c32" | "c64">, b: JsVal<"c32" | "c64">) {
  return pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y))
}

export const OP_ADD = new FnDist("+")
  .add(
    ["r64", "r64"],
    "r64",
    (a, b) => add(a.value, b.value),
    (ctx, a, b) => r64(ctx, a.expr, b.expr),
  )
  .add(["c64", "c64"], "c64", complex, (ctx, ar, br) => {
    const a = ctx.cache(ar)
    const b = ctx.cache(br)
    return `vec4(${r64(ctx, `${a}.xy`, `${b}.xy`)}, ${r64(ctx, `${a}.zw`, `${b}.zw`)})`
  })
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => add(a.value, b.value),
    (_, a, b) => `(${a.expr} + ${b.expr})`,
  )
  .add(["c32", "c32"], "c32", complex, (_, a, b) => `(${a.expr} + ${b.expr})`)
