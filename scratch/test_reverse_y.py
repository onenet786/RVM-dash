"""
Test reverse Y ordering for Chamber 1 signals.
"""
from solve_zero_drc_shield import check_collisions

tracks = [
    # D12 takes highest Y (49.60)
    {'net': 'D12', 'layer': 'bot', 'width': 0.7, 'pts': [(38.54, 46.50), (38.54, 49.60), (51.12, 49.60), (51.12, 51.10)]},
    # D11 takes Y=48.90
    {'net': 'D11', 'layer': 'bot', 'width': 0.7, 'pts': [(45.54, 46.50), (45.54, 48.90), (53.66, 48.90), (53.66, 51.10)]},
    # D10 takes Y=48.20
    {'net': 'D10', 'layer': 'bot', 'width': 0.7, 'pts': [(52.54, 46.50), (52.54, 48.20), (56.20, 48.20), (56.20, 51.10)]},
    # D9 takes lowest Y (47.50)
    {'net': 'D9', 'layer': 'bot', 'width': 0.7, 'pts': [(55.08, 46.50), (55.08, 47.50), (58.74, 47.50), (58.74, 51.10)]},
]

colls = check_collisions(tracks, 'bot')
print(f"REVERSE Y ORDER COLLISIONS: {len(colls)}")
for c in colls:
    print(f"  Collision between {c[0]} and {c[1]}")
