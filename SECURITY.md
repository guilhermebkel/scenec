# Security

scenec compiles untrusted scenes and custom SVG. The protections are the SVG allowlist (`sanitizeSvg`), the sandboxed file reader (no `..`, no absolute paths) and the object and frame limits.

To report a way around them, open a private report through GitHub's "Report a vulnerability" on the Security tab of `guilhermebkel/scenec`. Please include the scene that shows it. Do not open a public issue for it.
