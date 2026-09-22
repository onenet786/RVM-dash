"""
Inspect D41 collision with 5V_SERVO.
"""
from test_power_routing import tracks, colls_bot

for c in colls_bot:
    if 'D41' in c or '5V_SERVO' in c:
        print(f"Collision between {c[0]} and {c[1]}:")
        print(f"  Segment 1: {c[2]}")
        print(f"  Segment 2: {c[3]}")
