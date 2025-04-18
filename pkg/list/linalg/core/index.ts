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
  WRITE_MATRIX,
  mr32Det,
  mr32Eq,
  mr32Hadamard,
  mr32Mul,
  mr32Neg,
  mr32Pow,
  mr32ScalMul,
  mr32Add,
  matrixJs,
  matrixGlsl,
} from "./matrix"
import {
  vr32Add,
  vr32Cross,
  vr32Dot,
  vr32Neg,
  vr32Norm,
  vr32ScalMul,
  WRITE_VECTOR,
} from "./vector"
import { glslIssue } from "./matrix"
import { matrixIcon, vectorIcon } from "./resources"
import { NO_DRAG, NO_SYM } from "@/eval/ast/tx"

declare module "@/eval/ty" {
  interface Tys {
    mr32: SReal[][]
    vr32: SReal[]
  }
}

export default {
  name: "linear algebra",
  label: null,
  category: "linear algebra",
  deps: ["core/ops", "num/real"],
  ty: {
    info: {
      mr32: {
        name: "matrix",
        namePlural: "matrices",
        get glsl(): never {
          return glslIssue()
        },
        toGlsl: glslIssue,
        garbage: {
          js: [],
          get glsl(): never {
            return glslIssue()
          },
        },
        coerce: {},
        write: WRITE_MATRIX,
        order: null,
        point: false,
        icon: matrixIcon,
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
      vr32: {
        name: "vector",
        namePlural: "vectors",
        get glsl(): never {
          return glslIssue()
        },
        toGlsl: glslIssue,
        garbage: {
          js: [],
          get glsl(): never {
            return glslIssue()
          },
        },
        coerce: {
          mr32: {
            js: (a) => a.map((x) => [x]),
            glsl: glslIssue,
          },
        },
        write: WRITE_VECTOR,
        order: null,
        point: false,
        icon: vectorIcon,
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
    },
  },
  eval: {
    tx: {
      ast: {
        matrix: {
          label: "parse matrices",
          sym: NO_SYM,
          js(node, props) {
            return matrixJs(node.cols, node.values, props)
          },
          glsl(node, props) {
            return matrixGlsl(node.cols, node.values, props)
          },
          drag: NO_DRAG,
          deps(node, deps) {
            for (const value of node.values) {
              deps.add(value)
            }
          },
        },
      },
    },
    fn: {
      det: new FnDist("det", "take the determinant of a matrix").add(
        ["mr32"],
        "r32",
        (a) => mr32Det(a.value),
        glslIssue,
        "\\left|A\\right|=\\left|A\\right|",
      ),
    },
  },
  // AIDEN/TODO: Fix examples
  load() {
    OP_POS.add(
      ["vr32"],
      "vr32",
      (a) => a.value,
      glslIssue,
      "+\\begin{matrix}a_1\\\\a_2\\end{matrix}=\\begin{matrix}a_1\\\\a_2\\end{matrix}",
    ).add(
      ["mr32"],
      "mr32",
      (a) => a.value,
      glslIssue,
      "+\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}=\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}",
    )

    OP_NEG.add(
      ["vr32"],
      "vr32",
      (a) => vr32Neg(a.value),
      glslIssue,
      "-\\begin{matrix}a_1\\\\a_2\\end{matrix}=\\begin{matrix}-a_1\\\\-a_2\\end{matrix}",
    ).add(
      ["mr32"],
      "mr32",
      (a) => mr32Neg(a.value),
      glslIssue,
      "-\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}=\\begin{matrix}-a_{11}&-a_{12}\\\\-a_{21}&-a_{22}\\end{matrix}",
    )

    OP_ADD.add(
      ["vr32", "vr32"],
      "vr32",
      (a, b) => vr32Add(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}+\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}+b_{11}&a_{12}+b_{12}\\\\a_{21}+b_{21}&a_{22}+b_{22}\\end{matrix}",
    ).add(
      ["mr32", "mr32"],
      "mr32",
      (a, b) => mr32Add(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}+\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}+b_{11}&a_{12}+b_{12}\\\\a_{21}+b_{21}&a_{22}+b_{22}\\end{matrix}",
    )

    OP_SUB.add(
      ["mr32", "mr32"],
      "mr32",
      (a, b) => mr32Add(a.value, mr32Neg(b.value)),
      glslIssue,
      "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}-\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}-b_{11}&a_{12}-b_{12}\\\\a_{21}-b_{21}&a_{22}-b_{22}\\end{matrix}",
    )

    OP_JUXTAPOSE.add(
      ["mr32", "vr32"],
      "vr32",
      (a, b) =>
        mr32Mul(
          a.value,
          b.value.map((x) => [x]),
        ).flat(),
      glslIssue,
      "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
    )
      .add(
        ["r32", "vr32"],
        "vr32",
        (a, b) => vr32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["vr32", "r32"],
        "vr32",
        (a, b) => vr32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )
      .add(
        ["mr32", "mr32"],
        "mr32",
        (a, b) => mr32Mul(a.value, b.value),
        glslIssue,
        "\\begin{matrix}a_{11}&a_{12}\\\\a_{21}&a_{22}\\end{matrix}\\begin{matrix}b_{11}&b_{12}\\\\b_{21}&b_{22}\\end{matrix}=\\begin{matrix}a_{11}b_{11}+a{12}b_{21}&a_{11}b_{12}+a_{12}b_{22}\\\\a_{21}b_{11}+a_{22}b_{21}&a_{21}b_{12}+a_{22}b_{22}\\end{matrix}",
      )
      .add(
        ["r32", "mr32"],
        "mr32",
        (a, b) => mr32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["mr32", "r32"],
        "mr32",
        (a, b) => mr32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )

    OP_CDOT.add(
      ["vr32", "vr32"],
      "r32",
      (a, b) => vr32Dot(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
    )
      .add(
        ["mr32", "vr32"],
        "vr32",
        (a, b) =>
          mr32Mul(
            a.value,
            b.value.map((x) => [x]),
          ).flat(),
        glslIssue,
        "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
      )
      .add(
        ["mr32", "mr32"],
        "mr32",
        (a, b) => mr32Mul(a.value, b.value),
        glslIssue,
        "A\\cdot B=A\\cdot B",
      )
      .add(
        ["r32", "vr32"],
        "vr32",
        (a, b) => vr32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["vr32", "r32"],
        "vr32",
        (a, b) => vr32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )
      .add(
        ["r32", "mr32"],
        "mr32",
        (a, b) => mr32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["mr32", "r32"],
        "mr32",
        (a, b) => mr32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )

    OP_CROSS.add(
      ["vr32", "vr32"],
      "vr32",
      (a, b) => vr32Cross(a.value, b.value),
      glslIssue,
      "\\begin{matrix}a_1\\\\a_2\\\\a_3\\end{matrix}\\cdot\\begin{matrix}b_1\\\\b_2\\\\b_3\\end{matrix}=\\begin{matrix}a_2b_3-a_3b_2\\\\a_3b_1-a_1b_3\\\\a_1b_2-a_2b_1\\end{matrix}",
    )
      .add(
        ["mr32", "vr32"],
        "vr32",
        (a, b) =>
          mr32Mul(
            a.value,
            b.value.map((x) => [x]),
          ).flat(),
        glslIssue,
        "\\begin{matrix}a\\\\b\\end{matrix}\\cdot\\begin{matrix}c\\\\d\\end{matrix}=ac+bd",
      )
      .add(
        ["r32", "vr32"],
        "vr32",
        (a, b) => vr32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["vr32", "r32"],
        "vr32",
        (a, b) => vr32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )
      .add(
        ["mr32", "mr32"],
        "mr32",
        (a, b) => mr32Mul(a.value, b.value),
        glslIssue,
        "A\\times B=A\\times B",
      )
      .add(
        ["r32", "mr32"],
        "mr32",
        (a, b) => mr32ScalMul(b.value, a.value),
        glslIssue,
        "a\\cdot B=a\\cdot B",
      )
      .add(
        ["mr32", "r32"],
        "mr32",
        (a, b) => mr32ScalMul(a.value, b.value),
        glslIssue,
        "A\\cdot b=A\\cdot b",
      )

    OP_ODOT.add(
      ["mr32", "mr32"],
      "mr32",
      (a, b) => mr32Hadamard(a.value, b.value),
      glslIssue,
      "A\\odot B=A\\odot B",
    )

    OP_ABS.add(
      ["vr32"],
      "r32",
      (a) => vr32Norm(a.value),
      glslIssue,
      "\\left|\\begin{matrix}a\\\\b\\\\c\\end{matrix}\\right|=\\sqrt{a^2+b^2+c^2}",
    ).add(
      ["mr32"],
      "r32",
      (a) => mr32Det(a.value),
      glslIssue,
      "\\left|A\\right|=\\left|A\\right|",
    )

    OP_EQ.add(
      ["mr32", "mr32"],
      "bool",
      (a, b) => mr32Eq(a.value, b.value),
      glslIssue,
      "A=B",
    )

    // prettier-ignore
    OP_RAISE.add(
      ["mr32", "r32"],
      "mr32",
      (a, b) => mr32Pow(a.value, b.value),
      glslIssue,
      "A^b",
    )
  },
} satisfies Package
