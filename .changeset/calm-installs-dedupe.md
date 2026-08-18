---
"@openproject/stimulus-elements": patch
---

`installElements()` now dedupes across bundled copies of the package: the blessing is tagged with a `Symbol.for` key, so a second module instance (two dependency graphs bundling the library twice) recognises an already-installed blessing instead of pushing a duplicate. Also documents that installing after controllers were registered fails silently — Stimulus leaves no trace the library could warn on — and pins that failure mode with a test.
