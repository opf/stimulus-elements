import { Controller } from "@hotwired/stimulus"
import { ElementsBlessing } from "./blessing"

// Cross-bundle identity for the blessing: if this package is bundled twice
// (two dependency graphs), each copy has its own ElementsBlessing function,
// but Symbol.for resolves to the same global symbol — so any copy can
// recognise a blessing installed by another and skip the duplicate push.
const BLESSING_TAG = Symbol.for("@openproject/stimulus-elements.blessing")

let installed = false

// Must run before any register()/Application.start(): Stimulus snapshots
// blessings per controller at registration time and leaves no observable
// trace of prior registrations, so a late install CANNOT be detected or
// warned about — controllers registered earlier just never gain accessors.
// That silent failure mode is pinned by test/install-order.test.ts.
export function installElements(): void {
  if (installed) return
  ;(ElementsBlessing as unknown as Record<symbol, boolean>)[BLESSING_TAG] = true
  const blessings = (Controller as unknown as { blessings: Function[] }).blessings
  const present = blessings.some(
    (blessing) => (blessing as unknown as Record<symbol, boolean>)[BLESSING_TAG] === true,
  )
  if (!present) blessings.push(ElementsBlessing)
  installed = true
}
