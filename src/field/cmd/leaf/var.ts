import { Leaf } from "."
import {
  PRECEDENCE_MAP,
  type Node,
  type PuncInfix,
} from "../../../eval/ast/token"
import { h, t } from "../../jsx"
import {
  Cursor,
  L,
  R,
  Span,
  type Command,
  type Dir,
  type InitProps,
} from "../../model"
import type { Options, WordMap } from "../../options"

/**
 * The different kinds of {@linkcode CmdVar}-composed words which exist. These
 * affect punctuation and parentheses.
 *
 * - `"var"` is suitable for variables like Desmos's `width` and `height`
 * - `"prefix"` is suitable for functions like `sin` and `cos`
 * - `"infix"` is suitable for operators like `for` and `with`
 *
 * Spacing of plus/minus signs and parentheses are specified below:
 *
 * - `"var"`: `+word` `2 + word` `word + 2` `word2` `(...)word(...)`
 * - `"prefix"`: `+word` `2 + word` `word +2` `(...) word(...)`
 * - `"infix"`: `2 word` `word 2` `word +` `(...) word (...)`
 */
export type WordKind = "var" | "prefix" | "infix"

export class CmdVar extends Leaf {
  static init(cursor: Cursor, props: InitProps) {
    const { input, options } = props
    const self = new CmdVar(input, options)
    self.insertAt(cursor, L)
    if (self.kind != null) return
    if (options.autoCmds) {
      const cmds = options.autoCmds
      const maxLen = cmds.maxLen
      if (!maxLen) return

      // Gather as many `CmdVar`s as possible (but only up to `maxLen`)
      let leftmost: Command = self
      const text = [self.text]
      while (text.length < maxLen && leftmost[L]?.autoCmd) {
        leftmost = leftmost[L]
        text.unshift(leftmost.autoCmd!)
      }

      // Try each combination
      while (text.length) {
        const word = text.join("")
        if (cmds.has(word)) {
          const cmd = cmds.get(word)!
          new Span(cursor.parent, leftmost[L], self[R]).remove()
          cmd.init(cursor, { ...props, input: "\\" + word })
          return
        }

        text.shift()
        leftmost = leftmost[R]!
      }
    }
  }

  readonly kind: WordKind | null = null
  readonly part: Dir | null = null

  static render(text: string, kind: CmdVar["kind"], part: CmdVar["part"]) {
    const side =
      part == L ? "-l"
      : part == R ? "-r"
      : "-mid"

    return h(
      "nya-cmd-var" +
        (kind ? ` nya-cmd-word nya-cmd-word-${kind} nya-cmd-word${side}` : ""),
      h(
        "font-['Times_New_Roman'] [line-height:.9]" +
          (kind == null ? " italic" : "") +
          // `relative` helps keep f above other letters, which is important in selections
          (text == "f" ?
            " mx-[.1em] [.nya-cmd-word>:where(&)]:mx-0 relative"
          : ""),
        t(text),
      ),
    )
  }

  constructor(
    readonly text: string,
    readonly options: Options,
  ) {
    // The wrapper ensures selections work fine
    super(text, CmdVar.render(text, null, null))
  }

  private render(kind = this.kind, part = this.part) {
    if (this.kind == kind && this.part == part) {
      return
    }

    this.setEl(
      CmdVar.render(
        this.text,
        ((this as any).kind = kind),
        ((this as any).part = part),
      ),
    )
  }

  private checkWords(words: WordMap<WordKind>) {
    const vars: CmdVar[] = [this]

    let lhs: CmdVar = this
    while (lhs[L] instanceof CmdVar) {
      lhs = lhs[L]
      vars.push(lhs)
    }
    vars.reverse()

    let rhs: CmdVar = this
    while (rhs[R] instanceof CmdVar) {
      rhs = rhs[R]
      vars.push(rhs)
    }

    for (const cmd of vars) {
      cmd.render(null, null)
    }

    const maxLen = words.maxLen
    if (maxLen == 0) return

    for (let i = 0; i < vars.length; i++) {
      // `maxLen` might be shorter if we're near the end of the `vars` array
      const max = Math.min(vars.length - i, maxLen)

      const text: string[] = []
      for (let j = 0; j < max; j++) {
        text.push(vars[i + j]!.text)
      }

      for (let j = max; j > 1; j--, text.pop()) {
        const full = text.join("")
        const kind = words.get(full)

        if (kind) {
          vars[i]!.render(kind, L)
          for (let k = i + 1; k < i + j - 1; k++) {
            vars[k]!.render(kind, null)
          }
          vars[i + j - 1]!.render(kind, R)
          i += j - 1
          break
        }
      }
    }
  }

  ascii(): string {
    return this.text
  }

  latex(): string {
    if (this.part == L) {
      return "\\operatorname{" + this.text
    }
    if (this.part == R) {
      return this.text + "}"
    }
    return this.text
  }

  reader(): string {
    if (this.kind) {
      if (this.part == L) {
        return " " + this.text
      } else if (this.part == R) {
        return this.text + " "
      }
    }
    return this.text
  }

  onSiblingChange(): void {
    if (this.options.words) {
      this.checkWords(this.options.words)
    }
  }

  moveAcrossWord(cursor: Cursor, dir: Dir): void {
    if (!this.kind) {
      super.moveAcrossWord(cursor, dir)
      return
    }

    if (dir == L) {
      do {
        cursor.move(L)
      } while (
        cursor[L] instanceof CmdVar &&
        cursor[L].kind &&
        (cursor[R] as CmdVar).part != L
      )
    } else {
      do {
        cursor.move(R)
      } while (
        cursor[R] instanceof CmdVar &&
        cursor[R].kind &&
        (cursor[L] as CmdVar).part != R
      )
    }
  }

  ir(tokens: Node[]): void {
    if (this.kind) {
      if (this.part == L) {
        tokens.push({
          type: "var",
          value: this.text,
          kind: this.kind,
        })
        return
      }

      let last = tokens[tokens.length - 1]
      if (last && last.type == "var" && !last.sub && !last.sup) {
        last.value += this.text
      } else {
        tokens.push(
          (last = {
            type: "var",
            value: this.text,
            kind: this.kind,
          }),
        )
      }

      if (this.part == R && last.value in PRECEDENCE_MAP) {
        tokens.pop()
        tokens.push({
          type: "punc",
          kind: "infix",
          value: last.value as PuncInfix,
        })
      }

      return
    }

    tokens.push({ type: "var", value: this.text, kind: "var" })
  }

  get autoCmd(): string {
    return this.text
  }
}
