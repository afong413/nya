import { Leaf } from "."
import { type Token } from "../../../ast/token"
import { h } from "../../jsx"
import { L, R, type Cursor } from "../../model"
import { CmdVar } from "./var"

export class CmdDot extends Leaf {
  static init(cursor: Cursor) {
    new CmdDot().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("nya-cmd-dot", "."))
    this.render()
  }

  render() {
    const l = this[L] instanceof CmdDot
    const r = this[R] instanceof CmdDot
    const prop = !l && this[R] instanceof CmdVar

    this.setEl(
      h(
        "nya-cmd-dot" +
          (l && !r && this[R] ? " nya-cmd-dot-r" : "") +
          (r && !l && this[L] ? " nya-cmd-dot-l" : "") +
          (prop ? " nya-cmd-dot-prop" : ""),
        ".",
      ),
    )
  }

  onSiblingChange(): void {
    this.render()
  }

  reader(): string {
    return " comma "
  }

  ascii(): string {
    return ","
  }

  latex(): string {
    return ","
  }

  ir(tokens: Token[]): void {
    const last = tokens[tokens.length - 1]
    if (last?.type == "punc") {
      if (last.value.kind == "." || last.value.kind == "..") {
        tokens.pop()
        tokens.push({
          type: "punc",
          value: { kind: `${last.value.kind}.`, type: "infix" },
        })

        const prev = tokens[tokens.length - 2]
        if (!prev) {
          tokens.splice(0, 0, { type: "void" })
        } else if (prev.type == "punc" && prev.value.kind == ",") {
          tokens.splice(tokens.length - 1, 0, { type: "void" })
        }
        if (!this[R]) {
          tokens.push({ type: "void" })
        }

        return
      }
    }
    tokens.push({
      type: "punc",
      value: { kind: ".", type: "infix" },
    })
  }
}
