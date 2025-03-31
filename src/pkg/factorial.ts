import { Precedence } from "@/eval/ast/token"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import { binary, suffixFn, SYM_1, txr, unary } from "@/eval/sym"
import { approx, num, real, rept } from "@/eval/ty/create"
import { CmdExclamation } from "@/field/cmd/leaf/exclamation"
import { SymPsi } from "@/field/cmd/leaf/sym"
import { CmdBrack } from "@/field/cmd/math/brack"
import { CmdSupSub } from "@/field/cmd/math/supsub"
import { Block, L, R } from "@/field/model"
import digamma from "@stdlib/math/base/special/digamma"
import factorial from "@stdlib/math/base/special/factorial"
import polygamma from "@stdlib/math/base/special/polygamma"
import { complex, gamma, type Complex } from "mathjs"
import type { Package } from "."
import { chain, OP_ADD, OP_JUXTAPOSE } from "./core/ops"

function factorialGlsl(ctx: GlslContext, x: string) {
  ctx.glsl`float sinpiSeries(float x) {
  float xsq = x * x;
  return x * (3.141592653589793 - xsq * (5.167708 - xsq * (2.549761 - xsq * 0.5890122)));
}

float sinpi(float x) {
  if (isnan(x) || isinf(x)) {
    return 0.0 / 0.0;
  }
  if (x == 0.0) {
    return x;
  }
  if (x == floor(x)) {
    return x > 0.0 ? 0.0 : -0.0;
  }
  int i = int(floor(2.0 * x + 0.5));
  float t = -0.5 * float(i) + x;
  float s = bool(i & 2) ? -1.0 : 1.0;
  float y = bool(i & 1) ? cos(3.141592653589793 * t) : sinpiSeries(t);
  return s * y;
}

float sincpi(float x) {
  return isnan(x)
    ? 0.0 / 0.0
    : isinf(x)
    ? 0.0
    : x == 0.0
    ? 1.0
    : sinpi(x) / (3.141592653589793 * x);
}

float stirlingPrefactor(float x, float y) {
  if (isnan(x) || isnan(y)) {
    return 0.0 / 0.0;
  }
  return pow(x / exp(1.0), y);
}

float stirlerrSeries(float x) {
  float S0 = 0.083333336;
  float S1 = 0.0027777778;
  float S2 = 0.0007936508;
  float nn = x * x;
  return (S0 - (S1 - S2 / nn) / nn) / x;
}

float factorialMinimax(float x) {
  float n1 = 2.1618295;
  float n2 = 1.5849807;
  float n3 = 0.4026814;
  float d1 = 2.2390451;
  float d2 = 1.6824219;
  float d3 = 0.43668285;

  float n = 1.0 + x * (n1 + x * (n2 + x * n3));
  float d = 1.0 + x * (d1 + x * (d2 + x * d3));
  float xp1 = x + 1.0;

  return stirlingPrefactor(xp1, x) * sqrt(xp1) * (n / d);
}

float factorialAsymptotic(float x) {
  return stirlingPrefactor(x, x) *
  sqrt(2.0 * 3.141592653589793 * x) *
  exp(stirlerrSeries(x));
}

float factorialPositive(float x) {
  return x > 34.04
    ? 1.0 / 0.0
    : x > 8.0
    ? factorialAsymptotic(x)
    : factorialMinimax(x);
}

float factorial(float x) {
  if (isnan(x) || isinf(x) && x < 0.0) {
    return 0.0 / 0.0;
  }

  bool isInteger = x == floor(x);
  if (x < 0.0) {
    if (isInteger) {
      return 1.0 / 0.0;
    }
    return 1.0 / (sincpi(x) * factorialPositive(-x));
  }
  float approx = factorialPositive(x);
  return isInteger ? round(approx) : approx;
}
`

  return `factorial(${x})`
}

export const FN_DIGAMMA: FnDist = new FnDist(
  "digamma",
  "computes the derivative of the natural logarithm of the gamma function",
  {
    deriv: unary((wrt, x) => {
      return chain(x, wrt, {
        type: "call",
        fn: FN_POLYGAMMA,
        args: [SYM_1, x],
      })
    }),
    display([a, b]) {
      if (!(a && !b)) return

      const block = new Block(null)
      const cursor = block.cursor(R)
      new SymPsi().insertAt(cursor, L)

      const arg = txr(a).display(a).block
      new CmdBrack("(", ")", null, arg).insertAt(cursor, L)

      return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
    },
  },
).add(
  ["r32"],
  "r32",
  (a) => {
    return approx(digamma(num(a.value)))
  },
  () => {
    throw new Error(
      "Cannot compute the digamma function in shaders yet. (The digamma function is generated when you take the derivative of a factorial.)",
    )
  },
  "\\psi(2)≈0.422784",
)

