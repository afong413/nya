import type { Package } from "#/types"
import {
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_CROSS,
  OP_JUXTAPOSE,
  OP_NEG,
  OP_ODOT,
  OP_POS,
  OP_RAISE,
  OP_SUB,
} from "#/list/core/ops"
import { FnDist } from "@/eval/ops/dist"
import { OP_EQ } from "#/list/core/cmp"
import {
  m32Det,
  m32Eq,
  m32Hadamard,
  m32Mul,
  m32Neg,
  m32Pow,
  m32ScalMulRight as m32ScalMul,
  m32Add as m32add,
} from "./util/matrix"
import {
  v32Add,
  v32Cross,
  v32Dot,
  v32Neg,
  v32Norm,
  v32ScalMul,
} from "./util/vector"
import { m32Info, v32Info } from "./ty/info"
import { matrixAst } from "./ty/ast"
import { glslIssue } from "./ty/etc"

declare module "@/eval/ty" {
  interface Tys {
    m32: SReal[][]
    v32: SReal[]
  }
}

export default {
  name: "linear algebra",
  label: null,
  category: "linear algebra",
  deps: ["core/ops", "num/real"],
  ty: {
    info: {
      m32: m32Info,
      v32: v32Info,
    },
  },
  eval: {
    tx: {
      ast: {
        matrix: matrixAst,
      },
    },
    fn: {
      det: new FnDist("det", "take the determinant of a matrix").add(
        ["m32"],
        "r32",
        (a) => m32Det(a.value),
        glslIssue,
        "\\left|A\\right|=\\left|A\\right|",
      ),
    },
  },
  load() {
    // prettier-ignore
    OP_POS.add(
      ["v32"],
      "v32",
      (a) => a.value,
      glslIssue,
      "+\\begin{matrix}a_1\\\\a_2\\end{matrix}=\\begin{matrix}a_1\\\\a_2\\end{matrix}",
    ).add(
      ["m32"],
      "m32",
      (a) => a.value,
      glslIssue,
      "+\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}=\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}",
    )

    // prettier-ignore
    OP_NEG.add(
      ["v32"],
      "v32",
      (a) => v32Neg(a.value),
      glslIssue,
      "-\\begin{matrix}a_1\\\\a_2\\end{matrix}=\\begin{matrix}-a_1\\\\-a_2\\end{matrix}",
    ).add(
      ["m32"],
      "m32",
      (a) => m32Neg(a.value),
      glslIssue,
      "-\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}=\\begin{matrix}-a_{11}&-a_{12}\\\\-a_{21}&-a_{22}\\end{matrix}",
    )

    OP_ADD.add(
      ["v32", "v32"],
      "v32",
      (a, b) => v32Add(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}+\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}+b_{11}&a_{12}+b_{12}\\\\a_{21}+b_{21}&a_{22}+b_{22}\\end{matrix}",
    ).add(
      ["m32", "m32"],
      "m32",
      (a, b) => m32add(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}+\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}+b_{11}&a_{12}+b_{12}\\\\a_{21}+b_{21}&a_{22}+b_{22}\\end{matrix}",
    )

    OP_SUB.add(
      ["m32", "m32"],
      "m32",
      (a, b) => m32add(a.value, m32Neg(b.value)),
      glslIssue,
      "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}-\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}-b_{11}&a_{12}-b_{12}\\\\a_{21}-b_{21}&a_{22}-b_{22}\\end{matrix}",
    )

    OP_JUXTAPOSE.add(
      ["m32", "v32"],
      "v32",
      (a, b) =>
        m32Mul(
          a.value,
          b.value.map((x) => [x]),
        ).flat(),
      glslIssue,
      "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
    )
      .add(
        ["r32", "v32"],
        "v32",
        (a, b) => v32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["v32", "r32"],
        "v32",
        (a, b) => v32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )
      .add(
        ["m32", "m32"],
        "m32",
        (a, b) => m32Mul(a.value, b.value),
        glslIssue,
        "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}b_{11}+a{12}b_{21}&a_{11}b_{12}+a_{12}b_{22}\\\\a_{21}b_{11}+a_{22}b_{21}&a_{21}b_{12}+a_{22}b_{22}\\end{matrix}",
      )
      .add(
        ["r32", "m32"],
        "m32",
        (a, b) => m32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["m32", "r32"],
        "m32",
        (a, b) => m32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )

    OP_CDOT.add(
      ["v32", "v32"],
      "r32",
      (a, b) => v32Dot(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
    )
      .add(
        ["m32", "v32"],
        "v32",
        (a, b) =>
          m32Mul(
            a.value,
            b.value.map((x) => [x]),
          ).flat(),
        glslIssue,
        "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
      )
      .add(
        ["m32", "m32"],
        "m32",
        (a, b) => m32Mul(a.value, b.value),
        glslIssue,
        "A\\cdot B=A\\cdot B",
      )
      .add(
        ["r32", "v32"],
        "v32",
        (a, b) => v32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["v32", "r32"],
        "v32",
        (a, b) => v32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )
      .add(
        ["r32", "m32"],
        "m32",
        (a, b) => m32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["m32", "r32"],
        "m32",
        (a, b) => m32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )

    OP_CROSS.add(
      ["v32", "v32"],
      "v32",
      (a, b) => v32Cross(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a_1\\\\a_2\\\\a_3\\end{matrix}\\cdot\\begin{matrix}b_1\\\\b_2\\\\b_3\\end{matrix}=\\begin{matrix}a_2b_3-a_3b_2\\\\a_3b_1-a_1b_3\\\\a_1b_2-a_2b_1\\end{matrix}",
    )
      .add(
        ["m32", "v32"],
        "v32",
        (a, b) =>
          m32Mul(
            a.value,
            b.value.map((x) => [x]),
          ).flat(),
        glslIssue,
        "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
      )
      .add(
        ["r32", "v32"],
        "v32",
        (a, b) => v32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["v32", "r32"],
        "v32",
        (a, b) => v32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )
      .add(
        ["m32", "m32"],
        "m32",
        (a, b) => m32Mul(a.value, b.value),
        glslIssue,
        "A\\times B=A\\times B",
      )
      .add(
        ["r32", "m32"],
        "m32",
        (a, b) => m32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["m32", "r32"],
        "m32",
        (a, b) => m32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )

    OP_ODOT.add(
      ["m32", "m32"],
      "m32",
      (a, b) => m32Hadamard(a.value, b.value),
      glslIssue,
      "A\\odot B=A\\odot B",
    )

    OP_ABS.add(
      ["v32"],
      "r32",
      (a) => v32Norm(a.value),
      glslIssue,
      "\\left|\\begin{matrix}a\\\\b\\\\c\\end{matrix}\\right|=\\sqrt{a^2+b^2+c^2}",
    ).add(
      ["m32"],
      "r32",
      (a) => m32Det(a.value),
      glslIssue,
      "\\left|A\\right|=\\left|A\\right|",
    )

    OP_EQ.add(
      ["m32", "m32"],
      "bool",
      (a, b) => m32Eq(a.value, b.value),
      glslIssue,
      "A=B",
    )

    // prettier-ignore
    OP_RAISE.add(
      ["m32", "r32"],
      "m32",
      (a, b) => m32Pow(a.value, b.value),
      glslIssue,
      "A^b",
    )
  },
} satisfies Package
