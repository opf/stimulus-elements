import { test, expect } from "vitest"
import { Controller } from "@hotwired/stimulus"
import { installElements } from "../src/install"

// Runs in its own file so the install module is in its virgin state.
test("installElements does not duplicate a blessing from another bundled copy", () => {
  const blessings = (Controller as any).blessings as Function[]
  const before = blessings.length

  // Simulate a second copy of this package (two dependency graphs bundling
  // it twice): different function identity, same Symbol.for tag.
  const foreign = function ElementsBlessing(): PropertyDescriptorMap {
    return {}
  }
  ;(foreign as any)[Symbol.for("@openproject/stimulus-elements.blessing")] = true
  blessings.push(foreign)

  installElements()

  // only the foreign copy is present — install recognised the tag and did
  // not push a second, identically-behaving blessing
  expect(blessings.length).toBe(before + 1)
})
