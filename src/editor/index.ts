import "../../index.css"
import { OpEq, OpGt, OpLt } from "./cmd/leaf/cmp"
import { CmdComma } from "./cmd/leaf/comma"
import { CmdDot } from "./cmd/leaf/dot"
import { CmdNum } from "./cmd/leaf/num"
import { OpCdot, OpMinus, OpPlus } from "./cmd/leaf/op"
import { CmdVar } from "./cmd/leaf/var"
import { CmdFor } from "./cmd/logic/for"
import { CmdPiecewise } from "./cmd/logic/piecewise"
import { BIG_ALIASES, CmdBig } from "./cmd/math/big"
import { CmdBrack } from "./cmd/math/brack"
import { CmdFrac } from "./cmd/math/frac"
import { CmdInt } from "./cmd/math/int"
import { CmdMatrix } from "./cmd/math/matrix"
import { CmdRoot } from "./cmd/math/root"
import { CmdSupSub } from "./cmd/math/supsub"
import { ByRegex } from "./cmd/util/by-regex"
import {
  CmdBackspace,
  CmdBreakCol,
  CmdBreakRow,
  CmdDel,
  CmdMove,
  CmdTab,
} from "./cmd/util/cursor"
import { CmdNoop } from "./cmd/util/noop"
import { Exts, Field } from "./field"
import { h } from "./jsx"
import { D, L, R, U, type Init } from "./model"
import { WordMap } from "./options"

const CmdPrompt: Init = {
  init() {
    const val = prompt("type a latex command")
    if (!val) return
    field.type("\\" + val)
  },
  initOn() {
    const val = prompt("type a latex command")
    if (!val) return
    field.type("\\" + val)
  },
}

const exts = new Exts()
  .setDefault(
    new ByRegex([
      [/^\d$/, CmdNum],
      [/^\w$/, CmdVar],
      [/^\s$/, CmdNoop],
      [/^[()[\]{}]$/, CmdBrack],
    ]),
  )
  // basic ops
  .set("+", OpPlus)
  .set("-", OpMinus)
  .set("*", OpCdot)
  .set("/", CmdFrac)
  // equality ops
  .set("=", OpEq)
  .set("<", OpLt)
  .set(">", OpGt)
  // other cmds
  .setAll(["_", "^"], CmdSupSub)
  .setAll(Object.keys(BIG_ALIASES), CmdBig)
  .set(",", CmdComma)
  .set(".", CmdDot)
  .set("&", CmdBreakCol)
  .set(";", CmdBreakRow)
  // movement ops
  .set("ArrowLeft", CmdMove(L))
  .set("Home", CmdMove(L, true))
  .set("ArrowRight", CmdMove(R))
  .set("End", CmdMove(R, true))
  .set("ArrowUp", CmdMove(U))
  .set("ArrowDown", CmdMove(D))
  .set("Backspace", CmdBackspace)
  .set("Del", CmdDel)
  .set("Delete", CmdDel)
  .set("Tab", CmdTab)
  // manual latex
  .set("\\", CmdPrompt)

const autoCmds = new WordMap<Init>([
  ["sum", CmdBig],
  ["prod", CmdBig],
  ["int", CmdInt],
  ["matrix", CmdMatrix],
  ["for", CmdFor],
  ["sqrt", CmdRoot],
  ["nthroot", CmdRoot],
  ["cases", CmdPiecewise],
  ["switch", CmdPiecewise],
  ["piecewise", CmdPiecewise],
])

const field = new Field(exts, {
  autoCmds,
  autoSubscriptNumbers: true,
})

// Set up field styles
document.body.className = "flex flex-col justify-center min-h-screen px-8"

document.body.appendChild(
  h(
    "[line-height:1] text-[1.265rem] text-center overflow-auto p-8 -mx-8",
    field.el,
  ),
)

const latex = h("text-center block text-sm break-all px-8 text-balance mt-8")
document.body.appendChild(latex)

const ascii = h("text-center block text-sm break-all px-8 text-balance mt-4")
document.body.appendChild(ascii)

const reader = h("text-center block text-xs break-all px-8 text-balance mt-4")
document.body.appendChild(reader)

