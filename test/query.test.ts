import { test, expect, beforeEach, vi } from "vitest"
import { scopedQuery } from "../src/query"

beforeEach(() => {
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

test("first() returns the first scoped match or null", () => {
  expect(scopedQuery(root(), "#only").first()).toBe(document.getElementById("only"))
  expect(scopedQuery(root(), ".missing").first()).toBeNull()
})

test("first() is scoped to root — elements outside are not found", () => {
  // ".item" outside #root exists, but scoped query only sees the two inside
  const found = scopedQuery(root(), ".item").first()
  expect(found).toBe(root().querySelector(".item"))
  expect(found!.textContent).toBe("1")
})

test("all() returns a real Array of scoped matches", () => {
  const items = scopedQuery(root(), ".item").all()
  expect(Array.isArray(items)).toBe(true)
  expect(items.length).toBe(2) // outside .item excluded
  expect(items.map((el) => el.textContent)).toEqual(["1", "2"])
})

test("all() returns [] when nothing matches", () => {
  expect(scopedQuery(root(), ".none").all()).toEqual([])
})

test("exists() reports whether a scoped match is present", () => {
  expect(scopedQuery(root(), "#only").exists()).toBe(true)
  expect(scopedQuery(root(), ".missing").exists()).toBe(false)
})

test("methods can be destructured — no this dependence", () => {
  const { first, all, exists } = scopedQuery(root(), ".item")
  expect(first()!.textContent).toBe("1")
  expect(all().length).toBe(2)
  expect(exists()).toBe(true)
})

test("missing root returns null / [] / false without warning", () => {
  const warn = vi.spyOn(console, "warn")
  expect(scopedQuery(null, ".item").first()).toBeNull()
  expect(scopedQuery(undefined, ".item").all()).toEqual([])
  expect(scopedQuery(null, ".item").exists()).toBe(false)
  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
})

test("invalid selector warns once per root and returns null / []", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  expect(scopedQuery(root(), "###").first()).toBeNull()
  expect(scopedQuery(root(), "###").all()).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1) // once per (root, selector), across accesses
  warn.mockRestore()
})

test("empty / whitespace selector warns once per root and returns null / []", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  expect(scopedQuery(root(), "   ").first()).toBeNull()
  expect(scopedQuery(root(), "   ").all()).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})

test("a fresh root gets its own warning — registry is per element, no reset needed", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  scopedQuery(root(), "###").first()
  expect(warn).toHaveBeenCalledTimes(1)

  document.body.innerHTML = `<section id="root"></section>`
  scopedQuery(root(), "###").first()
  expect(warn).toHaveBeenCalledTimes(2)
  warn.mockRestore()
})
