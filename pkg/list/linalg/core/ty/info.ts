import type { TyInfo } from "@/eval/ty/info"
import { m32Icon, v32Icon } from "./icon"
import type { Tys } from "@/eval/ty"
import { CmdMatrix } from "@/field/cmd/math/matrix"
import { Block } from "@/field/model"
import { L, R } from "@/field/dir"
import { glslIssue } from "./etc"

export const m32Info = {
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
  write: {
    isApprox(value) {
      return value.some((x) => x.some((x) => x.type === "approx"))
    },
    display(value, props) {
      if (value.length === 0) {
        new CmdMatrix(0, []).insertAt(props.cursor, L)
        return
      }
      new CmdMatrix(
        value[0]!.length,
        value.flat().map((x) => {
          const block = new Block(null)

          props.at(block.cursor(R)).num(x)

          return block
        }),
      ).insertAt(props.cursor, L)
      // TODO:
    },
  },
  order: null,
  point: false,
  icon: m32Icon,
  token: null,
  glide: null,
  preview: null,
  extras: null,
} satisfies TyInfo<Tys["m32"]>

export const v32Info = {
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
    m32: {
      js: (a) => a.map((x) => [x]),
      glsl: glslIssue,
    },
  },
  write: {
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
  },
  order: null,
  point: false,
  icon: v32Icon,
  token: null,
  glide: null,
  preview: null,
  extras: null,
} satisfies TyInfo<Tys["v32"]>
