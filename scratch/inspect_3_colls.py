"""
Print collisions.
"""
from generate_single_sided_shield import get_single_sided_tracks, check_collisions

tracks = get_single_sided_tracks()
colls = check_collisions(tracks)
for c in colls:
    print(f"Collision between {c[0]} and {c[1]}:")
    print(f"  {c[2]}")
    print(f"  {c[3]}")
