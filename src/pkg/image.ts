import { faImage as faImageRegular } from "@fortawesome/free-regular-svg-icons"
import { faImage } from "@fortawesome/free-solid-svg-icons"
import type { Package } from "."
import type { Node, Nodes, PlainVar } from "../eval/ast/token"
import { NO_DRAG } from "../eval/ast/tx"
import type { JsValue, Val } from "../eval/ty"
import { Leaf } from "../field/cmd/leaf"
import { OpEq } from "../field/cmd/leaf/cmp"
import { CmdVar } from "../field/cmd/leaf/var"
import { fa } from "../field/fa"
import { Field } from "../field/field"
import { R } from "../field/model"
import { h, hx, path, svgx, t } from "../jsx"
import { type ItemFactory } from "../sheet/item"
import type { ItemRef } from "../sheet/items"

declare module "../eval/ast/token" {
  interface Nodes {
    imageraw: { data: Val<"imageraw"> }
  }
}

declare module "../eval/ty" {
  interface Tys {
    imageraw: {
      src: string
      width: number
      height: number
    }
  }

  interface TyComponents {
    imageraw: never
  }
}

class CmdImgRaw extends Leaf {
  constructor(public data: Val<"imageraw">) {
    super("", h(""))
  }

  reader(): string {
    return ""
  }

  ascii(): string {
    return ""
  }

  latex(): string {
    return ""
  }

  ir(tokens: Node[]): true | void {
    tokens.push({ type: "imageraw", data: this.data })
  }
}

interface Data {
  url: string | null
  name: Field
  ref: ItemRef<Data>
  el: HTMLElement
}

const FACTORY: ItemFactory<Data> = {
  id: "nya:image",
  name: "image",
  icon: faImage,

  init(ref) {
    const msg = t("")

    const msgEl = h(
      "hidden [line-height:1] text-center absolute inset-x-2 z-10 pt-0.5 bottom-1 bg-[--nya-bg] text-[--nya-expr-error]",
      h(
        "absolute bottom-full inset-x-0 from-[--nya-bg] to-transparent bg-gradient-to-t h-2",
      ),
      msg,
    )

    function setMsg(text: string) {
      if (text) {
        msgEl.classList.remove("hidden")
        msgEl.classList.add("block")
        msg.data = text
      } else {
        msgEl.classList.add("hidden")
        msgEl.classList.remove("block")
      }
    }

    const name = new Field(
      ref.list.sheet.options,
      "nya-display whitespace-nowrap font-['Symbola','Times_New_Roman',serif] font-normal not-italic [line-height:1] cursor-text select-none inline-block nya-range-bound border-[--nya-border] text-[1rem] p-1 pr-2 border-b min-w-12 max-w-24 min-h-[calc(1.5rem_+_1px)] focus:outline-none focus:border-b-[--nya-expr-focus] focus:border-b-2 [&::-webkit-scrollbar]:hidden overflow-x-auto align-middle focus:-mb-px after:hidden",
    )

    CmdVar.leftOf(
      name.block.cursor(R),
      ref.list.sheet.scope.name("i"),
      name.options,
    )

    const field = hx("input", {
      type: "file",
      accept: "image/*",
      class: "sr-only",
    })

    const none = h(
      "flex-1 flex items-center justify-center px-3 py-2",
      "Click to upload an image.",
    )

    const img1 = hx(
      "img",
      "hidden absolute size-full inset-0 object-cover blur",
    )
    const img2 = hx("img", "hidden absolute size-full inset-0 object-contain")

    const data: Data = {
      url: null,
      name,
      ref,
      el: h(
        "grid grid-cols-[2.5rem_auto] border-r border-b border-[--nya-border] relative nya-expr",
        // grey side of expression
        h(
          {
            class:
              "nya-expr-bar inline-flex bg-[--nya-bg-sidebar] flex-col p-0.5 border-r border-[--nya-border] font-sans text-[--nya-expr-index] text-[65%] leading-none focus:outline-none",
            tabindex: "-1",
          },
          ref.elIndex,
          fa(faImageRegular, "block mx-auto size-6 mt-0.5 mb-1.5 fill-current"),
        ),

        // main body
        h(
          "relative flex items-center pl-4 p-2",
          name.el,
          new OpEq(false).el,
          hx(
            "label",
            "relative flex h-32 min-w-32 flex-1 bg-[--nya-bg-sidebar] rounded border border-[--nya-border] overflow-hidden",
            field,
            none,
            img1,
            img2,
          ),
          msgEl,
        ),

        // focus ring
        h(
          "hidden absolute -inset-y-px inset-x-0 [:first-child>&]:top-0 border-2 border-[--nya-expr-focus] pointer-events-none [:focus-within>&]:block [:active>&]:block",
        ),
      ),
    }

    let ast: PlainVar | null = null

    function check() {
      ast = null

      try {
        const node = name.block.ast()

        if (node.type == "void") {
          setMsg("Please provide a name for this image.")
          return
        }

        if (!(node.type == "var" && node.kind == "var")) {
          setMsg("The name should be a variable name.")
          return
        }

        if (node.sup) {
          setMsg("The name should not have a superscript.")
          return
        }

        ast = node satisfies Nodes["var"] as any
      } catch (e) {
        console.warn("[image.ast]", e)
        ast = null
        setMsg(e instanceof Error ? e.message : "I don't understand that name.")
        return
      }

      if (data.url == null) {
        setMsg("Click to upload an image to use.")
        return
      }

      setMsg("")
    }

    check()

    field.addEventListener("change", () => {
      const file = field.files?.[0]
      field.value = ""
      if (!file) return

      const prev = data.url
      const next = URL.createObjectURL(file)
      data.url = next
      img1.src = img2.src = next
      none.classList.add("hidden")
      img1.classList.remove("hidden")
      img1.classList.add("block")
      img2.classList.remove("hidden")
      img2.classList.add("block")

      if (prev) {
        URL.revokeObjectURL(prev)
      }

      check()
    })

    const prevOnAfterChange = name.onAfterChange
    name.onAfterChange = (wasChangeCanceled) => {
      prevOnAfterChange.call(name, wasChangeCanceled)
      check()
    }

    return data
  },
  el(data) {
    return data.el
  },
  encode() {
    // TODO:
    return ""
  },
  decode(ref) {
    // TODO:
    return FACTORY.init(ref)
  },
  unlink() {
    // TODO:
  },
  focus() {
    // TODO:
  },
}

