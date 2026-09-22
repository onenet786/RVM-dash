"""
Test orthogonal 2-layer routing (Manhattan layer separation).
Bottom = Horizontal tracks
Top = Vertical tracks
"""

from solve_zero_drc_shield import check_collisions

# Let's test routing where vertical trunk crossings are on Top Copper,
# and horizontal buses are on Bottom Copper.
tracks = []

# All nets with sources and targets
NETS = [
    # Top PWM
    ('D12', (38.54, 46.50), (51.12, 51.10), 49.60),
    ('D11', (45.54, 46.50), (53.66, 51.10), 48.90),
    ('D10', (52.54, 46.50), (56.20, 51.10), 48.20),
    ('D9',  (55.08, 46.50), (58.74, 51.10), 47.50),
]

for name, src, dst, y_mid in NETS:
    # Source stub on bot
    tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [src, (src[0], y_mid)]})
    # Horizontal run on bot
    tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(src[0], y_mid), (dst[0], y_mid)]})
    # Target stub on bot
    tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(dst[0], y_mid), dst]})

# Header nets:
HEADER_NETS = [
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

for name, src, dst, x_col in HEADER_NETS:
    # 1. Horizontal from source to x_col on BOT
    tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [src, (x_col, src[1])]})
    # 2. Vertical from src[1] to dst[1] on TOP (jumper layer - 0 crossing on bot!)
    tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [(x_col, src[1]), (x_col, dst[1])]})
    # 3. Horizontal from x_col to target header on BOT
    tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(x_col, dst[1]), dst]})

colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')
print(f"BOT COLLISIONS: {len(colls_bot)}")
for c in colls_bot:
    print(f"  BOT COLLISION: {c[0]} with {c[1]}")
print(f"TOP COLLISIONS: {len(colls_top)}")
for c in colls_top:
    print(f"  TOP COLLISION: {c[0]} with {c[1]}")
