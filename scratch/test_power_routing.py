"""
Test adding power buses (+5V_SERVO, +12V, GND, +5V_LOGIC) to the strict Manhattan routing.
"""

from test_strict_manhattan import build_strict_manhattan
from solve_zero_drc_shield import check_collisions

tracks = build_strict_manhattan()

# 1. 5V_SERVO High-Current Rail (width 1.8mm) on BOT
# TB2 (6.0, 34.54) -> C1 (12.0, 34.54) -> runs along Y=34.54
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(6.0, 34.54), (12.0, 34.54), (18.0, 34.54)]})

# Chamber 1 Servos (Y=46.5): J2 at 36.54, J3 at 45.54
# Chamber 2 Servos (Y=27.5): J8 at 36.54, J9 at 45.54
# Chamber 3 Servos (Y=46.5): J15 at 80.54, J16 at 89.54

# Corridors for 5V_SERVO:
# Y=44.50 on BOT connects J2 & J3
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(36.54, 46.50), (36.54, 44.50), (45.54, 44.50), (45.54, 46.50)]})
# Y=29.00 on BOT connects J8 & J9
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(36.54, 27.50), (36.54, 29.00), (45.54, 29.00), (45.54, 27.50)]})
# Y=44.50 on BOT connects J15 & J16
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(80.54, 46.50), (80.54, 44.50), (89.54, 44.50), (89.54, 46.50)]})

# Feeder line from TB2 (18.0, 34.54) on TOP (vertical jumpers to avoid horizontal bot tracks):
tracks.append({'net': '5V_SERVO', 'layer': 'top', 'width': 1.8, 'pts': [(18.0, 34.54), (18.0, 44.50)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(18.0, 44.50), (36.54, 44.50)]})
tracks.append({'net': '5V_SERVO', 'layer': 'top', 'width': 1.8, 'pts': [(18.0, 34.54), (18.0, 29.00)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(18.0, 29.00), (36.54, 29.00)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(45.54, 44.50), (80.54, 44.50)]})

colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')
print(f"WITH POWER - BOT COLLISIONS: {len(colls_bot)}")
for c in colls_bot:
    print(f"  BOT: {c[0]} with {c[1]}")
print(f"WITH POWER - TOP COLLISIONS: {len(colls_top)}")
for c in colls_top:
    print(f"  TOP: {c[0]} with {c[1]}")
