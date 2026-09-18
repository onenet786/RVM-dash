import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Polygon, PathPatch
from matplotlib.path import Path
import numpy as np

OUTPUT_DIR = r"D:\GIT-HUB\RVM-dash\docs\user_manuals\images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Executive Theme Palette
BG_DARK = "#070b14"
SURFACE_DARK = "#0f172a"
SURFACE_CARD = "#131d35"
BORDER_COLOR = "#1e293b"
CYAN = "#00d2ff"
AMBER = "#f59e0b"
EMERALD = "#10b981"
ROSE = "#f43f5e"
PURPLE = "#a855f7"
BLUE = "#3b82f6"
TEXT_MAIN = "#f8fafc"
TEXT_MUTED = "#94a3b8"
TEXT_CYAN = "#38bdf8"
COPPER_ORANGE = "#d97706"
SILKSCREEN_WHITE = "#ffffff"
PCB_FR4_GREEN = "#072413"
PCB_MASK_BLUE = "#0a2540"

# Helper: Draw routed track with 45-degree chamfers
def draw_track(ax, points, color='black', width=1.5, alpha=1.0, zorder=3):
    xs, ys = zip(*points)
    ax.plot(xs, ys, color=color, linewidth=width, solid_capstyle='round', 
            solid_joinstyle='round', alpha=alpha, zorder=zorder)

# Helper: Draw annular solder pad with drill center
def draw_pad(ax, x, y, outer_r=1.2, inner_r=0.45, pad_color='black', hole_color='white', zorder=4):
    ax.add_patch(Circle((x, y), outer_r, facecolor=pad_color, edgecolor=pad_color, linewidth=0.1, zorder=zorder))
    if inner_r > 0:
        ax.add_patch(Circle((x, y), inner_r, facecolor=hole_color, edgecolor=hole_color, linewidth=0.1, zorder=zorder+1))

# Helper: Draw SMD rectangular pad
def draw_smd_pad(ax, x, y, w, h, pad_color='black', zorder=4):
    ax.add_patch(Rectangle((x - w/2, y - h/2), w, h, facecolor=pad_color, edgecolor=pad_color, zorder=zorder))

