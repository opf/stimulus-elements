const warnedSelectors = new Set<string>()

function warnOnce(selector: string, reason: unknown): void {
  if (warnedSelectors.has(selector)) return
  warnedSelectors.add(selector)
  console.warn(
    `[stimulus-elements] Ignoring invalid selector ${JSON.stringify(selector)}:`,
    reason,
  )
}

function isNonEmptySelector(selector: string): boolean {
  return typeof selector === "string" && selector.trim().length > 0
}

export function resetSelectorWarnings(): void {
  warnedSelectors.clear()
}

export function queryOne(
  root: Element | null | undefined,
  selector: string,
): Element | null {
  if (!root) return null
  if (!isNonEmptySelector(selector)) {
    warnOnce(selector, "selector is empty")
    return null
  }
  try {
    return root.querySelector(selector)
  } catch (error) {
    warnOnce(selector, error)
    return null
  }
}

export function queryAll(
  root: Element | null | undefined,
  selector: string,
): Element[] {
  if (!root) return []
  if (!isNonEmptySelector(selector)) {
    warnOnce(selector, "selector is empty")
    return []
  }
  try {
    return Array.from(root.querySelectorAll(selector))
  } catch (error) {
    warnOnce(selector, error)
    return []
  }
}
