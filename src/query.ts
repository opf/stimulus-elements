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

// Splits a selector list on top-level commas only, stripping CSS comments
// as it scans. Commas nested inside parentheses, brackets, quotes, or after
// a backslash escape are not separators in valid selector syntax, and
// comment contents must not affect any of that state (a quote inside
// /* … */ would otherwise jam the quote tracking). Comments are removed
// without inserting whitespace, matching CSS tokenizer semantics. Invalid
// input may split oddly, but the rewritten selector then throws in
// querySelector and fails closed.
function splitSelectorList(selector: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ""
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]
    if (char === "\\") {
      current += selector.slice(i, i + 2)
      i++
      continue
    }
    if (!quote && char === "/" && selector[i + 1] === "*") {
      const end = selector.indexOf("*/", i + 2)
      if (end === -1) break // unterminated comment consumes the rest
      i = end + 1
      continue
    }
    if (quote) {
      if (char === quote) quote = null
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === "(" || char === "[") {
      depth++
    } else if (char === ")" || char === "]") {
      if (depth > 0) depth--
    } else if (char === "," && depth === 0) {
      parts.push(current)
      current = ""
      continue
    }
    current += char
  }
  parts.push(current)
  return parts
}

// Anchors every top-level alternative to the query root, so combinators
// cannot match through ancestors outside it (".menu li" must find ".menu"
// inside the root). Only a LEADING :scope proves the alternative is rooted —
// that is the author's explicit anchoring and passes through untouched.
// Everything else gets the prefix, including alternatives mentioning :scope
// elsewhere (":not(:scope) .item", ".outer :scope .item"): a non-leading
// :scope does not anchor, and prefixing at worst makes the alternative
// unmatchable, which fails closed instead of leaking.
const LEADING_SCOPE = /^:scope(?![\w-])/i

export function anchorToScope(selector: string): string {
  return splitSelectorList(selector)
    .map((part) => {
      const trimmed = part.trim()
      return LEADING_SCOPE.test(trimmed) ? trimmed : `:scope ${trimmed}`
    })
    .join(", ")
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
  const anchored = anchorToScope(selector)
  const first = (): Element | null => {
    try {
      return root.querySelector(anchored)
    } catch (error) {
      warnOnce(root, selector, error)
      return null
    }
  }
  return {
    first,
    all() {
      try {
        return Array.from(root.querySelectorAll(anchored))
      } catch (error) {
        warnOnce(root, selector, error)
        return []
      }
    },
    exists: () => first() !== null,
  }
}
