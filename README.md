# stimulus-elements

Declarative, controller-scoped element lookups for Stimulus — like `targets`,
but backed by any CSS selector. Built on the controller-blessing pattern
created by [Marco Roth](https://marcoroth.dev), with code adapted from his
article [Supercharge your Stimulus controllers with custom APIs](https://marcoroth.dev/posts/supercharge-your-stimulus-controllers-with-custom-apis).

> [!IMPORTANT]
> This library is currently used internally at OpenProject and is under
> active development. There is no public roadmap yet — expect APIs to change
> without notice.

## Install

```bash
bun add @openproject/stimulus-elements @hotwired/stimulus
```

## Setup

Register the blessing once, where you start your Stimulus application:

```js
import { installElements } from "@openproject/stimulus-elements"

installElements()
```

`installElements()` must run before you register any controllers / call
`Application.start()` — blessings are snapshotted per controller at
registration time, so installing afterward yields controllers without the
accessors.

## Usage

```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static elements = {
    backdrop: "#backdrop",
    item: ".item",
    menuItem: ".menu > li",
  }

  connect() {
    this.backdropElement?.classList.remove("hidden") // Element | null
    this.itemElements.forEach((el) => (el.dataset.ready = "true")) // Element[]
    if (this.hasMenuItemElement) { /* ... */ } // boolean
  }
}
```

For each entry `foo: "<selector>"` (key camelized) you get:

| Accessor | Type | Behaviour |
|----------|------|-----------|
| `this.fooElement` | `Element \| null` | first match, scoped to the controller element |
| `this.fooElements` | `Element[]` | all matches, as a real array |
| `this.hasFooElement` | `boolean` | whether a match exists |

Lookups are **scoped to the controller's own element**, read **live** on every
access, and never throw — an invalid selector warns once and yields `null` / `[]`.

Scoping is anchored: every selector (and every comma-separated alternative in
it) is evaluated as if prefixed with `:scope`, so combinators cannot reach
through ancestors outside the controller element — `.menu li` only matches
when `.menu` itself is inside the controller. Selectors starting with
`:scope` are left untouched, and relative selectors like `> li` work as-is.

## Overriding selectors from the DOM

Any declared element's selector can be overridden per instance from the controller
element, without changing the controller:

```html
<div data-controller="test"
     data-test-backdrop-element=".backdrop"
     data-test-menu-item-element=".item:not([data-disabled])"></div>
```

The attribute is `data-[identifier]-[name]-element`, where `[name]` is the element
name in kebab-case (so `menuItem` becomes `menu-item`). When present and non-empty it
wins over the static `elements` selector; an empty or whitespace-only value falls back
to the static selector. Overrides are read live, like all lookups.

Keep element names to simple camelCase words — an embedded acronym like `htmlURL` dasherizes to `html-u-r-l`, which is hard to predict in the attribute.

### Security

Selector evaluation is read-only and fails closed, and results are always
descendants of the controller element. Override attributes carry the same
trust level as any Stimulus `data-*` attribute: markup that can inject
`data-*-element` attributes can already inject `data-controller` and
`data-action`, which is strictly more powerful. If you sanitize user-supplied
HTML, strip or allowlist `data-*` attributes. If you build selector values
from user input yourself, escape the dynamic parts with
[`CSS.escape()`](https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape_static).

## TypeScript

```ts
import { Controller } from "@hotwired/stimulus"
import type { WithElements } from "@openproject/stimulus-elements"

interface MyController extends WithElements<{ backdrop: string }> {}
class MyController extends Controller {
  static elements = { backdrop: "#backdrop" }
}
```

`WithElements` camelizes keys exactly like the runtime, so you can pass your
`static elements` keys verbatim — `menu_item` and `menuItem` both yield
`menuItemElement` / `menuItemElements` / `hasMenuItemElement`.

## Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets).
When your PR changes published behaviour, run `bunx changeset` and commit the
generated file alongside your change. On merge to `main`, a "Release Tracking"
PR collects pending changesets; merging that PR bumps the version, updates
`CHANGELOG.md`, and publishes to npm (via OIDC trusted publishing — no tokens).

## Credits

Adapted from Marco Roth's article
[Supercharge your Stimulus controllers with custom APIs](https://marcoroth.dev/posts/supercharge-your-stimulus-controllers-with-custom-apis),
which introduced the blessing pattern this library builds on.
