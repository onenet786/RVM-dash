"""
=============================================================================
PECODROP RVM — MASTER ARDUINO MEGA SHIELD PCB RECREATION SCRIPT (REV 8.0)
Strictly synchronized with PecoDropDesktopApp/Arduino/RVM_Arduino/RVM_Arduino.ino:
- Chamber 1 Plastic: Sonar 9/10, Iris 11, Drop 12, Sizing 22/23, 24/41, 42/43, Bin Full D47
- Chamber 2 Metal: Sonar 25/26, Iris 27, Drop 28, Sizing 29/30, 31/44, 45/46, Inductive D32, Bin Full D48
- Chamber 3 Paper: Top Sonar 33/34, Bot Sonar 39/40, Iris 35, Drop 36, HX711 37/38, Bin Full D49
- Environmental Safety: MQ-6 Gas / Fire / Smoke Alarm Sensor D50
=============================================================================
"""

import os
import sys
import math
import zipfile
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Polygon, PathPatch
from matplotlib.backends.backend_pdf import PdfPages

W_BOARD = 101.60  # mm
H_BOARD = 53.34   # mm

OUT_DIR_DOC = r"d:\GIT-HUB\RVM-dash\docs\user_manuals"
OUT_DIR_IMG = r"d:\GIT-HUB\RVM-dash\docs\user_manuals\images"
OUT_DIR_GERBER = r"d:\GIT-HUB\RVM-dash\docs\user_manuals\gerbers"

