import { test, expect } from "vitest"
import { Application, Controller } from "@hotwired/stimulus"
import { installElements } from "../src/install"

const tick = () => new Promise((r) => setTimeout(r, 20))

// Characterizes the README's hard invariant: installElements() must run
// before register()/start(). Stimulus snapshots blessings per controller at
// registration time and leaves no observable trace the library could warn
// on (see CONTEXT.md), so violating the invariant fails SILENTLY — this
// test pins that failure mode and would catch Stimulus ever changing it.
// Runs in its own file so no other test has installed the blessing first.
test("controllers registered before installElements silently lack accessors", async () => {
  class EarlyController extends Controller {
    static elements = { thing: ".thing" }
  }
  document.body.innerHTML = `<div data-controller="early"><span class="thing"></span></div>`
  const app = Application.start()
  app.register("early", EarlyController)
  await tick()
  const earlyEl = document.querySelector('[data-controller~="early"]')!
  const early: any = app.getControllerForElementAndIdentifier(earlyEl, "early")

  // silent failure: no accessors, no warning, no error
  expect(early.thingElement).toBeUndefined()
  expect(early.hasThingElement).toBeUndefined()

  // installing afterwards does not retro-bless already-registered controllers
  installElements()
  expect(early.thingElement).toBeUndefined()

  // but a controller registered after install gains the accessors
  class LateController extends Controller {
    static elements = { thing: ".thing" }
  }
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div data-controller="late"><span class="thing"></span></div>`,
  )
  app.register("late", LateController)
  await tick()
  const lateEl = document.querySelector('[data-controller~="late"]')!
  const late: any = app.getControllerForElementAndIdentifier(lateEl, "late")
  expect(late.thingElement).toBe(lateEl.querySelector(".thing"))

  app.stop()
})