# Definition of All Board Copper Tracks
def get_board_tracks():
    # Tracks are list of dicts: {'pts': [...], 'width': float, 'layer': 'top'/'bot'/'both', 'net': str}
    tracks = []

    # 1. HEAVY 5V_SERVO RAIL (100-mil / 2.5mm width on Bottom Copper)
    tracks.append({
        'pts': [(4.8, 31.8), (4.8, 22.0), (7.2, 19.5), (7.2, 12.0), (7.2, 4.5)],
        'width': 2.8, 'layer': 'bot', 'net': '5V_SERVO_FEED'
    })
    tracks.append({
        'pts': [(4.8, 31.8), (12.0, 31.8), (14.0, 33.8), (21.04, 33.8), (21.04, 34.5)],
        'width': 2.4, 'layer': 'bot', 'net': '5V_SERVO_P_IRIS'
    })
    tracks.append({
        'pts': [(21.04, 33.8), (32.04, 33.8), (32.04, 34.5)],
        'width': 2.4, 'layer': 'bot', 'net': '5V_SERVO_P_DROP'
    })
    tracks.append({
        'pts': [(32.04, 33.8), (42.0, 33.8), (44.0, 31.8), (44.0, 18.5), (47.54, 18.5), (47.54, 17.0)],
        'width': 2.4, 'layer': 'bot', 'net': '5V_SERVO_M_IRIS'
    })
    tracks.append({
        'pts': [(47.54, 18.5), (59.04, 18.5), (59.04, 17.0)],
        'width': 2.4, 'layer': 'bot', 'net': '5V_SERVO_M_DROP'
    })
    tracks.append({
        'pts': [(44.0, 31.8), (70.0, 31.8), (74.54, 31.8), (74.54, 32.0)],
        'width': 2.4, 'layer': 'bot', 'net': '5V_SERVO_PP_IRIS'
    })
    tracks.append({
        'pts': [(74.54, 31.8), (85.54, 31.8), (85.54, 32.0)],
        'width': 2.4, 'layer': 'bot', 'net': '5V_SERVO_PP_DROP'
    })

    # 2. POWER GROUND PGND RAIL (100-mil / 2.5mm width on Top & Bottom)
    tracks.append({
        'pts': [(9.6, 31.8), (11.5, 31.8), (11.5, 20.5), (7.2, 16.2), (4.3, 16.2)],
        'width': 2.4, 'layer': 'top', 'net': 'PGND_TVS'
    })
    tracks.append({
        'pts': [(9.6, 31.8), (16.0, 31.8), (18.5, 34.3), (18.5, 34.5)],
        'width': 2.0, 'layer': 'bot', 'net': 'PGND_P_IRIS'
    })
    tracks.append({
        'pts': [(18.5, 34.3), (27.0, 34.3), (29.5, 34.3), (29.5, 34.5)],
        'width': 2.0, 'layer': 'bot', 'net': 'PGND_P_DROP'
    })
    tracks.append({
        'pts': [(29.5, 34.3), (40.0, 34.3), (45.0, 19.5), (45.0, 17.0)],
        'width': 2.0, 'layer': 'bot', 'net': 'PGND_M_IRIS'
    })
    tracks.append({
        'pts': [(45.0, 19.5), (56.5, 19.5), (56.5, 17.0)],
        'width': 2.0, 'layer': 'bot', 'net': 'PGND_M_DROP'
    })
    tracks.append({
        'pts': [(40.0, 34.3), (72.0, 34.3), (72.0, 32.0)],
        'width': 2.0, 'layer': 'bot', 'net': 'PGND_PP_IRIS'
    })
    tracks.append({
        'pts': [(72.0, 34.3), (83.0, 34.3), (83.0, 32.0)],
        'width': 2.0, 'layer': 'bot', 'net': 'PGND_PP_DROP'
    })

    # 3. 12V MAIN & INDUCTIVE POWER
    tracks.append({
        'pts': [(4.8, 44.2), (15.0, 44.2), (18.5, 40.7), (18.5, 24.2)],
        'width': 1.6, 'layer': 'top', 'net': '12V_TO_TB_IND'
    })
    tracks.append({
        'pts': [(18.5, 24.2), (24.0, 24.2), (24.0, 26.5), (28.0, 26.5), (28.0, 25.5)],
        'width': 1.2, 'layer': 'top', 'net': '12V_TO_R1_U1'
    })
    tracks.append({
        'pts': [(9.6, 44.2), (14.0, 44.2), (24.1, 34.1), (24.1, 24.2)],
        'width': 1.4, 'layer': 'bot', 'net': '12V_GND_TO_TB_IND'
    })
    tracks.append({
        'pts': [(21.3, 24.2), (21.3, 22.0), (28.0, 22.0)],
        'width': 1.0, 'layer': 'top', 'net': 'IND_SIG_TO_OPTO'
    })

    # Optocoupler Isolated Output to Mega Pin 32
    tracks.append({
        'pts': [(33.5, 25.5), (38.0, 25.5), (42.0, 29.5), (92.0, 29.5), (95.5, 26.0), (100.04, 25.8)],
        'width': 0.8, 'layer': 'bot', 'net': 'CAN_INDUCTIVE_PIN32'
    })

    # 4. 5V_LOGIC BUS (Clean 1.2mm / 48-mil rail)
    tracks.append({
        'pts': [(42.66, 2.4), (42.66, 6.0), (38.0, 6.0), (38.0, 8.0)],
        'width': 1.4, 'layer': 'top', 'net': 'MEGA_5V_TO_FB1'
    })
    tracks.append({
        'pts': [(38.0, 8.0), (32.0, 8.0), (26.0, 8.0), (20.0, 14.0), (17.7, 14.0), (17.7, 42.1)],
        'width': 1.2, 'layer': 'top', 'net': '5V_LOGIC_CH1_BUS'
    })
    tracks.append({
        'pts': [(17.7, 42.1), (23.7, 42.1), (29.7, 42.1), (35.7, 42.1)],
        'width': 1.0, 'layer': 'top', 'net': '5V_LOGIC_US_CH1'
    })
    tracks.append({
        'pts': [(38.0, 6.0), (44.7, 6.0), (44.7, 25.1), (50.7, 25.1), (56.7, 25.1), (62.7, 25.1)],
        'width': 1.0, 'layer': 'top', 'net': '5V_LOGIC_US_CH2'
    })
    tracks.append({
        'pts': [(44.7, 6.0), (73.0, 6.0), (73.0, 40.2), (84.0, 40.2)],
        'width': 1.0, 'layer': 'top', 'net': '5V_LOGIC_US_CH3'
    })
    tracks.append({
        'pts': [(73.0, 6.0), (75.0, 8.0), (75.0, 20.1)],
        'width': 1.0, 'layer': 'top', 'net': '5V_LOGIC_HX711'
    })

    # 5. SIGNAL TRACES WITH 45-DEGREE ANGLE ROUTING (16-mil / 0.45mm width)
    # Chamber 1 (Plastic) PWM & Ultrasonic
    tracks.append({
        'pts': [(18.7, 42.1), (18.7, 46.5), (23.2, 51.0), (45.0, 51.0), (45.0, 50.0), (46.04, 51.1)],
        'width': 0.6, 'layer': 'bot', 'net': 'P_ENTR_TRIG_D9'
    })
    tracks.append({
        'pts': [(19.7, 42.1), (19.7, 45.5), (24.2, 50.0), (47.5, 50.0), (48.58, 51.1)],
        'width': 0.6, 'layer': 'top', 'net': 'P_ENTR_ECHO_D10'
    })
    tracks.append({
        'pts': [(23.58, 34.5), (23.58, 37.0), (32.0, 45.4), (50.0, 45.4), (51.12, 51.1)],
        'width': 0.6, 'layer': 'bot', 'net': 'P_IRIS_PWM_D11'
    })
    tracks.append({
        'pts': [(34.58, 34.5), (34.58, 36.5), (42.0, 43.9), (52.5, 43.9), (53.66, 51.1)],
        'width': 0.6, 'layer': 'top', 'net': 'P_DROP_PWM_D12'
    })
    # Sizing Ultrasonics to 2x18 Header (Right Edge)
    tracks.append({
        'pts': [(24.7, 42.1), (24.7, 44.0), (28.0, 47.3), (92.0, 47.3), (96.5, 42.8), (100.04, 15.0)],
        'width': 0.55, 'layer': 'bot', 'net': 'P_BOT_TRIG_22'
    })
    tracks.append({
        'pts': [(25.7, 42.1), (25.7, 43.0), (29.0, 46.3), (91.0, 46.3), (95.5, 41.8), (97.5, 15.0)],
        'width': 0.55, 'layer': 'top', 'net': 'P_BOT_ECHO_23'
    })
    tracks.append({
        'pts': [(30.7, 42.1), (30.7, 43.5), (33.5, 46.3), (90.0, 46.3), (95.0, 41.3), (100.04, 16.8)],
        'width': 0.55, 'layer': 'bot', 'net': 'P_MID_TRIG_24'
    })
    tracks.append({
        'pts': [(31.7, 42.1), (31.7, 42.5), (34.5, 45.3), (89.0, 45.3), (94.0, 40.3), (97.5, 31.2)],
        'width': 0.55, 'layer': 'top', 'net': 'P_MID_ECHO_41'
    })
    tracks.append({
        'pts': [(36.7, 42.1), (36.7, 43.0), (39.5, 45.8), (88.0, 45.8), (93.0, 40.8), (100.04, 33.0)],
        'width': 0.55, 'layer': 'bot', 'net': 'P_TOP_TRIG_42'
    })
    tracks.append({
        'pts': [(37.7, 42.1), (37.7, 42.0), (40.5, 44.8), (87.0, 44.8), (92.0, 39.8), (97.5, 33.0)],
        'width': 0.55, 'layer': 'top', 'net': 'P_TOP_ECHO_43'
    })

    # Chamber 2 (Metal) Signals
    tracks.append({
        'pts': [(45.7, 25.1), (45.7, 22.0), (49.0, 18.7), (92.0, 18.7), (97.5, 18.6)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_ENTR_TRIG_25'
    })
    tracks.append({
        'pts': [(46.7, 25.1), (46.7, 21.0), (50.0, 17.7), (91.0, 17.7), (100.04, 18.6)],
        'width': 0.55, 'layer': 'top', 'net': 'M_ENTR_ECHO_26'
    })
    tracks.append({
        'pts': [(50.08, 17.0), (50.08, 14.5), (55.0, 9.58), (91.5, 9.58), (97.5, 20.4)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_IRIS_PWM_27'
    })
    tracks.append({
        'pts': [(61.58, 17.0), (61.58, 13.5), (65.0, 10.08), (92.5, 10.08), (100.04, 20.4)],
        'width': 0.55, 'layer': 'top', 'net': 'M_DROP_PWM_28'
    })
    tracks.append({
        'pts': [(51.7, 25.1), (51.7, 22.5), (54.0, 20.2), (93.0, 20.2), (97.5, 22.2)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_BOT_TRIG_29'
    })
    tracks.append({
        'pts': [(52.7, 25.1), (52.7, 21.5), (55.0, 19.2), (94.0, 19.2), (100.04, 22.2)],
        'width': 0.55, 'layer': 'top', 'net': 'M_BOT_ECHO_30'
    })
    tracks.append({
        'pts': [(57.7, 25.1), (57.7, 23.0), (60.0, 20.7), (93.5, 20.7), (97.5, 24.0)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_MID_TRIG_31'
    })
    tracks.append({
        'pts': [(58.7, 25.1), (58.7, 22.0), (61.0, 19.7), (85.0, 19.7), (90.0, 24.7), (100.04, 34.8)],
        'width': 0.55, 'layer': 'top', 'net': 'M_MID_ECHO_44'
    })
    tracks.append({
        'pts': [(63.7, 25.1), (63.7, 23.5), (66.0, 21.2), (86.0, 21.2), (91.0, 26.2), (97.5, 36.6)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_TOP_TRIG_45'
    })
    tracks.append({
        'pts': [(64.7, 25.1), (64.7, 22.5), (67.0, 20.2), (87.0, 20.2), (92.0, 25.2), (100.04, 36.6)],
        'width': 0.55, 'layer': 'top', 'net': 'M_TOP_ECHO_46'
    })

    # Chamber 3 (Paper) Signals & Load Cell
    tracks.append({
        'pts': [(74.4, 40.2), (74.4, 37.0), (77.0, 34.4), (91.0, 34.4), (95.0, 30.4), (97.5, 27.6)],
        'width': 0.55, 'layer': 'bot', 'net': 'PP_TOP_TRIG_33'
    })
    tracks.append({
        'pts': [(75.8, 40.2), (75.8, 36.0), (78.0, 33.8), (92.0, 33.8), (96.0, 29.8), (100.04, 27.6)],
        'width': 0.55, 'layer': 'top', 'net': 'PP_TOP_ECHO_34'
    })
    tracks.append({
        'pts': [(77.08, 32.0), (77.08, 29.5), (80.0, 26.58), (93.0, 26.58), (97.5, 29.4)],
        'width': 0.55, 'layer': 'bot', 'net': 'PP_IRIS_PWM_35'
    })
    tracks.append({
        'pts': [(88.08, 32.0), (88.08, 28.5), (91.0, 25.58), (94.0, 25.58), (100.04, 29.4)],
        'width': 0.55, 'layer': 'top', 'net': 'PP_DROP_PWM_36'
    })
    tracks.append({
        'pts': [(85.4, 40.2), (85.4, 38.0), (88.0, 35.4), (93.0, 35.4), (97.5, 33.0)],
        'width': 0.55, 'layer': 'bot', 'net': 'PP_BOT_TRIG_39'
    })
    tracks.append({
        'pts': [(86.8, 40.2), (86.8, 37.0), (89.0, 34.8), (94.0, 34.8), (100.04, 33.0)],
        'width': 0.55, 'layer': 'top', 'net': 'PP_BOT_ECHO_40'
    })
    tracks.append({
        'pts': [(79.5, 20.1), (79.5, 17.5), (82.0, 15.0), (94.5, 15.0), (97.5, 31.2)],
        'width': 0.55, 'layer': 'bot', 'net': 'HX711_DOUT_37'
    })
    tracks.append({
        'pts': [(84.0, 20.1), (84.0, 16.5), (86.5, 14.0), (95.5, 14.0), (100.04, 31.2)],
        'width': 0.55, 'layer': 'top', 'net': 'HX711_SCK_38'
    })

    return tracks

# Helper: Render all component pads
def render_all_pads(ax, pad_color='black', hole_color='white', zorder=4):
    # Arduino Mega Top Digital Headers
    for p in range(10):
        px = 43.5 + p * 2.54
        draw_pad(ax, px, 51.1, outer_r=1.0, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)
    for p in range(8):
        px = 72.5 + p * 2.54
        draw_pad(ax, px, 51.1, outer_r=1.0, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Bottom Headers (Power & Analogs)
    for bx in [32.5, 55.5, 78.5]:
        for p in range(8):
            px = bx + p * 2.54
            draw_pad(ax, px, 2.4, outer_r=1.0, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # 2x18 Dual Row Header (Pins 22-53)
    for r in range(18):
        ry = 15.0 + r * 1.8
        draw_pad(ax, 97.5, ry, outer_r=0.85, inner_r=0.38, pad_color=pad_color, hole_color=hole_color, zorder=zorder)
        draw_pad(ax, 100.04, ry, outer_r=0.85, inner_r=0.38, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # High Current Screw Terminals
    draw_pad(ax, 4.8, 44.2, outer_r=2.1, inner_r=0.75, pad_color=pad_color, hole_color=hole_color, zorder=zorder)
    draw_pad(ax, 9.6, 44.2, outer_r=2.1, inner_r=0.75, pad_color=pad_color, hole_color=hole_color, zorder=zorder)
    draw_pad(ax, 4.8, 31.8, outer_r=2.1, inner_r=0.75, pad_color=pad_color, hole_color=hole_color, zorder=zorder)
    draw_pad(ax, 9.6, 31.8, outer_r=2.1, inner_r=0.75, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Bulk Capacitors (C1, C2, C3)
    for cy in [19.5, 12.0, 4.5]:
        draw_pad(ax, 7.2, cy + 1.2, outer_r=1.2, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)
        draw_pad(ax, 7.2, cy - 1.2, outer_r=1.2, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Chamber 1 JST-XH Connectors (Pins: VCC, TRIG, ECHO, GND)
    for i in range(4):
        jx = 17.7 + i * 6.0
        for p in range(4):
            draw_pad(ax, jx + p * 1.0, 42.1, outer_r=0.75, inner_r=0.35, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Chamber 1 Servos (Pins: GND, +5V, SIG)
    for sx in [18.5, 29.5]:
        for p in range(3):
            draw_pad(ax, sx + p * 2.54, 34.5, outer_r=0.95, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Chamber 2 JST-XH Connectors
    for i in range(4):
        jx = 44.7 + i * 6.0
        for p in range(4):
            draw_pad(ax, jx + p * 1.0, 25.1, outer_r=0.75, inner_r=0.35, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Chamber 2 Servos
    for sx in [45.0, 56.5]:
        for p in range(3):
            draw_pad(ax, sx + p * 2.54, 17.0, outer_r=0.95, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # TB3 Inductive Sensor Terminal (3-Pin 5.08mm)
    for p in range(3):
        draw_pad(ax, 18.5 + p * 2.8, 24.2, outer_r=1.3, inner_r=0.55, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # U1 Optocoupler PC817 (DIP-4)
    for p in range(4):
        py = 22.0 if p in [1, 2] else 25.5
        px = 28.0 if p in [0, 1] else 33.5
        draw_pad(ax, px, py, outer_r=0.9, inner_r=0.4, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Chamber 3 JST-XH Connectors
    for jx in [73.0, 84.0]:
        for p in range(4):
            draw_pad(ax, jx + p * 1.4, 40.2, outer_r=0.8, inner_r=0.35, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # Chamber 3 Servos
    for sx in [72.0, 83.0]:
        for p in range(3):
            draw_pad(ax, sx + p * 2.54, 32.0, outer_r=0.95, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # HX711 Carrier Header (1x4)
    for p in range(4):
        draw_pad(ax, 75.0 + p * 4.5, 20.1, outer_r=1.1, inner_r=0.45, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

    # M3 Chassis Standoff Holes (5x)
    for hx, hy in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        draw_pad(ax, hx, hy, outer_r=3.2, inner_r=1.6, pad_color=pad_color, hole_color=hole_color, zorder=zorder)

# ----------------------------------------------------------------------
# 1. GENERATE DEDICATED BOTTOM COPPER ETCHING MASK (B.Cu)
# ----------------------------------------------------------------------
def generate_shield_pcb_copper_bottom(mirror=False):
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
            ax.text(5 + t, -3.2, f"{t}", fontsize=5, ha='center', color="#000000")
    ax.text(55, -8.0, "100.0 mm TRUE SCALE CALIBRATION RULER (VERIFY WITH VERNIER CALIPERS BEFORE ETCHING)", 
            fontsize=6, fontweight='bold', ha='center', color="#000000")

    # Board Outline (101.60 x 53.34 mm)
    w_board, h_board = 101.60, 53.34
    ax.add_patch(FancyBboxPatch((0, 0), w_board, h_board, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.2))

    # Title Ribbon
    ax.text(w_board / 2, h_board + 6.0, "PECODROP RVM — ARDUINO MEGA 2560 EXPANSION SHIELD", 
            fontsize=11, fontweight='bold', ha='center', color="#000000")
    sub_title = "BOTTOM COPPER LAYER (B.Cu) — [MIRRORED FOR TONER TRANSFER IRON-ON ETCHING] (1:1 SCALE)" if mirror else "BOTTOM COPPER LAYER (B.Cu) — CHEMICAL ETCHING & COPPER TRACK MASK (1:1 SCALE)"
    ax.text(w_board / 2, h_board + 3.0, sub_title, fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # Draw all Bottom Copper Tracks in Solid Pure Black
    all_tracks = get_board_tracks()
    for trk in all_tracks:
        if trk['layer'] in ['bot', 'both']:
            pts = [(w_board - pt[0], pt[1]) if mirror else pt for pt in trk['pts']]
            draw_track(ax, pts, color="#000000", width=trk['width'] * 1.8, zorder=3)

    # Draw All Solder Pads in Solid Black with White Drill Centers
    def mirror_pad(x, y):
        return (w_board - x, y) if mirror else (x, y)

    # Mega Headers
    for p in range(10):
        px, py = mirror_pad(43.5 + p * 2.54, 51.1)
        draw_pad(ax, px, py, outer_r=1.0, inner_r=0.45)
    for p in range(8):
        px, py = mirror_pad(72.5 + p * 2.54, 51.1)
        draw_pad(ax, px, py, outer_r=1.0, inner_r=0.45)
    for bx in [32.5, 55.5, 78.5]:
        for p in range(8):
            px, py = mirror_pad(bx + p * 2.54, 2.4)
            draw_pad(ax, px, py, outer_r=1.0, inner_r=0.45)
    for r in range(18):
        ry = 15.0 + r * 1.8
        p1x, p1y = mirror_pad(97.5, ry)
        p2x, p2y = mirror_pad(100.04, ry)
        draw_pad(ax, p1x, p1y, outer_r=0.85, inner_r=0.38)
        draw_pad(ax, p2x, p2y, outer_r=0.85, inner_r=0.38)
    p_t1x, p_t1y = mirror_pad(4.8, 44.2)
    p_t2x, p_t2y = mirror_pad(9.6, 44.2)
    draw_pad(ax, p_t1x, p_t1y, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p_t2x, p_t2y, outer_r=2.1, inner_r=0.75)
    p_s1x, p_s1y = mirror_pad(4.8, 31.8)
    p_s2x, p_s2y = mirror_pad(9.6, 31.8)
    draw_pad(ax, p_s1x, p_s1y, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p_s2x, p_s2y, outer_r=2.1, inner_r=0.75)
    for cy in [19.5, 12.0, 4.5]:
        c1x, c1y = mirror_pad(7.2, cy + 1.2)
        c2x, c2y = mirror_pad(7.2, cy - 1.2)
        draw_pad(ax, c1x, c1y, outer_r=1.2, inner_r=0.45)
        draw_pad(ax, c2x, c2y, outer_r=1.2, inner_r=0.45)
    for i in range(4):
        jx = 17.7 + i * 6.0
        for p in range(4):
            px, py = mirror_pad(jx + p * 1.0, 42.1)
            draw_pad(ax, px, py, outer_r=0.75, inner_r=0.35)
    for sx in [18.5, 29.5]:
        for p in range(3):
            px, py = mirror_pad(sx + p * 2.54, 34.5)
            draw_pad(ax, px, py, outer_r=0.95, inner_r=0.45)
    for i in range(4):
        jx = 44.7 + i * 6.0
        for p in range(4):
            px, py = mirror_pad(jx + p * 1.0, 25.1)
            draw_pad(ax, px, py, outer_r=0.75, inner_r=0.35)
    for sx in [45.0, 56.5]:
        for p in range(3):
            px, py = mirror_pad(sx + p * 2.54, 17.0)
            draw_pad(ax, px, py, outer_r=0.95, inner_r=0.45)
    for p in range(3):
        px, py = mirror_pad(18.5 + p * 2.8, 24.2)
        draw_pad(ax, px, py, outer_r=1.3, inner_r=0.55)
    for p in range(4):
        py = 22.0 if p in [1, 2] else 25.5
        px = 28.0 if p in [0, 1] else 33.5
        mpx, mpy = mirror_pad(px, py)
        draw_pad(ax, mpx, mpy, outer_r=0.9, inner_r=0.4)
    for jx in [73.0, 84.0]:
        for p in range(4):
            px, py = mirror_pad(jx + p * 1.4, 40.2)
            draw_pad(ax, px, py, outer_r=0.8, inner_r=0.35)
    for sx in [72.0, 83.0]:
        for p in range(3):
            px, py = mirror_pad(sx + p * 2.54, 32.0)
            draw_pad(ax, px, py, outer_r=0.95, inner_r=0.45)
    for p in range(4):
        px, py = mirror_pad(75.0 + p * 4.5, 20.1)
        draw_pad(ax, px, py, outer_r=1.1, inner_r=0.45)
    for hx, hy in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        mx, my = mirror_pad(hx, hy)
        draw_pad(ax, mx, my, outer_r=3.2, inner_r=1.6)

    lbl = "REV 2.1 - B.Cu [MIRRORED FOR TONER TRANSFER]" if mirror else "REV 2.1 - B.Cu [BOTTOM COPPER DIRECT VIEW]"
    ax.text(w_board / 2, 28.0, lbl, fontsize=7, fontweight='bold', color="#000000", ha='center', va='center')

    plt.tight_layout()
    fname = "rvm_arduino_mega_shield_pcb_copper_bottom_mirror.png" if mirror else "rvm_arduino_mega_shield_pcb_copper_bottom.png"
    out_path = os.path.join(OUTPUT_DIR, fname)
    plt.savefig(out_path, facecolor="#ffffff", edgecolor='none', dpi=300)
    plt.close()
    print("Saved Bottom Copper Mask (" + ("Mirrored" if mirror else "Direct") + "):", out_path)

# ----------------------------------------------------------------------
# 2. GENERATE DEDICATED TOP COPPER LAYER (F.Cu)
# ----------------------------------------------------------------------
def generate_shield_pcb_copper_top():
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
            ax.text(5 + t, -3.2, f"{t}", fontsize=5, ha='center', color="#000000")
    ax.text(55, -8.0, "100.0 mm TRUE SCALE CALIBRATION RULER (MEASURE WITH CALIPERS)", 
            fontsize=6, fontweight='bold', ha='center', color="#000000")

    # Board Outline
    w_board, h_board = 101.60, 53.34
    ax.add_patch(FancyBboxPatch((0, 0), w_board, h_board, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.2))

    # Title Ribbon
    ax.text(w_board / 2, h_board + 6.0, "PECODROP RVM — ARDUINO MEGA 2560 EXPANSION SHIELD", 
            fontsize=11, fontweight='bold', ha='center', color="#000000")
    ax.text(w_board / 2, h_board + 3.0, "TOP COPPER LAYER (F.Cu) — COMPONENT SIDE TRACK ROUTING (1:1 SCALE)", 
            fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # Draw all Top Copper Tracks
    all_tracks = get_board_tracks()
    for trk in all_tracks:
        if trk['layer'] in ['top', 'both']:
            draw_track(ax, trk['pts'], color="#000000", width=trk['width'] * 1.8, zorder=3)

    # Draw All Solder Pads
    render_all_pads(ax, pad_color="#000000", hole_color="#ffffff", zorder=4)

    ax.text(50.0, 28.0, "REV 2.1 - F.Cu TOP COPPER TRACKS", fontsize=7, 
            fontweight='bold', color="#000000", ha='center', va='center')

    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "rvm_arduino_mega_shield_pcb_copper_top.png")
    plt.savefig(out_path, facecolor="#ffffff", edgecolor='none', dpi=300)
    plt.close()
    print("Saved Top Copper Mask:", out_path)

# ----------------------------------------------------------------------
# 3. GENERATE COMPLETE 1:1 SCALE MULTI-PANEL FABRICATION FILM & DRILL SHEET
# ----------------------------------------------------------------------
def generate_pcb_print_sheet():
    # Large A4 Landscape Sheet containing:
    # PANEL 1 (Top Left): Bottom Copper Etching Mask (B.Cu - Solid Black Tracks)
    # PANEL 2 (Top Right): Top Copper Tracks (F.Cu)
    # PANEL 3 (Bottom Left): Component Placement & Silkscreen
    # PANEL 4 (Bottom Right): Drill Chart & Calibration Ruler
    fig, ax = plt.subplots(figsize=(24, 16), dpi=250, facecolor="#ffffff")
    ax.set_facecolor("#ffffff")
    ax.set_xlim(-5, 235)
    ax.set_ylim(-5, 155)
    ax.axis('off')

    # Master Border
    ax.plot([0, 230, 230, 0, 0], [0, 0, 150, 150, 0], color="#000000", linewidth=1.5)
    ax.plot([1, 229, 229, 1, 1], [1, 1, 149, 149, 1], color="#000000", linewidth=0.5)

    # Master Title Block (Top Center)
    ax.text(115, 144, "PECODROP RVM — ARDUINO MEGA 2560 MEZZANINE EXPANSION SHIELD", fontsize=15, fontweight='bold', ha='center', color="#000000")
    ax.text(115, 140, "COMPLETE 1:1 TRUE-SCALE PCB FABRICATION SHEET • COPPER ETCH MASKS & DRILL TEMPLATE (REV 2.1)", fontsize=10, ha='center', color="#333333")

    w_board, h_board = 101.60, 53.34
    all_tracks = get_board_tracks()

    # ==================================================================
    # PANEL 1: BOTTOM COPPER LAYER (B.Cu) - TONER TRANSFER ETCH MASK
    # Position: X: 8 to 109.6, Y: 75 to 128.34
    # ==================================================================
    p1_x, p1_y = 8, 75
    ax.add_patch(FancyBboxPatch((p1_x, p1_y), w_board, h_board, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.5))
    ax.text(p1_x + w_board/2, p1_y + h_board + 2.5, "PANEL 1: BOTTOM COPPER ETCHING MASK (B.Cu - TONER TRANSFER / CNC MILLING)", 
            fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # Shifted and Mirrored for direct transfer
    for trk in all_tracks:
        if trk['layer'] in ['bot', 'both']:
            pts_shifted = [(p1_x + pt[0], p1_y + pt[1]) for pt in trk['pts']]
            draw_track(ax, pts_shifted, color="#000000", width=trk['width'] * 1.5, zorder=3)

    # Shifted Pads for Panel 1
    for p in range(10):
        draw_pad(ax, p1_x + 43.5 + p * 2.54, p1_y + 51.1, outer_r=1.0, inner_r=0.45)
    for p in range(8):
        draw_pad(ax, p1_x + 72.5 + p * 2.54, p1_y + 51.1, outer_r=1.0, inner_r=0.45)
    for bx in [32.5, 55.5, 78.5]:
        for p in range(8):
            draw_pad(ax, p1_x + bx + p * 2.54, p1_y + 2.4, outer_r=1.0, inner_r=0.45)
    for r in range(18):
        ry = p1_y + 15.0 + r * 1.8
        draw_pad(ax, p1_x + 97.5, ry, outer_r=0.85, inner_r=0.38)
        draw_pad(ax, p1_x + 100.04, ry, outer_r=0.85, inner_r=0.38)
    # Terminals & Caps
    draw_pad(ax, p1_x + 4.8, p1_y + 44.2, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p1_x + 9.6, p1_y + 44.2, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p1_x + 4.8, p1_y + 31.8, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p1_x + 9.6, p1_y + 31.8, outer_r=2.1, inner_r=0.75)
    for cy in [19.5, 12.0, 4.5]:
        draw_pad(ax, p1_x + 7.2, p1_y + cy + 1.2, outer_r=1.2, inner_r=0.45)
        draw_pad(ax, p1_x + 7.2, p1_y + cy - 1.2, outer_r=1.2, inner_r=0.45)
    # JST-XH & Servos
    for i in range(4):
        jx = p1_x + 17.7 + i * 6.0
        for p in range(4):
            draw_pad(ax, jx + p * 1.0, p1_y + 42.1, outer_r=0.75, inner_r=0.35)
    for sx in [18.5, 29.5]:
        for p in range(3):
            draw_pad(ax, p1_x + sx + p * 2.54, p1_y + 34.5, outer_r=0.95, inner_r=0.45)
    for i in range(4):
        jx = p1_x + 44.7 + i * 6.0
        for p in range(4):
            draw_pad(ax, jx + p * 1.0, p1_y + 25.1, outer_r=0.75, inner_r=0.35)
    for sx in [45.0, 56.5]:
        for p in range(3):
            draw_pad(ax, p1_x + sx + p * 2.54, p1_y + 17.0, outer_r=0.95, inner_r=0.45)
    for p in range(3):
        draw_pad(ax, p1_x + 18.5 + p * 2.8, p1_y + 24.2, outer_r=1.3, inner_r=0.55)
    for p in range(4):
        py = p1_y + (22.0 if p in [1, 2] else 25.5)
        px = p1_x + (28.0 if p in [0, 1] else 33.5)
        draw_pad(ax, px, py, outer_r=0.9, inner_r=0.4)
    for jx in [73.0, 84.0]:
        for p in range(4):
            draw_pad(ax, p1_x + jx + p * 1.4, p1_y + 40.2, outer_r=0.8, inner_r=0.35)
    for sx in [72.0, 83.0]:
        for p in range(3):
            draw_pad(ax, p1_x + sx + p * 2.54, p1_y + 32.0, outer_r=0.95, inner_r=0.45)
    for p in range(4):
        draw_pad(ax, p1_x + 75.0 + p * 4.5, p1_y + 20.1, outer_r=1.1, inner_r=0.45)
    for hx, hy in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        draw_pad(ax, p1_x + hx, p1_y + hy, outer_r=3.2, inner_r=1.6)

    ax.text(p1_x + w_board/2, p1_y + 4.0, "[B.Cu SOLDER SIDE: SOLID BLACK COPPER TRACES & PADS FOR ETCHING]", 
            fontsize=6, fontweight='bold', ha='center', color="#000000")

    # ==================================================================
    # PANEL 2: TOP COPPER LAYER (F.Cu) - COMPONENT SIDE TRACKS
    # Position: X: 118 to 219.6, Y: 75 to 128.34
    # ==================================================================
    p2_x, p2_y = 118, 75
    ax.add_patch(FancyBboxPatch((p2_x, p2_y), w_board, h_board, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.5))
    ax.text(p2_x + w_board/2, p2_y + h_board + 2.5, "PANEL 2: TOP COPPER LAYER (F.Cu - COMPONENT SIDE TRACK ROUTING)", 
            fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    for trk in all_tracks:
        if trk['layer'] in ['top', 'both']:
            pts_shifted = [(p2_x + pt[0], p2_y + pt[1]) for pt in trk['pts']]
            draw_track(ax, pts_shifted, color="#000000", width=trk['width'] * 1.5, zorder=3)

    # Shifted Pads for Panel 2
    for p in range(10):
        draw_pad(ax, p2_x + 43.5 + p * 2.54, p2_y + 51.1, outer_r=1.0, inner_r=0.45)
    for p in range(8):
        draw_pad(ax, p2_x + 72.5 + p * 2.54, p2_y + 51.1, outer_r=1.0, inner_r=0.45)
    for bx in [32.5, 55.5, 78.5]:
        for p in range(8):
            draw_pad(ax, p2_x + bx + p * 2.54, p2_y + 2.4, outer_r=1.0, inner_r=0.45)
    for r in range(18):
        ry = p2_y + 15.0 + r * 1.8
        draw_pad(ax, p2_x + 97.5, ry, outer_r=0.85, inner_r=0.38)
        draw_pad(ax, p2_x + 100.04, ry, outer_r=0.85, inner_r=0.38)
    draw_pad(ax, p2_x + 4.8, p2_y + 44.2, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p2_x + 9.6, p2_y + 44.2, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p2_x + 4.8, p2_y + 31.8, outer_r=2.1, inner_r=0.75)
    draw_pad(ax, p2_x + 9.6, p2_y + 31.8, outer_r=2.1, inner_r=0.75)
    for cy in [19.5, 12.0, 4.5]:
        draw_pad(ax, p2_x + 7.2, p2_y + cy + 1.2, outer_r=1.2, inner_r=0.45)
        draw_pad(ax, p2_x + 7.2, p2_y + cy - 1.2, outer_r=1.2, inner_r=0.45)
    for i in range(4):
        jx = p2_x + 17.7 + i * 6.0
        for p in range(4):
            draw_pad(ax, jx + p * 1.0, p2_y + 42.1, outer_r=0.75, inner_r=0.35)
    for sx in [18.5, 29.5]:
        for p in range(3):
            draw_pad(ax, p2_x + sx + p * 2.54, p2_y + 34.5, outer_r=0.95, inner_r=0.45)
    for i in range(4):
        jx = p2_x + 44.7 + i * 6.0
        for p in range(4):
            draw_pad(ax, jx + p * 1.0, p2_y + 25.1, outer_r=0.75, inner_r=0.35)
    for sx in [45.0, 56.5]:
        for p in range(3):
            draw_pad(ax, p2_x + sx + p * 2.54, p2_y + 17.0, outer_r=0.95, inner_r=0.45)
    for p in range(3):
        draw_pad(ax, p2_x + 18.5 + p * 2.8, p2_y + 24.2, outer_r=1.3, inner_r=0.55)
    for p in range(4):
        py = p2_y + (22.0 if p in [1, 2] else 25.5)
        px = p2_x + (28.0 if p in [0, 1] else 33.5)
        draw_pad(ax, px, py, outer_r=0.9, inner_r=0.4)
    for jx in [73.0, 84.0]:
        for p in range(4):
            draw_pad(ax, p2_x + jx + p * 1.4, p2_y + 40.2, outer_r=0.8, inner_r=0.35)
    for sx in [72.0, 83.0]:
        for p in range(3):
            draw_pad(ax, p2_x + sx + p * 2.54, p2_y + 32.0, outer_r=0.95, inner_r=0.45)
    for p in range(4):
        draw_pad(ax, p2_x + 75.0 + p * 4.5, p2_y + 20.1, outer_r=1.1, inner_r=0.45)
    for hx, hy in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        draw_pad(ax, p2_x + hx, p2_y + hy, outer_r=3.2, inner_r=1.6)

    ax.text(p2_x + w_board/2, p2_y + 4.0, "[F.Cu COMPONENT SIDE: SIGNAL & POWER TRACES]", 
            fontsize=6, fontweight='bold', ha='center', color="#000000")

    # ==================================================================
    # PANEL 3: COMPONENT PLACEMENT SILKSCREEN & DRILL TEMPLATE
    # Position: X: 8 to 109.6, Y: 12 to 65.34
    # ==================================================================
    p3_x, p3_y = 8, 12
    ax.add_patch(FancyBboxPatch((p3_x, p3_y), w_board, h_board, boxstyle="round,pad=0.0,rounding_size=2.5",
                                facecolor="#ffffff", edgecolor="#000000", linewidth=1.5))
    ax.text(p3_x + w_board/2, p3_y + h_board + 2.5, "PANEL 3: TOP COMPONENT SILKSCREEN & DRILL POSITIONING TEMPLATE", 
            fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # Component Outlines on Panel 3
    # M3 mounting holes
    for hx, hy in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        cx, cy = p3_x + hx, p3_y + hy
        ax.add_patch(Circle((cx, cy), 2.5, facecolor="none", edgecolor="#000000", linewidth=0.8))
        ax.add_patch(Circle((cx, cy), 1.6, facecolor="#000000"))
        ax.plot([cx - 3.5, cx + 3.5], [cy, cy], color="#000000", linewidth=0.5)
        ax.plot([cx, cx], [cy - 3.5, cy + 3.5], color="#000000", linewidth=0.5)
        ax.text(cx, cy - 4.5, "M3", fontsize=5.5, ha='center', color="#000000")

    # Header rectangles
    ax.add_patch(Rectangle((p3_x + 42.0, p3_y + 49.5), 28.0, 3.2, facecolor="none", edgecolor="#000000", linewidth=0.8))
    for p in range(10):
        ax.add_patch(Circle((p3_x + 43.5 + p * 2.54, p3_y + 51.1), 0.75, facecolor="#000000"))
    ax.text(p3_x + 56.0, p3_y + 47.5, "D8 - D13 | GND | AREF | SDA | SCL", fontsize=5, ha='center')

    ax.add_patch(Rectangle((p3_x + 71.0, p3_y + 49.5), 21.0, 3.2, facecolor="none", edgecolor="#000000", linewidth=0.8))
    for p in range(8):
        ax.add_patch(Circle((p3_x + 72.5 + p * 2.54, p3_y + 51.1), 0.75, facecolor="#000000"))
    ax.text(p3_x + 81.5, p3_y + 47.5, "COMM D0 - D7", fontsize=5, ha='center')

    # Bottom Headers
    for bx, bname in [(32.5, "POWER 5V/GND"), (55.5, "ANALOG A0-A7"), (78.5, "ANALOG A8-A15")]:
        ax.add_patch(Rectangle((p3_x + bx - 1.5, p3_y + 0.8), 21.0, 3.2, facecolor="none", edgecolor="#000000", linewidth=0.8))
        for p in range(8):
            ax.add_patch(Circle((p3_x + bx + p * 2.54, p3_y + 2.4), 0.75, facecolor="#000000"))
        ax.text(p3_x + bx + 9.0, p3_y + 4.8, bname, fontsize=5, ha='center')

    # 2x18 Header
    ax.add_patch(Rectangle((p3_x + 96.5, p3_y + 13.5), 5.0, 34.0, facecolor="none", edgecolor="#000000", linewidth=0.8))
    for r in range(18):
        ry = p3_y + 15.0 + r * 1.8
        ax.add_patch(Circle((p3_x + 97.5, ry), 0.55, facecolor="#000000"))
        ax.add_patch(Circle((p3_x + 100.04, ry), 0.55, facecolor="#000000"))
    ax.text(p3_x + 94.0, p3_y + 31.0, "PINS 22 TO 53", fontsize=5, rotation=90, ha='center', va='center')

    # Screw Terminals
    ax.add_patch(Rectangle((p3_x + 2.5, p3_y + 40.0), 9.5, 8.5, facecolor="none", edgecolor="#000000", linewidth=0.8))
    ax.add_patch(Circle((p3_x + 4.8, p3_y + 44.2), 1.5, facecolor="#000000"))
    ax.add_patch(Circle((p3_x + 9.6, p3_y + 44.2), 1.5, facecolor="#000000"))
    ax.text(p3_x + 7.2, p3_y + 41.5, "12V_IN", fontsize=5.5, ha='center', fontweight='bold')

    ax.add_patch(Rectangle((p3_x + 2.5, p3_y + 27.0), 9.5, 9.5, facecolor="none", edgecolor="#000000", linewidth=0.8))
    ax.add_patch(Circle((p3_x + 4.8, p3_y + 31.8), 1.5, facecolor="#000000"))
    ax.add_patch(Circle((p3_x + 9.6, p3_y + 31.8), 1.5, facecolor="#000000"))
    ax.text(p3_x + 7.2, p3_y + 28.5, "5V_SERVO", fontsize=5.5, ha='center', fontweight='bold')

    # Bulk Caps C1, C2, C3
    for c_idx, cy in enumerate([19.5, 12.0, 4.5]):
        ax.add_patch(Circle((p3_x + 7.2, p3_y + cy), 2.8, facecolor="none", edgecolor="#000000", linewidth=0.8))
        ax.add_patch(Circle((p3_x + 7.2, p3_y + cy + 1.2), 0.5, facecolor="#000000"))
        ax.add_patch(Circle((p3_x + 7.2, p3_y + cy - 1.2), 0.5, facecolor="#000000"))
        ax.text(p3_x + 7.2, p3_y + cy, f"C{c_idx+1}", fontsize=5, ha='center', va='center')

    # Connectors & Components
    for i, name in enumerate(["P_ENTR", "P_BOT", "P_MID", "P_TOP"]):
        jx = p3_x + 17.0 + i * 5.6
        jy = p3_y + 40.5
        ax.add_patch(Rectangle((jx, jy), 4.5, 3.2, facecolor="none", edgecolor="#000000", linewidth=0.6))
        for pin in range(4):
            ax.add_patch(Circle((jx + 0.7 + pin * 1.0, jy + 1.6), 0.35, facecolor="#000000"))
        ax.text(jx + 2.25, jy - 1.2, name, fontsize=4.5, ha='center')

    for s_idx, s_name in enumerate(["P_IRIS", "P_DROP"]):
        sx = p3_x + 17.5 + s_idx * 11.0
        sy = p3_y + 34.5
        ax.add_patch(Rectangle((sx, sy), 8.0, 2.5, facecolor="none", edgecolor="#000000", linewidth=0.6))
        for p in range(3):
            ax.add_patch(Circle((sx + 1.2 + p * 2.54, sy + 1.25), 0.5, facecolor="#000000"))
        ax.text(sx + 4.0, sy + 1.25, s_name, fontsize=4.5, ha='center', va='center')

    for i, name in enumerate(["M_ENTR", "M_BOT", "M_MID", "M_TOP"]):
        jx = p3_x + 44.0 + i * 5.8
        jy = p3_y + 23.5
        ax.add_patch(Rectangle((jx, jy), 4.5, 3.2, facecolor="none", edgecolor="#000000", linewidth=0.6))
        for pin in range(4):
            ax.add_patch(Circle((jx + 0.7 + pin * 1.0, jy + 1.6), 0.35, facecolor="#000000"))
        ax.text(jx + 2.25, jy - 1.2, name, fontsize=4.5, ha='center')

    for s_idx, s_name in enumerate(["M_IRIS", "M_DROP"]):
        sx = p3_x + 44.5 + s_idx * 11.5
        sy = p3_y + 16.0
        ax.add_patch(Rectangle((sx, sy), 8.5, 2.5, facecolor="none", edgecolor="#000000", linewidth=0.6))
        for p in range(3):
            ax.add_patch(Circle((sx + 1.2 + p * 2.54, sy + 1.25), 0.5, facecolor="#000000"))
        ax.text(sx + 4.2, sy + 1.25, s_name, fontsize=4.5, ha='center', va='center')

    # Inductive Optocoupler & Terminal
    ax.add_patch(Rectangle((p3_x + 17.0, p3_y + 21.0), 9.0, 6.5, facecolor="none", edgecolor="#000000", linewidth=0.6))
    for p in range(3):
        ax.add_patch(Circle((p3_x + 18.5 + p * 2.8, p3_y + 24.2), 0.9, facecolor="#000000"))
    ax.text(p3_x + 21.5, p3_y + 19.5, "TB_IND", fontsize=5, ha='center')

    ax.add_patch(Rectangle((p3_x + 28.5, p3_y + 21.0), 4.5, 6.0, facecolor="none", edgecolor="#000000", linewidth=0.8))
    for p in range(4):
        py = p3_y + (22.0 if p in [1, 2] else 25.5)
        px = p3_x + (28.0 if p in [0, 1] else 33.5)
        ax.add_patch(Circle((px, py), 0.45, facecolor="#000000"))
    ax.text(p3_x + 30.7, p3_y + 24.0, "U1:PC817", fontsize=4.8, ha='center', va='center')

    for i, name in enumerate(["PP_TOP", "PP_BOT"]):
        jx = p3_x + 72.0 + i * 11.0
        jy = p3_y + 39.0
        ax.add_patch(Rectangle((jx, jy), 6.5, 3.5, facecolor="none", edgecolor="#000000", linewidth=0.6))
        for pin in range(4):
            ax.add_patch(Circle((jx + 1.0 + pin * 1.4, jy + 1.75), 0.4, facecolor="#000000"))
        ax.text(jx + 3.25, jy - 1.2, name, fontsize=4.8, ha='center')

    for s_idx, s_name in enumerate(["PP_IRIS", "PP_DROP"]):
        sx = p3_x + 72.0 + s_idx * 11.0
        sy = p3_y + 30.5
        ax.add_patch(Rectangle((sx, sy), 8.5, 2.5, facecolor="none", edgecolor="#000000", linewidth=0.6))
        for p in range(3):
            ax.add_patch(Circle((sx + 1.2 + p * 2.54, sy + 1.25), 0.5, facecolor="#000000"))
        ax.text(sx + 4.2, sy + 1.25, s_name, fontsize=4.5, ha='center', va='center')

    ax.add_patch(Rectangle((p3_x + 73.0, p3_y + 18.5), 18.5, 3.2, facecolor="none", edgecolor="#000000", linewidth=0.8))
    for p in range(4):
        ax.add_patch(Circle((p3_x + 75.0 + p * 4.5, p3_y + 20.1), 0.65, facecolor="#000000"))
    ax.text(p3_x + 82.2, p3_y + 16.5, "HX711 CARRIER HEADER [VCC, DOUT(37), SCK(38), GND]", fontsize=4.8, ha='center')

    # ==================================================================
    # PANEL 4: DRILL SCHEDULE, CALIBRATION RULER & FABRICATION SPECS
    # Position: X: 118 to 226, Y: 12 to 65.34
    # ==================================================================
    p4_x, p4_y = 118, 12
    ax.add_patch(Rectangle((p4_x, p4_y), w_board, h_board, facecolor="#ffffff", edgecolor="#000000", linewidth=1.2))
    ax.text(p4_x + w_board/2, p4_y + h_board + 2.5, "PANEL 4: 1:1 CALIBRATION RULER & DRILL BIT APERTURE SCHEDULE", 
            fontsize=8.5, fontweight='bold', ha='center', color="#000000")

    # True Scale Calibration Ruler (100.0 mm)
    rx, ry = p4_x + 0.8, p4_y + 44.0
    ax.plot([rx, rx + 100], [ry, ry], color="#000000", linewidth=2.0)
    for t in range(101):
        h = 2.5 if t % 10 == 0 else (1.5 if t % 5 == 0 else 0.8)
        ax.plot([rx + t, rx + t], [ry, ry + h], color="#000000", linewidth=0.6 if t % 10 != 0 else 1.2)
        if t % 10 == 0:
            ax.text(rx + t, ry + 3.2, f"{t}", fontsize=5, ha='center', color="#000000")
    ax.text(rx + 50, ry - 3.0, "100.0 mm TRUE SCALE CALIBRATION RULER (MEASURE WITH CALIPER BEFORE ETCHING)", 
            fontsize=5.8, fontweight='bold', ha='center', color="#000000")

    # Fabrication & Drill Schedule
    ax.text(p4_x + 3.0, p4_y + 36.0, "DRILL BIT APERTURES & HOLE SIZES:", fontsize=7, fontweight='bold', color="#000000")
    drill_text = (
        "• 3.20mm (M3 Drill):  5x Holes (Chassis Mounting Standoffs)\n"
        "• 1.40mm (0.055 in):   7x Holes (16A 5.08mm Screw Terminals TB1, TB2, TB3)\n"
        "• 1.00mm (0.040 in):  52x Holes (Arduino Mega 2560 Header Sockets)\n"
        "• 0.90mm (0.035 in):  32x Holes (JST-XH 2.50mm Shrouded Ultrasonic Headers)\n"
        "• 0.85mm (0.033 in):   6x Holes (1000uF Low-ESR Radial Capacitors C1, C2, C3)\n"
        "• 0.80mm (0.031 in):  22x Holes (PC817 Opto U1, Servos J_SRV1-6, HX711)\n"
        "• 0.40mm (0.016 in):  18x Vias  (Inter-layer Copper Stitching Vias)"
    )
    ax.text(p4_x + 3.0, p4_y + 34.0, drill_text, fontsize=5.5, color="#111111", va='top', fontfamily='monospace')

    ax.text(p4_x + 3.0, p4_y + 14.0, "CHEMICAL ETCHING & TONER TRANSFER SOP:", fontsize=6.5, fontweight='bold', color="#000000")
    sop_text = (
        "1. Print Panel 1 on glossy magazine paper / heat-transfer film at 100% scale (no fit).\n"
        "2. Clean double-sided 1.6mm FR-4 copper clad with isopropyl alcohol & scouring pad.\n"
        "3. Iron toner onto copper at 200°C for 4.5 mins. Soak in water & gently peel paper.\n"
        "4. Etch in ferric chloride (FeCl3) solution at 45°C with agitation until clear.\n"
        "5. Rinse thoroughly, strip toner with acetone, apply liquid tin or flux coating."
    )
    ax.text(p4_x + 3.0, p4_y + 12.0, sop_text, fontsize=5.0, color="#333333", va='top')

    plt.tight_layout()
    print_path = os.path.join(OUTPUT_DIR, "rvm_arduino_mega_shield_pcb_print_1to1.png")
    plt.savefig(print_path, facecolor="#ffffff", edgecolor='none', dpi=250)
    plt.close()
    print("Saved 1:1 Complete Multi-Panel PCB Print Sheet:", print_path)

# ----------------------------------------------------------------------
# 4. GENERATE REALISTIC 2D CAD PCB LAYOUT WITH VISIBLE COPPER TRACES
# ----------------------------------------------------------------------
def generate_shield_pcb_layout():
    fig, ax = plt.subplots(figsize=(20, 12), dpi=220, facecolor=BG_DARK)
    ax.set_facecolor(BG_DARK)
    ax.set_xlim(-8, 112)
    ax.set_ylim(-8, 64)
    ax.axis('off')

    # Master Board Dimensions
    mega_w, mega_h = 101.60, 53.34

    # Outer Dimension Leaders & Annotations
    ax.plot([0, mega_w], [mega_h + 4.5, mega_h + 4.5], color=CYAN, linewidth=1.2)
    ax.plot([0, 0], [mega_h, mega_h + 6.0], color=CYAN, linewidth=0.8)
    ax.plot([mega_w, mega_w], [mega_h, mega_h + 6.0], color=CYAN, linewidth=0.8)
    ax.text(mega_w / 2, mega_h + 5.5, "<--- 101.60 mm (4.000 in) --->", fontsize=8.5, fontweight='bold', color=CYAN, ha='center')

    ax.plot([mega_w + 4.5, mega_w + 4.5], [0, mega_h], color=CYAN, linewidth=1.2)
    ax.plot([mega_w, mega_w + 6.0], [0, 0], color=CYAN, linewidth=0.8)
    ax.plot([mega_w, mega_w + 6.0], [mega_h, mega_h], color=CYAN, linewidth=0.8)
    ax.text(mega_w + 5.5, mega_h / 2, "53.34 mm\n(2.100 in)", fontsize=8, fontweight='bold', color=CYAN, va='center')

    # Dark Blue/Green Industrial Soldermask Substrate (FR-4)
    board_pcb = FancyBboxPatch((0, 0), mega_w, mega_h, boxstyle="round,pad=0.0,rounding_size=2.5",
                               facecolor="#08182b", edgecolor="#0284c7", linewidth=2.0)
    ax.add_patch(board_pcb)

    # Copper Ground Flood Zone (semi-transparent hatching)
    gnd_flood = FancyBboxPatch((1.5, 1.5), mega_w - 3.0, mega_h - 3.0, boxstyle="round,pad=0.0,rounding_size=2.0",
                               facecolor="#0a233d", edgecolor="#0369a1", linewidth=0.8, alpha=0.5)
    ax.add_patch(gnd_flood)

    # DRAW ALL REAL COPPER TRACES ON CAD VIEW:
    # Bottom Copper Tracks (Blue / Cyan) and Top Copper Tracks (Bright Copper / Amber)
    all_tracks = get_board_tracks()
    for trk in all_tracks:
        if trk['layer'] == 'bot':
            draw_track(ax, trk['pts'], color="#0284c7", width=trk['width'] * 1.4, alpha=0.85, zorder=2)
        elif trk['layer'] == 'top':
            draw_track(ax, trk['pts'], color="#f59e0b", width=trk['width'] * 1.4, alpha=0.9, zorder=3)
        else: # both
            draw_track(ax, trk['pts'], color="#0284c7", width=trk['width'] * 1.4, alpha=0.7, zorder=2)
            draw_track(ax, trk['pts'], color="#f59e0b", width=trk['width'] * 1.1, alpha=0.9, zorder=3)

    # DRAW ALL GOLD-PLATED SOLDER PADS (ENIG / HASL Finish)
    render_all_pads(ax, pad_color="#f59e0b", hole_color="#070b14", zorder=4)

    # COMPONENT SILKSCREEN & LABELS (Top White Silkscreen Layer)
    # 4 Standard Arduino Mega M3 Mounting Holes
    holes = [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]
    for hx, hy in holes:
        ax.add_patch(Circle((hx, hy), 3.0, facecolor='none', edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
        ax.text(hx, hy - 4.2, "M3", fontsize=6.5, color=SILKSCREEN_WHITE, ha='center', zorder=6)

    # Arduino Mega Headers
    ax.add_patch(Rectangle((42.0, 49.5), 28.0, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
    ax.text(56.0, 47.8, "DIGITAL 8-13 | GND | AREF | SDA | SCL", fontsize=6, color=SILKSCREEN_WHITE, ha='center', zorder=6)

    ax.add_patch(Rectangle((71.0, 49.5), 21.0, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
    ax.text(81.5, 47.8, "COMM D0(RX0)-D7", fontsize=6, color=SILKSCREEN_WHITE, ha='center', zorder=6)

    ax.add_patch(Rectangle((31.0, 0.8), 21.0, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
    ax.text(41.5, 4.8, "POWER (5V, GND, VIN, RESET)", fontsize=6, color=CYAN, ha='center', zorder=6)

    ax.add_patch(Rectangle((54.0, 0.8), 21.0, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
    ax.text(64.5, 4.8, "ANALOG A0 - A7", fontsize=6, color=SILKSCREEN_WHITE, ha='center', zorder=6)

    ax.add_patch(Rectangle((77.0, 0.8), 21.0, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
    ax.text(87.5, 4.8, "ANALOG A8 - A15", fontsize=6, color=SILKSCREEN_WHITE, ha='center', zorder=6)

    ax.add_patch(Rectangle((96.5, 13.5), 5.0, 34.0, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.8, zorder=5))
    ax.text(94.0, 31.0, "2x18 DUAL HEADER (PINS 22 TO 53)", fontsize=6, color=AMBER, rotation=90, va='center', ha='center', zorder=6)

    # Screw Terminals
    ax.add_patch(FancyBboxPatch((2.5, 40.0), 9.5, 8.5, boxstyle="round,pad=0.2", facecolor="#1e293b", edgecolor=AMBER, linewidth=1.2, zorder=5))
    ax.text(7.2, 47.2, "12V IN", fontsize=7.5, fontweight='bold', color=AMBER, ha='center', zorder=6)
    ax.text(7.2, 41.0, "TB_12V", fontsize=6, color=TEXT_MUTED, ha='center', zorder=6)

    ax.add_patch(FancyBboxPatch((2.5, 27.0), 9.5, 9.5, boxstyle="round,pad=0.2", facecolor="#1e293b", edgecolor=ROSE, linewidth=1.5, zorder=5))
    ax.text(7.2, 35.0, "5V_SERVO (10A)", fontsize=7, fontweight='bold', color=ROSE, ha='center', zorder=6)
    ax.text(7.2, 28.0, "TB_SERVO_PWR", fontsize=6, color=TEXT_MUTED, ha='center', zorder=6)

    # Bulk Caps C1, C2, C3
    for c_idx, cy in enumerate([19.5, 12.0, 4.5]):
        ax.add_patch(Circle((7.2, cy), 3.0, facecolor="none", edgecolor=ROSE, linewidth=1.0, zorder=5))
        ax.text(7.2, cy, f"C{c_idx+1}", fontsize=6.5, color=SILKSCREEN_WHITE, ha='center', va='center', zorder=6)
        ax.text(11.2, cy, "1000uF\n16V", fontsize=5.5, color=ROSE, va='center', zorder=6)

    # Chamber 1 (Plastic) Silkscreen
    ax.add_patch(Rectangle((16.0, 33.5), 23.5, 14.5, facecolor="none", edgecolor=CYAN, linewidth=1.0, linestyle=":", zorder=5))
    ax.text(17.0, 46.5, "CH1: PLASTIC (PET)", fontsize=7.5, fontweight='bold', color=CYAN, zorder=6)
    for i, name in enumerate(["P_ENTR", "P_BOT", "P_MID", "P_TOP"]):
        jx = 17.0 + i * 5.6
        ax.add_patch(Rectangle((jx, 40.5), 4.5, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.6, zorder=5))
        ax.text(jx + 2.25, 39.0, name, fontsize=5, color=TEXT_CYAN, ha='center', zorder=6)
    for s_idx, s_name in enumerate(["P_IRIS", "P_DROP"]):
        sx = 17.5 + s_idx * 11.0
        ax.add_patch(Rectangle((sx, 33.5), 8.0, 2.5, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.6, zorder=5))
        ax.text(sx + 4.0, 32.2, s_name, fontsize=5, color=TEXT_MAIN, ha='center', zorder=6)

    # Chamber 2 (Metal) Silkscreen
    ax.add_patch(Rectangle((43.0, 13.5), 26.0, 16.0, facecolor="none", edgecolor=AMBER, linewidth=1.0, linestyle=":", zorder=5))
    ax.text(44.0, 28.0, "CH2: ALUMINUM CANS", fontsize=7.5, fontweight='bold', color=AMBER, zorder=6)
    for i, name in enumerate(["M_ENTR", "M_BOT", "M_MID", "M_TOP"]):
        jx = 44.0 + i * 5.8
        ax.add_patch(Rectangle((jx, 23.5), 4.5, 3.2, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.6, zorder=5))
        ax.text(jx + 2.25, 22.0, name, fontsize=5, color=AMBER, ha='center', zorder=6)
    for s_idx, s_name in enumerate(["M_IRIS", "M_DROP"]):
        sx = 44.5 + s_idx * 11.5
        ax.add_patch(Rectangle((sx, 16.0), 8.5, 2.5, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.6, zorder=5))
        ax.text(sx + 4.25, 14.7, s_name, fontsize=5, color=TEXT_MAIN, ha='center', zorder=6)

    # Inductive Proximity & Opto U1
    ax.add_patch(Rectangle((17.0, 21.0), 9.0, 6.5, facecolor="none", edgecolor=AMBER, linewidth=0.8, zorder=5))
    ax.text(21.5, 20.0, "TB_INDUCTIVE", fontsize=5.5, color=AMBER, ha='center', zorder=6)
    ax.add_patch(Rectangle((28.5, 21.0), 4.5, 6.0, facecolor="#1e1b2e", edgecolor=EMERALD, linewidth=0.8, zorder=5))
    ax.text(30.75, 24.0, "U1\nPC817", fontsize=5, color=EMERALD, ha='center', va='center', zorder=6)

    # Chamber 3 (Paper) Silkscreen
    ax.add_patch(Rectangle((71.0, 16.0), 23.0, 31.0, facecolor="none", edgecolor=EMERALD, linewidth=1.0, linestyle=":", zorder=5))
    ax.text(72.0, 45.5, "CH3: PAPER WASTAGE", fontsize=7.5, fontweight='bold', color=EMERALD, zorder=6)
    for i, name in enumerate(["PP_TOP", "PP_BOT"]):
        jx = 72.0 + i * 11.0
        ax.add_patch(Rectangle((jx, 39.0), 6.5, 3.5, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.6, zorder=5))
        ax.text(jx + 3.25, 37.5, name, fontsize=5, color=EMERALD, ha='center', zorder=6)
    for s_idx, s_name in enumerate(["PP_IRIS", "PP_DROP"]):
        sx = 72.0 + s_idx * 11.0
        ax.add_patch(Rectangle((sx, 30.5), 8.5, 2.5, facecolor="none", edgecolor=SILKSCREEN_WHITE, linewidth=0.6, zorder=5))
        ax.text(sx + 4.25, 29.2, s_name, fontsize=5, color=TEXT_MAIN, ha='center', zorder=6)

    # HX711 Carrier Header
    ax.add_patch(Rectangle((73.0, 18.5), 18.5, 3.2, facecolor="#1e293b", edgecolor=EMERALD, linewidth=0.8, zorder=5))
    ax.text(82.2, 16.8, "HX711 CARRIER [VCC, DOUT, SCK, GND]", fontsize=5, color=EMERALD, ha='center', zorder=6)

    # Layer Legend in Corner
    ax.add_patch(Rectangle((2.0, 56.0), 97.6, 6.0, facecolor=SURFACE_CARD, edgecolor=BORDER_COLOR, linewidth=1.0, zorder=8))
    ax.plot([4, 10], [59.0, 59.0], color="#f59e0b", linewidth=2.5, zorder=9)
    ax.text(12, 59.0, "TOP COPPER (F.Cu) - Component Side Tracks", fontsize=6.5, color="#f59e0b", va='center', zorder=9)
    ax.plot([40, 46], [59.0, 59.0], color="#0284c7", linewidth=2.5, zorder=9)
    ax.text(48, 59.0, "BOTTOM COPPER (B.Cu) - Solder Side Tracks & Ground Flood", fontsize=6.5, color="#38bdf8", va='center', zorder=9)
    ax.add_patch(Circle((85, 59.0), 1.2, facecolor="#f59e0b", zorder=9))
    ax.add_patch(Circle((85, 59.0), 0.5, facecolor="#070b14", zorder=10))
    ax.text(88, 59.0, "PTH Solder Pads & Vias", fontsize=6.5, color=SILKSCREEN_WHITE, va='center', zorder=9)

    plt.tight_layout()
    pcb_path = os.path.join(OUTPUT_DIR, "rvm_arduino_mega_shield_pcb_layout.png")
    plt.savefig(pcb_path, facecolor=BG_DARK, edgecolor='none', dpi=220)
    plt.close()
    print("Saved Updated Realistic 2D CAD PCB Layout with Copper Tracks:", pcb_path)

if __name__ == "__main__":
    print("Generating comprehensive Copper PCB CAD diagrams...")
    generate_shield_pcb_copper_bottom(mirror=False)
    generate_shield_pcb_copper_bottom(mirror=True)
    generate_shield_pcb_copper_top()
    generate_pcb_print_sheet()
    generate_shield_pcb_layout()
    print("ALL COPPER PCB ARTWORK & FABRICATION TEMPLATES GENERATED SUCCESSFULLY!")
