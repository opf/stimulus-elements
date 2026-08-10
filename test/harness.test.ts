import { test, expect } from "vitest"

test("DOM is available", () => {
  document.body.innerHTML = `<div id="x" class="a"></div>`
  expect(document.querySelector("#x")).not.toBeNull()
  expect(document.querySelectorAll(".a").length).toBe(1)
})

// Guards the reason this suite runs in a real browser at all: per spec,
// querySelector matches selectors document-wide and only filters results to
// descendants, so a combinator can reference ancestors OUTSIDE the query
// root. happy-dom restricted matching to the subtree (non-spec), which hid
// exactly this class of scoping behaviour from the suite. If this fails,
// the environment cannot faithfully exercise selector semantics.
test("environment is spec-correct: combinators match through outside ancestors", () => {
  document.body.innerHTML = `<div class="wrap"><section id="root"><span class="item"></span></section></div>`
  const root = document.getElementById("root")!
  expect(root.querySelector(".wrap .item")).not.toBeNull()
})