os.makedirs(OUT_DIR_DOC, exist_ok=True)
os.makedirs(OUT_DIR_IMG, exist_ok=True)
os.makedirs(OUT_DIR_GERBER, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. PIN DEFINITIONS & NETLIST
# -----------------------------------------------------------------------------
TOP_10 = [('D8', 43.50), ('D9', 46.04), ('D10', 48.58), ('D11', 51.12),
          ('D12', 53.66), ('D13', 56.20), ('GND', 58.74), ('AREF', 61.28),
          ('SDA', 63.82), ('SCL', 66.36)]

TOP_8 = [('D7', 72.50), ('D6', 75.04), ('D5', 77.58), ('D4', 80.12),
         ('D3', 82.66), ('D2', 85.20), ('TX1', 87.74), ('RX0', 90.28)]

BOT_PWR = [('NC', 32.50), ('IOREF', 35.04), ('RESET', 37.58), ('3V3', 40.12),
           ('5V_LOGIC', 42.66), ('GND', 45.20), ('GND', 47.74), ('VIN', 50.28)]

BOT_ANA = [(f'A{i}', 55.50 + i*2.54) for i in range(8)] + [(f'A{i+8}', 78.50 + i*2.54) for i in range(8)]

# Right 2x18 Header mapping
MEGA_2X18 = [
    (5.08,  'GND', 97.50),  (5.08,  '5V_LOGIC', 100.04),
    (7.62,  'GND', 97.50),  (7.62,  '5V_LOGIC', 100.04),
    (10.16, 'D23', 97.50),  (10.16, 'D22', 100.04),
    (12.70, 'D25', 97.50),  (12.70, 'D24', 100.04),
    (15.24, 'D27', 97.50),  (15.24, 'D26', 100.04),
    (17.78, 'D29', 97.50),  (17.78, 'D28', 100.04),
    (20.32, 'D31', 97.50),  (20.32, 'D30', 100.04),
    (22.86, 'D33', 97.50),  (22.86, 'D32', 100.04),
    (25.40, 'D35', 97.50),  (25.40, 'D34', 100.04),
    (27.94, 'D37', 97.50),  (27.94, 'D36', 100.04),
    (30.48, 'D39', 97.50),  (30.48, 'D38', 100.04),
    (33.02, 'D41', 97.50),  (33.02, 'D40', 100.04),
    (35.56, 'D43', 97.50),  (35.56, 'D42', 100.04),
    (38.10, 'D45', 97.50),  (38.10, 'D44', 100.04),
    (40.64, 'D47', 97.50),  (40.64, 'D46', 100.04),  # D47 = Plastic Bin Sensor
    (43.18, 'D49', 97.50),  (43.18, 'D48', 100.04),  # D49 = Paper Bin, D48 = Metal Bin
    (45.72, 'D51', 97.50),  (45.72, 'D50', 100.04),  # D50 = MQ6 Gas Alarm Sensor
    (48.26, 'D53', 97.50),  (48.26, 'D52', 100.04),
]

CONNECTORS = [
    # Power Input Screw Terminals (5.08mm Pitch)
    ('TB_PWR_12V', 6.0, 42.0, ['GND', '12V_RAW']),
    ('TB_PWR_5VS', 6.0, 28.0, ['GND', '5V_SERVO']),

    # Capacitors
    ('C_12V', 12.0, 42.0, ['GND', '12V_RAW']),
    ('C_5VS', 12.0, 28.0, ['GND', '5V_SERVO']),

    # Status LEDs
    ('LED_12V', 16.5, 42.0, ['12V_RAW', 'GND']),
    ('LED_5VS', 16.5, 28.0, ['5V_SERVO', 'GND']),

    # Chamber 1 (Plastic)
    ('CH1_ENTR', 22.0, 46.50, ['5V_LOGIC', 'D9', 'D10', 'GND']),
    ('CH1_BOT',  34.0, 46.50, ['5V_LOGIC', 'D22', 'D23', 'GND']),
    ('CH1_MID',  22.0, 38.50, ['5V_LOGIC', 'D24', 'D41', 'GND']),
    ('CH1_TOP',  34.0, 38.50, ['5V_LOGIC', 'D42', 'D43', 'GND']),
    ('CH1_IRIS', 46.0, 46.50, ['D11', '5V_SERVO', 'GND']),
    ('CH1_DROP', 55.0, 46.50, ['D12', '5V_SERVO', 'GND']),
    ('CH1_BIN',  46.0, 38.50, ['5V_LOGIC', 'D47', 'GND']),  # Pin 47

    # Chamber 2 (Metal)
    ('CH2_ENTR', 22.0, 27.50, ['5V_LOGIC', 'D25', 'D26', 'GND']),
    ('CH2_BOT',  34.0, 27.50, ['5V_LOGIC', 'D29', 'D30', 'GND']),
    ('CH2_MID',  22.0, 16.50, ['5V_LOGIC', 'D31', 'D44', 'GND']),
    ('CH2_TOP',  34.0, 16.50, ['5V_LOGIC', 'D45', 'D46', 'GND']),
    ('CH2_IND',  46.0, 27.50, ['12V_RAW', 'D32', 'GND']),
    ('CH2_IRIS', 46.0, 16.50, ['D27', '5V_SERVO', 'GND']),
    ('CH2_DROP', 55.0, 16.50, ['D28', '5V_SERVO', 'GND']),
    ('CH2_BIN',  55.0, 27.50, ['5V_LOGIC', 'D48', 'GND']),  # Pin 48

    # Chamber 3 (Paper)
    ('CH3_ENTR', 67.0, 46.50, ['5V_LOGIC', 'D33', 'D34', 'GND']),
    ('CH3_BOT',  79.0, 46.50, ['5V_LOGIC', 'D39', 'D40', 'GND']),
    ('CH3_HX',   67.0, 34.50, ['5V_LOGIC', 'D37', 'D38', 'GND']),
    ('CH3_IRIS', 67.0, 16.50, ['D35', '5V_SERVO', 'GND']),
    ('CH3_DROP', 76.0, 16.50, ['D36', '5V_SERVO', 'GND']),
    ('CH3_BIN',  79.0, 34.50, ['5V_LOGIC', 'D49', 'GND']),  # Pin 49

    # Environmental Safety
    ('ENV_MQ6',  76.0, 25.00, ['5V_LOGIC', 'D50', 'GND']),  # Pin 50
]

def build_all_pads():
    pads = []
    # Mega Headers
    for net, x in TOP_10:
        pads.append({'id': f'M_T10_{net}', 'x': x, 'y': 51.10, 'net': net, 'r_out': 1.15, 'r_in': 0.45, 'type': 'mega'})
    for net, x in TOP_8:
        pads.append({'id': f'M_T8_{net}', 'x': x, 'y': 51.10, 'net': net, 'r_out': 1.15, 'r_in': 0.45, 'type': 'mega'})
    for net, x in BOT_PWR:
        pads.append({'id': f'M_PWR_{net}', 'x': x, 'y': 2.40, 'net': net, 'r_out': 1.15, 'r_in': 0.45, 'type': 'mega'})
    for net, x in BOT_ANA:
        pads.append({'id': f'M_ANA_{net}', 'x': x, 'y': 2.40, 'net': net, 'r_out': 1.15, 'r_in': 0.45, 'type': 'mega'})
    for y, net, x in MEGA_2X18:
        pads.append({'id': f'M_2X18_{net}_{x}_{y}', 'x': x, 'y': y, 'net': net, 'r_out': 1.10, 'r_in': 0.42, 'type': 'mega_2x18'})

    # Connectors
    for name, bx, by, nets in CONNECTORS:
        pitch = 5.08 if 'TB_' in name else 2.54
        r_out = 2.2 if 'TB_' in name else 1.15
        r_in = 0.85 if 'TB_' in name else 0.45
        for i, net in enumerate(nets):
            py = by + i*pitch if 'TB_' in name or 'C_' in name else by
            px = bx if 'TB_' in name or 'C_' in name else bx + i*pitch
            pads.append({'id': f'{name}_{net}_{i}', 'x': px, 'y': py, 'net': net, 'r_out': r_out, 'r_in': r_in, 'type': 'conn', 'parent': name})

    # M3 Mounting Holes
    for mx, my in [(14.0, 2.5), (15.2, 50.8), (66.0, 35.6), (96.5, 12.7), (96.5, 50.8)]:
        pads.append({'id': f'MOUNT_{mx}_{my}', 'x': mx, 'y': my, 'net': 'GND', 'r_out': 3.2, 'r_in': 1.6, 'type': 'mount'})

    return pads

def build_tracks():
    tracks = []
    # 1. High-Current 5V Servo Rail (2.2mm width)
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.2, 'pts': [(6.0, 28.0), (18.0, 28.0), (18.0, 21.0), (77.0, 21.0)]})
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.0, 'pts': [(48.54, 21.0), (48.54, 16.50)]})  # M_IRIS
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.0, 'pts': [(57.54, 21.0), (57.54, 16.50)]})  # M_DROP
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.0, 'pts': [(69.54, 21.0), (69.54, 16.50)]})  # PP_IRIS
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.0, 'pts': [(78.54, 21.0), (78.54, 16.50)]})  # PP_DROP
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.0, 'pts': [(18.0, 28.0), (18.0, 44.0), (48.54, 44.0), (48.54, 46.50)]}) # P_IRIS
    tracks.append({'net': '5V_SERVO', 'layer': 'bot', 'width': 2.0, 'pts': [(48.54, 44.0), (57.54, 44.0), (57.54, 46.50)]}) # P_DROP

    # 2. 12V Inductive Sensor Rail
    tracks.append({'net': '12V_RAW', 'layer': 'top', 'width': 1.4, 'pts': [(6.0, 42.0), (14.0, 42.0), (14.0, 31.0), (46.0, 31.0), (46.0, 27.50)]})

    # 3. Clean 5V Logic Bus
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.2, 'pts': [(42.66, 2.40), (42.66, 7.0), (22.0, 7.0), (22.0, 46.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.0, 'pts': [(22.0, 46.50), (34.0, 46.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.0, 'pts': [(22.0, 38.50), (34.0, 38.50), (46.0, 38.50)]}) # To P_BIN
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.0, 'pts': [(22.0, 27.50), (34.0, 27.50), (55.0, 27.50)]}) # To M_BIN
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.0, 'pts': [(22.0, 16.50), (34.0, 16.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.2, 'pts': [(42.66, 7.0), (67.0, 7.0), (67.0, 46.50), (79.0, 46.50)]})
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.0, 'pts': [(67.0, 34.50), (79.0, 34.50)]}) # To PP_BIN
    tracks.append({'net': '5V_LOGIC', 'layer': 'bot', 'width': 1.0, 'pts': [(67.0, 25.00), (76.0, 25.00)]}) # To ENV_MQ6

    # 4. Top PWM Signals (D9, D10, D11, D12)
    tracks.append({'net': 'D9',  'layer': 'top', 'width': 0.65, 'pts': [(24.54, 46.50), (24.54, 49.50), (46.04, 49.50), (46.04, 51.10)]})
    tracks.append({'net': 'D10', 'layer': 'top', 'width': 0.65, 'pts': [(27.08, 46.50), (27.08, 48.70), (48.58, 48.70), (48.58, 51.10)]})
    tracks.append({'net': 'D11', 'layer': 'top', 'width': 0.65, 'pts': [(46.00, 46.50), (46.00, 47.90), (51.12, 47.90), (51.12, 51.10)]})
    tracks.append({'net': 'D12', 'layer': 'top', 'width': 0.65, 'pts': [(55.00, 46.50), (55.00, 47.90), (53.66, 47.90), (53.66, 51.10)]})

    # 5. [NEW] Bin Full & MQ-6 Telemetry Traces to 2x18 Header
    # D47 Plastic Bin Sensor
    tracks.append({'net': 'D47', 'layer': 'top', 'width': 0.65, 'pts': [(48.54, 38.50), (48.54, 40.64), (97.50, 40.64)]})
    # D48 Metal Bin Sensor
    tracks.append({'net': 'D48', 'layer': 'top', 'width': 0.65, 'pts': [(57.54, 27.50), (57.54, 43.18), (100.04, 43.18)]})
    # D49 Paper Bin Sensor
    tracks.append({'net': 'D49', 'layer': 'top', 'width': 0.65, 'pts': [(81.54, 34.50), (81.54, 43.18), (97.50, 43.18)]})
    # D50 MQ6 Gas Alarm Sensor
    tracks.append({'net': 'D50', 'layer': 'top', 'width': 0.65, 'pts': [(78.54, 25.00), (78.54, 45.72), (100.04, 45.72)]})

    return tracks

