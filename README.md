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
accessors. This failure is **silent**: Stimulus leaves no trace of earlier
registrations the library could detect and warn about, so there is no
runtime error — the accessors are simply `undefined`. Calling
`installElements()` more than once is safe, including from two bundled
copies of this package.

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

## TypeScript

```ts
import { Controller } from "@hotwired/stimulus"
import type { WithElements } from "@openproject/stimulus-elements"

interface MyController extends WithElements<{ backdrop: string }> {}
class MyController extends Controller {
  static elements = { backdrop: "#backdrop" }
}
```

`WithElements` keys must already be camelCase (matching the generated accessor
names) — e.g. use `menuItem`, not `menu_item`, in the type argument even though
the runtime `static elements` key may be `menu_item`.

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
