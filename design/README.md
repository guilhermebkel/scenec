# Design

Brand kit for scenec: the logo, its variants, the web icons and the presentation.

| Folder or file | What is in it |
| --- | --- |
| `svg/` | Symbol, horizontal and stacked logos, each in `light` and `dark`; `symbol-small-*` for 16 to 32 px. No background. |
| `mono/` | One-colour versions: black, white and ink. |
| `web/` | `favicon.ico`, `favicon.svg`, PNG icons, `apple-touch-icon.png`, the app icon, `site.webmanifest` and `head-snippet.html`. |
| `presentation/` | The identity deck (`index.html`, `slide-*.png`) and the `spec.json` it is built from. |
| `social-preview.png` | The 1280 x 640 image for the GitHub social preview. |
| `GUIDELINES.md` | Clear space, minimum sizes, colours and what not to do. |
| `source/` | The scripts that generate the SVG files. |

## Rebuild

```
cd design/source
python3 kit.py                              # rewrites ../svg
SKILL_DIR=<logo-skill-dir> ./build-presentation.sh
```

The `mono/` and `web/` files come from the logo skill's `export_variants.py`, run on the files in `svg/`. They are not part of the npm package.
