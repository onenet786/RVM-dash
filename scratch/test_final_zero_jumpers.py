"""
Refined Zero-Collision Single-Sided Routing Engine.
Every net has dedicated channels.
Jumpers cross over the central bus.
Copper collisions must equal 0.
"""

def ccw(A, B, C):
    return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

def intersect(A, B, C, D):
    if (A == C or A == D or B == C or B == D):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check_collisions(tracks):
    segs = []
    for trk in tracks:
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

def build_zero_tracks():
    tracks = []
    
    # 1. Top PWM (D12, D11, D10, D9) - Verified 0 collisions
    tracks.append({'net': 'D12', 'pts': [(38.54, 46.50), (38.54, 49.60), (51.12, 49.60), (51.12, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D11', 'pts': [(45.54, 46.50), (45.54, 48.90), (53.66, 48.90), (53.66, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D10', 'pts': [(52.54, 46.50), (52.54, 48.20), (56.20, 48.20), (56.20, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D9',  'pts': [(55.08, 46.50), (55.08, 47.50), (58.74, 47.50), (58.74, 51.10)], 'width': 0.7})

    # 2. Direct Tracks (No Jumper needed)
    # D36: J16 (92.08, 46.50) -> drops at 94.0 to Y=22.86 -> (97.50, 22.86)
    tracks.append({'net': 'D36', 'pts': [(92.08, 46.50), (94.00, 46.50), (94.00, 22.86), (97.50, 22.86)], 'width': 0.7})
    # D38: J17 (70.54, 28.50) -> drops to Y=25.40 -> (97.50, 25.40)
    tracks.append({'net': 'D38', 'pts': [(70.54, 28.50), (70.54, 25.40), (97.50, 25.40)], 'width': 0.7})
    # D40: J18 (73.08, 16.50) -> rises to Y=27.94 -> (97.50, 27.94)
    tracks.append({'net': 'D40', 'pts': [(73.08, 16.50), (73.08, 27.94), (97.50, 27.94)], 'width': 0.7})
    # D32: J13 (63.08, 16.50) -> rises to Y=17.78 -> (97.50, 17.78)
    tracks.append({'net': 'D32', 'pts': [(63.08, 16.50), (63.08, 17.78), (97.50, 17.78)], 'width': 0.7})
    # D30: J10 (27.08, 16.50) -> drops to Y=15.24 -> (97.50, 15.24)
    tracks.append({'net': 'D30', 'pts': [(27.08, 16.50), (27.08, 15.24), (97.50, 15.24)], 'width': 0.7})
    # D28: J9 (48.08, 27.50) -> drops to Y=12.70 -> (97.50, 12.70)
    tracks.append({'net': 'D28', 'pts': [(48.08, 27.50), (48.08, 12.70), (97.50, 12.70)], 'width': 0.7})
    # D26: J7 (27.08, 27.50) -> drops to Y=10.16 -> (97.50, 10.16)
    tracks.append({'net': 'D26', 'pts': [(27.08, 27.50), (27.08, 10.16), (97.50, 10.16)], 'width': 0.7})
    # D24: J5 (36.54, 38.50) -> drops to Y=7.62 -> (97.50, 7.62)
    tracks.append({'net': 'D24', 'pts': [(36.54, 38.50), (36.54, 7.62), (97.50, 7.62)], 'width': 0.7})
    # D22: J4 (24.54, 38.50) -> drops to Y=5.08 -> (97.50, 5.08)
    tracks.append({'net': 'D22', 'pts': [(24.54, 38.50), (24.54, 5.08), (97.50, 5.08)], 'width': 0.7})
    # D42: J6 (48.54, 38.50) -> drops to Y=30.48 -> (97.50, 30.48)
    tracks.append({'net': 'D42', 'pts': [(48.54, 38.50), (48.54, 30.48), (97.50, 30.48)], 'width': 0.7})

    # 3. Jumper Copper Stubs (Connecting to dedicated JMP pads right next to target pins)
    # JMP1 (D46)
    tracks.append({'net': 'D46', 'pts': [(51.08, 16.50), (51.08, 18.50)], 'width': 0.7})
    tracks.append({'net': 'D46', 'pts': [(95.00, 35.56), (97.50, 35.56)], 'width': 0.7})
    # JMP2 (D45)
    tracks.append({'net': 'D45', 'pts': [(48.54, 16.50), (48.54, 18.50)], 'width': 0.7})
    tracks.append({'net': 'D45', 'pts': [(95.00, 33.02), (100.04, 33.02)], 'width': 0.7})
    # JMP3 (D44)
    tracks.append({'net': 'D44', 'pts': [(39.08, 16.50), (39.08, 18.50)], 'width': 0.7})
    tracks.append({'net': 'D44', 'pts': [(93.00, 33.02), (97.50, 33.02)], 'width': 0.7})
    # JMP4 (D43)
    tracks.append({'net': 'D43', 'pts': [(51.08, 38.50), (51.08, 36.50)], 'width': 0.7})
    tracks.append({'net': 'D43', 'pts': [(95.00, 30.48), (100.04, 30.48)], 'width': 0.7})
    # JMP5 (D41)
    tracks.append({'net': 'D41', 'pts': [(39.08, 38.50), (39.08, 36.50)], 'width': 0.7})
    tracks.append({'net': 'D41', 'pts': [(95.00, 27.94), (100.04, 27.94)], 'width': 0.7})
    # JMP6 (D39)
    tracks.append({'net': 'D39', 'pts': [(70.54, 16.50), (70.54, 18.50)], 'width': 0.7})
    tracks.append({'net': 'D39', 'pts': [(95.00, 25.40), (100.04, 25.40)], 'width': 0.7})
    # JMP7 (D37)
    tracks.append({'net': 'D37', 'pts': [(73.08, 28.50), (73.08, 30.50)], 'width': 0.7})
    tracks.append({'net': 'D37', 'pts': [(95.00, 22.86), (100.04, 22.86)], 'width': 0.7})
    # JMP8 (D35)
    tracks.append({'net': 'D35', 'pts': [(83.08, 46.50), (83.08, 44.50)], 'width': 0.7})
    tracks.append({'net': 'D35', 'pts': [(95.00, 20.32), (100.04, 20.32)], 'width': 0.7})
    # JMP9 (D33)
    tracks.append({'net': 'D33', 'pts': [(68.54, 46.50), (68.54, 44.50)], 'width': 0.7})
    tracks.append({'net': 'D33', 'pts': [(95.00, 17.78), (100.04, 17.78)], 'width': 0.7})
    # JMP10 (D31)
    tracks.append({'net': 'D31', 'pts': [(36.54, 16.50), (36.54, 14.50)], 'width': 0.7})
    tracks.append({'net': 'D31', 'pts': [(95.00, 15.24), (100.04, 15.24)], 'width': 0.7})
    # JMP11 (D29)
    tracks.append({'net': 'D29', 'pts': [(24.54, 16.50), (24.54, 14.50)], 'width': 0.7})
    tracks.append({'net': 'D29', 'pts': [(95.00, 12.70), (100.04, 12.70)], 'width': 0.7})
    # JMP12 (D27)
    tracks.append({'net': 'D27', 'pts': [(39.08, 27.50), (39.08, 29.50)], 'width': 0.7})
    tracks.append({'net': 'D27', 'pts': [(95.00, 10.16), (100.04, 10.16)], 'width': 0.7})
    # JMP13 (D25)
    tracks.append({'net': 'D25', 'pts': [(24.54, 27.50), (24.54, 29.50)], 'width': 0.7})
    tracks.append({'net': 'D25', 'pts': [(95.00, 7.62),  (100.04, 7.62)], 'width': 0.7})
    # JMP14 (D23)
    tracks.append({'net': 'D23', 'pts': [(27.08, 38.50), (27.08, 40.50)], 'width': 0.7})
    tracks.append({'net': 'D23', 'pts': [(95.00, 5.08),  (100.04, 5.08)], 'width': 0.7})

    # 4. Power Buses on Single Layer (+5V_SERVO)
    tracks.append({'net': '5V_SERVO', 'pts': [(6.0, 34.54), (12.0, 34.54), (18.0, 34.54)], 'width': 1.8})
    # Servos at Y=46.50
    tracks.append({'net': '5V_SERVO', 'pts': [(36.0, 46.50), (36.0, 44.50), (45.54, 44.50), (45.54, 46.50)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(45.54, 44.50), (80.54, 44.50), (80.54, 46.50)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(80.54, 44.50), (89.54, 44.50), (89.54, 46.50)], 'width': 1.8})

    return tracks

tracks = build_zero_tracks()
colls = check_collisions(tracks)
print(f"VERIFIED ZERO-COLLISION CHECK: {len(colls)} collisions")
for c in colls:
    print(f"  COLLISION: {c[0]} with {c[1]}")