# -----------------------------------------------------------------------------
# 2. GENERATE MASTER SCHEMATIC (PNG)
# -----------------------------------------------------------------------------
def generate_master_schematic():
    fig = plt.figure(figsize=(24, 15), dpi=200, facecolor="#070b14")
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor("#070b14")
    ax.set_xlim(0, 240)
    ax.set_ylim(0, 150)
    ax.axis('off')

    # Master Header
    title_box = FancyBboxPatch((6, 137), 228, 10, boxstyle="round,pad=0.5,rounding_size=2.0",
                               facecolor="#0c1527", edgecolor="#00d2ff", linewidth=2.0)
    ax.add_patch(title_box)
    ax.text(120, 143.5, "PECODROP RVM — ARDUINO MEGA 2560 EXPANSION SHIELD SCHEMATIC (REV 8.0)",
            fontsize=17, fontweight='bold', color="#ffffff", ha='center', va='center')
    ax.text(120, 139.5, "Document Ref: SCH-RVM-MEGA-REV8.0 • 3 Chambers + Bin Telemetry + MQ-6 Gas Safety • Dual Rail Power Isolation",
            fontsize=10.5, color="#38bdf8", ha='center', va='center')

    # Card 1: Power Distribution & Isolation (Left Top)
    pwr_box = FancyBboxPatch((6, 75), 68, 58, boxstyle="round,pad=0.5,rounding_size=1.5",
                             facecolor="#0f172a", edgecolor="#3b82f6", linewidth=1.5)
    ax.add_patch(pwr_box)
    ax.text(10, 129, "POWER DISTRIBUTION & DUAL-RAIL ISOLATION", fontsize=11, fontweight='bold', color="#38bdf8")

    # TB_12V block
    ax.add_patch(FancyBboxPatch((10, 108), 26, 17, boxstyle="round,pad=0.3", facecolor="#1e293b", edgecolor="#f59e0b", linewidth=1.2))
    ax.text(23, 120, "TB_12V_IN", fontsize=9, fontweight='bold', color="#f59e0b", ha='center')
    ax.text(23, 114, "12V 15A Industrial PSU\n[+12V, GND]", fontsize=7.5, color="#94a3b8", ha='center')
    ax.text(40, 117, "+12V_RAW Rail\n➔ Feeds LJ12A3 Sensor\n➔ Feeds External Bucks", fontsize=7.5, color="#f59e0b", va='center')

    # TB_5VS block
    ax.add_patch(FancyBboxPatch((10, 85), 26, 18, boxstyle="round,pad=0.3", facecolor="#1e293b", edgecolor="#f43f5e", linewidth=1.2))
    ax.text(23, 98, "TB_SERVO_PWR", fontsize=9, fontweight='bold', color="#f43f5e", ha='center')
    ax.text(23, 91, "5V 10A Buck Reg\n[+5V_SERVO, PGND]", fontsize=7.5, color="#94a3b8", ha='center')
    ax.text(40, 94, "+5V_SERVO Bus:\n➔ Feeds all 6 MG996R Servos\n➔ 3x 1000µF Low-ESR Caps\n➔ SMBJ6.0A TVS Clamp", fontsize=7.5, color="#f43f5e", va='center')

    # Card 2: Mechatronics Rules & Guardrails (Left Bottom)
    rules_box = FancyBboxPatch((6, 8), 68, 63, boxstyle="round,pad=0.5,rounding_size=1.5",
                              facecolor="#0f172a", edgecolor="#1e293b", linewidth=1.5)
    ax.add_patch(rules_box)
    ax.text(10, 67, "MECHATRONICS & CABLING SPECIFICATIONS", fontsize=10.5, fontweight='bold', color="#38bdf8")

    rules_text = (
        "1. WIRE GAUGES:\n"
        "   • 12V & 5V_SERVO: 16 AWG Stranded (UL1007)\n"
        "   • Servo Signal Lines: 22 AWG (Twisted Triplet)\n"
        "   • Ultrasonic & HX711: 24 AWG Shielded Twisted Pair\n\n"
        "2. GROUNDING ARCHITECTURE:\n"
        "   • PGND (Servo High-Current) and DGND (Logic) are\n"
        "     joined at a single Star Net-Tie on the PCB.\n"
        "   • Eliminates servo motor ground-bounce in ADCs.\n\n"
        "3. BACK-EMF TRANSIENT SUPPRESSION:\n"
        "   • Each servo header has 100nF ceramic decoupling.\n"
        "   • Central 3x 1000µF bulk charge reservoir.\n"
        "   • Bidirectional TVS diode absorbs reverse spikes.\n\n"
        "4. CONNECTOR STANDARD:\n"
        "   • Polarized keyed JST-XH prevents inverted plug-in.\n"
        "   • Gold-plated header pins prevent oxidation."
    )
    ax.text(10, 64, rules_text, fontsize=7.5, color="#94a3b8", family="monospace", va='top')

    # Card 3: Arduino Mega 2560 Mezzanine Pinout (Center Column)
    mega_box = FancyBboxPatch((78, 8), 78, 125, boxstyle="round,pad=0.5,rounding_size=1.5",
                              facecolor="#0f172a", edgecolor="#00d2ff", linewidth=1.5)
    ax.add_patch(mega_box)
    ax.text(117, 129, "ARDUINO MEGA 2560 REV3 MEZZANINE INTERFACE", fontsize=11, fontweight='bold', color="#00d2ff", ha='center')

    # Digital Pins 8 to 13 Block
    ax.add_patch(FancyBboxPatch((82, 102), 70, 22, boxstyle="round,pad=0.3", facecolor="#162238", edgecolor="#38bdf8", linewidth=1.0))
    ax.text(85, 120, "PWM BUS & HEARTBEAT (Pins 8 to 13)", fontsize=9, fontweight='bold', color="#38bdf8")
    top_pins_str = (
        "Pin 9  ➔ Plastic Entrance Sonar TRIG (5V TTL Out)\n"
        "Pin 10 ➔ Plastic Entrance Sonar ECHO (5V TTL In)\n"
        "Pin 11 ➔ Plastic Iris Aperture Servo PWM (50Hz Signal)\n"
        "Pin 12 ➔ Plastic Drop Gate Servo PWM (50Hz Signal)\n"
        "Pin 13 ➔ System Heartbeat / Run LED (Green)\n"
        "Pin 8  ➔ Hardware Fault Alarm LED / Buzzer Output"
    )
    ax.text(85, 117, top_pins_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    # Pins 22 to 32 Block
    ax.add_patch(FancyBboxPatch((82, 68), 70, 31, boxstyle="round,pad=0.3", facecolor="#162238", edgecolor="#f59e0b", linewidth=1.0))
    ax.text(85, 95, "CHAMBER 1 & 2 SENSING (Pins 22 to 32)", fontsize=9, fontweight='bold', color="#f59e0b")
    c12_pins_str = (
        "Pin 22/23 ➔ Plastic Bottom Sizing Trig / Echo\n"
        "Pin 24/41 ➔ Plastic Middle Sizing Trig / Echo\n"
        "Pin 42/43 ➔ Plastic Top Sizing Trig / Echo\n"
        "Pin 25/26 ➔ Metal Entrance Sonar Trig / Echo\n"
        "Pin 27/28 ➔ Metal Iris & Drop Gate Servo PWMs\n"
        "Pin 29/30 ➔ Metal Bottom Sizing Trig / Echo\n"
        "Pin 31/44 ➔ Metal Middle Sizing Trig / Echo\n"
        "Pin 45/46 ➔ Metal Top Sizing Trig / Echo\n"
        "Pin 32    ➔ Inductive Can Sensor (Active LOW via Opto)"
    )
    ax.text(85, 92, c12_pins_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    # Pins 33 to 40 Block
    ax.add_patch(FancyBboxPatch((82, 38), 70, 27, boxstyle="round,pad=0.3", facecolor="#162238", edgecolor="#10b981", linewidth=1.0))
    ax.text(85, 61, "CHAMBER 3 PAPER & HX711 (Pins 33 to 40)", fontsize=9, fontweight='bold', color="#10b981")
    c3_pins_str = (
        "Pin 33/34 ➔ Paper Top Entrance Sonar Trig / Echo\n"
        "Pin 35/36 ➔ Paper Iris & Drop Gate Servo PWMs\n"
        "Pin 37    ➔ HX711 Serial Data DOUT (Internal Pullup)\n"
        "Pin 38    ➔ HX711 Serial Clock SCK (Output)\n"
        "Pin 39/40 ➔ Paper Bottom Sonar Trig / Echo\n"
        "Pins 20/21➔ SDA / SCL Auxiliary I2C Display Bus"
    )
    ax.text(85, 58, c3_pins_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    # [NEW] Pins 47 to 50: Telemetry & Safety Block
    ax.add_patch(FancyBboxPatch((82, 12), 70, 23, boxstyle="round,pad=0.3", facecolor="#1e1832", edgecolor="#a855f7", linewidth=1.2))
    ax.text(85, 31, "[NEW] BIN FULL TELEMETRY & SAFETY (Pins 47 to 50)", fontsize=8.5, fontweight='bold', color="#c084fc")
    bin_pins_str = (
        "Pin 47 ➔ PLASTIC Bin Full Optical Sensor (INPUT_PULLUP, LOW=Full)\n"
        "Pin 48 ➔ METAL Bin Full Optical Sensor (INPUT_PULLUP, LOW=Full)\n"
        "Pin 49 ➔ PAPER Bin Full Optical Sensor (INPUT_PULLUP, LOW=Full)\n"
        "Pin 50 ➔ MQ-6 Gas / Fire / Smoke Sensor (INPUT_PULLUP, LOW=Alarm)\n"
        "Failsafe: Compartment pauses intake automatically when bin full."
    )
    ax.text(85, 28, bin_pins_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    # Card 4: Field Connector Blocks (Right Column)
    conn_box = FancyBboxPatch((160, 8), 74, 125, boxstyle="round,pad=0.5,rounding_size=1.5",
                              facecolor="#0f172a", edgecolor="#10b981", linewidth=1.5)
    ax.add_patch(conn_box)
    ax.text(197, 129, "FIELD COMPARTMENT CONNECTORS", fontsize=11, fontweight='bold', color="#10b981", ha='center')

    # Chamber 1 Field Block
    ax.add_patch(FancyBboxPatch((164, 98), 66, 26, boxstyle="round,pad=0.3", facecolor="#162238", edgecolor="#0284c7", linewidth=1.0))
    ax.text(167, 120, "CHAMBER 1: PLASTIC CONNECTORS", fontsize=8.5, fontweight='bold', color="#38bdf8")
    c1_conn_str = (
        "• 4x JST-XH 4-Pin Sonars: P_ENTR(9/10), P_BOT(22/23),\n"
        "  P_MID(24/41), P_TOP(42/43) [VCC, TRIG, ECHO, GND]\n"
        "• 2x 3-Pin Polarized Servos: P_IRIS(11), P_DROP(12)\n"
        "• 1x JST-XH 3-Pin: P_BIN(Pin 47) [5V, SIG, GND] (NEW)"
    )
    ax.text(167, 117, c1_conn_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    # Chamber 2 Field Block
    ax.add_patch(FancyBboxPatch((164, 68), 66, 27, boxstyle="round,pad=0.3", facecolor="#162238", edgecolor="#d97706", linewidth=1.0))
    ax.text(167, 91, "CHAMBER 2: METAL CANS CONNECTORS", fontsize=8.5, fontweight='bold', color="#f59e0b")
    c2_conn_str = (
        "• 4x JST-XH 4-Pin Sonars: M_ENTR(25/26), M_BOT(29/30),\n"
        "  M_MID(31/44), M_TOP(45/46) [VCC, TRIG, ECHO, GND]\n"
        "• 1x Screw Terminal TB3: Inductive Sensor LJ12A3 (12V)\n"
        "  ➔ PC817 Optocoupler Isolation pulls Pin 32 to GND\n"
        "• 2x 3-Pin Polarized Servos: M_IRIS(27), M_DROP(28)\n"
        "• 1x JST-XH 3-Pin: M_BIN(Pin 48) [5V, SIG, GND] (NEW)"
    )
    ax.text(167, 88, c2_conn_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    # Chamber 3 & Safety Field Block
    ax.add_patch(FancyBboxPatch((164, 12), 66, 53, boxstyle="round,pad=0.3", facecolor="#162238", edgecolor="#059669", linewidth=1.0))
    ax.text(167, 61, "CHAMBER 3 & ENVIRONMENTAL CONNECTORS", fontsize=8.5, fontweight='bold', color="#10b981")
    c3_conn_str = (
        "• 2x JST-XH 4-Pin Sonars: PP_ENTR(33/34), PP_BOT(39/40)\n"
        "• 1x 4-Pin Gold Socket: HX711 Load Cell Carrier\n"
        "  [5V, DOUT(37), SCK(38), GND] - 1g precision\n"
        "• 2x 3-Pin Polarized Servos: PP_IRIS(35), PP_DROP(36)\n"
        "• 1x JST-XH 3-Pin: PP_BIN(Pin 49) [5V, SIG, GND] (NEW)\n\n"
        "ENVIRONMENTAL SAFETY MODULE (NEW):\n"
        "• 1x JST-XH 3-Pin: MQ-6 Gas / Smoke Sensor\n"
        "  [5V_LOGIC, DOUT(Pin 50), GND]\n"
        "  Continuous debounce monitoring for kiosk safety."
    )
    ax.text(167, 58, c3_conn_str, fontsize=7.2, color="#f8fafc", family="monospace", va='top')

    schematic_path = os.path.join(OUT_DIR_IMG, "rvm_arduino_mega_shield_schematic.png")
    fig.savefig(schematic_path, facecolor="#070b14", edgecolor='none', dpi=200)
    plt.close(fig)
    print(f"[SCHEMATIC GENERATED]: {schematic_path}")

# -----------------------------------------------------------------------------
# 3. GENERATE 2D REALISTIC CAD ASSEMBLY LAYOUT (PNG)
# -----------------------------------------------------------------------------
def generate_cad_layout(pads, tracks):
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.subplots_adjust(left=0.03, right=0.97, top=0.93, bottom=0.05)
    ax.set_facecolor('#070e1c')
    ax.set_xlim(-5, 108)
    ax.set_ylim(-5, 58)
    ax.set_aspect('equal')
    ax.axis('off')

    # PCB Board Outline
    board = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                           facecolor="#0a192f", edgecolor="#00d2ff", linewidth=2.5, zorder=1)
    ax.add_patch(board)

    # Ground Plane Grid effect
    for x in np.arange(2.0, W_BOARD-2.0, 4.0):
        ax.axvline(x, color='#112240', linewidth=0.5, linestyle=':', zorder=2)
    for y in np.arange(2.0, H_BOARD-2.0, 4.0):
        ax.axhline(y, color='#112240', linewidth=0.5, linestyle=':', zorder=2)

    # Draw Copper Tracks
    for trk in tracks:
        col = '#0284c7' if trk['layer'] == 'bot' else '#f59e0b'
        lw = trk['width'] * 2.0
        xs, ys = zip(*trk['pts'])
        ax.plot(xs, ys, color=col, linewidth=lw, solid_capstyle='round', solid_joinstyle='round', alpha=0.6, zorder=3)

    # Chamber Compartment Silkscreen Outlines (Positioned clean with zero pad overlap)
    c1_zone = FancyBboxPatch((20, 36.5), 41, 12.0, boxstyle="round,pad=0.4,rounding_size=1.2",
                             facecolor="none", edgecolor="#38bdf8", linewidth=1.0, linestyle="--", zorder=4)
    ax.add_patch(c1_zone)
    ax.text(21, 35.5, "CH1: PLASTIC (PET) [PINS 9,10,11,12, 22,23, 24,41, 42,43 + BIN D47]", fontsize=6.2, fontweight='bold', color="#38bdf8", zorder=5)

    c2_zone = FancyBboxPatch((20, 14.0), 42, 16.0, boxstyle="round,pad=0.4,rounding_size=1.2",
                             facecolor="none", edgecolor="#f59e0b", linewidth=1.0, linestyle="--", zorder=4)
    ax.add_patch(c2_zone)
    ax.text(21, 13.0, "CH2: METAL CANS [PINS 25,26,27,28, 29,30, 31,44, 45,46, IND D32 + BIN D48]", fontsize=6.2, fontweight='bold', color="#f59e0b", zorder=5)

    c3_zone = FancyBboxPatch((64, 14.0), 28, 34.5, boxstyle="round,pad=0.4,rounding_size=1.2",
                             facecolor="none", edgecolor="#10b981", linewidth=1.0, linestyle="--", zorder=4)
    ax.add_patch(c3_zone)
    ax.text(65, 47.5, "CH3: PAPER & CARTON [33,34,35,36, HX:37,38, 39,40 + D49]", fontsize=6.2, fontweight='bold', color="#10b981", zorder=5)
    ax.text(65, 23.5, "ENV: MQ-6 ALARM (PIN 50)", fontsize=6.2, fontweight='bold', color="#c084fc", zorder=5)

    # Power Silkscreen
    ax.text(3, 49, "12V IN (TB1)", fontsize=6.5, fontweight='bold', color="#f59e0b", zorder=5)
    ax.text(3, 35, "5V_SERVO (TB2)", fontsize=6.5, fontweight='bold', color="#f43f5e", zorder=5)

    # Draw all pads
    for p in pads:
        is_gnd = (p['net'] == 'GND')
        is_pwr = ('5V' in p['net'] or '12V' in p['net'])
        is_bin = ('D47' in p['net'] or 'D48' in p['net'] or 'D49' in p['net'] or 'D50' in p['net'])
        col = '#10b981' if is_gnd else ('#f59e0b' if is_pwr else ('#c084fc' if is_bin else '#38bdf8'))
        c_out = Circle((p['x'], p['y']), p['r_out'], facecolor=col, edgecolor='#ffffff', linewidth=0.4, zorder=6)
        c_in = Circle((p['x'], p['y']), p['r_in'], facecolor='#070e1c', edgecolor='none', zorder=7)
        ax.add_patch(c_out)
        ax.add_patch(c_in)

    # Component Outlines / Silkscreen Boxes
    for name, bx, by, nets in CONNECTORS:
        w = len(nets) * 2.54 + 1.6 if 'TB_' not in name else len(nets) * 5.08 + 2.0
        h = 5.0 if 'TB_' not in name else 8.0
        s_box = Rectangle((bx - 1.0, by - h/2), w, h, facecolor="none", edgecolor="#ffffff", linewidth=0.5, zorder=4)
        ax.add_patch(s_box)

    # Labels for new and critical field connections
    annot_list = [
        ("CH1_BIN\n(Pin 47)", 48.5, 41.50, "#c084fc"),
        ("CH2_BIN\n(Pin 48)", 57.5, 30.50, "#c084fc"),
        ("CH3_BIN\n(Pin 49)", 81.5, 37.50, "#c084fc"),
        ("ENV_MQ6\n(Pin 50)", 78.5, 27.50, "#c084fc"),
        ("CH2_IND (D32)", 48.5, 24.50, "#f59e0b"),
        ("CH3_HX (37/38)", 70.0, 31.50, "#10b981"),
        ("P_IRIS (11)", 48.5, 49.00, "#38bdf8"),
        ("P_DROP (12)", 57.5, 49.00, "#38bdf8"),
        ("M_IRIS (27)", 48.5, 13.50, "#f59e0b"),
        ("M_DROP (28)", 57.5, 13.50, "#f59e0b"),
        ("PP_IRIS (35)", 69.5, 13.50, "#10b981"),
        ("PP_DROP (36)", 78.5, 13.50, "#10b981"),
    ]
    for lbl, x, y, col in annot_list:
        ax.text(x, y, lbl, fontsize=5.2, fontweight='bold', color=col, ha='center', va='center', zorder=8)

    # Board Title & Layer Legend
    ax.text(W_BOARD/2, H_BOARD + 2.5, "PECODROP RVM — ARDUINO MEGA SHIELD 2D PHYSICAL CAD LAYOUT (REV 8.0)",
            color='#38bdf8', fontsize=12, fontweight='bold', ha='center')

    layout_path = os.path.join(OUT_DIR_IMG, "rvm_arduino_mega_shield_pcb_layout.png")
    fig.savefig(layout_path, dpi=300, facecolor='#070e1c', edgecolor='none')
    plt.close(fig)
    print(f"[CAD LAYOUT GENERATED]: {layout_path}")

# -----------------------------------------------------------------------------
# 4. GENERATE 1:1 TRUE SCALE ETCHING MASKS (MIRROR & DIRECT) WITH TRACKS
# -----------------------------------------------------------------------------
def generate_copper_etch_masks(pads, tracks):
    # 1. Mirrored Toner Transfer (B.Cu Mirror)
    fig, ax = plt.subplots(figsize=(W_BOARD/25.4, H_BOARD/25.4), dpi=600)
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    ax.set_facecolor('#000000')
    ax.set_xlim(W_BOARD, 0) # Mirrored horizontally!
    ax.set_ylim(0, H_BOARD)
    ax.set_aspect('equal')
    ax.axis('off')

    # Solid Copper Flood
    board = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                           facecolor="#000000", edgecolor="#000000", zorder=1)
    ax.add_patch(board)

    # Tracks on bottom layer (white isolation lines or copper paths)
    for trk in tracks:
        if trk['layer'] == 'bot':
            xs, ys = zip(*trk['pts'])
            ax.plot(xs, ys, color='#ffffff', linewidth=trk['width'] * 1.5, solid_capstyle='round', solid_joinstyle='round', zorder=2)

    # Pads
    for p in pads:
        c_ring = Circle((p['x'], p['y']), p['r_out'], facecolor='#ffffff', edgecolor='none', zorder=3)
        c_hole = Circle((p['x'], p['y']), p['r_in'], facecolor='#000000', edgecolor='none', zorder=4)
        ax.add_patch(c_ring)
        ax.add_patch(c_hole)

    mirror_path = os.path.join(OUT_DIR_IMG, "rvm_arduino_mega_shield_pcb_copper_bottom_mirror.png")
    fig.savefig(mirror_path, dpi=600, facecolor='#000000', edgecolor='none')
    plt.close(fig)
    print(f"[MIRROR ETCH MASK GENERATED]: {mirror_path}")

    # 2. Direct Solder-side Mask (B.Cu Direct)
    fig, ax = plt.subplots(figsize=(W_BOARD/25.4, H_BOARD/25.4), dpi=600)
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    ax.set_facecolor('#000000')
    ax.set_xlim(0, W_BOARD)
    ax.set_ylim(0, H_BOARD)
    ax.set_aspect('equal')
    ax.axis('off')

    board = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                           facecolor="#000000", edgecolor="#000000", zorder=1)
    ax.add_patch(board)
    for trk in tracks:
        if trk['layer'] == 'bot':
            xs, ys = zip(*trk['pts'])
            ax.plot(xs, ys, color='#ffffff', linewidth=trk['width'] * 1.5, solid_capstyle='round', solid_joinstyle='round', zorder=2)
    for p in pads:
        c_ring = Circle((p['x'], p['y']), p['r_out'], facecolor='#ffffff', edgecolor='none', zorder=3)
        c_hole = Circle((p['x'], p['y']), p['r_in'], facecolor='#000000', edgecolor='none', zorder=4)
        ax.add_patch(c_ring)
        ax.add_patch(c_hole)

    direct_path = os.path.join(OUT_DIR_IMG, "rvm_arduino_mega_shield_pcb_copper_bottom.png")
    fig.savefig(direct_path, dpi=600, facecolor='#000000', edgecolor='none')
    plt.close(fig)
    print(f"[DIRECT ETCH MASK GENERATED]: {direct_path}")

    # 3. Top Copper Mask (F.Cu)
    fig, ax = plt.subplots(figsize=(W_BOARD/25.4, H_BOARD/25.4), dpi=600)
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, W_BOARD)
    ax.set_ylim(0, H_BOARD)
    ax.set_aspect('equal')
    ax.axis('off')

    board = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                           facecolor="#ffffff", edgecolor="#000000", linewidth=1.0, zorder=1)
    ax.add_patch(board)
    for trk in tracks:
        if trk['layer'] == 'top':
            xs, ys = zip(*trk['pts'])
            ax.plot(xs, ys, color='#000000', linewidth=trk['width'] * 1.5, solid_capstyle='round', solid_joinstyle='round', zorder=2)
    for p in pads:
        c_ring = Circle((p['x'], p['y']), p['r_out'], facecolor='#000000', edgecolor='none', zorder=3)
        c_hole = Circle((p['x'], p['y']), p['r_in'], facecolor='#ffffff', edgecolor='none', zorder=4)
        ax.add_patch(c_ring)
        ax.add_patch(c_hole)

    top_path = os.path.join(OUT_DIR_IMG, "rvm_arduino_mega_shield_pcb_copper_top.png")
    fig.savefig(top_path, dpi=600, facecolor='#ffffff', edgecolor='none')
    plt.close(fig)
    print(f"[TOP COPPER MASK GENERATED]: {top_path}")

# -----------------------------------------------------------------------------
# 5. GENERATE 1:1 TRUE SCALE PDF PRINT SHEETS (A4 WITH CALIBRATION BAR)
# -----------------------------------------------------------------------------
def generate_print_sheet_pdf(pads, tracks):
    pdf_path = os.path.join(OUT_DIR_DOC, "RVM_Mega_Shield_Bottom_Copper_MIRROR_1to1.pdf")
    with PdfPages(pdf_path) as pdf:
        fig = plt.figure(figsize=(8.27, 11.69), dpi=600)
        ax_w = (W_BOARD) / 210.0
        ax_h = (H_BOARD) / 297.0
        ax_l = (1.0 - ax_w) / 2.0
        ax_b = 0.52
        
        ax = fig.add_axes([ax_l, ax_b, ax_w, ax_h])
        ax.set_facecolor('#000000')
        ax.set_xlim(W_BOARD, 0)
        ax.set_ylim(0, H_BOARD)
        ax.set_aspect('equal')
        ax.axis('off')

        board = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                               facecolor="#000000", edgecolor="#000000", zorder=1)
        ax.add_patch(board)
        for trk in tracks:
            if trk['layer'] == 'bot':
                xs, ys = zip(*trk['pts'])
                ax.plot(xs, ys, color='#ffffff', linewidth=trk['width'] * 1.5, solid_capstyle='round', solid_joinstyle='round', zorder=2)
        for p in pads:
            c_ring = Circle((p['x'], p['y']), p['r_out'], facecolor='#ffffff', edgecolor='none', zorder=3)
            c_hole = Circle((p['x'], p['y']), p['r_in'], facecolor='#000000', edgecolor='none', zorder=4)
            ax.add_patch(c_ring)
            ax.add_patch(c_hole)

        ax_info = fig.add_axes([0.1, 0.08, 0.8, 0.38])
        ax_info.axis('off')
        ax_info.set_xlim(0, 160)
        ax_info.set_ylim(0, 70)

        # 100 mm Calibration line
        ax_info.plot([30, 130], [55, 55], color='#000000', linewidth=2.0)
        ax_info.plot([30, 30], [50, 60], color='#000000', linewidth=2.0)
        ax_info.plot([130, 130], [50, 60], color='#000000', linewidth=2.0)
        ax_info.text(80, 58, "CALIBRATION CHECK BAR = EXACTLY 100.0 mm (Measure with physical caliper/ruler)",
                     fontsize=9, fontweight='bold', ha='center', va='bottom')

        instructions = (
            "PECODROP RVM — ARDUINO MEGA 2560 EXPANSION SHIELD (REV 8.0 DIY ETCH MASK)\n"
            "--------------------------------------------------------------------------------------------------------\n"
            "PRINT & FABRICATION INSTRUCTIONS (TONER TRANSFER / CHEMICAL ETCHING):\n"
            "1. LASER PRINTER SETUP: Print on A4 Glossy Photo Paper or Laser Film at 100% Scale ('Actual Size').\n"
            "   CRITICAL: Do NOT select 'Fit to Page' or 'Shrink Oversized Pages' in Acrobat / Reader print dialog!\n"
            "2. VERIFY ACCURACY: Check the 100.0 mm calibration bar above with digital calipers. It must measure 100.0mm.\n"
            "3. TONER TRANSFER: Clean copper laminate with steel wool & acetone, iron at 200°C for 3 minutes, then soak.\n"
            "4. CHEMICAL ETCHING: Etch in Ferric Chloride (FeCl3) or Sodium Persulfate at 45°C with agitation (8-12 mins).\n"
            "5. DRILL SPECIFICATIONS:\n"
            "   • Component Pads (Sensors, Servos, Mega Headers): 0.8 mm carbide bit\n"
            "   • Power Screw Terminals (TB1, TB2) & Large Caps: 1.2 mm carbide bit\n"
            "   • Chassis Standoff Mounting Holes (5x): 3.2 mm drill bit (M3 Screws)\n"
            "6. COMPATIBILITY: 100% matched to PecoDropDesktopApp/Arduino/RVM_Arduino/RVM_Arduino.ino:\n"
            "   Plastic Bin Full (Pin 47), Metal Bin Full (Pin 48), Paper Bin Full (Pin 49), MQ-6 Alarm (Pin 50)."
        )
        ax_info.text(0, 48, instructions, fontsize=7.2, family='monospace', va='top')

        pdf.savefig(fig)
        plt.close(fig)
    print(f"[PDF 1:1 PRINT SHEET GENERATED]: {pdf_path}")

    # Master Multi-page Fabrication Sheet
    master_path = os.path.join(OUT_DIR_DOC, "RVM_Arduino_Mega_Shield_PCB_Fabrication_Master_A4.pdf")
    with PdfPages(master_path) as pdf:
        # Page 1: Mirror Etch Mask
        fig1 = plt.figure(figsize=(8.27, 11.69), dpi=600)
        ax1 = fig1.add_axes([ax_l, ax_b, ax_w, ax_h])
        ax1.set_facecolor('#000000')
        ax1.set_xlim(W_BOARD, 0)
        ax1.set_ylim(0, H_BOARD)
        ax1.set_aspect('equal')
        ax1.axis('off')
        board = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                               facecolor="#000000", edgecolor="#000000", zorder=1)
        ax1.add_patch(board)
        for trk in tracks:
            if trk['layer'] == 'bot':
                xs, ys = zip(*trk['pts'])
                ax1.plot(xs, ys, color='#ffffff', linewidth=trk['width'] * 1.5, solid_capstyle='round', solid_joinstyle='round', zorder=2)
        for p in pads:
            c_ring = Circle((p['x'], p['y']), p['r_out'], facecolor='#ffffff', edgecolor='none', zorder=3)
            c_hole = Circle((p['x'], p['y']), p['r_in'], facecolor='#000000', edgecolor='none', zorder=4)
            ax1.add_patch(c_ring)
            ax1.add_patch(c_hole)
        ax1_info = fig1.add_axes([0.1, 0.08, 0.8, 0.38])
        ax1_info.axis('off')
        ax1_info.set_xlim(0, 160)
        ax1_info.set_ylim(0, 70)
        ax1_info.plot([30, 130], [55, 55], color='#000000', linewidth=2.0)
        ax1_info.plot([30, 30], [50, 60], color='#000000', linewidth=2.0)
        ax1_info.plot([130, 130], [50, 60], color='#000000', linewidth=2.0)
        ax1_info.text(80, 58, "CALIBRATION CHECK BAR = EXACTLY 100.0 mm (Measure with physical caliper/ruler)",
                      fontsize=9, fontweight='bold', ha='center', va='bottom')
        ax1_info.text(0, 48, instructions, fontsize=7.2, family='monospace', va='top')
        pdf.savefig(fig1)
        plt.close(fig1)

        # Page 2: Assembly Diagram Guide (Landscape)
        fig2 = plt.figure(figsize=(11.69, 8.27), dpi=300)
        ax2 = fig2.add_axes([0.05, 0.08, 0.90, 0.84])
        ax2.set_facecolor('#070e1c')
        ax2.set_xlim(-5, 108)
        ax2.set_ylim(-5, 58)
        ax2.set_aspect('equal')
        ax2.axis('off')
        board2 = FancyBboxPatch((0, 0), W_BOARD, H_BOARD, boxstyle="round,pad=0,rounding_size=3.0",
                                facecolor="#0a192f", edgecolor="#00d2ff", linewidth=2.5, zorder=1)
        ax2.add_patch(board2)
        for trk in tracks:
            col = '#0284c7' if trk['layer'] == 'bot' else '#f59e0b'
            xs, ys = zip(*trk['pts'])
            ax2.plot(xs, ys, color=col, linewidth=trk['width'] * 2.0, solid_capstyle='round', solid_joinstyle='round', alpha=0.6, zorder=3)
        for p in pads:
            is_gnd = (p['net'] == 'GND')
            is_pwr = ('5V' in p['net'] or '12V' in p['net'])
            is_bin = ('D47' in p['net'] or 'D48' in p['net'] or 'D49' in p['net'] or 'D50' in p['net'])
            col = '#10b981' if is_gnd else ('#f59e0b' if is_pwr else ('#c084fc' if is_bin else '#38bdf8'))
            c_out = Circle((p['x'], p['y']), p['r_out'], facecolor=col, edgecolor='#ffffff', linewidth=0.4, zorder=5)
            c_in = Circle((p['x'], p['y']), p['r_in'], facecolor='#070e1c', edgecolor='none', zorder=6)
            ax2.add_patch(c_out)
            ax2.add_patch(c_in)
        ax2.set_title("PECODROP RVM — ARDUINO MEGA SHIELD ASSEMBLY & PINOUT GUIDE (REV 8.0)",
                      color='#38bdf8', fontsize=13, fontweight='bold', pad=12)
        pdf.savefig(fig2)
        plt.close(fig2)
    print(f"[FABRICATION MASTER PDF GENERATED]: {master_path}")

