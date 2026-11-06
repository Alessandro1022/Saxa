"""Genererar Saxa-ikonen: ordet SAXA format av hårstrån. Kör: python3 scripts/make-logo.py"""
import math, random

random.seed(7)

def catmull(pts, n=14):
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(pts[-1])
    return out

def line(a, b, bend=0.0):
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy)
    return [a, (mx - dy / L * bend, my + dx / L * bend), b]

# Bokstavsskelett i en 100x140-ruta
S = [[(82, 26), (62, 10), (32, 12), (16, 34), (32, 60), (66, 78), (86, 104), (72, 130), (40, 133), (14, 116)]]
A = [[(6, 136), (30, 70), (50, 8), (70, 70), (94, 136)], line((26, 92), (74, 92), 3)]
X = [line((10, 8), (90, 136), 4), line((90, 8), (10, 136), -4)]
WORD = [(S, 0), (A, 108), (X, 214), (A, 322)]

def strands(skel, ox, oy, sc, count):
    paths = []
    base = catmull(skel)
    # normaler
    norms = []
    for i in range(len(base)):
        a = base[max(i - 1, 0)]; b = base[min(i + 1, len(base) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1
        norms.append((-dy / L, dx / L))
    for k in range(count):
        off = (k - (count - 1) / 2) * 1.9 + random.uniform(-0.8, 0.8)
        f1, f2 = random.uniform(0.6, 1.6), random.uniform(0, 6.28)
        amp = random.uniform(0.6, 2.2)
        s = random.randint(0, 3); e = len(base) - random.randint(0, 3)
        pts = []
        for i in range(s, e):
            t = i / len(base)
            w = off + amp * math.sin(t * 6.28 * f1 + f2)
            x = base[i][0] + norms[i][0] * w
            y = base[i][1] + norms[i][1] * w
            pts.append((ox + x * sc, oy + y * sc))
        # lösa hårtoppar i ändarna
        if random.random() < 0.5 and len(pts) > 3:
            (x1, y1), (x2, y2) = pts[-2], pts[-1]
            ang = math.atan2(y2 - y1, x2 - x1) + random.uniform(-0.7, 0.7)
            ln = random.uniform(5, 14)
            pts.append((x2 + math.cos(ang) * ln, y2 + math.sin(ang) * ln))
        d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
        paths.append((d, random.uniform(1.8, 3.2), random.uniform(0.6, 1.0)))
    return paths

def svg(size=512, bg=True):
    sc = 1.04
    word_w = 422 * sc
    ox, oy = (512 - word_w) / 2, (512 - 140 * sc) / 2 + 4
    out = []
    for letters, dx in WORD:
        for skel in letters:
            out += strands(skel, ox + dx * sc, oy, sc, 9)
    # några lösa strån som "faller"
    flies = []
    for _ in range(9):
        x, y = random.uniform(70, 440), random.choice([random.uniform(70, 150), random.uniform(370, 450)])
        ln, a, c = random.uniform(14, 30), random.uniform(0, 3.14), random.uniform(-8, 8)
        x2, y2 = x + math.cos(a) * ln, y + math.sin(a) * ln
        flies.append(f'<path d="M{x:.1f} {y:.1f} Q{(x+x2)/2 + c:.1f} {(y+y2)/2 - c:.1f} {x2:.1f} {y2:.1f}" stroke-width="{random.uniform(1.1,1.8):.2f}" opacity="{random.uniform(.25,.55):.2f}"/>')
    grid = ''.join(f'<path d="M{i} 0V512M0 {i}H512"/>' for i in range(32, 512, 64))
    body = ''.join(f'<path d="{d}" stroke-width="{w:.2f}" opacity="{o:.2f}"/>' for d, w, o in out)
    bgsvg = f'''<rect width="512" height="512" rx="114" fill="url(#bg)"/>
  <rect width="512" height="512" rx="114" fill="url(#glow)"/>
  <g stroke="#ffffff" stroke-opacity=".035" stroke-width="1">{grid}</g>''' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1b1f"/><stop offset="1" stop-color="#09090b"/></linearGradient>
    <radialGradient id="glow" cx=".3" cy=".18" r=".8"><stop offset="0" stop-color="#d2ab5c" stop-opacity=".28"/><stop offset=".6" stop-color="#d2ab5c" stop-opacity="0"/></radialGradient>
    <linearGradient id="hair" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fbe9b8"/><stop offset=".5" stop-color="#e0bf78"/><stop offset="1" stop-color="#a87b33"/></linearGradient>
  </defs>
  {bgsvg}
  <g fill="none" stroke="url(#hair)" stroke-linecap="round" stroke-linejoin="round">{body}{''.join(flies)}</g>
</svg>'''

import sys, os
root = os.path.join(os.path.dirname(__file__), '..')
random.seed(7); open(os.path.join(root, 'public/logo.svg'), 'w').write(svg())
random.seed(7); open(os.path.join(root, 'app/icon.svg'), 'w').write(svg())
random.seed(7); open(os.path.join(root, 'public/logo-mark.svg'), 'w').write(svg(bg=False))
print('ok')
