import { h, path, svgx } from "@/jsx"

// AIDEN/TODO: Color icons

export function m32Icon(): HTMLSpanElement {
  return h(
    "",
    h(
      "text-[#000] dark:text-[#888] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
      h("opacity-25 block bg-current absolute inset-0"),
      svgx(
        "0 0 16 16",
        "size-[16px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible [stroke-linecap:round] stroke-current stroke-2 [stroke-linejoin:round] fill-none",
        path(`M 3 0 h -3 v 16 h 3 M 13 0 h 3 v 16 h -3`),
      ),
      h(
        "size-[3px] bg-current absolute rounded-full top-[35%] left-[35%] -translate-x-1/2 -translate-y-1/2",
      ),
      h(
        "size-[3px] bg-current absolute rounded-full top-[35%] left-[65%] -translate-x-1/2 -translate-y-1/2",
      ),
      h(
        "size-[3px] bg-current absolute rounded-full top-[65%] left-[65%] -translate-x-1/2 -translate-y-1/2",
      ),
      h(
        "size-[3px] bg-current absolute rounded-full top-[65%] left-[35%] -translate-x-1/2 -translate-y-1/2",
      ),
    ),
  )
}

export function v32Icon(): HTMLSpanElement {
  return h(
    "",
    h(
      "text-[#000] dark:text-[#888] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
      h("opacity-25 block bg-current absolute inset-0"),
      svgx(
        "0 0 16 16",
        "size-[16px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible [stroke-linecap:round] stroke-current stroke-2 [stroke-linejoin:round] fill-none",
        path(`M 5 0 h -3 v 16 h 3 M 11 0 h 3 v 16 h -3`),
      ),
      h(
        "size-[3px] bg-current absolute rounded-full top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2",
      ),
      h(
        "size-[3px] bg-current absolute rounded-full top-[65%] left-[50%] -translate-x-1/2 -translate-y-1/2",
      ),
    ),
  )
}
