export const U_ZERO_WIDTH_SPACE = "\u200B"

export function h(
  cl?: string | Record<string, string | null>,
  ...children: (Node | string | null)[]
) {
  return hx("span", cl, ...children)
}

export function hx<K extends keyof HTMLElementTagNameMap>(
  name: K,
  cl?: string | Record<string, string | null>,
  ...children: (Node | string | null)[]
) {
  const el = document.createElement(name)
  if (typeof cl == "string") {
    el.className = cl
  } else if (cl) {
    for (const key in cl) {
      if (cl[key]) {
        el.setAttribute(key, cl[key])
      }
    }
  }
  for (const child of children) {
    if (child) {
      el.append(child)
    }
  }
  return el
}

export function t(text: string) {
  return document.createTextNode(text)
}

export function p(d: string) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path")
  el.setAttribute("d", d)
  return el
}

export function g(className: string, ...children: ChildNode[]) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "g")
  el.setAttribute("class", className)
  el.append(...children)
  return el
}

export function svg(viewBox: string, ...children: ChildNode[]) {
  const el = svgx(
    viewBox,
    "fill-current absolute top-0 left-0 w-full h-full",
    ...children,
  )
  el.setAttribute("preserveAspectRatio", "none")
  return el
}

export function svgx(
  viewBox: string,
  className: string | Record<string, string>,
  ...children: ChildNode[]
) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  el.setAttribute("viewBox", viewBox)
  if (typeof className == "string") {
    el.setAttribute("class", className)
  } else {
    for (const key in className) {
      el.setAttribute(key, className[key]!)
    }
  }
  for (const child of children) {
    el.appendChild(child)
  }
  return el
}

export function usvg(
  classes: string,
  viewBox: `${number} ${number} ${number} ${number}`,
  d: string,
  stroke = 0.4,
) {
  const [x1, y1, w, h] = viewBox.split(" ").map(parseFloat)
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  el.setAttribute("preserveAspectRatio", "none")
  el.setAttribute(
    "viewBox",
    `${x1! - stroke / 2} ${y1! - stroke / 2} ${w! + stroke} ${h! + stroke}`,
  )
  el.setAttribute("fill", "none")
  el.setAttribute("stroke", "currentColor")
  el.setAttribute("stroke-width", "" + stroke)
  el.setAttribute("stroke-linecap", "square")
  el.setAttribute("stroke-linejoin", "miter")
  el.setAttribute("stroke-miterlimit", "100")
  el.setAttribute("class", classes)
  el.appendChild(p(d))
  return el
}

export function a(href: string, ...children: (Node | string | null)[]) {
  return hx(
    "a",
    { class: "text-blue-500 underline underline-offset-2", href },
    ...children,
  )
}

export interface SVGProps {
  svg: {
    class?: string
    fill?: string
  }
  g: {
    class?: string
  }
  line: {
    x1: number
    y1: number
    x2: number
    y2: number
    stroke?: string
    "stroke-width"?: number
    "stroke-opacity"?: number
    "stroke-linecap"?: "round"
  }
  circle: {
    class?: string
    cx: number
    cy: number
    r: number
    fill?: string
    stroke?: string
    "fill-opacity"?: number
    "stroke-width"?: number
    "stroke-opacity"?: number
  }
  foreignObject: {
    class?: string
    x: number
    y: number
    width: number
    height: number
  }
}

export type SVGClassOnlyElements = {
  [K in keyof SVGProps]: { class?: string } extends SVGProps[K] ? K : never
}[keyof SVGProps]

// TODO: use sx for all SVG functions

export function sx<K extends keyof SVGProps>(
  name: K,
  cl: SVGProps[K],
  ...children: (Node | null)[]
): SVGElementTagNameMap[K]

export function sx<K extends SVGClassOnlyElements>(
  name: K,
  cl?: string | SVGProps[K],
  ...children: (Node | null)[]
): SVGElementTagNameMap[K]

export function sx(
  name: string,
  cl?: string | Record<string, string | number | null>,
  ...children: (Node | null)[]
) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name)
  if (typeof cl == "string") {
    el.setAttribute("class", cl)
  } else if (cl) {
    for (const key in cl) {
      if (cl[key]) {
        el.setAttribute(key, "" + cl[key])
      }
    }
  }
  for (const child of children) {
    if (child) {
      el.append(child)
    }
  }
  return el
}
