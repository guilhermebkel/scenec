import math

def pt(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r * math.cos(a), cy + r * math.sin(a)

def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")

# Geometric lowercase "scenec" built from round-capped strokes.
W = 12      # stroke
R = 30      # centerline radius of round letters
XH = 72     # x-height (outer)

def letters(x0, base):
    cy = base - 36
    paths = []
    x = x0
    def S(cx):
        r = 15
        t = (cx, base - 51); b = (cx, base - 21)
        s = pt(t[0], t[1], r, -30)
        mid = (cx, base - 36)
        e = pt(b[0], b[1], r, 150)
        return (f"M{f(s[0])} {f(s[1])} A{r} {r} 0 1 0 {f(mid[0])} {f(mid[1])} "
                f"A{r} {r} 0 1 1 {f(e[0])} {f(e[1])}")
    def C(cx):
        a = pt(cx, cy, R, -42); b = pt(cx, cy, R, 42)
        return f"M{f(a[0])} {f(a[1])} A{R} {R} 0 1 0 {f(b[0])} {f(b[1])}"
    def E(cx):
        b = pt(cx, cy, R, 42)
        return (f"M{f(cx - R)} {f(cy)} L{f(cx + R)} {f(cy)} A{R} {R} 0 1 0 {f(b[0])} {f(b[1])}")
    def N(left):
        return (f"M{f(left)} {f(base - 6)} L{f(left)} {f(base - 66)} "
                f"M{f(left)} {f(cy)} A{R} {R} 0 0 1 {f(left + 2 * R)} {f(cy)} L{f(left + 2 * R)} {f(base - 6)}")
    gap = 14
    out = []
    # s
    out.append(S(x + 6 + 15 + 0)); x += 42 + gap
    # c
    out.append(C(x + 36)); x += 72 + gap
    # e
    out.append(E(x + 36)); x += 72 + gap
    # n
    out.append(N(x + 6)); x += 72 + gap
    # e
    out.append(E(x + 36)); x += 72 + gap
    # c
    out.append(C(x + 36)); x += 72
    return out, x
