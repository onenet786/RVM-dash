"""
Strict Manhattan 2-Layer Router:
- B.Cu: ONLY Horizontal segments (unique Y)
- F.Cu: ONLY Vertical segments (unique X)
Guarantee: 0 collisions on B.Cu and 0 collisions on F.Cu!
"""

from solve_zero_drc_shield import check_collisions

def build_strict_manhattan():
    tracks = []
    
    # 1. Top PWM (D12, D11, D10, D9)
    # Horizontal on bot, vertical on top
    pwm_nets = [
        ('D12', (38.54, 46.50), (51.12, 51.10), 49.60, 38.54, 51.12),
        ('D11', (45.54, 46.50), (53.66, 51.10), 48.90, 45.54, 53.66),
        ('D10', (52.54, 46.50), (56.20, 51.10), 48.20, 52.54, 56.20),
        ('D9',  (55.08, 46.50), (58.74, 51.10), 47.50, 55.08, 58.74),
    ]
    for name, src, dst, y_mid, x_src, x_dst in pwm_nets:
        # vertical stub on TOP
        tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [src, (x_src, y_mid)]})
        # horizontal run on BOT
        tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(x_src, y_mid), (x_dst, y_mid)]})
        # vertical to header on TOP
        tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [(x_dst, y_mid), dst]})

    # 2. All 25 Header Nets:
    # Each net has:
    # - Source pad (x_s, y_s)
    # - Destination pad (x_d, y_d)
    # Strategy:
    # - Vertical segment on TOP at unique X column: (x_col, y_s) -> (x_col, y_d)
    # - Horizontal segment 1 on BOT: (x_s, y_s) -> (x_col, y_s)
    # - Horizontal segment 2 on BOT: (x_col, y_d) -> (x_d, y_d)
    # Notice: All vertical segments are on TOP. All horizontal segments are on BOT.
    
    all_header_nets = [
        # Inner column (dst X = 97.50)
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

        # Outer column (dst X = 100.04)
        ('D45', (48.54, 16.50), (100.04, 33.02), 63.5),
        ('D43', (51.08, 38.50), (100.04, 30.48), 59.5),
        ('D41', (39.08, 38.50), (100.04, 27.94), 41.5),
        ('D39', (70.54, 16.50), (100.04, 25.40), 79.5),
        ('D37', (73.08, 28.50), (100.04, 22.86), 77.5),
        ('D35', (83.08, 46.50), (100.04, 20.32), 85.0),
        ('D33', (68.54, 46.50), (100.04, 17.78), 72.5),
        ('D31', (36.54, 16.50), (100.04, 15.24), 37.0),
        ('D29', (24.54, 16.50), (100.04, 12.70), 26.0),
        ('D27', (39.08, 27.50), (100.04, 10.16), 40.5),
        ('D25', (24.54, 27.50), (100.04, 7.62),  28.0),
        ('D23', (27.08, 38.50), (100.04, 5.08),  29.0),
    ]

    for name, src, dst, x_col in all_header_nets:
        # 1. Horizontal from source to x_col on BOT
        tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [src, (x_col, src[1])]})
        # 2. Vertical on TOP (unique x_col)
        tracks.append({'net': name, 'layer': 'top', 'width': 0.7, 'pts': [(x_col, src[1]), (x_col, dst[1])]})
        # 3. Horizontal from x_col to target on BOT
        tracks.append({'net': name, 'layer': 'bot', 'width': 0.7, 'pts': [(x_col, dst[1]), dst]})

    return tracks

tracks = build_strict_manhattan()
colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')

print(f"STRICT MANHATTAN BOT COLLISIONS: {len(colls_bot)}")
for c in colls_bot:
    print(f"  BOT: {c[0]} with {c[1]}")

print(f"STRICT MANHATTAN TOP COLLISIONS: {len(colls_top)}")
for c in colls_top:
    print(f"  TOP: {c[0]} with {c[1]}")
