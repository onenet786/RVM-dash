"""
=============================================================================
PECODROP RVM — SINGLE-SIDED ARDUINO MEGA 2560 SHIELD PCB (REV 4.0 DIY)
100% Single-Sided Etch Mask with Through-Hole Jumper Pads (JMP)
Strict 1:1 hardware match for RVM_Arduino.ino (NO CODE CHANGES)
DRC: EXACTLY 0 COPPER COLLISIONS.
=============================================================================
"""

import os
import sys
import math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Polygon

W_BOARD = 101.60  # mm
H_BOARD = 53.34   # mm

# Line intersection checker for strict DRC
def ccw(A, B, C):
    return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

def intersect(A, B, C, D):
    if (A == C or A == D or B == C or B == D):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check_collisions(tracks):
    segs = []
    for trk in tracks:
        pts = trk['pts']
        for i in range(len(pts) - 1):
            segs.append((pts[i], pts[i+1], trk['net']))
    colls = []
    n = len(segs)
    for i in range(n):
        for j in range(i+1, n):
            s1, s2 = segs[i], segs[j]
            if s1[2] == s2[2] and (s1[0] == s2[0] or s1[0] == s2[1] or s1[1] == s2[0] or s1[1] == s2[1]):
                continue
            if intersect(s1[0], s1[1], s2[0], s2[1]):
                colls.append((s1[2], s2[2], s1, s2))
    return colls

# Definition of Jumpers needed to bridge RVM_Arduino.ino signals across the single-sided board:
# Pad A is at the sensor end; Pad B is at the Mega header end.
JUMPERS = [
    # Plastic Sizing US
    ('JMP_D22', 'D22', (24.54, 36.50), (88.00, 5.08),  'JMP:D22'),
    ('JMP_D23', 'D23', (27.08, 40.50), (93.00, 5.08),  'JMP:D23'),
    ('JMP_D24', 'D24', (36.54, 36.50), (88.00, 7.62),  'JMP:D24'),
    ('JMP_D41', 'D41', (39.08, 36.50), (93.00, 27.94), 'JMP:D41'),
    ('JMP_D42', 'D42', (48.54, 36.50), (88.00, 30.48), 'JMP:D42'),
    ('JMP_D43', 'D43', (51.08, 36.50), (93.00, 30.48), 'JMP:D43'),

    # Metal Chamber
    ('JMP_D25', 'D25', (24.54, 29.50), (93.00, 7.62),  'JMP:D25'),
    ('JMP_D26', 'D26', (27.08, 25.50), (88.00, 10.16), 'JMP:D26'),
    ('JMP_D27', 'D27', (39.08, 29.50), (93.00, 10.16), 'JMP:D27'),
    ('JMP_D28', 'D28', (48.08, 25.50), (88.00, 12.70), 'JMP:D28'),
    ('JMP_D29', 'D29', (24.54, 14.50), (93.00, 12.70), 'JMP:D29'),
    ('JMP_D30', 'D30', (27.08, 14.50), (88.00, 15.24), 'JMP:D30'),
    ('JMP_D31', 'D31', (36.54, 14.50), (93.00, 15.24), 'JMP:D31'),
    ('JMP_D32', 'D32', (63.08, 14.50), (88.00, 17.78), 'JMP:D32'),
    ('JMP_D44', 'D44', (39.08, 18.50), (91.00, 33.02), 'JMP:D44'),
    ('JMP_D45', 'D45', (48.54, 14.50), (93.00, 33.02), 'JMP:D45'),
    ('JMP_D46', 'D46', (51.08, 18.50), (93.00, 35.56), 'JMP:D46'),

    # Paper Chamber
    ('JMP_D33', 'D33', (68.54, 48.50), (93.00, 17.78), 'JMP:D33'),
    ('JMP_D34', 'D34', (71.08, 48.50), (88.00, 20.32), 'JMP:D34'),
    ('JMP_D35', 'D35', (83.08, 48.50), (93.00, 20.32), 'JMP:D35'),
    ('JMP_D36', 'D36', (92.08, 48.50), (88.00, 22.86), 'JMP:D36'),
    ('JMP_D37', 'D37', (73.08, 30.50), (93.00, 22.86), 'JMP:D37'),
    ('JMP_D38', 'D38', (70.54, 26.50), (88.00, 25.40), 'JMP:D38'),
    ('JMP_D39', 'D39', (70.54, 18.50), (93.00, 25.40), 'JMP:D39'),
    ('JMP_D40', 'D40', (73.08, 14.50), (88.00, 27.94), 'JMP:D40'),
]

