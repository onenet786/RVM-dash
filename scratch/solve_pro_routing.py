"""
Iterative router and zero-collision validator for Pro RVM Shield.
"""

import sys

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

def build_tracks():
    tracks = []
    
    # --- Top PWM Header Tracks (B.Cu) ---
    # D9, D10, D11, D12
    tracks.append({'net': 'D9', 'layer': 'bot', 'width': 0.7, 'pts': [(24.54, 46.50), (24.54, 49.60), (58.74, 49.60), (58.74, 51.10)]})
    tracks.append({'net': 'D10', 'layer': 'bot', 'width': 0.7, 'pts': [(27.08, 46.50), (27.08, 48.90), (56.20, 48.90), (56.20, 51.10)]})
    tracks.append({'net': 'D11', 'layer': 'bot', 'width': 0.7, 'pts': [(39.08, 46.50), (39.08, 48.20), (53.66, 48.20), (53.66, 51.10)]})
    tracks.append({'net': 'D12', 'layer': 'bot', 'width': 0.7, 'pts': [(48.08, 46.50), (48.08, 47.50), (51.12, 47.50), (51.12, 51.10)]})

    # --- Chamber 3 Top Servos & US (B.Cu) ---
    # J16 Drop Servo D36 (92.08, 46.5) -> D36 (97.50, 22.86)
    tracks.append({'net': 'D36', 'layer': 'bot', 'width': 0.7, 'pts': [(92.08, 46.50), (94.00, 46.50), (94.00, 22.86), (97.50, 22.86)]})
    # J15 Iris Servo D35 (83.08, 46.5) -> D35 (100.04, 20.32) via top
    tracks.append({'net': 'D35', 'layer': 'top', 'width': 0.7, 'pts': [(83.08, 46.50), (83.08, 20.32), (100.04, 20.32)]})
    # J14 Top US Echo D34 (71.08, 46.5) -> D34 (97.50, 20.32)
    tracks.append({'net': 'D34', 'layer': 'bot', 'width': 0.7, 'pts': [(71.08, 46.50), (71.08, 41.50), (95.20, 41.50), (95.20, 20.32), (97.50, 20.32)]})
    # J14 Top US Trig D33 (68.54, 46.5) -> D33 (100.04, 17.78) via top
    tracks.append({'net': 'D33', 'layer': 'top', 'width': 0.7, 'pts': [(68.54, 46.50), (68.54, 17.78), (100.04, 17.78)]})

    # --- Chamber 3 HX711 & Bot US ---
    # J17 SCK D38 (70.54, 28.5) -> D38 (97.50, 25.40)
    tracks.append({'net': 'D38', 'layer': 'bot', 'width': 0.7, 'pts': [(70.54, 28.50), (70.54, 25.40), (97.50, 25.40)]})
    # J17 DOUT D37 (73.08, 28.5) -> D37 (100.04, 22.86)
    tracks.append({'net': 'D37', 'layer': 'top', 'width': 0.7, 'pts': [(73.08, 28.50), (73.08, 22.86), (100.04, 22.86)]})
    # J18 Bot Echo D40 (73.08, 16.5) -> D40 (97.50, 27.94)
    tracks.append({'net': 'D40', 'layer': 'bot', 'width': 0.7, 'pts': [(73.08, 16.50), (73.08, 27.94), (97.50, 27.94)]})
    # J18 Bot Trig D39 (70.54, 16.5) -> D39 (100.04, 25.40)
    tracks.append({'net': 'D39', 'layer': 'top', 'width': 0.7, 'pts': [(70.54, 16.50), (70.54, 25.40), (100.04, 25.40)]})

    # --- Chamber 1 Sizing US (J4, J5, J6) ---
    # J6 Top Echo D43 (51.08, 38.5) -> D43 (100.04, 30.48)
    tracks.append({'net': 'D43', 'layer': 'top', 'width': 0.7, 'pts': [(51.08, 38.50), (51.08, 30.48), (100.04, 30.48)]})
    # J6 Top Trig D42 (48.54, 38.5) -> D42 (97.50, 30.48)
    tracks.append({'net': 'D42', 'layer': 'bot', 'width': 0.7, 'pts': [(48.54, 38.50), (48.54, 30.48), (97.50, 30.48)]})
    # J5 Mid Echo D41 (39.08, 38.5) -> D41 (100.04, 27.94)
    tracks.append({'net': 'D41', 'layer': 'top', 'width': 0.7, 'pts': [(39.08, 38.50), (39.08, 27.94), (66.00, 27.94), (66.00, 27.94), (100.04, 27.94)]})
    # J5 Mid Trig D24 (36.54, 38.5) -> D24 (97.50, 7.62)
    tracks.append({'net': 'D24', 'layer': 'bot', 'width': 0.7, 'pts': [(36.54, 38.50), (36.54, 33.50), (62.00, 33.50), (62.00, 7.62), (97.50, 7.62)]})
    # J4 Bot Echo D23 (27.08, 38.5) -> D23 (100.04, 5.08)
    tracks.append({'net': 'D23', 'layer': 'top', 'width': 0.7, 'pts': [(27.08, 38.50), (27.08, 5.08), (100.04, 5.08)]})
    # J4 Bot Trig D22 (24.54, 38.5) -> D22 (97.50, 5.08)
    tracks.append({'net': 'D22', 'layer': 'bot', 'width': 0.7, 'pts': [(24.54, 38.50), (24.54, 5.08), (97.50, 5.08)]})

    # --- Chamber 2 Metal Signals ---
    # J13 Inductive D32 (63.08, 16.5) -> D32 (97.50, 17.78)
    tracks.append({'net': 'D32', 'layer': 'bot', 'width': 0.7, 'pts': [(63.08, 16.50), (64.50, 17.78), (97.50, 17.78)]})
    # J12 Top Echo D46 (51.08, 16.5) -> D46 (97.50, 35.56)
    tracks.append({'net': 'D46', 'layer': 'bot', 'width': 0.7, 'pts': [(51.08, 16.50), (51.08, 35.56), (97.50, 35.56)]})
    # J12 Top Trig D45 (48.54, 16.5) -> D45 (100.04, 33.02)
    tracks.append({'net': 'D45', 'layer': 'top', 'width': 0.7, 'pts': [(48.54, 16.50), (48.54, 33.02), (100.04, 33.02)]})
    # J11 Mid Echo D44 (39.08, 16.5) -> D44 (97.50, 33.02)
    tracks.append({'net': 'D44', 'layer': 'bot', 'width': 0.7, 'pts': [(39.08, 16.50), (39.08, 33.02), (97.50, 33.02)]})
    # J11 Mid Trig D31 (36.54, 16.5) -> D31 (100.04, 15.24)
    tracks.append({'net': 'D31', 'layer': 'top', 'width': 0.7, 'pts': [(36.54, 16.50), (36.54, 15.24), (100.04, 15.24)]})
    # J10 Bot Echo D30 (27.08, 16.5) -> D30 (97.50, 15.24)
    tracks.append({'net': 'D30', 'layer': 'bot', 'width': 0.7, 'pts': [(27.08, 16.50), (27.08, 15.24), (97.50, 15.24)]})
    # J10 Bot Trig D29 (24.54, 16.5) -> D29 (100.04, 12.70)
    tracks.append({'net': 'D29', 'layer': 'top', 'width': 0.7, 'pts': [(24.54, 16.50), (24.54, 12.70), (100.04, 12.70)]})
    # J9 Drop D28 (48.08, 27.5) -> D28 (97.50, 12.70)
    tracks.append({'net': 'D28', 'layer': 'bot', 'width': 0.7, 'pts': [(48.08, 27.50), (48.08, 12.70), (97.50, 12.70)]})
    # J8 Iris D27 (39.08, 27.5) -> D27 (100.04, 10.16)
    tracks.append({'net': 'D27', 'layer': 'top', 'width': 0.7, 'pts': [(39.08, 27.50), (39.08, 10.16), (100.04, 10.16)]})
    # J7 Echo D26 (27.08, 27.5) -> D26 (97.50, 10.16)
    tracks.append({'net': 'D26', 'layer': 'bot', 'width': 0.7, 'pts': [(27.08, 27.50), (27.08, 10.16), (97.50, 10.16)]})
    # J7 Trig D25 (24.54, 27.5) -> D25 (100.04, 7.62)
    tracks.append({'net': 'D25', 'layer': 'top', 'width': 0.7, 'pts': [(24.54, 27.50), (24.54, 7.62), (100.04, 7.62)]})

    # --- Power Buses (5V Servo Heavy Bus) ---
    # TB2 (6.0, 34.54) -> runs to Servos at Y=46.5, Y=27.5, Y=46.5
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(6.0, 34.54), (12.0, 34.54), (16.5, 34.54), (19.0, 34.54), (19.0, 44.0), (36.54, 44.0), (36.54, 46.50)]})
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(36.54, 44.0), (45.54, 44.0), (45.54, 46.50)]})
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(19.0, 34.54), (19.0, 25.0), (36.54, 25.0), (36.54, 27.50)]})
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(36.54, 25.0), (45.54, 25.0), (45.54, 27.50)]})
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(45.54, 44.0), (80.54, 44.0), (80.54, 46.50)]})
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(80.54, 44.0), (89.54, 44.0), (89.54, 46.50)]})

    # --- Logic 5V Bus (VCC) ---
    tracks.append({'net': '5V_LOGIC', 'layer': 'top', 'width': 1.2, 'pts': [(22.0, 46.50), (22.0, 38.50), (22.0, 27.50), (22.0, 16.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'top', 'width': 1.2, 'pts': [(22.0, 38.50), (34.0, 38.50), (46.0, 38.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'top', 'width': 1.2, 'pts': [(22.0, 16.50), (34.0, 16.50), (46.0, 16.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'top', 'width': 1.2, 'pts': [(46.0, 38.50), (66.0, 38.50), (66.0, 46.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'top', 'width': 1.2, 'pts': [(66.0, 38.50), (68.0, 38.50), (68.0, 28.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'top', 'width': 1.2, 'pts': [(68.0, 28.50), (68.0, 16.50)]})

    return tracks

tracks = build_tracks()
colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')
print(f"BOT COLLISIONS: {len(colls_bot)}")
for c in colls_bot:
    print(f"  BOT COLLISION between {c[0]} and {c[1]}")
print(f"TOP COLLISIONS: {len(colls_top)}")
for c in colls_top:
    print(f"  TOP COLLISION between {c[0]} and {c[1]}")
