// Single owner of the element-naming rule: one `static elements` key maps to
// the accessor triple (`xElement` / `xElements` / `hasXElement`) and the
// attribute-override suffix (`data-{identifier}-{suffix}-element`).
//
// Acronym keys keep Stimulus's naive dasherization on purpose:
// `htmlURL` → suffix `html-u-r-l`.

export interface ElementDefinition {
  readonly getterName: string
  readonly pluralName: string
  readonly predicateName: string
  readonly attributeSuffix: string
}

export function elementDefinition(key: string): ElementDefinition {
  const name = camelize(key)
  return {
    getterName: `${name}Element`,
    pluralName: `${name}Elements`,
    predicateName: `has${capitalize(name)}Element`,
    attributeSuffix: dasherize(name),
  }
}

// Merge raw `static elements` pairs into definitions:
// - same raw key: later-wins silently (subclass overrides parent selector)
// - different raw keys claiming the same generated property name: warn;
//   the later descriptor wins that property (Object.assign semantics).
// The three generated names share one property namespace, so `foo`/`_foo`
// collide on the predicate and `foo`/`hasFoo` collide across kinds.
export function mergeElementDefinitions(
  pairs: [string, string][],
): { definition: ElementDefinition; selector: string }[] {
  const byRawKey = new Map<string, string>()
  for (const [key, selector] of pairs) {
    byRawKey.set(key, selector) // later-wins → subclass overrides
  }

  const claimedBy = new Map<string, string>()
  const merged: { definition: ElementDefinition; selector: string }[] = []
  for (const [key, selector] of byRawKey) {
    const definition = elementDefinition(key)
    for (const property of [
      definition.getterName,
      definition.pluralName,
      definition.predicateName,
    ]) {
      const incumbent = claimedBy.get(property)
      if (incumbent !== undefined && incumbent !== key) {
        console.warn(
          `[stimulus-elements] Element keys ${JSON.stringify(incumbent)} and ${JSON.stringify(key)} ` +
            `both define property ${JSON.stringify(property)}; using ${JSON.stringify(selector)} from ${JSON.stringify(key)}`,
        )
      }
      claimedBy.set(property, key)
    }
    merged.push({ definition, selector })
  }
  return merged
}

function camelize(value: string): string {
  return value.replace(/[-_]([a-z0-9])/gi, (_match, char: string) => char.toUpperCase())
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1)
}

function dasherize(value: string): string {
  return value.replace(/([A-Z])/g, (_match, char: string) => `-${char.toLowerCase()}`)
}

type Separator = "-" | "_"
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
type LowerAlpha =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
// Mirrors the runtime regex char class [a-z0-9] with the `i` flag: ASCII only.
type Camelizable = Digit | LowerAlpha | Uppercase<LowerAlpha>

// Tail-recursive (accumulator) form — the nested form hits TS2589 on long keys.
type CamelizeImpl<S extends string, Acc extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Separator
      ? Tail extends `${infer Next}${infer Rest}`
        ? Next extends Camelizable
          ? CamelizeImpl<Rest, `${Acc}${Uppercase<Next>}`>
          : CamelizeImpl<Tail, `${Acc}${Head}`>
        : `${Acc}${Head}`
      : CamelizeImpl<Tail, `${Acc}${Head}`>
    : `${Acc}${S}`

// Type-level twin of `camelize` — must stay in lockstep with the regex above.
export type Camelize<S extends string> = CamelizeImpl<S, "">

// Numeric keys are stringified like the runtime (`Object.keys`) does.
type ElementName<T> = Camelize<`${keyof T & (string | number)}`>

type GetterNames<T> = `${ElementName<T>}Element`
type PluralNames<T> = `${ElementName<T>}Elements`
type PredicateNames<T> = `has${Capitalize<ElementName<T>>}Element`

// Declaration-merging helper: describe the accessors a `static elements`
// definition generates, so controllers get typed `this.xElement` access.
//
//   interface MyController extends WithElements<{ backdrop: string }> {}
//   class MyController extends Controller {
//     static elements = { backdrop: "#backdrop" }
//   }
//
// Keys are camelized exactly like the runtime does, so snake_case and
// kebab-case keys yield the same accessor names in both worlds.
//
// Each property is the union of every role that generates its name. For
// non-colliding keys that is a single role and the exact accessor type;
// when keys collide (`foo`/`hasFoo` both produce `hasFooElement`) the
// union forces callers to narrow, since runtime key order decides.
export type WithElements<T extends Record<string, string>> = {
  [P in GetterNames<T> | PluralNames<T> | PredicateNames<T>]:
    | (P extends GetterNames<T> ? Element | null : never)
    | (P extends PluralNames<T> ? Element[] : never)
    | (P extends PredicateNames<T> ? boolean : never)
}
