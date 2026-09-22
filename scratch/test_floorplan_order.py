"""
Test ordered floorplan for Chamber 1 top PWM signals.
"""
from solve_zero_drc_shield import check_collisions

# J3 (Drop, D12) at X=36.0
# J2 (Iris, D11) at X=43.0
# J1 (Entrance, D10/D9) at X=50.0

tracks = [
    # D12 from (38.54, 46.5) -> (51.12, 51.10)
    {'net': 'D12', 'layer': 'bot', 'width': 0.7, 'pts': [(38.54, 46.50), (38.54, 47.50), (51.12, 47.50), (51.12, 51.10)]},
    # D11 from (45.54, 46.5) -> (53.66, 51.10)
    {'net': 'D11', 'layer': 'bot', 'width': 0.7, 'pts': [(45.54, 46.50), (45.54, 48.20), (53.66, 48.20), (53.66, 51.10)]},
    # D10 from (52.54, 46.5) -> (56.20, 51.10)
    {'net': 'D10', 'layer': 'bot', 'width': 0.7, 'pts': [(52.54, 46.50), (52.54, 48.90), (56.20, 48.90), (56.20, 51.10)]},
    # D9 from (55.08, 46.5) -> (58.74, 51.10)
    {'net': 'D9', 'layer': 'bot', 'width': 0.7, 'pts': [(55.08, 46.50), (55.08, 49.60), (58.74, 49.60), (58.74, 51.10)]},
]

colls = check_collisions(tracks, 'bot')
print(f"ORDERED FLOORPLAN BOT COLLISIONS: {len(colls)}")
