# 0011. Token-scanner SVG sanitizer with an allowlist

Status: accepted.

Custom SVG assets are untrusted input. `sanitizeSvg` scans tokens (not regex), allows a fixed set of elements, throws on `<!ENTITY>` and drops `on*` attributes, external `href`/`url()` and `<style>`. The 100 assets in 10 kits are checked by a smoke test against the same allowlist.
