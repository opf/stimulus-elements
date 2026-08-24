import { test, expect, beforeEach, vi } from "vitest"
import { scopedQuery, anchorToScope } from "../src/query"

beforeEach(() => {
  document.body.innerHTML = `
    <div class="wrap">
      <section id="root">
        <span class="item">1</span>
        <span class="item">2</span>
        <b id="only"></b>
        <span data-x="a,b" id="attr-comma"></span>
        <div class="inner"><span class="deep-item">d</span></div>
      </section>
    </div>
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

// The :scope anchoring guarantee: unit tests pin the pure selector rewrite,
// and (since the suite runs in a real browser) the scopedQuery tests below
// exercise the actual leak — ".wrap .item" matching via an ancestor OUTSIDE
// the root. See harness.test.ts for the environment guard.
test("anchorToScope prefixes a bare selector", () => {
  expect(anchorToScope(".wrap .item")).toBe(":scope .wrap .item")
})

test("anchorToScope prefixes every comma-separated alternative", () => {
  expect(anchorToScope(".a, .b")).toBe(":scope .a, :scope .b")
})

test("anchorToScope does not split on commas inside parentheses", () => {
  expect(anchorToScope(":is(.a, .b) > li")).toBe(":scope :is(.a, .b) > li")
})

test("anchorToScope does not split on commas inside quoted attribute values", () => {
  expect(anchorToScope('[data-x="a,b"]')).toBe(':scope [data-x="a,b"]')
  expect(anchorToScope("[data-x='a,b']")).toBe(":scope [data-x='a,b']")
})

test("anchorToScope does not split on escaped commas", () => {
  expect(anchorToScope(".a\\,b")).toBe(":scope .a\\,b")
})

test("anchorToScope leaves alternatives with a LEADING :scope untouched", () => {
  expect(anchorToScope(":scope > .item")).toBe(":scope > .item")
  expect(anchorToScope(":SCOPE .a, .b")).toBe(":SCOPE .a, :scope .b")
  expect(anchorToScope(":scope.foo .item")).toBe(":scope.foo .item")
})

test("anchorToScope prefixes alternatives where :scope is not the leading anchor", () => {
  // a non-leading :scope must not disable anchoring — these could otherwise
  // match through ancestors outside the root
  expect(anchorToScope(":not(:scope) .item")).toBe(":scope :not(:scope) .item")
  expect(anchorToScope(".outer :scope .item")).toBe(":scope .outer :scope .item")
  expect(anchorToScope('[data-x=":scope"] .item')).toBe(':scope [data-x=":scope"] .item')
  // ":scope" glued to an identifier tail is not the :scope pseudo-class
  expect(anchorToScope(":scoped .item")).toBe(":scope :scoped .item")
})

test("anchorToScope strips CSS comments so they cannot confuse the scanner", () => {
  // a quote inside a comment must not jam the quote state and hide the comma
  expect(anchorToScope('.none/*"*/, .outer .item')).toBe(":scope .none, :scope .outer .item")
  // comments are removed without inserting whitespace (CSS tokenizer semantics)
  expect(anchorToScope(".a/*x*/.b")).toBe(":scope .a.b")
  // unterminated comment consumes the rest of the selector
  expect(anchorToScope(".a/*, .outer .item")).toBe(":scope .a")
})

test("anchorToScope makes relative selectors explicit", () => {
  expect(anchorToScope("> .item")).toBe(":scope > .item")
})

test("combinators cannot match through ancestors outside the root", () => {
  expect(scopedQuery(root(), ".wrap .item").first()).toBeNull()
  expect(scopedQuery(root(), ".wrap .item").all()).toEqual([])
})

test("combinators still work when the full path is inside the root", () => {
  const deep = scopedQuery(root(), ".inner .deep-item").first()
  expect(deep!.textContent).toBe("d")
})

test("every comma-separated alternative is anchored to the root", () => {
  // second alternative must not escape the anchor via the comma
  expect(scopedQuery(root(), ".none, .wrap .item").first()).toBeNull()
  // but comma alternatives that are inside the root still match
  expect(scopedQuery(root(), ".none, .item").all().length).toBe(2)
})

test("relative selectors match direct children of the root", () => {
  const items = scopedQuery(root(), "> .item").all()
  expect(items.map((el) => el.textContent)).toEqual(["1", "2"])
  expect(scopedQuery(root(), "> .deep-item").first()).toBeNull()
})

test("commas inside :is() are not treated as list separators", () => {
  expect(scopedQuery(root(), ":is(.item, .none)").all().length).toBe(2)
})

test("commas inside quoted attribute values are not treated as list separators", () => {
  expect(scopedQuery(root(), '[data-x="a,b"]').first()).toBe(
    document.getElementById("attr-comma"),
  )
})

test("an explicit :scope in the selector is left untouched", () => {
  const items = scopedQuery(root(), ":scope > .item").all()
  expect(items.length).toBe(2)
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
