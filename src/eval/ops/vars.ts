import type { GlslValue, JsValue } from "../ty"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
  dynamic?: boolean
}

export const ERR_COORDS_USED_OUTSIDE_GLSL =
  "Cannot access pixel coordinates outside of shaders."

export const VARS: Record<string, Builtin> = Object.create(null)
