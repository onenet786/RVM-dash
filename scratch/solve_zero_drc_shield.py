"""
Dedicated zero-collision channel router for Pro RVM Shield.
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

# Let's test routing with strictly monotonic channels
def test_monotonic():
    tracks = []
    
    # 1. Top Header on B.Cu (Concentric nested, zero crossing)
    # D9 is outermost, D12 is innermost
    tracks.append({'net': 'D9', 'layer': 'bot', 'width': 0.7, 'pts': [(24.54, 46.50), (24.54, 47.30), (58.74, 47.30), (58.74, 51.10)]})
    tracks.append({'net': 'D10', 'layer': 'bot', 'width': 0.7, 'pts': [(27.08, 46.50), (27.08, 48.00), (56.20, 48.00), (56.20, 51.10)]})
    tracks.append({'net': 'D11', 'layer': 'bot', 'width': 0.7, 'pts': [(39.08, 46.50), (39.08, 48.70), (53.66, 48.70), (53.66, 51.10)]})
    tracks.append({'net': 'D12', 'layer': 'bot', 'width': 0.7, 'pts': [(48.08, 46.50), (48.08, 49.40), (51.12, 49.40), (51.12, 51.10)]})

    # Let's verify top header first
    colls = check_collisions(tracks, 'bot')
    print(f"Top header collisions: {len(colls)}")

test_monotonic()
