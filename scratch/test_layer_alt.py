"""
Test layer separation for Top Header nets.
"""
from solve_zero_drc_shield import check_collisions

tracks = [
    {'net': 'D9', 'layer': 'top', 'width': 0.7, 'pts': [(24.54, 46.50), (24.54, 49.00), (58.74, 49.00), (58.74, 51.10)]},
    {'net': 'D10', 'layer': 'bot', 'width': 0.7, 'pts': [(27.08, 46.50), (27.08, 48.00), (56.20, 48.00), (56.20, 51.10)]},
    {'net': 'D11', 'layer': 'top', 'width': 0.7, 'pts': [(39.08, 46.50), (39.08, 47.50), (53.66, 47.50), (53.66, 51.10)]},
    {'net': 'D12', 'layer': 'bot', 'width': 0.7, 'pts': [(48.08, 46.50), (48.08, 49.50), (51.12, 49.50), (51.12, 51.10)]},
]

colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')
print(f"BOT COLLISIONS: {len(colls_bot)}")
print(f"TOP COLLISIONS: {len(colls_top)}")
