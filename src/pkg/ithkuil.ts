import { affixes, roots } from "@zsnout/ithkuil/data"
import * as generate from "@zsnout/ithkuil/generate"
import { wordToIthkuil } from "@zsnout/ithkuil/generate"
import { glossWord } from "@zsnout/ithkuil/gloss"
import { version } from "@zsnout/ithkuil/package.json"
import { parseWord } from "@zsnout/ithkuil/parse"
import { CharacterRow, getBBox, textToScript } from "@zsnout/ithkuil/script"
import { createRecognizer, unglossWord } from "@zsnout/ithkuil/ungloss"
import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { each, type JsVal, type JsValue, type Val } from "../eval/ty"
import { Leaf } from "../field/cmd/leaf"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdComma } from "../field/cmd/leaf/comma"
import { L } from "../field/model"
import { h, p, svgx } from "../jsx"
import { defineExt } from "../sheet/ext"
import { circle } from "../sheet/ui/expr/circle"
import { CmdTextInert, PKG_TEXT, type TextSegment } from "./text"

declare module "../eval/ty" {
  interface Tys {
    ithkuilscript: readonly [string, SVGSVGElement]
  }

  interface TyComponents {
    ithkuilscript: never
  }
}

class CmdIthkuilScript extends Leaf {
  constructor(
    readonly source: string,
    el: SVGSVGElement,
  ) {
    const hx = el.viewBox.baseVal.height
    const y = el.viewBox.baseVal.y + hx

    super(
      "\\ithkuil ",
      h(
        {
          class: "inline-block *:h-[--h]",
          style: `--h:${hx / 70}em;vertical-align:${-0.22 - (y - 35) / 70}em`,
        },
        el,
      ),
    )
  }

  reader(): string {
    return " IthkuilScript "
  }

  ascii(): string {
    return " IthkuilScript "
  }

  latex(): string {
    return " IthkuilScript "
  }

  ir(): true | void {}
}

const recognize = createRecognizer(affixes, roots)

const CATEGORIES = Object.fromEntries(
  Object.entries(generate)
    .filter((x) => x[0].startsWith("ALL_"))
    .map(([k, v]) => {
      k = k.slice(4).toLowerCase().replace(/_/g, "")
      if (k.endsWith("s")) k = k.slice(0, -1)
      if (k == "slotxstresse") k = "slotxstress"
      return [k, v] as const
    })
    .filter(
      (a): a is readonly [string, string[] & any[]] =>
        Array.isArray(a[1]) && a[1].every((x) => typeof x == "string"),
    ),
)

