---
"@openproject/stimulus-elements": patch
---

Merge the internal `queryOne`/`queryAll` helpers into one `scopedQuery(root, selector)` module returning `{ first, all, exists }`. The invalid-selector warn-once registry is now keyed per root element (WeakMap) instead of process-global, so warnings reset naturally with the DOM and the test-only `resetSelectorWarnings` export is gone. No public API change.
