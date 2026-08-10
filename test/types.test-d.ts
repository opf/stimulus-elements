// Type-level assertions, checked by `bun run typecheck` (tsc --noEmit).
// Not a bun test file — the ".test-d." name is deliberately skipped by bun test.
// Camelization sample table mirrors the runtime regex /[-_]([a-z0-9])/gi.
// Keep in sync with test/element-definition.test.ts.
import type { Camelize, WithElements } from "../src/element-definition"

type Expect<T extends true> = T
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
  ? true
  : false

type _Cases = [
  Expect<Equal<Camelize<"menu_item">, "menuItem">>,
  Expect<Equal<Camelize<"menu-item">, "menuItem">>,
  Expect<Equal<Camelize<"backdrop">, "backdrop">>,
  Expect<Equal<Camelize<"alreadyCamel">, "alreadyCamel">>,
  Expect<Equal<Camelize<"foo--bar">, "foo-Bar">>,
  Expect<Equal<Camelize<"foo__bar">, "foo_Bar">>,
  Expect<Equal<Camelize<"foo-">, "foo-">>,
  Expect<Equal<Camelize<"foo_">, "foo_">>,
  Expect<Equal<Camelize<"x--">, "x--">>,
  Expect<Equal<Camelize<"_foo">, "Foo">>,
  Expect<Equal<Camelize<"-foo">, "Foo">>,
  Expect<Equal<Camelize<"foo-.bar">, "foo-.bar">>,
  Expect<Equal<Camelize<"foo_.bar">, "foo_.bar">>,
  Expect<Equal<Camelize<"foo-Bar">, "fooBar">>,
  Expect<Equal<Camelize<"foo-1bar">, "foo1bar">>,
  Expect<Equal<Camelize<"foo-_bar">, "foo-Bar">>,
  Expect<Equal<Camelize<"a-b-c">, "aBC">>,
  Expect<Equal<Camelize<"a-b_c-D">, "aBCD">>,
  Expect<Equal<Camelize<"htmlURL">, "htmlURL">>,
  Expect<Equal<Camelize<"foo-über">, "foo-über">>,
  Expect<Equal<Camelize<"-1thing">, "1thing">>,
  Expect<
    Equal<
      Camelize<"a_very_long_element_key_name_that_goes_on_and_on_for_quite_a_while">,
      "aVeryLongElementKeyNameThatGoesOnAndOnForQuiteAWhile"
    >
  >,
  // Degenerate and non-literal inputs terminate; union keys distribute.
  Expect<Equal<Camelize<"">, "">>,
  Expect<Equal<Camelize<string>, string>>,
  Expect<Equal<Camelize<"menu_item" | "backdrop">, "menuItem" | "backdrop">>,
]

// WithElements: one declared key produces exactly the camelized accessor triple.
type W = WithElements<{ menu_item: string; backdrop: string }>
type _WithElementsCases = [
  Expect<
    Equal<
      keyof W,
      | "menuItemElement"
      | "menuItemElements"
      | "hasMenuItemElement"
      | "backdropElement"
      | "backdropElements"
      | "hasBackdropElement"
    >
  >,
  Expect<Equal<W["menuItemElement"], Element | null>>,
  Expect<Equal<W["menuItemElements"], Element[]>>,
  Expect<Equal<W["hasMenuItemElement"], boolean>>,
  Expect<Equal<keyof WithElements<{ "menu-item": string }>, "menuItemElement" | "menuItemElements" | "hasMenuItemElement">>,
  Expect<Equal<keyof WithElements<{ "1thing": string }>, "1thingElement" | "1thingElements" | "has1thingElement">>,
  // Numeric keys are stringified like Object.keys does at runtime.
  Expect<Equal<keyof WithElements<{ 1: string }>, "1Element" | "1Elements" | "has1Element">>,
  // Colliding names get the union of their roles — callers must narrow.
  Expect<Equal<WithElements<{ foo: string; hasFoo: string }>["hasFooElement"], Element | null | boolean>>,
]