export const FN_POLYGAMMA: FnDist = new FnDist(
  "polygamma",
  "computes repeated derivatives of the natural logarithm of the gamma function",
  {
    deriv: binary((wrt, n, x) => {
      if (txr(n).uses(n, wrt)) {
        throw new Error(
          "The index of the polygamma function cannot depend on the variable with respect to which you take the derivative. For example, d/dx polygamma(x,x) is not allowed.",
        )
      }
      return chain(x, wrt, {
        type: "call",
        fn: FN_POLYGAMMA,
        args: [{ type: "call", fn: OP_ADD, args: [n, SYM_1] }, x],
      })
    }),
    display([a, b, c]) {
      if (!(a && b && !c)) return

      const block = new Block(null)
      const cursor = block.cursor(R)
      new SymPsi().insertAt(cursor, L)

      const superscript = new Block(null)
      const index = txr(a).display(a).block
      new CmdBrack("(", ")", null, index).insertAt(superscript.cursor(R), L)
      new CmdSupSub(null, superscript).insertAt(cursor, L)

      const arg = txr(b).display(b).block
      new CmdBrack("(", ")", null, arg).insertAt(cursor, L)

      return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
    },
  },
).add(
  ["r32", "r32"],
  "r32",
  (a, b) => {
    return approx(polygamma(num(a.value), num(b.value)))
  },
  () => {
    throw new Error(
      "Cannot compute the polygamma function in shaders yet. (The polygamma function is generated when you take the derivative of a factorial.)",
    )
  },
  "\\psi^(3)(2)≈0.493939",
)

const OP_FACTORIAL: FnDist = new FnDist("!", "computes a factorial", {
  message: "Cannot take the factorial of %%.",
  display: suffixFn(() => new CmdExclamation(), Precedence.Atom),
  deriv: unary((wrt, a) =>
    chain(a, wrt, {
      type: "call",
      fn: OP_JUXTAPOSE,
      args: [
        {
          type: "call",
          fn: OP_FACTORIAL,
          args: [a],
        },
        {
          type: "call",
          // TODO: decide whether to use digamma or polygamma
          fn: FN_DIGAMMA,
          args: [
            {
              type: "call",
              fn: OP_ADD,
              args: [a, SYM_1],
            },
          ],
        },
      ],
    }),
  ),
})
  .add(
    ["r32"],
    "r32",
    (a) => {
      const val = num(a.value)
      if (val == Math.floor(val) && val < 0) {
        return real(Infinity)
      }
      return real(factorial(val))
    },
    (ctx, a) => factorialGlsl(ctx, a.expr),
    "7! =5040=7\\cdot6\\cdot5\\cdot4\\cdot3\\cdot2\\cdot1",
  )
  .add(
    ["c32"],
    "c32",
    ({ value }) => {
      const x = num(value.x)
      const y = num(value.y)
      if (y == 0 && x == Math.floor(x) && x < 0) {
        return rept({ x: Infinity, y: 0 })
      }
      // The type signature lies.
      const result = gamma(complex(x + 1, y)) as number | Complex
      if (typeof result == "number") {
        return rept({ x: result, y: 0 })
      } else {
        return rept({ x: result.re, y: result.im })
      }
    },
    () => {
      throw new Error(
        "Cannot take factorials of complex numbers in shaders yet.",
      )
    },
    "(2+3i)!≈-0.44011-0.06364i",
  )

export const PKG_FACTORIAL: Package = {
  id: "nya:factorial",
  name: "factorial",
  label: "extended factorial operator",
  category: "numbers",
  eval: {
    tx: {
      suffix: {
        factorial: {
          sym(node) {
            if (node.rhs.repeats != 1) {
              throw new Error("Cannot compute higher-order factorials yet.")
            }
            return { type: "call", fn: OP_FACTORIAL, args: [node.base] }
          },
          deps(node, deps) {
            if (typeof node.repeats != "number") {
              deps.add(node.repeats)
            }
          },
          js(node) {
            if (node.rhs.repeats != 1) {
              throw new Error("Cannot compute higher-order factorials yet.")
            }
            return OP_FACTORIAL.js([node.base])
          },
          glsl(node, props) {
            if (node.rhs.repeats != 1) {
              throw new Error("Cannot compute higher-order factorials yet.")
            }
            return OP_FACTORIAL.glsl(props.ctx, [node.base])
          },
        },
      },
    },
  },
}
