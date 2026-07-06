import { Controller } from "@hotwired/stimulus"
import { ElementsBlessing } from "./blessing"

let installed = false

// `installed` and the `blessings.includes` check are per-module-instance: if this
// package ends up bundled twice (e.g. via two different dependency graphs), each
// copy tracks its own state and will push its own `ElementsBlessing` onto
// `Controller.blessings`. That's harmless — later registration wins — but it's
// worth knowing this guard doesn't dedupe across module instances, only within one.
export function installElements(): void {
  if (installed) return
  const blessings = (Controller as unknown as { blessings: Function[] }).blessings
  if (!blessings.includes(ElementsBlessing)) {
    blessings.push(ElementsBlessing)
  }
  installed = true
}
