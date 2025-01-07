import { Leaf } from "."
import type { Token } from "../../../ast/token"
import { h } from "../../jsx"
import { L, type Cursor } from "../../model"

export class CmdComma extends Leaf {
  static init(cursor: Cursor) {
    new CmdComma().insertAt(cursor, L)
  }

  constructor() {
    super(",", h("nya-cmd-op nya-cmd-comma pr-[.1em]", ","))
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

  invalidatesTransparentWrapper(): boolean {
    return true
  }

  ir(tokens: Token[]): void {
    const last = tokens[tokens.length - 1]
    if (
      last?.type == "punc" &&
      (last.value.kind == ".." || last.value.kind == "...")
    ) {
      tokens.push({ type: "void" })
    }
    tokens.push({ type: "punc", value: { type: "infix", kind: "," } })
  }
}
