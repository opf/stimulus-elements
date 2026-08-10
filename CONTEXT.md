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
handling, :scope anchoring, and the warn-once policy; callers never see those
concerns.

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
- **Selectors are :scope-anchored per alternative.** `querySelector(sel)`
  matches selectors document-wide and only filters *results* to descendants,
  so `.menu li` can bind via a `.menu` ancestor outside the controller
  element. `anchorToScope` prefixes `:scope ` onto every *top-level*
  comma-separated alternative (split by a depth/quote/escape/comment-aware
  scanner — commas only nest inside quotes, parens, brackets, escapes, or
  `/* … */` comments in valid selector syntax; comments are stripped since
  their contents would otherwise corrupt the quote tracking). Only a
  *leading* `:scope` proves an alternative is rooted and passes through;
  a non-leading `:scope` (`:not(:scope) .item`, `.outer :scope .item`) does
  not anchor and gets the prefix too — at worst that makes the alternative
  unmatchable, which fails closed instead of leaking. A `:scope :is(...)`
  wrap was rejected: it anchors only the subject, combinator left-hand sides
  inside `:is()` still match ancestors outside the root. Note: happy-dom
  already restricts
  combinator matching to the subtree (non-spec), so the leak only reproduces
  in real browsers — the guarantee is pinned by unit tests on the pure
  rewrite, verified manually in Chrome.
- **Selector trust model.** Override attributes are as trusted as any
  Stimulus `data-*` attribute — attribute injection already grants
  `data-controller`/`data-action`, which is strictly stronger. Selector
  evaluation is read-only, fails closed, and returns only descendants of the
  controller element. `CSS.escape` has no application point inside this
  library (nothing is interpolated into a selector template); it is user
  guidance for dynamically built selector values.
- **Type/runtime lockstep.** `Camelize<K>` mirrors the runtime `camelize`
  regex exactly (ASCII-only, tail-recursive). Twin sample tables live in
  `test/element-definition.test.ts` and `test/types.test-d.ts` — keep in sync.
