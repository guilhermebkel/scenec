# 0006. Three visual regression gates, PNGs not stored

Status: accepted.

Each of the 108 cases passes three gates: SVG byte-identical; layout, warnings and art equal; and, if the SVG changed, pixelmatch on 800 px renders with a 0.005% limit (3% hides real changes). PNG baselines were 52 MB, so they are not stored: the pixel gate renders `baseline.svg` on the fly.