export const PKG_ITHKUIL: Package = {
  id: "nya:ithkuil",
  name: "ithkuil utilities",
  label: "adds utilities for working with the language ithkuil",
  deps: [() => PKG_TEXT],
  ty: {
    info: {
      ithkuilscript: {
        name: "ithkuil script",
        namePlural: "ithkuil scripts",
        coerce: {},
        garbage: {
          get js() {
            return ["", svgx("", "")] as const
          },
          get glsl(): never {
            return err()
          },
        },
        get glsl(): never {
          return err()
        },
        write: {
          isApprox() {
            return false
          },
          display(value, props) {
            new CmdIthkuilScript(value[0], value[1]).insertAt(props.cursor, L)
          },
        },
        icon() {
          return h(
            "",
            h(
              "text-[theme(colors.slate.500)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              svgx(
                "-9.5367431640625e-7 -35.04999923706055 34.20000076293945 70.0999984741211",
                "absolute top-1/2 left-1/2 h-[90%] -translate-x-1/2 -translate-y-1/2 fill-current",
                p(
                  "M 8.449998474121093 -25.05 l 0 25 l -8.45 8.45 l 26.7 26.65 l 7.5 -7.5 l -25.5 -25.5 l 9.75 -9.7 l 0 -27.4 l -10 10 z",
                ),
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    fns: {
      ithkuilgloss: new FnDist("ithkuilgloss", "glosses an ithkuil word").add(
        ["text"],
        "text",
        (a) => {
          const sourceRaw = a.value.map((x) => x.value).join("")
          return sourceRaw
            .split(/[-\s]+/)
            .map<TextSegment>((source) => {
              const parsed = parseWord(source)
              if (!parsed) {
                throw new Error(`Failed to parse ${source}.`)
              }
              return { type: "plain", value: glossWord(parsed).short }
            })
            .flatMap((x, i) =>
              i == 0 ? [x] : [{ type: "plain", value: "\n" }, x],
            )
        },
        err,
      ),
      ithkuilungloss: new FnDist(
        "ithkuilungloss",
        "unglosses an ithkuil word",
      ).add(
        ["text"],
        "text",
        (str) => {
          const sourceRaw = str.value.map((x) => x.value).join("")
          return sourceRaw
            .split(/\s/)
            .map((source): TextSegment => {
              const recognized = recognize(source)
              const [a, b, c, d, e] = unglossWord(recognized.gloss)
              const unglossed = [c, b, d, e, a]
              const success = unglossed.filter((x) => x.type == "success")
              const error = unglossed.filter((x) => x.type == "error")
              if (success[0]) {
                return { type: "plain", value: wordToIthkuil(success[0].value) }
              } else if (error[0]) {
                throw new Error(error[0].reason)
              } else {
                throw new Error(`Failed to parse '${str}'.`)
              }
            })
            .flatMap((x, i) =>
              i == 0 ? [x] : [{ type: "plain", value: "\n" }, x],
            )
        },
        err,
      ),
      ithkuilscript: new FnDist(
        "ithkuilscript",
        "converts an ithkuil word into script form",
      ).add(
        ["text"],
        "ithkuilscript",
        (str) => {
          const source = str.value.map((x) => x.value).join("")
          const result = textToScript(source, {
            handwritten: false,
            useCaseIllValDiacritics: true,
          })
          if (!result.ok) {
            throw new Error(result.reason)
          }
          const characters = CharacterRow({
            children: result.value,
            compact: false,
            space: 10, //+ renderedStrokeWidth,
          }) as SVGGElement
          const box = getBBox(characters)
          return [
            source,
            svgx(
              box.x + " " + box.y + " " + box.width + " " + box.height,
              "fill-current",
              characters,
            ),
          ]
        },
        err,
      ),
      ithkuil: {
        js(...args) {
          if (
            !(
              args.length == 1 &&
              args[0]!.list === false &&
              args[0]!.type == "text"
            )
          ) {
            throw new Error(
              "The 'ithkuil' function expects the name of a grammatical category.",
            )
          }
          const arg = args[0]! as JsVal<"text">

          const name = arg.value.map((x) => x.value).join("")
          const category = CATEGORIES[name.toLowerCase().replace(/[_. ]/g, "")]
          if (!category) {
            throw new Error(`The category '${name}' doesn't exist.`)
          }
          return {
            type: "text",
            list: category?.length,
            value: category.map(
              (x): Val<"text"> => [{ type: "plain", value: x }],
            ),
          }
        },
        glsl: err,
      },
    },
    vars: {
      ithkuilversion: {
        js: {
          type: "text",
          list: false,
          value: [{ type: "latex", value: version }],
        },
        get glsl(): never {
          return err()
        },
        display: true,
      },
      ithkuilall: {
        js: {
          type: "text",
          list: Object.keys(CATEGORIES).length,
          value: Object.keys(CATEGORIES).map(
            (name): Val<"text"> => [{ type: "plain", value: name }],
          ),
        },
        get glsl(): never {
          return err()
        },
        display(prop) {
          new OpEq(false).insertAt(prop.cursor, L)
          let first = true
          for (const name of Object.keys(CATEGORIES)) {
            if (first) {
              first = false
            } else {
              new CmdComma().insertAt(prop.cursor, L)
            }

            new CmdTextInert(name).insertAt(prop.cursor, L)
          }
        },
      },
    },
  },
  sheet: {
    exts: {
      1: [
        defineExt({
          data(expr) {
            if (expr.js?.value.type == "ithkuilscript") {
              return { expr, value: expr.js.value as JsValue<"ithkuilscript"> }
            }
          },
          aside() {
            return circle("ithkuilscript")
          },
          el(data) {
            const el = h(
              "flex flex-col gap-6 pb-4 -mt-2 [.nya-expr:has(&):not(:focus-within)_.nya-display]:sr-only [.nya-expr:has(&):not(:focus-within)_&]:py-3 [.nya-expr:has(&):not(:focus-within)_&]:mt-0",
              ...each(data.value).map((x) => {
                const el = x[1]
                return h(
                  {
                    class: "px-4 inline-block *:h-[--h]",
                    style: `--h:${(el.viewBox.baseVal.height / 70) * 2}rem`,
                  },
                  el,
                )
              }),
            )
            el.addEventListener("click", () => data.expr.field.el.focus())
            return el
          },
        }),
      ],
    },
  },
}

function err(): never {
  throw new Error("Ithkuil utilities do not work in shaders.")
}
