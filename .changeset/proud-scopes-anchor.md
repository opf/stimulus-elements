---
"@openproject/stimulus-elements": minor
---

Anchor element lookups with `:scope` so "scoped to the controller element" is real: previously `root.querySelector(".menu li")` could match via a `.menu` ancestor *outside* the controller element. Every comma-separated alternative is now prefixed with `:scope` (commas inside quotes, parentheses, brackets, escapes, or CSS comments are respected, and comments are stripped), so the anchor cannot be bypassed with a selector list. Only alternatives *starting* with `:scope` pass through untouched — a non-leading `:scope` does not anchor and gets the prefix too. Relative selectors like `> li` now work. Results were always confined to descendants of the controller element; what changes is which of them a combinator selector can match.
