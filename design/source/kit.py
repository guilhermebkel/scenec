import os
from wordmark import pt, f, letters

INK, PRIMARY, ACCENT, PAPER = "#3A2418", "#D9643A", "#F2B134", "#FFF8EE"
THEMES = {"light": dict(body=INK, dot=PRIMARY), "dark": dict(body=PAPER, dot=ACCENT)}
TITLE = "<title>scenec</title>"

def s_outline(stroke=24, a0=-34.4):
    ro, ri = 40 + stroke / 2, 40 - stroke / 2
    c1, c2 = (128, 88), (128, 168)
    a1 = a0 + 180
    def p(c, r, a):
        x, y = pt(c[0], c[1], r, a); return f"{f(x)} {f(y)}"
    return (f"M{p(c1, ro, a0)} A{f(ro)} {f(ro)} 0 1 0 {f(128)} {f(88 + ro)} "
            f"A{f(ri)} {f(ri)} 0 1 1 {p(c2, ri, a1)} L{p(c2, ro, a1)} "
            f"A{f(ro)} {f(ro)} 0 1 0 128 {f(168 - ro)} "
            f"A{f(ri)} {f(ri)} 0 1 1 {p(c1, ri, a0)} Z")

def disc(cx, cy, r, hole):
    d = f"M{cx + r} {cy} a{r} {r} 0 1 0 {-2 * r} 0 a{r} {r} 0 1 0 {2 * r} 0 Z"
    if hole:
        d += f" M{cx + hole} {cy} a{hole} {hole} 0 1 1 {-2 * hole} 0 a{hole} {hole} 0 1 1 {2 * hole} 0 Z"
    return d

def symbol(body, dot, small=False):
    if small:
        s = s_outline(28, -45); r, hole = 22, 0
    else:
        s = s_outline(24, -42); r, hole = 22, 8
    d = disc(168, 88, r, hole) + " " + disc(88, 168, r, hole)
    return (f'<g id="icon"><path d="{s}" fill="{body}"/>'
            f'<path d="{d}" fill="{dot}" fill-rule="evenodd"/></g>')

def word(x0, base, color):
    ps, end = letters(x0, base)
    d = "".join(f'<path d="{p}"/>' for p in ps)
    return (f'<g id="wordmark" fill="none" stroke="{color}" stroke-width="12" stroke-linecap="round" '
            f'stroke-linejoin="round">{d}</g>'), end + 6

def svg(vb, inner):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img">{TITLE}{inner}</svg>\n'

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SVG = os.path.join(ROOT, "svg")
os.makedirs(SVG, exist_ok=True)
for name, c in THEMES.items():
    open(os.path.join(SVG, f"symbol-{name}.svg"), "w").write(svg("40 32 176 192", symbol(c["body"], c["dot"])))
    open(os.path.join(SVG, f"symbol-small-{name}.svg"), "w").write(svg("40 32 176 192", symbol(c["body"], c["dot"], True)))
    x0 = 244
    w, end = word(x0, 164, c["body"])
    open(os.path.join(SVG, f"horizontal-{name}.svg"), "w").write(svg(f"40 32 {end + 12 - 40} 192", symbol(c["body"], c["dot"]) + w))
    # stacked: wordmark width measured from a probe at x0=0
    _, wend = word(0, 0, "#000"); ww = wend
    sx = (ww - 256) / 2
    base = 208 + 40 + 72
    w2, _ = word(0, base, c["body"])
    inner = f'<g transform="translate({f(sx)} 0)">{symbol(c["body"], c["dot"])}</g>{w2}'
    open(os.path.join(SVG, f"stacked-{name}.svg"), "w").write(svg(f"-6 32 {ww + 12} {base + 8 - 32}", inner))
print("wrote", SVG)
