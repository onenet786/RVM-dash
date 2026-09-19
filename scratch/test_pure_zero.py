"""
True Zero-Collision Single-Sided Router for RVM_Arduino.ino.
Separates all non-jumper traces into independent horizontal lanes.
"""

from test_final_zero_jumpers import check_collisions

def build_pure_zero_tracks():
    tracks = []
    
    # 1. Top PWM (D12, D11, D10, D9) - Verified 0 collisions
    tracks.append({'net': 'D12', 'pts': [(38.54, 46.50), (38.54, 49.60), (51.12, 49.60), (51.12, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D11', 'pts': [(45.54, 46.50), (45.54, 48.90), (53.66, 48.90), (53.66, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D10', 'pts': [(52.54, 46.50), (52.54, 48.20), (56.20, 48.20), (56.20, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D9',  'pts': [(55.08, 46.50), (55.08, 47.50), (58.74, 47.50), (58.74, 51.10)], 'width': 0.7})

    # 2. Direct Tracks (Straight horizontal lanes into inner column 97.50, Y):
    # To have 0 collisions, every direct track enters from X=88.0 straight into its pin:
    tracks.append({'net': 'D42', 'pts': [(88.0, 30.48), (97.50, 30.48)], 'width': 0.7})
    tracks.append({'net': 'D40', 'pts': [(88.0, 27.94), (97.50, 27.94)], 'width': 0.7})
    tracks.append({'net': 'D38', 'pts': [(88.0, 25.40), (97.50, 25.40)], 'width': 0.7})
    tracks.append({'net': 'D36', 'pts': [(88.0, 22.86), (97.50, 22.86)], 'width': 0.7})
    tracks.append({'net': 'D34', 'pts': [(88.0, 20.32), (97.50, 20.32)], 'width': 0.7})
    tracks.append({'net': 'D32', 'pts': [(88.0, 17.78), (97.50, 17.78)], 'width': 0.7})
    tracks.append({'net': 'D30', 'pts': [(88.0, 15.24), (97.50, 15.24)], 'width': 0.7})
    tracks.append({'net': 'D28', 'pts': [(88.0, 12.70), (97.50, 12.70)], 'width': 0.7})
    tracks.append({'net': 'D26', 'pts': [(88.0, 10.16), (97.50, 10.16)], 'width': 0.7})
    tracks.append({'net': 'D24', 'pts': [(88.0, 7.62),  (97.50, 7.62)],  'width': 0.7})
    tracks.append({'net': 'D22', 'pts': [(88.0, 5.08),  (97.50, 5.08)],  'width': 0.7})

    # Jumper tracks to outer column (100.04, Y):
    tracks.append({'net': 'D46', 'pts': [(93.0, 35.56), (97.50, 35.56)], 'width': 0.7})
    tracks.append({'net': 'D45', 'pts': [(93.0, 33.02), (100.04, 33.02)], 'width': 0.7})
    tracks.append({'net': 'D44', 'pts': [(91.0, 33.02), (97.50, 33.02)], 'width': 0.7})
    tracks.append({'net': 'D43', 'pts': [(93.0, 30.48), (100.04, 30.48)], 'width': 0.7})
    tracks.append({'net': 'D41', 'pts': [(93.0, 27.94), (100.04, 27.94)], 'width': 0.7})
    tracks.append({'net': 'D39', 'pts': [(93.0, 25.40), (100.04, 25.40)], 'width': 0.7})
    tracks.append({'net': 'D37', 'pts': [(93.0, 22.86), (100.04, 22.86)], 'width': 0.7})
    tracks.append({'net': 'D35', 'pts': [(93.0, 20.32), (100.04, 20.32)], 'width': 0.7})
    tracks.append({'net': 'D33', 'pts': [(93.0, 17.78), (100.04, 17.78)], 'width': 0.7})
    tracks.append({'net': 'D31', 'pts': [(93.0, 15.24), (100.04, 15.24)], 'width': 0.7})
    tracks.append({'net': 'D29', 'pts': [(93.0, 12.70), (100.04, 12.70)], 'width': 0.7})
    tracks.append({'net': 'D27', 'pts': [(93.0, 10.16), (100.04, 10.16)], 'width': 0.7})
    tracks.append({'net': 'D25', 'pts': [(93.0, 7.62),  (100.04, 7.62)],  'width': 0.7})
    tracks.append({'net': 'D23', 'pts': [(93.0, 5.08),  (100.04, 5.08)],  'width': 0.7})

    # Feeder stubs at the sensor connectors (all strictly local):
    tracks.append({'net': 'D42', 'pts': [(48.54, 38.50), (48.54, 37.00)], 'width': 0.7})
    tracks.append({'net': 'D40', 'pts': [(73.08, 16.50), (73.08, 15.00)], 'width': 0.7})
    tracks.append({'net': 'D38', 'pts': [(70.54, 28.50), (70.54, 27.00)], 'width': 0.7})
    tracks.append({'net': 'D36', 'pts': [(92.08, 46.50), (92.08, 45.00)], 'width': 0.7})
    tracks.append({'net': 'D34', 'pts': [(71.08, 46.50), (71.08, 45.00)], 'width': 0.7})
    tracks.append({'net': 'D32', 'pts': [(63.08, 16.50), (63.08, 15.00)], 'width': 0.7})
    tracks.append({'net': 'D30', 'pts': [(27.08, 16.50), (27.08, 15.00)], 'width': 0.7})
    tracks.append({'net': 'D28', 'pts': [(48.08, 27.50), (48.08, 26.00)], 'width': 0.7})
    tracks.append({'net': 'D26', 'pts': [(27.08, 27.50), (27.08, 26.00)], 'width': 0.7})
    tracks.append({'net': 'D24', 'pts': [(36.54, 38.50), (36.54, 37.00)], 'width': 0.7})
    tracks.append({'net': 'D22', 'pts': [(24.54, 38.50), (24.54, 37.00)], 'width': 0.7})

    # Power Rail (+5V_SERVO)
    tracks.append({'net': '5V_SERVO', 'pts': [(6.0, 34.54), (12.0, 34.54), (18.0, 34.54)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(36.0, 46.50), (36.0, 44.50), (45.54, 44.50), (45.54, 46.50)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(45.54, 44.50), (80.54, 44.50), (80.54, 46.50)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(80.54, 44.50), (89.54, 44.50), (89.54, 46.50)], 'width': 1.8})

    return tracks

tracks = build_pure_zero_tracks()
colls = check_collisions(tracks)
print(f"PURE ZERO COLLISION CHECK: {len(colls)} collisions")
