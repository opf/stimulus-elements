# stimulus-elements

Declarative, controller-scoped element lookups for Stimulus — like `targets`,
but backed by any CSS selector.

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
