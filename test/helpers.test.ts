import { test, expect } from "bun:test"
import { camelize, capitalize, dasherize, readInheritableStaticObjectPairs } from "../src/helpers"

test("camelize handles snake_case, kebab-case, and passthrough", () => {
  expect(camelize("menu_item")).toBe("menuItem")
  expect(camelize("menu-item")).toBe("menuItem")
  expect(camelize("backdrop")).toBe("backdrop")
  expect(camelize("alreadyCamel")).toBe("alreadyCamel")
})

test("capitalize uppercases the first character", () => {
  expect(capitalize("backdrop")).toBe("Backdrop")
  expect(capitalize("")).toBe("")
})

test("dasherize splits camelCase into kebab-case", () => {
  expect(dasherize("menuItem")).toBe("menu-item")
  expect(dasherize("backdrop")).toBe("backdrop")
  expect(dasherize("a")).toBe("a")
  expect(dasherize("ariaLabelledBy")).toBe("aria-labelled-by")
})

test("readInheritableStaticObjectPairs merges own static props base-first", () => {
  class Base {
    static elements: Record<string, string> = { a: "#a", b: "#b" }
  }
  class Child extends Base {
    static override elements: Record<string, string> = { b: "#b2", c: "#c" }
  }
  const pairs = readInheritableStaticObjectPairs<string>(Child, "elements")
  // base first, then child; consumer dedupes with later-wins
  expect(pairs).toEqual([
    ["a", "#a"],
    ["b", "#b"],
    ["b", "#b2"],
    ["c", "#c"],
  ])
})

test("readInheritableStaticObjectPairs ignores inherited (non-own) statics and missing prop", () => {
  class Base {}
  class Child extends Base {}
  expect(readInheritableStaticObjectPairs(Child, "elements")).toEqual([])
})

test("readInheritableStaticObjectPairs does not duplicate inherited (non-own) statics", () => {
  class Base {
    static elements = { a: "#a" }
  }
  class Child extends Base {}
  // Child has no own `elements`; must not re-emit Base's pairs
  expect(readInheritableStaticObjectPairs<string>(Child, "elements")).toEqual([["a", "#a"]])
})
