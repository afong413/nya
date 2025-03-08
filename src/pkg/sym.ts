import type { Package } from "."
import { Precedence, type MagicVar } from "../eval/ast/token"
import { TXR_AST } from "../eval/ast/tx"
import { insert, txr, TXR_SYM, type Sym, type TxrSym } from "../eval/sym"
import type { JsValue } from "../eval/ty"
import { frac, real } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import { CmdWord } from "../field/cmd/leaf/word"
import { Block, L, R } from "../field/model"
import { h } from "../jsx"

declare module "../eval/ty" {
  interface Tys {
    sym: Sym
  }

  interface TyComponents {
    sym: never
  }
}

export const PKG_SYM: Package = {
  id: "nya:sym",
  name: "symbolic computation",
  label: null,
  ty: {
    info: {
      sym: {
        name: "symbolic expression",
        namePlural: "symbolic expressions",
        coerce: {},
        garbage: {
          js: { type: "undef" },
          get glsl(): never {
            throw new Error("Cannot construct symbolic expressions in shaders.")
          },
        },
        get glsl(): never {
          throw new Error("Cannot construct symbolic expressions in shaders.")
        },
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            const txr: TxrSym<unknown> | undefined = TXR_SYM[value.type]
            if (!txr) {
              throw new Error(
                `Symbolic expression type '${value.type}' is not defined.`,
              )
            }

            insert(
              props.cursor,
              txr.display(value),
              Precedence.Comma,
              Precedence.Comma,
            )
          },
        },
        icon() {
          return h(
            "",
            h(
              "text-[#00786F] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_1.5px)] font-['Times_New_Roman'] italic text-[100%]",
                "f",
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    tx: {
      magic: {
        sym: {
          deps(node, deps) {
            deps.add(node.contents)
          },
          js(node, props) {
            validateSym(node)
            const tx = TXR_AST[node.contents.type]
            if (!tx?.sym) {
              throw new Error(
                `Cannot transform '${node.contents.type}' into a symbolic computation.`,
              )
            }

            return {
              type: "sym",
              list: false,
              value: tx.sym(node.contents as never, props),
            } satisfies JsValue<"sym", false>
          },
          glsl() {
            throw new Error("Cannot construct symbolic expressions in shaders.")
          },
        },
      },
    },
    sym: {
      call: {
        deriv() {
          // SYM:
          throw new Error("Cannot compute derivatives of functions yet.")
        },
        uses(value, name) {
          return value.args.some((x) => txr(x).uses(x, name))
        },
        display(value) {
          if (!value.fn.display) {
            console.warn(value.fn)
            throw new Error(
              `Cannot display function '${"name" in value.fn ? value.fn.name : "<unknown name>"}'`,
            )
          }
          return value.fn.display(value.args)
        },
      },
      var: {
        deriv(value, wrt) {
          if (value.id == wrt) {
            return {
              type: "js",
              value: {
                type: "r64",
                list: false,
                value: real(1),
              } satisfies JsValue<"r64", false>,
            }
          }

          return { type: "var", id: value.id }
        },
        uses(value, name) {
          return value.id == name
        },
        display(value) {
          const block = new Block(null)
          // SYM: this is a horrid way of displaying variables
          const word = new CmdWord("%" + value.id, "var", value.id.length == 2)
          word.el.classList.add(
            "border",
            "bg-[--nya-bg]",
            "border-[--nya-border]",
          )
          word.insertAt(block.cursor(R), L)
          return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
        },
      },
      js: {
        deriv() {
          return {
            type: "js",
            value: {
              type: "r64",
              list: false,
              value: real(0),
            } satisfies JsValue<"r64", false>,
          }
        },
        uses() {
          return false
        },
        display(value) {
          const block = new Block(null)
          new Display(block.cursor(R), frac(10, 1)).output(value.value, false)
          return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
        },
      },
    },
  },
}

function validateSym(node: MagicVar) {
  if (node.prop) {
    throw new Error(
      "Cannot access a particular property of a 'sym' expression.",
    )
  }
  if (node.sub) {
    throw new Error("Cannot apply subscripts to 'sym' expressions.")
  }
  if (node.sup) {
    throw new Error("Cannot apply superscripts to 'sym' expressions.")
  }
}
