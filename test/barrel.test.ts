import { test, expect } from "bun:test"
import { installElements, ElementsBlessing } from "../index"

test("barrel re-exports the public API", () => {
  expect(typeof installElements).toBe("function")
  expect(typeof ElementsBlessing).toBe("function")
})
