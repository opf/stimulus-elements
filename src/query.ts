const warnedByRoot = new WeakMap<Element, Set<string>>()

function warnOnce(root: Element, selector: string, reason: unknown): void {
  let seen = warnedByRoot.get(root)
  if (!seen) {
    seen = new Set()
    warnedByRoot.set(root, seen)
  }
  if (seen.has(selector)) return
  seen.add(selector)
  console.warn(
    `[stimulus-elements] Ignoring invalid selector ${JSON.stringify(selector)}:`,
    reason,
  )
}

export interface ScopedQuery {
  first(): Element | null
  all(): Element[]
  exists(): boolean
}

const EMPTY_QUERY: ScopedQuery = {
  first: () => null,
  all: () => [],
  exists: () => false,
}

export function scopedQuery(
  root: Element | null | undefined,
  selector: string,
): ScopedQuery {
  if (!root) return EMPTY_QUERY
  if (typeof selector !== "string" || selector.trim().length === 0) {
    warnOnce(root, selector, "selector is empty")
    return EMPTY_QUERY
  }
  const first = (): Element | null => {
    try {
      return root.querySelector(selector)
    } catch (error) {
      warnOnce(root, selector, error)
      return null
    }
  }
  return {
    first,
    all() {
      try {
        return Array.from(root.querySelectorAll(selector))
      } catch (error) {
        warnOnce(root, selector, error)
        return []
      }
    },
    exists: () => first() !== null,
  }
}