field.type("2")
field.type("*")
field.type("3")
field.type("a")
field.type("4")
field.type("5")
field.type("6")
field.type("8")
field.type("^")
field.type("9")
field.type("2")
field.type("3")
field.type("^")
field.type("9")
field.type("^")
field.type("5")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("+")
field.type("0")
field.type("4")
field.type("/")
field.type("5")
field.type("ArrowRight")
field.type("ArrowLeft")
field.type("^")
field.type("2")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("3")
field.type("a")
field.type("2")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowRight")
field.type("^")
field.type("4")
field.type("3")
field.type("6")
field.type("ArrowRight")
field.type("/")
field.type("2")
field.type("/")
field.type("3")
field.type("ArrowRight")
field.type("+")
field.type("4")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowDown")
field.type("ArrowLeft")
field.type("ArrowUp")
field.type("ArrowDown")
field.type("ArrowUp")
field.type("ArrowDown")
field.type("ArrowDown")
field.type("ArrowDown")
field.type("4")
field.type("3")
field.type("2")
field.type("1")
field.type("9")
field.type("3")
field.type("4")
field.type("2")
field.type("ArrowUp")
field.type("ArrowUp")
field.type("ArrowUp")
field.type("ArrowUp")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("\\sum")
field.type("2")
field.type("3")
field.type("ArrowUp")
field.type("4")
field.type("9")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("m")
field.type("a")
field.type("t")
field.type("r")
field.type("i")
field.type("x")
field.type("1")
field.type("ArrowRight")
field.type("2")
field.type("ArrowDown")
field.type("4")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("3")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("f")
field.type("o")
field.type("r")
field.type("x")
field.type("^")
field.type("2")
field.type("Tab")
field.type("Tab")
field.type("i")
field.type("Tab")
field.type("[")
field.type("1")
field.type(".")
field.type(".")
field.type(".")
field.type("1")
field.type("0")
field.type("]")
field.type("Tab")
field.type("n")
field.type("ArrowLeft")
field.type("ArrowLeft", new KeyboardEvent("keydown", { shiftKey: true }))
field.type("ArrowLeft")
field.type("i")
field.type("n")
field.type("t")
field.type("2")
field.type("ArrowDown")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("+")
field.type("^")
field.type("4")
field.type("Tab")
field.type("ArrowLeft", new KeyboardEvent("keydown", { altKey: true }))
field.type("ArrowLeft")
field.type("+")
field.type("p")
field.type("i")
field.type("e")
field.type("c")
field.type("e")
field.type("w")
field.type("i")
field.type("s")
field.type("e")
field.type("m")
field.type("a")
field.type("t")
field.type("r")
field.type("i")
field.type("x")
field.type("1")
field.type("ArrowRight")
field.type("2")
field.type("ArrowDown")
field.type("4")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("3")
field.type("ArrowLeft")
field.type("5")
field.type("ArrowLeft")
field.type("ArrowLeft")
field.type("8")
field.type("ArrowUp")
field.type("7")
field.type("ArrowDown")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("ArrowRight")
field.type("y")
field.type(">")
field.type("=")
field.type("4")
field.type("ArrowDown")
field.type("ArrowLeft")
field.type("2")
field.type("7")
field.type("^")
field.type("8")
field.type("^")
field.type("9")
field.type("/")
field.type("3")
field.type("Tab")
field.type("Tab")
field.type("Tab")
field.type("Tab")
field.type("x")
field.type("<")
field.type("/")
field.type("3")
field.type(";")

const cursor = h("border-current w-px -ml-px border-l")
render()

function unrender() {
  field.sel.each(({ el }) => el.classList.remove("bg-zlx-selection"))
  cursor.parentElement?.classList.remove("!bg-transparent")
  cursor.remove()
  field.sel.parent?.checkIfEmpty()
}

function render() {
  field.sel.each(({ el }) => el.classList.add("bg-zlx-selection"))
  field.sel.cursor(field.sel.focused).render(cursor)
  cursor.parentElement?.classList.add("!bg-transparent")
  field.sel.parent?.checkIfEmpty()
  cursor.parentElement?.parentElement?.classList.remove("zlx-has-empty")
  latex.textContent = field.block.latex()
  ascii.textContent = field.block.ascii()
  reader.textContent = field.block.reader()
}

addEventListener("keydown", (x) => {
  unrender()
  field.type(x.key, x)
  render()
})

document.body.append(
  h("font-semibold mt-8", "Available keys to press:"),
  h(
    "grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] w-full ml-8",
    ...exts
      .getAll()
      .sort()
      .map((name) => h("", name))
      .filter((x) => x != null),
  ),
  h("font-semibold mt-8", "Additional typable commands:"),
  h(
    "grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] w-full ml-8",
    ...autoCmds
      .getAll()
      .sort()
      .map((name) => h("", name))
      .filter((x) => x != null),
  ),
)
