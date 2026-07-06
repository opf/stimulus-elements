import { test, expect } from "bun:test"

test("happy-dom is registered", () => {
  document.body.innerHTML = `<div id="x" class="a"></div>`
  expect(document.querySelector("#x")).not.toBeNull()
  expect(document.querySelectorAll(".a").length).toBe(1)
})
