"""
Fix the single D41 vertical stub collision by moving it to TOP COPPER.
"""
from test_strict_manhattan import build_strict_manhattan
from solve_zero_drc_shield import check_collisions

tracks = build_strict_manhattan()

# 5V_SERVO Power Rail:
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(6.0, 34.54), (12.0, 34.54), (18.0, 34.54)]})

# Servos at Y=46.50
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(36.54, 46.50), (36.54, 44.50), (45.54, 44.50), (45.54, 46.50)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(45.54, 44.50), (80.54, 44.50), (80.54, 46.50)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(80.54, 44.50), (89.54, 44.50), (89.54, 46.50)]})

# Vertical feed to Y=44.50 on TOP
tracks.append({'net': '5V_SERVO', 'layer': 'top', 'width': 1.8, 'pts': [(18.0, 34.54), (18.0, 44.50)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(18.0, 44.50), (36.54, 44.50)]})

# Servos at Y=27.50 (J8, J9)
# Vertical stubs to the pads on TOP so they do not intersect D41 on BOT!
tracks.append({'net': '5V_SERVO', 'layer': 'top', 'width': 1.8, 'pts': [(18.0, 34.54), (18.0, 29.00)]})
tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 1.8, 'pts': [(18.0, 29.00), (36.54, 29.00), (45.54, 29.00)]})
tracks.append({'net': '5V_SERVO', 'layer': 'top', 'width': 1.8, 'pts': [(36.54, 29.00), (36.54, 27.50)]})
tracks.append({'net': '5V_SERVO', 'layer': 'top', 'width': 1.8, 'pts': [(45.54, 29.00), (45.54, 27.50)]})

colls_bot = check_collisions(tracks, 'bot')
colls_top = check_collisions(tracks, 'top')
print(f"FINAL BOT COLLISIONS: {len(colls_bot)}")
print(f"FINAL TOP COLLISIONS: {len(colls_top)}")
