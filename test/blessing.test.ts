import { test, expect, beforeEach } from "bun:test"
import { ElementsBlessing } from "../src/blessing"
import { resetSelectorWarnings } from "../src/query"

beforeEach(() => resetSelectorWarnings())

// Apply a blessing's descriptors onto a fake controller bound to `element`.
function bless(constructor: unknown, element: Element): any {
  const target: any = { element }
  Object.defineProperties(target, ElementsBlessing(constructor))
  return target
}

function fixture(): Element {
  document.body.innerHTML = `
    <div id="host">
      <i id="backdrop"></i>
      <span class="item">a</span>
      <span class="item">b</span>
    </div>`
  return document.getElementById("host")!
}

test("generates singular, plural, and has accessors with camelized names", () => {
  class C {
    static elements = { backdrop: "#backdrop", menu_item: ".item" }
  }
  const host = fixture()
  const ctrl = bless(C, host)

  expect(ctrl.backdropElement).toBe(host.querySelector("#backdrop"))
  expect(ctrl.menuItemElements.map((el: Element) => el.textContent)).toEqual(["a", "b"])
  expect(ctrl.hasBackdropElement).toBe(true)
})

test("singular is null and has is false when nothing matches", () => {
  class C {
    static elements = { ghost: ".nope" }
  }
  const ctrl = bless(C, fixture())
  expect(ctrl.ghostElement).toBeNull()
  expect(ctrl.hasGhostElement).toBe(false)
  expect(ctrl.ghostElements).toEqual([])
})

test("reads live — DOM added after blessing is picked up", () => {
  class C {
    static elements = { item: ".item" }
  }
  const host = fixture()
  const ctrl = bless(C, host)
  expect(ctrl.itemElements.length).toBe(2)

  const extra = document.createElement("span")
  extra.className = "item"
  host.appendChild(extra)
  expect(ctrl.itemElements.length).toBe(3) // no caching
})

test("subclass overrides parent selector (later-wins)", () => {
  class Base {
    static elements = { thing: "#backdrop" }
  }
  class Child extends Base {
    static override elements = { thing: ".item" }
  }
  const host = fixture()
  const ctrl = bless(Child, host)
  // Child's ".item" wins over Base's "#backdrop"
  expect(ctrl.thingElement).toBe(host.querySelector(".item"))
})
