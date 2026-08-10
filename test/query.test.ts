import { test, expect, beforeEach, vi } from "vitest"
import { queryOne, queryAll, resetSelectorWarnings } from "../src/query"

beforeEach(() => {
  resetSelectorWarnings()
  document.body.innerHTML = `
    <section id="root">
      <span class="item">1</span>
      <span class="item">2</span>
      <b id="only"></b>
    </section>
    <span class="item">outside</span>
  `
})

function root(): Element {
  return document.getElementById("root")!
}

test("queryOne returns the first scoped match or null", () => {
  expect(queryOne(root(), "#only")).toBe(document.getElementById("only"))
  expect(queryOne(root(), ".missing")).toBeNull()
})

test("queryOne is scoped to root — elements outside are not found", () => {
  // ".item" outside #root exists, but scoped query only sees the two inside
  const found = queryOne(root(), ".item")
  expect(found).toBe(root().querySelector(".item"))
  expect(found!.textContent).toBe("1")
})

test("queryAll returns a real Array of scoped matches", () => {
  const items = queryAll(root(), ".item")
  expect(Array.isArray(items)).toBe(true)
  expect(items.length).toBe(2) // outside .item excluded
  expect(items.map((el) => el.textContent)).toEqual(["1", "2"])
})

test("queryAll returns [] when nothing matches", () => {
  expect(queryAll(root(), ".none")).toEqual([])
})

test("missing root returns null / [] without warning", () => {
  const warn = vi.spyOn(console, "warn")
  expect(queryOne(null, ".item")).toBeNull()
  expect(queryAll(undefined, ".item")).toEqual([])
  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
})

test("invalid selector warns once and returns null / []", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  expect(queryOne(root(), "###")).toBeNull()
  expect(queryAll(root(), "###")).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1) // once per selector, across both calls
  warn.mockRestore()
})

test("empty / whitespace selector warns once and returns null / []", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  expect(queryOne(root(), "   ")).toBeNull()
  expect(queryAll(root(), "   ")).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})
