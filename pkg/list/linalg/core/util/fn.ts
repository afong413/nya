import type { SReal } from "@/eval/ty"
import { num, real } from "@/eval/ty/create"

export function sqrt(x: SReal): SReal {
  return real(num(x) ** 0.5)
}

export function isVector(v: SReal[][]): boolean {
  return v[0]?.length === 1
}
