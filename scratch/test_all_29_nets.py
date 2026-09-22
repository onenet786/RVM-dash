"""
Full 29-Net Router & Zero-Collision Validator for Pro RVM Shield.
Strictly mapped to RVM_Arduino.ino.
"""

def ccw(A, B, C):
    return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

def intersect(A, B, C, D):
    if (A == C or A == D or B == C or B == D):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check_collisions(tracks, layer):
    segs = []
    for trk in tracks:
        if trk['layer'] == layer or trk['layer'] == 'both':
            pts = trk['pts']
            for i in range(len(pts) - 1):
                segs.append((pts[i], pts[i+1], trk['net']))
    colls = []
    n = len(segs)
    for i in range(n):
        for j in range(i+1, n):
            s1, s2 = segs[i], segs[j]
            if s1[2] == s2[2] and (s1[0] == s2[0] or s1[0] == s2[1] or s1[1] == s2[0] or s1[1] == s2[1]):
                continue
            if intersect(s1[0], s1[1], s2[0], s2[1]):
                colls.append((s1[2], s2[2], s1, s2))
    return colls

def get_all_tracks():
    tracks = []
    
    # --- Top PWM Header (B.Cu) ---
    tracks.append({'net': 'D12', 'layer': 'bot', 'width': 0.7, 'pts': [(38.54, 46.50), (38.54, 49.60), (51.12, 49.60), (51.12, 51.10)]})
    tracks.append({'net': 'D11', 'layer': 'bot', 'width': 0.7, 'pts': [(45.54, 46.50), (45.54, 48.90), (53.66, 48.90), (53.66, 51.10)]})
    tracks.append({'net': 'D10', 'layer': 'bot', 'width': 0.7, 'pts': [(52.54, 46.50), (52.54, 48.20), (56.20, 48.20), (56.20, 51.10)]})
    tracks.append({'net': 'D9',  'layer': 'bot', 'width': 0.7, 'pts': [(55.08, 46.50), (55.08, 47.50), (58.74, 47.50), (58.74, 51.10)]})

    # --- Inner Column Nets (97.50, Y) ---
    # Horizontal on BOT, Vertical on TOP
    inner_nets = [
        ('D46', (51.08, 16.50), (97.50, 35.56), 62.0),
        ('D44', (39.08, 16.50), (97.50, 33.02), 60.0),
        ('D42', (48.54, 38.50), (97.50, 30.48), 58.0),
        ('D40', (73.08, 16.50), (97.50, 27.94), 78.0),
        ('D38', (70.54, 28.50), (97.50, 25.40), 76.0),
        ('D36', (92.08, 46.50), (97.50, 22.86), 94.0),
        ('D34', (71.08, 46.50), (97.50, 20.32), 74.0),
        ('D32', (63.08, 16.50), (97.50, 17.78), 65.0),
        ('D30', (27.08, 16.50), (97.50, 15.24), 30.0),
        ('D28', (48.08, 27.50), (97.50, 12.70), 50.0),
        ('D26', (27.08, 27.50), (97.50, 10.16), 32.0),
        ('D24', (36.54, 38.50), (97.50, 7.62),  38.0),
        ('D22', (24.54, 38.50), (97.50, 5.08),  25.0),
    ]

    for name, src, dst, x_col in inner_nets:
        tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [src, (x_col, src[1])]})
        tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [(x_col, src[1]), (x_col, dst[1])]})
        tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(x_col, dst[1]), dst]})

    # --- Outer Column Nets (100.04, Y) ---
    # Horizontal on TOP, Vertical on BOT
    outer_nets = [
        ('D45', (48.54, 16.50), (100.04, 33.02), 63.5),
        ('D43', (51.08, 38.50), (100.04, 30.48), 59.5),
        ('D41', (39.08, 38.50), (100.04, 27.94), 41.5),
        ('D39', (70.54, 16.50), (100.04, 25.40), 79.5),
        ('D37', (73.08, 28.50), (100.04, 22.86), 77.5),
        ('D35', (83.08, 46.50), (100.04, 20.32), 85.0),
        ('D33', (68.54, 46.50), (100.04, 17.78), 72.5),
        ('D31', (36.54, 16.50), (100.04, 15.24), 37.5),
        ('D29', (24.54, 16.50), (100.04, 12.70), 26.0),
        ('D27', (39.08, 27.50), (100.04, 10.16), 40.5),
        ('D25', (24.54, 27.50), (100.04, 7.62),  28.0),
        ('D23', (27.08, 38.50), (100.04, 5.08),  29.5),
    ]

    for name, src, dst, x_col in outer_nets:
        # Horizontal on TOP
        tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [src, (x_col, src[1])]})
        # Vertical on BOT
        tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(x_col, src[1]), (x_col, dst[1])]})
        # Horizontal to target on TOP
        tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [(x_col, dst[1]), dst]})

    return tracks

tracks = get_all_tracks()
colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')

print(f"TOTAL BOT COLLISIONS: {len(colls_bot)}")
for c in colls_bot:
    print(f"  BOT COLLISION: {c[0]} with {c[1]}")

print(f"TOTAL TOP COLLISIONS: {len(colls_top)}")
for c in colls_top:
    print(f"  TOP COLLISION: {c[0]} with {c[1]}")
