import { test, expect, vi } from "vitest"
import { elementDefinition, mergeElementDefinitions } from "../src/element-definition"

test("elementDefinition projects the accessor triple and attribute suffix", () => {
  expect(elementDefinition("menu_item")).toEqual({
    getterName: "menuItemElement",
    pluralName: "menuItemElements",
    predicateName: "hasMenuItemElement",
    attributeSuffix: "menu-item",
  })
})

test("acronym keys keep naive dasherization (locked-in, Stimulus-compatible)", () => {
  expect(elementDefinition("htmlURL")).toEqual({
    getterName: "htmlURLElement",
    pluralName: "htmlURLElements",
    predicateName: "hasHtmlURLElement",
    attributeSuffix: "html-u-r-l",
  })
})

// Camelization sample table — mirrors the regex /[-_]([a-z0-9])/gi exactly.
// Keep in sync with test/types.test-d.ts.
const camelizeSamples: [key: string, name: string][] = [
  ["menu_item", "menuItem"],
  ["menu-item", "menuItem"],
  ["backdrop", "backdrop"],
  ["alreadyCamel", "alreadyCamel"],
  ["foo--bar", "foo-Bar"], // first dash kept
  ["foo__bar", "foo_Bar"], // first underscore kept
  ["foo-", "foo-"], // trailing separator kept
  ["foo_", "foo_"],
  ["x--", "x--"],
  ["_foo", "Foo"], // leading separator consumed
  ["-foo", "Foo"],
  ["foo-.bar", "foo-.bar"], // separator before non-alphanumeric kept
  ["foo_.bar", "foo_.bar"],
  ["foo-Bar", "fooBar"], // i flag: separator consumed, char stays upper
  ["foo-1bar", "foo1bar"], // digit consumed unchanged
  ["foo-_bar", "foo-Bar"], // dash kept, underscore consumed
  ["a-b-c", "aBC"], // scan resumes after each match
  ["a-b_c-D", "aBCD"],
  ["foo-über", "foo-über"], // regex char class is ASCII-only
  ["-1thing", "1thing"],
  [
    "a_very_long_element_key_name_that_goes_on_and_on_for_quite_a_while",
    "aVeryLongElementKeyNameThatGoesOnAndOnForQuiteAWhile",
  ],
]

test("camelization matches the sample table", () => {
  for (const [key, name] of camelizeSamples) {
    expect(elementDefinition(key).getterName).toBe(`${name}Element`)
  }
})

test("predicate for a digit-leading key capitalizes to the same string", () => {
  expect(elementDefinition("1thing").predicateName).toBe("has1thingElement")
})

test("merge: same raw key later-wins silently (subclass override path)", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  const merged = mergeElementDefinitions([
    ["thing", "#a"],
    ["thing", "#b"],
  ])
  expect(merged).toHaveLength(1)
  expect(merged[0]!.selector).toBe("#b")
  expect(merged[0]!.definition.getterName).toBe("thingElement")
  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
})

test("merge: cross-key predicate collision warns and keeps both definitions", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  // foo → fooElement/fooElements/hasFooElement; _foo → FooElement/FooElements/hasFooElement
  const merged = mergeElementDefinitions([
    ["foo", ".a"],
    ["_foo", ".b"],
  ])
  expect(merged).toHaveLength(2)
  expect(warn).toHaveBeenCalledTimes(1)
  const message = String(warn.mock.calls[0]![0])
  expect(message).toContain('"foo"')
  expect(message).toContain('"_foo"')
  expect(message).toContain('"hasFooElement"')
  expect(message).toContain('".b"')
  warn.mockRestore()
})

test("merge: cross-kind collision (predicate vs getter) warns once", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  // foo's predicate hasFooElement vs hasFoo's getter hasFooElement
  const merged = mergeElementDefinitions([
    ["foo", ".a"],
    ["hasFoo", ".b"],
  ])
  expect(merged).toHaveLength(2)
  expect(warn).toHaveBeenCalledTimes(1)
  const message = String(warn.mock.calls[0]![0])
  expect(message).toContain('"foo"')
  expect(message).toContain('"hasFoo"')
  expect(message).toContain('"hasFooElement"')
  warn.mockRestore()
})