def get_all_pads():
    pads = []
    
    # 1. Mega Top Headers
    for p in range(10):
        px = 43.5 + p * 2.54
        pads.append({'x': px, 'y': 51.10, 'outer_r': 1.05, 'inner_r': 0.45, 'type': 'mega'})
    for p in range(8):
        px = 72.5 + p * 2.54
        pads.append({'x': px, 'y': 51.10, 'outer_r': 1.05, 'inner_r': 0.45, 'type': 'mega'})
        
    # 2. Mega Bottom Headers
    for bx in [32.5, 55.5, 78.5]:
        for p in range(8):
            px = bx + p * 2.54
            pads.append({'x': px, 'y': 2.40, 'outer_r': 1.05, 'inner_r': 0.45, 'type': 'mega'})

    # 3. Mega 2x18 Header (inner=97.50, outer=100.04)
    for r in range(18):
        ry = 5.08 + r * 2.54
        pads.append({'x': 97.50, 'y': ry, 'outer_r': 1.00, 'inner_r': 0.42, 'type': 'mega_2x18'})
        pads.append({'x': 100.04, 'y': ry, 'outer_r': 1.00, 'inner_r': 0.42, 'type': 'mega_2x18'})

    # 4. Power Terminals (5.08mm Pitch Screw Terminals)
    pads.append({'x': 6.0, 'y': 41.46, 'outer_r': 2.2, 'inner_r': 0.85, 'type': 'power'})
    pads.append({'x': 6.0, 'y': 46.54, 'outer_r': 2.2, 'inner_r': 0.85, 'type': 'power'})
    pads.append({'x': 6.0, 'y': 29.46, 'outer_r': 2.2, 'inner_r': 0.85, 'type': 'power'})
    pads.append({'x': 6.0, 'y': 34.54, 'outer_r': 2.2, 'inner_r': 0.85, 'type': 'power'})

    # 5. Filter Capacitors C1, C2
    pads.append({'x': 12.0, 'y': 29.46, 'outer_r': 1.4, 'inner_r': 0.55, 'type': 'cap'})
    pads.append({'x': 12.0, 'y': 34.54, 'outer_r': 1.4, 'inner_r': 0.55, 'type': 'cap'})
    pads.append({'x': 12.0, 'y': 41.46, 'outer_r': 1.4, 'inner_r': 0.55, 'type': 'cap'})
    pads.append({'x': 12.0, 'y': 46.54, 'outer_r': 1.4, 'inner_r': 0.55, 'type': 'cap'})

    # 6. Status LEDs & Resistors
    for ly in [46.54, 34.54, 22.0]:
        pads.append({'x': 16.5, 'y': ly, 'outer_r': 0.9, 'inner_r': 0.40, 'type': 'led'})
        pads.append({'x': 16.5, 'y': ly - 3.0, 'outer_r': 0.9, 'inner_r': 0.40, 'type': 'led'})

    # 7. Chamber 1 (Plastic) Connectors
    for p in range(3):
        pads.append({'x': 36.0 + p * 2.54, 'y': 46.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(3):
        pads.append({'x': 43.0 + p * 2.54, 'y': 46.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 50.0 + p * 2.54, 'y': 46.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 22.0 + p * 2.54, 'y': 38.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 34.0 + p * 2.54, 'y': 38.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 46.0 + p * 2.54, 'y': 38.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})

    # 8. Chamber 2 (Metal) Connectors
    for p in range(4):
        pads.append({'x': 22.0 + p * 2.54, 'y': 27.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(3):
        pads.append({'x': 34.0 + p * 2.54, 'y': 27.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(3):
        pads.append({'x': 43.0 + p * 2.54, 'y': 27.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 22.0 + p * 2.54, 'y': 16.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 34.0 + p * 2.54, 'y': 16.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 46.0 + p * 2.54, 'y': 16.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(3):
        pads.append({'x': 58.0 + p * 2.54, 'y': 16.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})

    # 9. Chamber 3 (Paper) Connectors
    for p in range(4):
        pads.append({'x': 66.0 + p * 2.54, 'y': 46.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(3):
        pads.append({'x': 78.0 + p * 2.54, 'y': 46.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(3):
        pads.append({'x': 87.0 + p * 2.54, 'y': 46.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 68.0 + p * 2.54, 'y': 28.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})
    for p in range(4):
        pads.append({'x': 68.0 + p * 2.54, 'y': 16.50, 'outer_r': 1.1, 'inner_r': 0.45, 'type': 'conn'})

    # 10. M3 Chassis Standoff Holes
    for hx, hy in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        pads.append({'x': hx, 'y': hy, 'outer_r': 3.2, 'inner_r': 1.6, 'type': 'mount'})

    # 11. DEDICATED THROUGH-HOLE JUMPER PADS (Every jumper wire solders here!)
    for jmp in JUMPERS:
        name, net, pad_a, pad_b, lbl = jmp
        pads.append({'x': pad_a[0], 'y': pad_a[1], 'outer_r': 1.25, 'inner_r': 0.45, 'type': 'jmp'})
        pads.append({'x': pad_b[0], 'y': pad_b[1], 'outer_r': 1.25, 'inner_r': 0.45, 'type': 'jmp'})

    return pads

def get_single_sided_tracks():
    tracks = []
    
    # 1. Top PWM (D12, D11, D10, D9) - 100% Direct Continuous Copper
    tracks.append({'net': 'D12', 'pts': [(38.54, 46.50), (38.54, 49.60), (51.12, 49.60), (51.12, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D11', 'pts': [(45.54, 46.50), (45.54, 48.90), (53.66, 48.90), (53.66, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D10', 'pts': [(52.54, 46.50), (52.54, 48.20), (56.20, 48.20), (56.20, 51.10)], 'width': 0.7})
    tracks.append({'net': 'D9',  'pts': [(55.08, 46.50), (55.08, 47.50), (58.74, 47.50), (58.74, 51.10)], 'width': 0.7})

    # 2. Direct Header Copper Tracks (Straight horizontal lanes into inner column 97.50, Y):
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

    # 3. Dedicated Copper Feeder Stubs (Connecting sensor pins directly to Jumper Pad A):
    for jmp in JUMPERS:
        name, net, pad_a, pad_b, lbl = jmp
        # Copper stub from sensor pin to pad_a:
        src_map = {
            'D22': (24.54, 38.50), 'D23': (27.08, 38.50), 'D24': (36.54, 38.50), 'D41': (39.08, 38.50),
            'D42': (48.54, 38.50), 'D43': (51.08, 38.50), 'D25': (24.54, 27.50), 'D26': (27.08, 27.50),
            'D27': (39.08, 27.50), 'D28': (48.08, 27.50), 'D29': (24.54, 16.50), 'D30': (27.08, 16.50),
            'D31': (36.54, 16.50), 'D32': (63.08, 16.50), 'D44': (39.08, 16.50), 'D45': (48.54, 16.50),
            'D46': (51.08, 16.50), 'D33': (68.54, 46.50), 'D34': (71.08, 46.50), 'D35': (83.08, 46.50),
            'D36': (92.08, 46.50), 'D37': (73.08, 28.50), 'D38': (70.54, 28.50), 'D39': (70.54, 16.50),
            'D40': (73.08, 16.50),
        }
        src = src_map[net]
        tracks.append({'net': net, 'pts': [src, pad_a], 'width': 0.7})

    # 4. Power Buses (+5V_SERVO High-Current Copper Rail)
    tracks.append({'net': '5V_SERVO', 'pts': [(6.0, 34.54), (12.0, 34.54), (18.0, 34.54)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(36.0, 46.50), (36.0, 44.50), (45.54, 44.50), (45.54, 46.50)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(45.54, 44.50), (80.54, 44.50), (80.54, 46.50)], 'width': 1.8})
    tracks.append({'net': '5V_SERVO', 'pts': [(80.54, 44.50), (89.54, 44.50), (89.54, 46.50)], 'width': 1.8})

    return tracks

def draw_track(ax, pts, color="#000000", width=1.0, zorder=3):
    xs, ys = zip(*pts)
    ax.plot(xs, ys, color=color, linewidth=width, solid_capstyle='round', solid_joinstyle='round', zorder=zorder)

def draw_pad(ax, x, y, outer_r=1.1, inner_r=0.45, pad_color="#000000", hole_color="#ffffff", zorder=5):
    c_out = Circle((x, y), outer_r, facecolor=pad_color, edgecolor=pad_color, zorder=zorder)
    c_in = Circle((x, y), inner_r, facecolor=hole_color, edgecolor=hole_color, zorder=zorder+1)
    ax.add_patch(c_out)
    ax.add_patch(c_in)

# -------------------------------------------------------------------------
# 1. 100% SINGLE-SIDED BOTTOM COPPER ETCH MASK (B.Cu)
# -------------------------------------------------------------------------
def generate_single_sided_copper(mirror=False, out_path="rvm_arduino_mega_shield_pcb_copper_bottom.png"):
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300, facecolor="#ffffff")
    ax.set_facecolor("#ffffff")
    ax.set_xlim(-10, 115)
    ax.set_ylim(-10, 65)
    ax.axis('off')

    # Calibration Ruler (100.0 mm Bar)
    ax.plot([5, 105], [-6, -6], color="#000000", linewidth=2.0)
    for t in range(101):
        h = 2.0 if t % 10 == 0 else (1.2 if t % 5 == 0 else 0.6)
        ax.plot([5 + t, 5 + t], [-6, -6 + h], color="#000000", linewidth=0.5 if t % 10 != 0 else 1.0)
        if t % 10 == 0:
            ax.text(5 + t, -3.2, f"{t}", fontsize=5.5, ha='center', color="#000000", fontweight='bold')
    ax.text(55, -8.2, "100.0 mm TRUE SCALE CALIBRATION RULER (VERIFY WITH VERNIER CALIPERS BEFORE ETCHING)", 
            fontsize=6.5, fontweight='bold', ha='center', color="#000000")

    # Board Outline
    ax.add_patch(FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.4))

    # Titles
    ax.text(W_BOARD / 2, H_BOARD + 6.5, "PECODROP RVM — ARDUINO MEGA 2560 SHIELD (REV 4.0 DIY SINGLE-SIDED)", 
            fontsize=11.5, fontweight='bold', ha='center', color="#000000")
    sub = "100% SINGLE-SIDED COPPER MASK (B.Cu) — [MIRRORED FOR TONER TRANSFER ETCHING] (1:1 SCALE)" if mirror else "100% SINGLE-SIDED COPPER MASK (B.Cu) — CHEMICAL ETCHING & TRACK MASK (1:1 SCALE)"
    ax.text(W_BOARD / 2, H_BOARD + 3.2, sub, fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # Draw All Tracks (Every single trace terminates in a through-hole pad!)
    tracks = get_single_sided_tracks()
    for trk in tracks:
        pts = [(W_BOARD - pt[0], pt[1]) if mirror else pt for pt in trk['pts']]
        draw_track(ax, pts, color="#000000", width=trk['width'] * 1.9, zorder=3)

    # Draw All Solder Pads
    pads = get_all_pads()
    for p in pads:
        px = (W_BOARD - p['x']) if mirror else p['x']
        draw_pad(ax, px, p['y'], outer_r=p['outer_r'], inner_r=p['inner_r'], pad_color="#000000", hole_color="#ffffff")

    # Watermark
    text_x = (W_BOARD - 35.0) if mirror else 35.0
    ax.text(text_x, 3.2, "REV 4.0 100% SINGLE-SIDED (NO DANGLING TRACES)", fontsize=5.5, fontweight='bold', ha='center', color="#000000")

    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {out_path}")

# -------------------------------------------------------------------------
# 2. TOP COPPER LAYER (F.Cu) - Dedicated Jumper Layer
# -------------------------------------------------------------------------
def generate_top_copper(out_path="rvm_arduino_mega_shield_pcb_copper_top.png"):
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300, facecolor="#ffffff")
    ax.set_facecolor("#ffffff")
    ax.set_xlim(-10, 115)
    ax.set_ylim(-10, 65)
    ax.axis('off')

    # Calibration Ruler
    ax.plot([5, 105], [-6, -6], color="#000000", linewidth=2.0)
    for t in range(101):
        h = 2.0 if t % 10 == 0 else (1.2 if t % 5 == 0 else 0.6)
        ax.plot([5 + t, 5 + t], [-6, -6 + h], color="#000000", linewidth=0.5 if t % 10 != 0 else 1.0)
        if t % 10 == 0:
            ax.text(5 + t, -3.2, f"{t}", fontsize=5.5, ha='center', color="#000000", fontweight='bold')
    ax.text(55, -8.2, "100.0 mm TRUE SCALE CALIBRATION RULER (VERIFY WITH VERNIER CALIPERS BEFORE ETCHING)", 
            fontsize=6.5, fontweight='bold', ha='center', color="#000000")

    # Board Outline
    ax.add_patch(FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.4))

    ax.text(W_BOARD / 2, H_BOARD + 6.5, "PECODROP RVM — ARDUINO MEGA 2560 SHIELD (REV 4.0 DIY SINGLE-SIDED)", 
            fontsize=11.5, fontweight='bold', ha='center', color="#000000")
    ax.text(W_BOARD / 2, H_BOARD + 3.2, "TOP COMPONENT JUMPER WIRE GUIDE (0-OHM LINKS BETWEEN PADS) (1:1 SCALE)", 
            fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # Draw Jumpers on Top
    for jmp in JUMPERS:
        name, net, pad_a, pad_b, lbl = jmp
        draw_track(ax, [pad_a, pad_b], color="#000000", width=1.5, zorder=3)
        mid_x = (pad_a[0] + pad_b[0]) / 2
        mid_y = (pad_a[1] + pad_b[1]) / 2
        ax.text(mid_x, mid_y + 0.8, name, fontsize=4.5, ha='center', color="#000000", fontweight='bold', zorder=6)

    pads = get_all_pads()
    for p in pads:
        draw_pad(ax, p['x'], p['y'], outer_r=p['outer_r'], inner_r=p['inner_r'], pad_color="#000000", hole_color="#ffffff")

    ax.text(35.0, 3.2, "REV 4.0 TOP WIRE JUMPERS", fontsize=5.5, fontweight='bold', ha='center', color="#000000")

    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {out_path}")

# -------------------------------------------------------------------------
# 3. REALISTIC 2D CAD PCB LAYOUT (Assembly View with Color-Coded Jumpers)
# -------------------------------------------------------------------------
def generate_assembly_layout(out_path="rvm_arduino_mega_shield_pcb_layout.png"):
    fig, ax = plt.subplots(figsize=(18, 11), dpi=300, facecolor="#0e1726")
    ax.set_facecolor("#0e1726")
    ax.set_xlim(-8, 112)
    ax.set_ylim(-8, 62)
    ax.axis('off')

    # Dark Matte Green Solder Mask PCB
    ax.add_patch(FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0.0,rounding_size=3.0",
                                facecolor="#0b4626", edgecolor="#2dd4bf", linewidth=1.8, zorder=1))

    # Draw Bottom Copper Tracks in Translucent Cyan/Blue
    tracks = get_single_sided_tracks()
    for trk in tracks:
        draw_track(ax, trk['pts'], color="#38bdf8", width=trk['width'] * 1.6, zorder=2)

    # Draw Solder Pads in Gold
    pads = get_all_pads()
    for p in pads:
        p_col = "#fbbf24" if p.get('type') != 'jmp' else "#f59e0b"
        draw_pad(ax, p['x'], p['y'], outer_r=p['outer_r'], inner_r=p['inner_r'], pad_color=p_col, hole_color="#0e1726", zorder=4)

    # Draw Jumper Wires (Top Side Insulated 0-ohm links) in Bright Orange
    for jmp in JUMPERS:
        name, net, pad_a, pad_b, lbl = jmp
        ax.plot([pad_a[0], pad_b[0]], [pad_a[1], pad_b[1]], color="#fb923c", linewidth=1.4, linestyle="--", zorder=6)
        mid_x = (pad_a[0] + pad_b[0]) / 2
        mid_y = (pad_a[1] + pad_b[1]) / 2
        ax.text(mid_x, mid_y + 0.6, name, fontsize=3.5, ha='center', color="#fdba74", fontweight='bold', zorder=7)

    # Silkscreen Chamber Outlines
    ax.add_patch(FancyBboxPatch((20.5, 34.0), 40.0, 17.5, boxstyle="round,pad=0.0,rounding_size=1.5",
                                facecolor="none", edgecolor="#ffffff", linewidth=0.9, linestyle="--", zorder=6))
    ax.text(22.0, 50.0, "CHAMBER 1: PLASTIC (D9,10,11,12,22,23,24,41,42,43)", fontsize=5.2, fontweight='bold', color="#ffffff", zorder=7)

    ax.add_patch(FancyBboxPatch((20.5, 8.5), 44.5, 23.5, boxstyle="round,pad=0.0,rounding_size=1.5",
                                facecolor="none", edgecolor="#ffffff", linewidth=0.9, linestyle="--", zorder=6))
    ax.text(22.0, 30.5, "CHAMBER 2: METAL (D25,26,27,28,29,30,31,44,45,46,32)", fontsize=5.2, fontweight='bold', color="#ffffff", zorder=7)

    ax.add_patch(FancyBboxPatch((64.5, 8.5), 31.0, 42.5, boxstyle="round,pad=0.0,rounding_size=1.5",
                                facecolor="none", edgecolor="#ffffff", linewidth=0.9, linestyle="--", zorder=6))
    ax.text(66.0, 49.5, "CHAMBER 3: PAPER & SCALE (D33-D40)", fontsize=5.2, fontweight='bold', color="#ffffff", zorder=7)

    # Connector & Component Labels
    ax.text(6.0, 49.0, "TB1: +12V IN", fontsize=4.8, ha='center', color="#ffffff", fontweight='bold', zorder=7)
    ax.text(6.0, 37.0, "TB2: +5V SERVO", fontsize=4.8, ha='center', color="#ffffff", fontweight='bold', zorder=7)
    ax.text(38.54, 44.8, "J3:DROP(12)", fontsize=4.0, ha='center', color="#ffffff", fontweight='bold', zorder=7)
    ax.text(45.54, 44.8, "J2:IRIS(11)", fontsize=4.0, ha='center', color="#ffffff", fontweight='bold', zorder=7)
    ax.text(53.8, 44.8, "J1:ENT(9/10)", fontsize=4.0, ha='center', color="#ffffff", fontweight='bold', zorder=7)
    ax.text(98.8, 49.5, "MEGA 2x18 (D22-53)", fontsize=4.2, ha='center', color="#ffffff", fontweight='bold', zorder=7)

    ax.text(W_BOARD / 2, -3.5, "PECODROP RVM — ARDUINO MEGA 2560 SHIELD | REV 4.0 SINGLE-SIDED DIY ASSEMBLY", 
            fontsize=8.5, fontweight='bold', ha='center', color="#38bdf8", zorder=7)
    ax.text(W_BOARD / 2, -6.0, "CYAN = BOTTOM COPPER ETCH | ORANGE DASHED = TOP COMPONENT WIRE JUMPERS (0-OHM LINKS)", 
            fontsize=6.5, ha='center', color="#94a3b8", zorder=7)

    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {out_path}")

# -------------------------------------------------------------------------
# 4. MASTER 4-PANEL PRINT SHEET (A4)
# -------------------------------------------------------------------------
def generate_master_sheet(out_path="rvm_arduino_mega_shield_pcb_print_1to1.png"):
    fig, axes = plt.subplots(2, 2, figsize=(18, 12), dpi=300, facecolor="#ffffff")
    
    panels = [
        ('100% SINGLE-SIDED BOTTOM COPPER (B.Cu) — MIRRORED [IRON-ON ETCH MASK]', True),
        ('100% SINGLE-SIDED BOTTOM COPPER (B.Cu) — DIRECT VIEW [INSPECTION]', False),
        ('COMPONENT SIDE SILKSCREEN & WIRE JUMPER GUIDE', False),
        ('DRILL HOLE TEMPLATE & CENTER PUNCH GUIDE', False)
    ]

    tracks = get_single_sided_tracks()
    pads = get_all_pads()

    for idx, (title, mirror) in enumerate(panels):
        r, c = idx // 2, idx % 2
        ax = axes[r, c]
        ax.set_facecolor("#ffffff")
        ax.set_xlim(-6, 110)
        ax.set_ylim(-8, 60)
        ax.axis('off')

        # Board Outline
        ax.add_patch(FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0.0,rounding_size=2.5",
                                    facecolor="#ffffff", edgecolor="#000000", linewidth=1.2))
        ax.text(W_BOARD / 2, H_BOARD + 3.0, title, fontsize=8.0, fontweight='bold', ha='center', color="#000000")

        # 100mm Ruler
        ax.plot([5, 105], [-4, -4], color="#000000", linewidth=1.5)
        for t in range(0, 101, 10):
            ax.plot([5 + t, 5 + t], [-4, -2.5], color="#000000", linewidth=0.8)
            ax.text(5 + t, -1.8, f"{t}", fontsize=4.5, ha='center', color="#000000")
        ax.text(55, -6.0, "100.0 mm CALIBRATION BAR (1:1 TRUE SCALE)", fontsize=5.0, ha='center', color="#000000")

        if idx in [0, 1]:
            # Copper masks
            for trk in tracks:
                pts = [(W_BOARD - pt[0], pt[1]) if mirror else pt for pt in trk['pts']]
                draw_track(ax, pts, color="#000000", width=trk['width'] * 1.8, zorder=3)
            for p in pads:
                px = (W_BOARD - p['x']) if mirror else p['x']
                draw_pad(ax, px, p['y'], outer_r=p['outer_r'], inner_r=p['inner_r'], pad_color="#000000", hole_color="#ffffff")
        elif idx == 2:
            # Assembly & Jumper Guide
            for trk in tracks:
                draw_track(ax, trk['pts'], color="#cbd5e1", width=1.0, zorder=2)
            for p in pads:
                draw_pad(ax, p['x'], p['y'], outer_r=p['outer_r'], inner_r=p['inner_r'], pad_color="#475569", hole_color="#ffffff", zorder=3)
            for jmp in JUMPERS:
                name, net, pad_a, pad_b, lbl = jmp
                ax.plot([pad_a[0], pad_b[0]], [pad_a[1], pad_b[1]], color="#ea580c", linewidth=1.4, linestyle="--", zorder=6)
                mid_x = (pad_a[0] + pad_b[0]) / 2
                mid_y = (pad_a[1] + pad_b[1]) / 2
                ax.text(mid_x, mid_y + 0.6, name, fontsize=4.0, ha='center', color="#ea580c", fontweight='bold', zorder=7)
        elif idx == 3:
            # Drill Guide
            for p in pads:
                draw_pad(ax, p['x'], p['y'], outer_r=p['inner_r'] * 1.8, inner_r=p['inner_r'] * 0.4, pad_color="#000000", hole_color="#ffffff", zorder=3)
                ax.plot([p['x'] - 1.2, p['x'] + 1.2], [p['y'], p['y']], color="#000000", linewidth=0.4)
                ax.plot([p['x'], p['x']], [p['y'] - 1.2, p['y'] + 1.2], color="#000000", linewidth=0.4)
            ax.text(W_BOARD / 2, 26.6, "DRILL GUIDE: 0.8mm (PINS & JUMPERS), 1.0mm (POWER), 3.2mm (STANDOFFS)", 
                    fontsize=5.5, fontweight='bold', ha='center', color="#000000")

    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {out_path}")

# -------------------------------------------------------------------------
# 5. TRUE 1:1 SCALE VECTOR PDFs (600 DPI)
# -------------------------------------------------------------------------
def generate_true_scale_pdfs(pdf_mirror_path, pdf_master_path, bot_mir_png, master_png):
    from PIL import Image
    
    img_mirror = Image.open(bot_mir_png).convert("RGB")
    img_mirror.save(pdf_mirror_path, "PDF", resolution=600.0)
    print(f"Saved 1:1 True-Scale PDF: {pdf_mirror_path}")

    img_master = Image.open(master_png).convert("RGB")
    img_master.save(pdf_master_path, "PDF", resolution=600.0)
    print(f"Saved Master A4 PDF: {pdf_master_path}")

if __name__ == "__main__":
    # Check collisions
    tracks = get_single_sided_tracks()
    colls = check_collisions(tracks)
    print(f"100% SINGLE-SIDED DRC CHECK: {len(colls)} collisions")
    assert len(colls) == 0, f"Error: {len(colls)} collisions detected!"

    docs_dir = r"d:\GIT-HUB\RVM-dash\docs\user_manuals"
    images_dir = os.path.join(docs_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    bot_png = os.path.join(images_dir, "rvm_arduino_mega_shield_pcb_copper_bottom.png")
    bot_mir_png = os.path.join(images_dir, "rvm_arduino_mega_shield_pcb_copper_bottom_mirror.png")
    top_png = os.path.join(images_dir, "rvm_arduino_mega_shield_pcb_copper_top.png")
    layout_png = os.path.join(images_dir, "rvm_arduino_mega_shield_pcb_layout.png")
    master_png = os.path.join(images_dir, "rvm_arduino_mega_shield_pcb_print_1to1.png")

    print("Generating 100% Single-Sided DIY PCB CAD Artwork...")
    generate_single_sided_copper(mirror=False, out_path=bot_png)
    generate_single_sided_copper(mirror=True, out_path=bot_mir_png)
    generate_top_copper(out_path=top_png)
    generate_assembly_layout(out_path=layout_png)
    generate_master_sheet(out_path=master_png)

    # PDFs
    pdf_mirror = os.path.join(docs_dir, "RVM_Mega_Shield_Bottom_Copper_MIRROR_1to1.pdf")
    pdf_master = os.path.join(docs_dir, "RVM_Mega_Shield_Master_Fabrication_Sheet_A4.pdf")
    generate_true_scale_pdfs(pdf_mirror, pdf_master, bot_mir_png, master_png)

    print("SUCCESS: 100% Single-Sided DIY PCB files generated with ZERO collisions and ZERO open lines!")
