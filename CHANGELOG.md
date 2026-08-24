# @openproject/stimulus-elements

## 0.3.0

### Minor Changes

- [#1](https://github.com/opf/stimulus-elements/pull/1) [`5d606a3`](https://github.com/opf/stimulus-elements/commit/5d606a38e1a14f8b5f43ddd3a49c4740852a5c0d) Thanks [@myabc](https://github.com/myabc)! - Fix `WithElements` to camelize keys like the runtime, and warn on colliding element keys
  
  - `WithElements<{ menu_item: string }>` now yields `menuItemElement` /
    `menuItemElements` / `hasMenuItemElement`, matching the runtime accessors.
    Previously it produced the wrong `menu_itemElement` names; if you worked
    around this by passing pre-camelized keys, those still work — but usages
    typed against the old snake_case accessor names must be renamed.
  - Element keys whose generated accessor names collide (e.g. `foo` and `_foo`
    both produce `hasFooElement`, or `foo`'s predicate vs `hasFoo`'s getter)
    now emit a console warning naming both keys; the later definition wins that
    property, as before.
  - The naming rule (key → accessor triple + attribute suffix) now lives in one
    module, with the acronym behaviour (`htmlURL` → `html-u-r-l`) locked in by
    tests.
