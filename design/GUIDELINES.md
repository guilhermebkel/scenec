# scenec logo guidelines

## The mark
- **Idea:** an S drawn as a path with a checkpoint at each end. A scene is a journey, the same model as scenec's 2.5D mode.
- **Versions:** horizontal (primary), stacked, symbol only, and a small symbol for 16 to 32 px.
- **Files:** `svg/` for screens (light and dark), `mono/` for one colour, `web/` for the favicon, app icon and manifest.

## Clear space
Keep a clear zone of one checkpoint disc (the disc of the symbol) on every side. The zone scales with the logo; never use a fixed distance.

## Minimum size
| Version | Screen |
| --- | --- |
| Horizontal | 96 px wide |
| Stacked | 64 px wide |
| Symbol | 24 px tall |
| Small symbol (`symbol-small-*.svg`, favicon) | 16 px |

Below 24 px always use the small symbol: it has a thicker stroke and solid discs.

## Colour
The palette comes from the `flat-autumn` theme.

| Name | HEX | RGB | CMYK (approx.) | Use |
| --- | --- | --- | --- | --- |
| Ink | `#3A2418` | 58, 36, 24 | 0, 38, 59, 77 | The S and the wordmark on light; dark backgrounds |
| Terracotta | `#D9643A` | 217, 100, 58 | 0, 54, 73, 15 | Checkpoints on light; the app icon tile |
| Amber | `#F2B134` | 242, 177, 52 | 0, 27, 79, 5 | Checkpoints on dark |
| Paper | `#FFF8EE` | 255, 248, 238 | 0, 3, 7, 0 | The S and the wordmark on dark |

CMYK values are rough conversions; check them with the printer. No Pantone is defined.

**Approved pairs** (WCAG contrast):
- `light` files (ink and terracotta) on paper or white: ink 13.8:1, terracotta 3.4:1 (fine for a large graphic, not for text).
- `dark` files (paper and amber) on ink: paper 13.8:1, amber 7.7:1.
- One colour: `mono/*-black.svg`, `*-white.svg` or `*-mono-3a2418.svg` when colour is not available.

## Type
The wordmark is drawn from geometric strokes with round caps; it is not a font. Do not retype it in another typeface. Poppins (OFL-1.1, in `fonts/`) is the companion typeface for surrounding text.

## Don'ts
- Do not stretch, squash or rotate the logo.
- Do not recolour outside the palette, or put terracotta on ink at small sizes.
- Do not add shadows, outlines, gradients or effects.
- Do not change the size of the symbol relative to the wordmark.
- Do not use the full symbol (with holes) below 24 px.
- Do not place it on a busy background without a colour block behind it.

## Known limits
- The symbol is outlined; the wordmark is still stroke-based. Convert its strokes to outlines before sending it to print or a cutter (Inkscape: Path > Stroke to Path).
- No trademark search was done. Search the registries and run a reverse image search before registering the mark.