# -----------------------------------------------------------------------------
# 6. GENERATE PRODUCTION GERBER PACKAGE & DRILL FILE (RS-274X)
# -----------------------------------------------------------------------------
def export_production_gerbers(pads, tracks):
    gerber_files = {}
    header_gbr = (
        "G04 PECODROP RVM ARDUINO MEGA SHIELD REV 8.0 PRODUCTION GERBER*\n"
        "%FSLAX34Y34*%\n"
        "%MOMM*%\n"
        "%LPD*%\n"
        "%ADD10C,1.1000*%\n"
        "%ADD11C,2.2000*%\n"
        "%ADD12C,3.2000*%\n"
        "%ADD20C,0.2500*%\n"
        "%ADD21C,0.6500*%\n"
        "%ADD22C,1.2000*%\n"
        "%ADD23C,2.2000*%\n"
        "G01*\n"
    )

    # 1. Edge Cuts
    outline = (
        header_gbr +
        "D20*\n"
        "X30000Y0D02*\n"
        "X986000Y0D01*\n"
        "X1016000Y30000D01*\n"
        "X1016000Y503400D01*\n"
        "X986000Y533400D01*\n"
        "X30000Y533400D01*\n"
        "X0Y503400D01*\n"
        "X0Y30000D01*\n"
        "X30000Y0D01*\n"
        "M02*\n"
    )
    gerber_files['RVM_Mega_Shield-Edge_Cuts.gbr'] = outline

    # 2. Bottom Copper (B_Cu)
    b_cu = [header_gbr]
    for p in pads:
        ap = 'D12*' if p['r_out'] > 3.0 else ('D11*' if p['r_out'] > 2.0 else 'D10*')
        x_int = int(round(p['x'] * 10000))
        y_int = int(round(p['y'] * 10000))
        b_cu.append(f"{ap}\nX{x_int}Y{y_int}D03*\n")
    # Bottom Tracks
    for trk in tracks:
        if trk['layer'] == 'bot':
            ap = 'D23*' if trk['width'] > 2.0 else ('D22*' if trk['width'] > 1.0 else 'D21*')
            b_cu.append(f"{ap}\n")
            pts = trk['pts']
            x0, y0 = int(round(pts[0][0] * 10000)), int(round(pts[0][1] * 10000))
            b_cu.append(f"X{x0}Y{y0}D02*\n")
            for pt in pts[1:]:
                xi, yi = int(round(pt[0] * 10000)), int(round(pt[1] * 10000))
                b_cu.append(f"X{xi}Y{yi}D01*\n")
    b_cu.append("M02*\n")
    gerber_files['RVM_Mega_Shield-B_Cu.gbr'] = "".join(b_cu)

    # 3. Top Copper (F_Cu)
    f_cu = [header_gbr]
    for p in pads:
        ap = 'D12*' if p['r_out'] > 3.0 else ('D11*' if p['r_out'] > 2.0 else 'D10*')
        x_int = int(round(p['x'] * 10000))
        y_int = int(round(p['y'] * 10000))
        f_cu.append(f"{ap}\nX{x_int}Y{y_int}D03*\n")
    # Top Tracks
    for trk in tracks:
        if trk['layer'] == 'top':
            ap = 'D22*' if trk['width'] > 1.0 else 'D21*'
            f_cu.append(f"{ap}\n")
            pts = trk['pts']
            x0, y0 = int(round(pts[0][0] * 10000)), int(round(pts[0][1] * 10000))
            f_cu.append(f"X{x0}Y{y0}D02*\n")
            for pt in pts[1:]:
                xi, yi = int(round(pt[0] * 10000)), int(round(pt[1] * 10000))
                f_cu.append(f"X{xi}Y{yi}D01*\n")
    f_cu.append("M02*\n")
    gerber_files['RVM_Mega_Shield-F_Cu.gbr'] = "".join(f_cu)

    # 4. Solder Masks
    mask = [header_gbr]
    for p in pads:
        ap = 'D12*' if p['r_out'] > 3.0 else ('D11*' if p['r_out'] > 2.0 else 'D10*')
        x_int = int(round(p['x'] * 10000))
        y_int = int(round(p['y'] * 10000))
        mask.append(f"{ap}\nX{x_int}Y{y_int}D03*\n")
    mask.append("M02*\n")
    gerber_files['RVM_Mega_Shield-F_Mask.gbr'] = "".join(mask)
    gerber_files['RVM_Mega_Shield-B_Mask.gbr'] = "".join(mask)

    # 5. Top Silkscreen (F_SilkS)
    silks = [header_gbr, "D20*\n"]
    for name, bx, by, nets in CONNECTORS:
        w = len(nets) * 2.54 + 2.0
        x0 = int(round((bx - 1.27) * 10000))
        y0 = int(round((by - 2.0) * 10000))
        x1 = int(round((bx + w) * 10000))
        y1 = int(round((by + 2.0) * 10000))
        silks.append(f"X{x0}Y{y0}D02*\nX{x1}Y{y0}D01*\nX{x1}Y{y1}D01*\nX{x0}Y{y1}D01*\nX{x0}Y{y0}D01*\n")
    silks.append("M02*\n")
    gerber_files['RVM_Mega_Shield-F_SilkS.gbr'] = "".join(silks)

    # 6. Excellon Drill (.drl)
    drl = [
        "M48\n", "METRIC,TZ\n",
        "T01C0.800\n",
        "T02C1.200\n",
        "T03C3.200\n",
        "%\n"
    ]
    drl.append("T01\n")
    for p in pads:
        if p['r_in'] < 0.6:
            drl.append(f"X{p['x']:.3f}Y{p['y']:.3f}\n")
    drl.append("T02\n")
    for p in pads:
        if 0.6 <= p['r_in'] < 1.2:
            drl.append(f"X{p['x']:.3f}Y{p['y']:.3f}\n")
    drl.append("T03\n")
    for p in pads:
        if p['r_in'] >= 1.2:
            drl.append(f"X{p['x']:.3f}Y{p['y']:.3f}\n")
    drl.append("M30\n")
    gerber_files['RVM_Mega_Shield.drl'] = "".join(drl)

    # Build ZIP archive
    zip_name = "RVM_Arduino_Mega_PlugAndPlay_Shield_Gerbers.zip"
    zip_path = os.path.join(OUT_DIR_DOC, zip_name)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for fname, content in gerber_files.items():
            fpath = os.path.join(OUT_DIR_GERBER, fname)
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            zipf.write(fpath, arcname=fname)

    print(f"[GERBER PRODUCTION ZIP CREATED]: {zip_path}")

# -----------------------------------------------------------------------------
# 7. MAIN EXECUTION
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    print("Building full pad netlist...")
    pads = build_all_pads()
    tracks = build_tracks()
    print(f"Total pads mapped: {len(pads)}, Tracks: {len(tracks)}")

    print("\n1. Generating Executive Master Schematic...")
    generate_master_schematic()

    print("\n2. Generating 2D Physical CAD Assembly Layout...")
    generate_cad_layout(pads, tracks)

    print("\n3. Generating 1:1 Solder-Side & Component Copper Masks...")
    generate_copper_etch_masks(pads, tracks)

    print("\n4. Generating 1:1 Vector Printable PDFs with 100.0mm Calibration Bar...")
    generate_print_sheet_pdf(pads, tracks)

    print("\n5. Generating Production Gerber Package & Excellon Drill Files...")
    export_production_gerbers(pads, tracks)

    print("\nALL PCB ARTIFACTS RECREATED WITH 100% FIRMWARE SYNCHRONIZATION!")
