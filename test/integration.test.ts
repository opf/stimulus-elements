import { test, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { Application, Controller } from "@hotwired/stimulus"
import { installElements } from "../src/install"
import { resetSelectorWarnings } from "../src/query"

let app: Application

beforeEach(() => {
  resetSelectorWarnings()
  installElements()
})

afterEach(() => {
  app?.stop()
  document.body.innerHTML = ""
})

const tick = () => new Promise((r) => setTimeout(r, 20))

async function boot(identifier: string, ctor: any, html: string) {
  document.body.innerHTML = html
  app = Application.start()
  app.register(identifier, ctor)
  await tick()
}

function controllerFor(identifier: string): any {
  const el = document.querySelector(`[data-controller~="${identifier}"]`)!
  return app.getControllerForElementAndIdentifier(el, identifier)
}

test("installElements is idempotent", () => {
  const before = (Controller as any).blessings.length
  installElements()
  installElements()
  const occurrences = (Controller as any).blessings.filter(
    (b: unknown) => (b as Function).name === "ElementsBlessing",
  ).length
  expect(occurrences).toBe(1)
  expect((Controller as any).blessings.length).toBe(before)
})

test("accessors work end-to-end through a real controller", async () => {
  class DiscloseController extends Controller {
    static elements = { backdrop: "#backdrop", item: ".item" }
  }
  await boot(
    "disclose",
    DiscloseController,
    `<div data-controller="disclose">
       <i id="backdrop"></i>
       <span class="item">a</span>
       <span class="item">b</span>
     </div>`,
  )
  const ctrl = controllerFor("disclose")
  expect(ctrl.backdropElement).toBe(document.getElementById("backdrop"))
  expect(ctrl.itemElements.length).toBe(2)
  expect(ctrl.hasBackdropElement).toBe(true)
})

test("selectors are scoped per controller — no cross-controller leakage", async () => {
  class BoxController extends Controller {
    static elements = { label: ".label" }
  }
  await boot(
    "box",
    BoxController,
    `<div id="one" data-controller="box"><span class="label">ONE</span></div>
     <div id="two" data-controller="box"><span class="label">TWO</span></div>`,
  )
  const one = app.getControllerForElementAndIdentifier(document.getElementById("one")!, "box") as any
  const two = app.getControllerForElementAndIdentifier(document.getElementById("two")!, "box") as any
  expect(one.labelElement.textContent).toBe("ONE")
  expect(two.labelElement.textContent).toBe("TWO")
})

test("invalid selector on a live controller warns once and does not throw", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {})
  class BadController extends Controller {
    static elements = { oops: "###" }
  }
  await boot("bad", BadController, `<div data-controller="bad"></div>`)
  const ctrl = controllerFor("bad")
  expect(ctrl.oopsElement).toBeNull()
  expect(ctrl.oopsElements).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})
