# Domain glossary

Vocabulary for this library. Use these terms in code, tests, and reviews.

## Terms

**Element definition**
The mapping from one `static elements` key to its accessor triple and
attribute-override suffix. Owned by `src/element-definition.ts` — the single
place the naming rule lives, at runtime (`elementDefinition`) and at the type
level (`Camelize`, `WithElements`).

**Accessor triple**
The three generated properties per element definition: `xElement`
(`Element | null`), `xElements` (`Element[]`), `hasXElement` (`boolean`),
where `x` is the camelized key.

**Attribute override**
The per-instance selector override read from the controller element:
`data-{identifier}-{suffix}-element`, where `{suffix}` is the dasherized
element name. Non-empty values win over the static selector; read live.

**Blessing**
Stimulus's mechanism for extending controllers at registration time.
`ElementsBlessing` (`src/blessing.ts`) turns `static elements` into the
accessor triples via element definitions.

**Scoped query**
The single DOM-lookup module (`src/query.ts`): `scopedQuery(root, selector)`
returns `{ first, all, exists }`. Owns the falsy-root guard, invalid-selector
handling, and the warn-once policy; callers never see those concerns.

## Recorded decisions

- **Acronym lock-in.** Dasherization is naive and Stimulus-compatible:
  `htmlURL` → suffix `html-u-r-l`. Locked in by tests; not to be "fixed".
- **Collision policy.** The three generated names share one property
  namespace. A clash between names from *different* raw keys (e.g. `foo` vs
  `_foo` on `hasFooElement`, or `foo` vs `hasFoo` across kinds) warns and the
  later definition wins that property. Same-raw-key redefinition (subclass
  overriding a parent selector) stays silent. Nothing throws.
- **Type level unions colliding roles.** `WithElements` cannot model
  property-level last-wins (runtime key order decides), so a colliding name
  gets the union of every role that generates it (e.g. `hasFooElement:
  boolean | Element | null`), forcing callers to narrow. An intersection was
  rejected: it is silently assignable to *both* roles on reads, hiding the
  pathology instead of surfacing it.
- **Warn-once is per root element.** The invalid-selector warning registry
  is a `WeakMap` keyed by the query root, not a process-global set. Lifetime
  is an implementation detail: warnings die with the element, tests need no
  reset hook, and each controller element reports a bad selector once.
- **Type/runtime lockstep.** `Camelize<K>` mirrors the runtime `camelize`
  regex exactly (ASCII-only, tail-recursive). Twin sample tables live in
  `test/element-definition.test.ts` and `test/types.test-d.ts` — keep in sync.
