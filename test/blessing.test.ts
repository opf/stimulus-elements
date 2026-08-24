import { test, expect, vi } from "vitest"
import { ElementsBlessing } from "../src/blessing"

// Apply a blessing's descriptors onto a fake controller bound to `element`.
function bless(constructor: unknown, element: Element, identifier = "test"): any {
  const target: any = { element, identifier }
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

test("override attribute wins over the static selector", () => {
  class C {
    static elements = { backdrop: "#backdrop" }
  }
  const host = fixture()
  host.setAttribute("data-test-backdrop-element", ".item")
  const ctrl = bless(C, host)
  expect(ctrl.backdropElement).toBe(host.querySelector(".item"))
})

test("override attribute name uses the dasherized element name", () => {
  class C {
    static elements = { menuItem: ".item" }
  }
  const host = fixture()
  host.setAttribute("data-test-menu-item-element", "#backdrop")
  const ctrl = bless(C, host)
  expect(ctrl.menuItemElement).toBe(host.querySelector("#backdrop"))
})

test("override attribute name is derived from a snake_case element key", () => {
  class C {
    static elements = { menu_item: ".item" }
  }
  const host = fixture()
  host.setAttribute("data-test-menu-item-element", "#backdrop")
  const ctrl = bless(C, host)
  expect(ctrl.menuItemElement).toBe(host.querySelector("#backdrop"))
})

test("empty override attribute falls back to the static selector", () => {
  class C {
    static elements = { backdrop: "#backdrop" }
  }
  const host = fixture()
  host.setAttribute("data-test-backdrop-element", "")
  const ctrl = bless(C, host)
  expect(ctrl.backdropElement).toBe(host.querySelector("#backdrop"))
})

test("whitespace-only override attribute falls back to the static selector", () => {
  class C {
    static elements = { backdrop: "#backdrop" }
  }
  const host = fixture()
  host.setAttribute("data-test-backdrop-element", "   ")
  const ctrl = bless(C, host)
  expect(ctrl.backdropElement).toBe(host.querySelector("#backdrop"))
})

test("override is read live — changing the attribute changes resolution", () => {
  class C {
    static elements = { thing: "#backdrop" }
  }
  const host = fixture()
  const ctrl = bless(C, host)
  expect(ctrl.thingElement).toBe(host.querySelector("#backdrop"))
  host.setAttribute("data-test-thing-element", ".item")
  expect(ctrl.thingElement).toBe(host.querySelector(".item"))
})

test("override applies to plural and has accessors", () => {
  class C {
    static elements = { backdrop: "#backdrop" }
  }
  const host = fixture()
  host.setAttribute("data-test-backdrop-element", ".item")
  const ctrl = bless(C, host)
  expect(ctrl.backdropElements.length).toBe(2)
  expect(ctrl.hasBackdropElement).toBe(true)
})

// Characterization: acronym keys keep Stimulus's naive dasherization —
// `htmlURL` maps to the attribute suffix `html-u-r-l`. Locked-in behaviour.
test("acronym key yields naive-dasherized override attribute", () => {
  class C {
    static elements = { htmlURL: "#backdrop" }
  }
  const host = fixture()
  const ctrl = bless(C, host)
  expect(ctrl.htmlURLElement).toBe(host.querySelector("#backdrop"))
  expect(ctrl.hasHtmlURLElement).toBe(true)

  host.setAttribute("data-test-html-u-r-l-element", ".item")
  expect(ctrl.htmlURLElement).toBe(host.querySelector(".item"))
})

test("subclass same-key override does not warn", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  class Base {
    static elements = { thing: "#backdrop" }
  }
  class Child extends Base {
    static override elements = { thing: ".item" }
  }
  bless(Child, fixture())
  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
})

test("cross-key predicate collision warns; both getters stay, later predicate wins", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  class C {
    // foo and _foo produce distinct getters but the same hasFooElement predicate
    static elements = { foo: ".nope", _foo: "#backdrop" }
  }
  const host = fixture()
  const ctrl = bless(C, host)
  expect(ctrl.fooElement).toBeNull()
  expect(ctrl.FooElement).toBe(host.querySelector("#backdrop"))
  // later key (_foo, "#backdrop") wins the shared predicate property
  expect(ctrl.hasFooElement).toBe(true)
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})

test("cross-kind collision warns; hasFooElement resolves to later key's getter", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  class C {
    // foo's predicate hasFooElement vs hasFoo's singular getter hasFooElement
    static elements = { foo: ".item", hasFoo: "#backdrop" }
  }
  const host = fixture()
  const ctrl = bless(C, host)
  // later definition's getter shadows the predicate: Element, not boolean
  expect(ctrl.hasFooElement).toBe(host.querySelector("#backdrop"))
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})

test("invalid override selector warns once and falls back to null / []", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  class C {
    static elements = { backdrop: "#backdrop" }
  }
  const host = fixture()
  host.setAttribute("data-test-backdrop-element", "###")
  const ctrl = bless(C, host)
  expect(ctrl.backdropElement).toBeNull()
  expect(ctrl.backdropElements).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})