export const PKG_IMAGE: Package = {
  id: "nya:image",
  name: "images",
  label: "upload and manipulate images",
  ty: {
    info: {
      imageraw: {
        name: "image file",
        namePlural: "image files",
        coerce: {},
        garbage: {
          js: {
            src: "",
            width: 1,
            height: 1,
          },
          get glsl(): never {
            throw new Error("Cannot load image files in shaders yet.")
          },
        },
        get glsl(): never {
          throw new Error("Cannot load image files in shaders yet.")
        },
        write: {
          display() {
            // FIXME:
          },
          isApprox() {
            return false
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
                "0 0 6 6",
                "absolute top-1/2 left-1/2 size-[16px] -translate-x-1/2 -translate-y-1/2 fill-current",
                path(
                  `M 0 0 h 1 v 1 h -1 z M 0 1 h 1 v 1 h -1 z M 0 4 h 1 v 1 h -1 z M 0 5 h 1 v 1 h -1 z M 1 0 h 1 v 1 h -1 z M 2 2 h 1 v 1 h -1 z M 2 3 h 1 v 1 h -1 z M 2 5 h 1 v 1 h -1 z M 3 0 h 1 v 1 h -1 z M 3 3 h 1 v 1 h -1 z M 3 5 h 1 v 1 h -1 z M 4 0 h 1 v 1 h -1 z M 4 2 h 1 v 1 h -1 z M 4 5 h 1 v 1 h -1 z M 5 0 h 1 v 1 h -1 z M 5 1 h 1 v 1 h -1 z M 5 3 h 1 v 1 h -1 z M 5 5 h 1 v 1 h -1 z`,
                ),
              ),
            ),
          )
        },
      },
    },
  },
  eval: {
    tx: {
      ast: {
        imageraw: {
          deps() {},
          drag: NO_DRAG,
          js(node): JsValue<"imageraw", false> {
            return { type: "imageraw", value: node.data, list: false }
          },
          glsl() {
            throw new Error("Cannot load image files in shaders yet.")
          },
        },
      },
    },
  },
  sheet: {
    items: [FACTORY],
  },
}
