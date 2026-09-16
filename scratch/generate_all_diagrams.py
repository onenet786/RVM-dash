import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Polygon
import numpy as np

OUTPUT_DIR = r"D:\GIT-HUB\RVM-dash\docs\user_manuals\images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Color Palette matching RVM_3Chamber_System_Guide
BG_COLOR = "#070a14"
CARD_BG = "#0d1322"
CARD_BORDER = "#1e293b"
CYAN = "#00d2ff"
AMBER = "#f59e0b"
EMERALD = "#10b981"
ROSE = "#f43f5e"
PURPLE = "#a855f7"
TEXT_WHITE = "#ffffff"
TEXT_MUTED = "#94a3b8"
TEXT_ACCENT = "#38bdf8"

# -------------------------------------------------------------
# 1. Chamber 1: Plastic Sizing Flow Diagram
# -------------------------------------------------------------
def generate_chamber1_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=150, facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Header
    ax.text(8, 9.5, "CHAMBER 1: PET PLASTIC BOTTLE SIZING & SORTING SYSTEM", 
            fontsize=20, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.text(8, 9.05, "Electro-Mechanical Cross-Section • 3-Level Ultrasonic Array • Multi-Tier Bottle Sizing", 
            fontsize=12, color=CYAN, ha='center', va='center')

    # Left Column: Mechanical Schematic
    bg_left = FancyBboxPatch((0.8, 0.8), 7.2, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                             facecolor=CARD_BG, edgecolor="#0284c7", linewidth=2)
    ax.add_patch(bg_left)
    ax.text(1.2, 8.2, "MECHANICAL TOWER CROSS-SECTION", fontsize=14, fontweight='bold', color=CYAN)

    # Chute Tube
    chute = FancyBboxPatch((3.0, 1.8), 2.8, 5.8, boxstyle="round,pad=0.1,rounding_size=0.1",
                           facecolor="#151e32", edgecolor="#334155", linewidth=2)
    ax.add_patch(chute)

    # Entrance Sensor
    ax.add_patch(FancyBboxPatch((1.2, 6.7), 1.6, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=CYAN, linewidth=1.5))
    ax.text(2.0, 7.05, "ENTRANCE SENSOR\nTrig: 9 | Echo: 10", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    # Sensor line into chute
    ax.annotate("", xy=(3.0, 7.05), xytext=(2.8, 7.05), arrowprops=dict(arrowstyle="->", color=CYAN, lw=2))

    # Upper Iris Gate Servo
    ax.add_patch(FancyBboxPatch((6.0, 6.3), 1.8, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=AMBER, linewidth=1.5))
    ax.text(6.9, 6.65, "IRIS SERVO (Pin 11)\n10° Closed ➔ 120° Open", fontsize=8.5, fontweight='bold', color=AMBER, ha='center', va='center')
    # Iris gate bar
    ax.plot([3.1, 5.7], [6.65, 6.65], color=AMBER, linewidth=4, linestyle="--")

    # Bottle representation inside column
    bottle = FancyBboxPatch((4.0, 2.4), 0.8, 3.2, boxstyle="round,pad=0.1,rounding_size=0.15",
                            facecolor="#0284c7", alpha=0.35, edgecolor=CYAN, linewidth=2)
    ax.add_patch(bottle)
    ax.text(4.4, 4.0, "PET BOTTLE\n(500 ml)", fontsize=9, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')

    # 3 Ultrasonic Sizing Sensors
    # Top
    ax.add_patch(FancyBboxPatch((1.2, 5.1), 1.6, 0.65, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=PURPLE, linewidth=1.5))
    ax.text(2.0, 5.42, "TOP SENSOR\nTrig: 42 | Echo: 43", fontsize=8, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 5.42), xytext=(2.8, 5.42), arrowprops=dict(arrowstyle="->", color=PURPLE, lw=1.5, ls="--"))
    ax.text(3.3, 5.6, "1.5L+ Sizing Beam", fontsize=7.5, color=PURPLE)

    # Middle
    ax.add_patch(FancyBboxPatch((1.2, 3.8), 1.6, 0.65, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=CYAN, linewidth=1.5))
    ax.text(2.0, 4.12, "MID SENSOR\nTrig: 24 | Echo: 41", fontsize=8, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 4.12), xytext=(2.8, 4.12), arrowprops=dict(arrowstyle="->", color=CYAN, lw=2))
    ax.text(3.3, 4.3, "500ml Sizing Beam (HIT)", fontsize=7.5, color=CYAN, fontweight='bold')

    # Bottom
    ax.add_patch(FancyBboxPatch((1.2, 2.5), 1.6, 0.65, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=EMERALD, linewidth=1.5))
    ax.text(2.0, 2.82, "BOTTOM SENSOR\nTrig: 22 | Echo: 23", fontsize=8, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 2.82), xytext=(2.8, 2.82), arrowprops=dict(arrowstyle="->", color=EMERALD, lw=2))
    ax.text(3.3, 3.0, "250ml Sizing Beam (HIT)", fontsize=7.5, color=EMERALD, fontweight='bold')

    # Bottom Drop Gate Servo
    ax.add_patch(FancyBboxPatch((6.0, 1.8), 1.8, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=ROSE, linewidth=1.5))
    ax.text(6.9, 2.15, "DROP SERVO (Pin 12)\n10° Closed ➔ 120° Open", fontsize=8.5, fontweight='bold', color=ROSE, ha='center', va='center')
    ax.plot([3.1, 5.7], [2.0, 2.0], color=ROSE, linewidth=4, linestyle="--")

    # Down Arrow to Bin
    ax.annotate("", xy=(4.4, 1.1), xytext=(4.4, 1.7), arrowprops=dict(arrowstyle="->", color=TEXT_MUTED, lw=2.5))
    ax.text(4.4, 0.9, "Discharge to Plastic Storage Bin", fontsize=8.5, color=TEXT_MUTED, ha='center')

    # Right Column: Logic, Classification Matrix & Protocol
    bg_right = FancyBboxPatch((8.4, 0.8), 6.8, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                              facecolor=CARD_BG, edgecolor="#1e293b", linewidth=1.5)
    ax.add_patch(bg_right)
    ax.text(8.8, 8.2, "SIZING LOGIC & TELEMETRY WORKFLOW", fontsize=14, fontweight='bold', color=TEXT_WHITE)

    # Workflow Steps
    steps = [
        ("Step 1: Entrance Detection", "Entrance HC-SR04 (Trig 9, Echo 10) triggers when empty - dist >= 5cm for 3 cycles.\nSerial Telemetry ➔ PLASTIC:OBJECT_DETECTED"),
        ("Step 2: Iris Gate Actuation", "Iris Servo (Pin 11) moves from 10° to 120°. Item drops into sizing column.\nWait for item arrival at bottom sensor (5000 ms timeout)."),
        ("Step 3: 3-Tier Ultrasonic Scanning", "3 sensors pulse with 30ms anti-crosstalk delay. Minimum 2 of 3 samples\nmust confirm presence (change >= 5cm from baseline)."),
        ("Step 4: Classification & Serial Handshake", "Determines bottle size based on logic matrix below.\nEmits: SIZE:<SIZE>;MATERIAL:PLASTIC"),
        ("Step 5: Bottom Gate Drop & Clear Verification", "Upper Iris closes (10°). Drop Servo (Pin 12) opens to 120° for 900ms.\nChamber verifies empty for 5 consecutive cycles ➔ BOTTLE:CLEARED")
    ]
    
    y_pos = 7.7
    for title, desc in steps:
        ax.text(8.8, y_pos, title, fontsize=9.5, fontweight='bold', color=CYAN)
        ax.text(8.8, y_pos - 0.35, desc, fontsize=8, color=TEXT_MUTED)
        y_pos -= 0.85

    # Sizing Classification Table
    ax.text(8.8, 3.4, "BOTTLE SIZING CLASSIFICATION MATRIX", fontsize=11, fontweight='bold', color=AMBER)
    
    # Draw Table
    table_y = 2.8
    # Header row
    ax.add_patch(FancyBboxPatch((8.8, table_y), 6.0, 0.45, boxstyle="square", facecolor="#1e293b", edgecolor="none"))
    ax.text(9.0, table_y + 0.22, "SIZE TIER", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, va='center')
    ax.text(10.8, table_y + 0.22, "BOTTOM (22/23)", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, va='center')
    ax.text(12.6, table_y + 0.22, "MID (24/41)", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, va='center')
    ax.text(14.1, table_y + 0.22, "TOP (42/43)", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, va='center')

    rows = [
        ("SMALL (<= 250ml)", "ON (HIT)", "OFF", "OFF", EMERALD),
        ("MEDIUM (500ml)", "ON (HIT)", "ON (HIT)", "OFF", CYAN),
        ("LARGE (1.5L+)", "ON (HIT)", "ON (HIT)", "ON (HIT)", PURPLE),
        ("INVALID PATTERN", "MISMATCH (e.g. OFF/ON/ON)", "-", "-", ROSE),
    ]

    for i, (tier, b, m, t, col) in enumerate(rows):
        ry = table_y - 0.42 * (i + 1)
        ax.add_patch(FancyBboxPatch((8.8, ry), 6.0, 0.4, boxstyle="square", 
                                    facecolor="#0b101c" if i % 2 == 0 else "#111827", edgecolor="none"))
        ax.text(9.0, ry + 0.2, tier, fontsize=8, fontweight='bold', color=col, va='center')
        ax.text(11.0, ry + 0.2, b, fontsize=8, color=TEXT_WHITE, va='center')
        ax.text(12.8, ry + 0.2, m, fontsize=8, color=TEXT_WHITE, va='center')
        ax.text(14.3, ry + 0.2, t, fontsize=8, color=TEXT_WHITE, va='center')

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "chamber1_plastic_sizing_flow.png")
    plt.savefig(output_path, facecolor=BG_COLOR, edgecolor='none')
    plt.close()
    print("Saved:", output_path)

# -------------------------------------------------------------
# 2. Chamber 2: Metal Inductive Flow Diagram
# -------------------------------------------------------------
def generate_chamber2_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=150, facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Header
    ax.text(8, 9.5, "CHAMBER 2: BEVERAGE CAN SENSING & METAL PURITY VERIFICATION", 
            fontsize=20, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.text(8, 9.05, "Electromechanical Verification • Inductive Proximity Sampling • Dual Servo Gate Flow", 
            fontsize=12, color=AMBER, ha='center', va='center')

    # Left Column: Mechanical Schematic
    bg_left = FancyBboxPatch((0.8, 0.8), 7.2, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                             facecolor=CARD_BG, edgecolor="#d97706", linewidth=2)
    ax.add_patch(bg_left)
    ax.text(1.2, 8.2, "CAN INTAKE & SENSING CHUTE", fontsize=14, fontweight='bold', color=AMBER)

    # Chute Tube
    chute = FancyBboxPatch((3.0, 1.8), 2.8, 5.8, boxstyle="round,pad=0.1,rounding_size=0.1",
                           facecolor="#151e32", edgecolor="#334155", linewidth=2)
    ax.add_patch(chute)

    # Entrance Sensor
    ax.add_patch(FancyBboxPatch((1.2, 6.7), 1.6, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=CYAN, linewidth=1.5))
    ax.text(2.0, 7.05, "ENTRANCE SENSOR\nTrig: 25 | Echo: 26", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 7.05), xytext=(2.8, 7.05), arrowprops=dict(arrowstyle="->", color=CYAN, lw=2))

    # Upper Iris Gate Servo
    ax.add_patch(FancyBboxPatch((6.0, 6.3), 1.8, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=AMBER, linewidth=1.5))
    ax.text(6.9, 6.65, "IRIS SERVO (Pin 27)\n10° Closed ➔ 120° Open", fontsize=8.5, fontweight='bold', color=AMBER, ha='center', va='center')
    ax.plot([3.1, 5.7], [6.65, 6.65], color=AMBER, linewidth=4, linestyle="--")

    # Aluminum Can representation
    can = FancyBboxPatch((3.9, 3.6), 1.0, 2.0, boxstyle="round,pad=0.08,rounding_size=0.1",
                         facecolor=AMBER, alpha=0.3, edgecolor=AMBER, linewidth=2.5)
    ax.add_patch(can)
    ax.text(4.4, 4.6, "ALUMINUM CAN\n(330 ml)", fontsize=9, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')

    # Inductive Proximity Sensor
    ax.add_patch(FancyBboxPatch((1.0, 4.3), 1.8, 0.8, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=AMBER, linewidth=2))
    ax.text(1.9, 4.7, "INDUCTIVE SENSOR\nPin 32 (INPUT_PULLUP)\nActive LOW on Metal", fontsize=8, fontweight='bold', color=AMBER, ha='center', va='center')
    # Sensor probe
    ax.plot([2.8, 3.8], [4.7, 4.7], color=AMBER, linewidth=3)
    ax.add_patch(Circle((3.8, 4.7), 0.12, color=AMBER))
    ax.text(3.4, 5.0, "Eddy Current\nCoupling", fontsize=7.5, color=AMBER, ha='center')

    # Sizing Ultrasonics (Auxiliary)
    ax.add_patch(FancyBboxPatch((1.0, 2.5), 1.8, 0.65, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=CYAN, linewidth=1.5))
    ax.text(1.9, 2.82, "CAN SIZING ARRAY\n29/30, 31/44, 45/46", fontsize=7.5, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 2.82), xytext=(2.8, 2.82), arrowprops=dict(arrowstyle="->", color=CYAN, lw=1.5))

    # Bottom Drop Gate Servo
    ax.add_patch(FancyBboxPatch((6.0, 1.8), 1.8, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=ROSE, linewidth=1.5))
    ax.text(6.9, 2.15, "DROP SERVO (Pin 28)\n10° Closed ➔ 120° Open", fontsize=8.5, fontweight='bold', color=ROSE, ha='center', va='center')
    ax.plot([3.1, 5.7], [2.0, 2.0], color=ROSE, linewidth=4, linestyle="--")

    # Down Arrow to Can Storage
    ax.annotate("", xy=(4.4, 1.1), xytext=(4.4, 1.7), arrowprops=dict(arrowstyle="->", color=TEXT_MUTED, lw=2.5))
    ax.text(4.4, 0.9, "Discharge to Metal Canister", fontsize=8.5, color=TEXT_MUTED, ha='center')

    # Right Column: Inductive Verification & Telemetry
    bg_right = FancyBboxPatch((8.4, 0.8), 6.8, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                              facecolor=CARD_BG, edgecolor="#1e293b", linewidth=1.5)
    ax.add_patch(bg_right)
    ax.text(8.8, 8.2, "INDUCTIVE SAMPLING & VERIFICATION PIPELINE", fontsize=14, fontweight='bold', color=TEXT_WHITE)

    steps_metal = [
        ("Step 1: Can Insertion Sensing", "HC-SR04 (Trig 25, Echo 26) triggers on distance change >= 5cm for 3 cycles.\nFirmware emits ➔ METAL:OBJECT_DETECTED"),
        ("Step 2: Entrance Aperture Open", "Iris Servo (Pin 27) moves to 120° (700ms). Can enters sizing chute.\nFirmware starts arrival watchdog timer (ARRIVAL_TIMEOUT_MS = 5000)."),
        ("Step 3: Inductive Purity Sampling (Pin 32)", "Executes 12 discrete samples over 180 ms (15 ms spacing).\nReads digital state of Pin 32 with internal pullup enabled."),
        ("Step 4: Acceptance / Rejection Decision", "Threshold: At least 9 of 12 samples must read LOW (Genuine Metal).\nIf >= 9 LOWs ➔ SIZE:<SIZE>;MATERIAL:CAN\nIf < 9 LOWs ➔ SIZE:<SIZE>;MATERIAL:REJECT"),
        ("Step 5: Discharge & Evacuation", "Upper Iris closes (10°). Drop Servo (Pin 28) opens to 120° (900ms).\nVerifies chute empty for 5 cycles ➔ Emits BOTTLE:CLEARED")
    ]

    y_pos = 7.7
    for title, desc in steps_metal:
        ax.text(8.8, y_pos, title, fontsize=9.5, fontweight='bold', color=AMBER)
        ax.text(8.8, y_pos - 0.35, desc, fontsize=8, color=TEXT_MUTED)
        y_pos -= 0.85

    # Inductive Proximity Pulse Box
    ax.text(8.8, 3.4, "INDUCTIVE SAMPLING WINDOW TIMING (180 ms)", fontsize=11, fontweight='bold', color=CYAN)
    
    box_t = FancyBboxPatch((8.8, 1.3), 6.0, 1.8, boxstyle="round,pad=0.15", facecolor="#050811", edgecolor="#334155", linewidth=1)
    ax.add_patch(box_t)

    # Mini timing diagram
    ax.text(9.0, 2.7, "Metal Sample Bus: 12 Samples @ 15ms intervals", fontsize=8.5, color=TEXT_WHITE, fontweight='bold')
    # Draw digital waveform
    wave_x = [9.0, 9.3, 9.3, 9.7, 9.7, 10.1, 10.1, 14.5]
    wave_y = [2.3, 2.3, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8]
    ax.plot(wave_x, wave_y, color=AMBER, lw=2.5)
    ax.text(9.15, 2.45, "HIGH (No Metal)", fontsize=7, color=ROSE)
    ax.text(11.5, 1.95, "ACTIVE LOW (>= 9 Samples = 100% Metal Verified)", fontsize=8, color=EMERALD, fontweight='bold')

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "chamber2_metal_inductive_flow.png")
    plt.savefig(output_path, facecolor=BG_COLOR, edgecolor='none')
    plt.close()
    print("Saved:", output_path)

# -------------------------------------------------------------
# 3. Chamber 3: Paper Load Cell Flow Diagram
# -------------------------------------------------------------
def generate_chamber3_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=150, facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Header
    ax.text(8, 9.5, "CHAMBER 3: PAPER WASTAGE MASS MEASUREMENT & DISCHARGE", 
            fontsize=20, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.text(8, 9.05, "HX711 24-Bit ADC Strain Gauge Platform • Tare Stabilization • Automated Hopper Release", 
            fontsize=12, color=EMERALD, ha='center', va='center')

    # Left Column: Mechanical Schematic
    bg_left = FancyBboxPatch((0.8, 0.8), 7.2, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                             facecolor=CARD_BG, edgecolor="#059669", linewidth=2)
    ax.add_patch(bg_left)
    ax.text(1.2, 8.2, "WEIGHING CHUTE & LOAD CELL TRAY", fontsize=14, fontweight='bold', color=EMERALD)

    # Chute Tube
    chute = FancyBboxPatch((3.0, 2.5), 2.8, 5.1, boxstyle="round,pad=0.1,rounding_size=0.1",
                           facecolor="#151e32", edgecolor="#334155", linewidth=2)
    ax.add_patch(chute)

    # Top Ultrasonic
    ax.add_patch(FancyBboxPatch((1.2, 6.7), 1.6, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=CYAN, linewidth=1.5))
    ax.text(2.0, 7.05, "TOP SENSOR\nTrig: 33 | Echo: 34", fontsize=8.5, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 7.05), xytext=(2.8, 7.05), arrowprops=dict(arrowstyle="->", color=CYAN, lw=2))

    # Upper Iris Gate Servo
    ax.add_patch(FancyBboxPatch((6.0, 6.3), 1.8, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=AMBER, linewidth=1.5))
    ax.text(6.9, 6.65, "IRIS SERVO (Pin 35)\n10° Closed ➔ 120° Open", fontsize=8.5, fontweight='bold', color=AMBER, ha='center', va='center')
    ax.plot([3.1, 5.7], [6.65, 6.65], color=AMBER, linewidth=4, linestyle="--")

    # Paper on Tray
    paper_rect = FancyBboxPatch((3.4, 3.2), 2.0, 0.4, boxstyle="round,pad=0.05", facecolor="#cbd5e1", edgecolor="#ffffff", linewidth=1.5)
    ax.add_patch(paper_rect)
    ax.text(4.4, 3.4, "PAPER WASTE (0.185 kg)", fontsize=8, fontweight='bold', color="#0f172a", ha='center', va='center')

    # Bottom Ultrasonic Sensor (Arrival Check)
    ax.add_patch(FancyBboxPatch((1.2, 3.8), 1.6, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=PURPLE, linewidth=1.5))
    ax.text(2.0, 4.15, "BOTTOM SENSOR\nTrig: 39 | Echo: 40\n(Confirms Tray Landing)", fontsize=7.5, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.annotate("", xy=(3.0, 3.4), xytext=(2.8, 4.0), arrowprops=dict(arrowstyle="->", color=PURPLE, lw=1.5))

    # Load Cell Platform
    ax.plot([3.1, 5.7], [3.0, 3.0], color="#94a3b8", linewidth=4)
    ax.add_patch(FancyBboxPatch((4.0, 2.5), 0.8, 0.5, boxstyle="round,pad=0.05", facecolor="#334155", edgecolor="#64748b", linewidth=1))
    ax.text(4.4, 2.75, "LOAD CELL", fontsize=7.5, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')

    # HX711 Module
    ax.add_patch(FancyBboxPatch((1.2, 1.8), 1.6, 0.8, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=EMERALD, linewidth=2))
    ax.text(2.0, 2.2, "HX711 24-BIT ADC\nDOUT: 37 | SCK: 38\n420 counts/gram", fontsize=7.5, fontweight='bold', color=EMERALD, ha='center', va='center')
    ax.plot([2.8, 4.0], [2.2, 2.7], color=EMERALD, linewidth=2, linestyle=":")

    # Paper Drop Servo
    ax.add_patch(FancyBboxPatch((6.0, 2.5), 1.8, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=ROSE, linewidth=1.5))
    ax.text(6.9, 2.85, "DROP SERVO (Pin 36)\n10° Closed ➔ 120° Open", fontsize=8.5, fontweight='bold', color=ROSE, ha='center', va='center')

    # Down Arrow to Paper Bin
    ax.annotate("", xy=(4.4, 1.1), xytext=(4.4, 1.8), arrowprops=dict(arrowstyle="->", color=TEXT_MUTED, lw=2.5))
    ax.text(4.4, 0.9, "Discharge to High-Capacity Paper Hopper", fontsize=8.5, color=TEXT_MUTED, ha='center')

    # Right Column: Weighing Cycle & Formula
    bg_right = FancyBboxPatch((8.4, 0.8), 6.8, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                              facecolor=CARD_BG, edgecolor="#1e293b", linewidth=1.5)
    ax.add_patch(bg_right)
    ax.text(8.8, 8.2, "MASS CALIBRATION & WEIGHING LOGIC", fontsize=14, fontweight='bold', color=TEXT_WHITE)

    steps_paper = [
        ("Step 1: Paper Entrance Detection", "Top HC-SR04 (Trig 33, Echo 34) senses insertion.\nFirmware emits ➔ PAPER:OBJECT_DETECTED"),
        ("Step 2: Aperture Open & Chute Slide", "Iris Servo (Pin 35) opens 120°. Paper drops toward weighing tray.\nBottom HC-SR04 (Trig 39, Echo 40) confirms item landed on tray."),
        ("Step 3: HX711 Tare & Dynamic Stabilization", "System polls HX711 ADC until reading >= 20.0g (PAPER_MIN_WEIGHT_G).\nRequires 3 consecutive readings within ±5g to confirm settling."),
        ("Step 4: Precision 8-Sample Weight Calculation", "Averages 8 ADC readings. Applies calibration factor:\nWeight (kg) = [(Raw_ADC - Tare_Raw) / 420.0] / 1000.0\nEmits: SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:0.185"),
        ("Step 5: Hopper Drop & Clear Tare Verification", "Paper Drop Servo (Pin 36) rotates 120° for 900ms dumping paper.\nVerifies weight drops below 8.0g (PAPER_CLEAR_WEIGHT_G) ➔ BOTTLE:CLEARED")
    ]

    y_pos = 7.7
    for title, desc in steps_paper:
        ax.text(8.8, y_pos, title, fontsize=9.5, fontweight='bold', color=EMERALD)
        ax.text(8.8, y_pos - 0.35, desc, fontsize=8, color=TEXT_MUTED)
        y_pos -= 0.85

    # Formula Box
    ax.text(8.8, 3.4, "HX711 CALIBRATION CONSTANTS (RVM_Arduino.ino)", fontsize=11, fontweight='bold', color=CYAN)
    f_box = FancyBboxPatch((8.8, 1.3), 6.0, 1.8, boxstyle="round,pad=0.15", facecolor="#050811", edgecolor="#334155", linewidth=1)
    ax.add_patch(f_box)

    code_text = (
        "const float PAPER_COUNTS_PER_GRAM = 420.0f;  // Load cell calibration factor\n"
        "const float PAPER_MIN_WEIGHT_G    = 20.0f;   // Minimum valid paper threshold\n"
        "const float PAPER_CLEAR_WEIGHT_G  = 8.0f;    // Zero return verification threshold\n"
        "Weight Grams = (readHx711Average(8) - paperTareRaw) / 420.0f;"
    )
    ax.text(9.0, 2.1, code_text, fontsize=8.5, color=TEXT_ACCENT, fontfamily="monospace", va='center')

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "chamber3_paper_loadcell_flow.png")
    plt.savefig(output_path, facecolor=BG_COLOR, edgecolor='none')
    plt.close()
    print("Saved:", output_path)

# -------------------------------------------------------------
# 4. Arduino Mega 2560 Pinout & Power Wiring Diagram
# -------------------------------------------------------------
def generate_pinout_wiring_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=150, facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Header
    ax.text(8, 9.5, "ARDUINO MEGA 2560 COMPLETE PINOUT & POWER WIRING SCHEMATIC", 
            fontsize=20, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.text(8, 9.05, "Complete I/O Mapping • 3 Chambers • 6 Servos • 8 HC-SR04 Sensors • Inductive • HX711 ADC", 
            fontsize=12, color=CYAN, ha='center', va='center')

    # Central Arduino Mega Board representation
    board_rect = FancyBboxPatch((6.0, 1.0), 4.0, 7.5, boxstyle="round,pad=0.2,rounding_size=0.2",
                                facecolor="#0e172a", edgecolor="#38bdf8", linewidth=2.5)
    ax.add_patch(board_rect)
    ax.text(8.0, 8.1, "ARDUINO MEGA 2560", fontsize=15, fontweight='bold', color=TEXT_WHITE, ha='center')
    ax.text(8.0, 7.7, "ATmega2560 @ 16 MHz • Baud 115200", fontsize=9, color=CYAN, ha='center')

    # Chamber 1 (Left Top)
    c1_box = FancyBboxPatch((0.8, 5.0), 4.5, 3.5, boxstyle="round,pad=0.2", facecolor=CARD_BG, edgecolor="#0284c7", linewidth=2)
    ax.add_patch(c1_box)
    ax.text(1.1, 8.1, "CHAMBER 1: PLASTIC (PET)", fontsize=11, fontweight='bold', color=CYAN)
    c1_pins = [
        "Entrance Ultrasonic : Trig 9 / Echo 10",
        "Iris Aperture Servo : Pin 11 (PWM)",
        "Drop Gate Servo     : Pin 12 (PWM)",
        "Sizing Bottom Trig/Echo : 22 / 23",
        "Sizing Middle Trig/Echo : 24 / 41",
        "Sizing Top Trig/Echo    : 42 / 43"
    ]
    for i, p in enumerate(c1_pins):
        ax.text(1.1, 7.6 - i * 0.45, p, fontsize=8.5, color=TEXT_WHITE, fontfamily="monospace")
    # Wiring connection
    ax.annotate("", xy=(6.0, 6.7), xytext=(5.3, 6.7), arrowprops=dict(arrowstyle="<->", color=CYAN, lw=2))

    # Chamber 2 (Left Bottom)
    c2_box = FancyBboxPatch((0.8, 1.0), 4.5, 3.6, boxstyle="round,pad=0.2", facecolor=CARD_BG, edgecolor="#d97706", linewidth=2)
    ax.add_patch(c2_box)
    ax.text(1.1, 4.2, "CHAMBER 2: METAL CANS", fontsize=11, fontweight='bold', color=AMBER)
    c2_pins = [
        "Entrance Ultrasonic : Trig 25 / Echo 26",
        "Iris Aperture Servo : Pin 27 (PWM)",
        "Drop Gate Servo     : Pin 28 (PWM)",
        "Sizing Bottom Trig/Echo : 29 / 30",
        "Sizing Middle Trig/Echo : 31 / 44",
        "Sizing Top Trig/Echo    : 45 / 46",
        "Inductive Sensor    : Pin 32 (PULLUP)"
    ]
    for i, p in enumerate(c2_pins):
        ax.text(1.1, 3.7 - i * 0.42, p, fontsize=8, color=TEXT_WHITE, fontfamily="monospace")
    # Wiring connection
    ax.annotate("", xy=(6.0, 2.8), xytext=(5.3, 2.8), arrowprops=dict(arrowstyle="<->", color=AMBER, lw=2))

    # Chamber 3 (Right Top)
    c3_box = FancyBboxPatch((10.7, 5.0), 4.5, 3.5, boxstyle="round,pad=0.2", facecolor=CARD_BG, edgecolor="#059669", linewidth=2)
    ax.add_patch(c3_box)
    ax.text(11.0, 8.1, "CHAMBER 3: PAPER WASTAGE", fontsize=11, fontweight='bold', color=EMERALD)
    c3_pins = [
        "Top Entrance Trig/Echo : 33 / 34",
        "Bottom Platform Trig/Echo : 39 / 40",
        "Iris Aperture Servo    : Pin 35 (PWM)",
        "Drop Gate Servo        : Pin 36 (PWM)",
        "HX711 DOUT (Data)      : Pin 37",
        "HX711 SCK (Clock)      : Pin 38"
    ]
    for i, p in enumerate(c3_pins):
        ax.text(11.0, 7.6 - i * 0.45, p, fontsize=8.5, color=TEXT_WHITE, fontfamily="monospace")
    # Wiring connection
    ax.annotate("", xy=(10.0, 6.7), xytext=(10.7, 6.7), arrowprops=dict(arrowstyle="<->", color=EMERALD, lw=2))

    # Power Rails & Safety Isolation (Right Bottom)
    pwr_box = FancyBboxPatch((10.7, 1.0), 4.5, 3.6, boxstyle="round,pad=0.2", facecolor=CARD_BG, edgecolor="#a855f7", linewidth=2)
    ax.add_patch(pwr_box)
    ax.text(11.0, 4.2, "POWER RAILS & ISOLATION", fontsize=11, fontweight='bold', color=PURPLE)
    pwr_info = [
        "Main Input     : 12V DC 15A Industrial PSU",
        "Servo Power Rail: 5V 10A Buck Regulator",
        "  ➔ Feeds all 6 Servos (Pins 11,12,27,28,35,36)",
        "  ➔ Opto-isolated common ground",
        "Logic Power Rail: 5V 3A Low-Noise Supply",
        "  ➔ Arduino Mega + 8x HC-SR04 + HX711",
        "USB Interface  : 115200 Baud to Desktop PC"
    ]
    for i, p in enumerate(pwr_info):
        ax.text(11.0, 3.7 - i * 0.42, p, fontsize=8, color=TEXT_WHITE, fontfamily="monospace")
    # Wiring connection
    ax.annotate("", xy=(10.0, 2.8), xytext=(10.7, 2.8), arrowprops=dict(arrowstyle="<->", color=PURPLE, lw=2))

    # Center summary badges on Arduino
    ax.add_patch(FancyBboxPatch((6.4, 6.5), 3.2, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=CYAN))
    ax.text(8.0, 6.85, "10 Pins: Plastic Array & Servos", fontsize=8.5, fontweight='bold', color=CYAN, ha='center', va='center')

    ax.add_patch(FancyBboxPatch((6.4, 5.4), 3.2, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=AMBER))
    ax.text(8.0, 5.75, "11 Pins: Metal Array, Proximity & Servos", fontsize=8.5, fontweight='bold', color=AMBER, ha='center', va='center')

    ax.add_patch(FancyBboxPatch((6.4, 4.3), 3.2, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=EMERALD))
    ax.text(8.0, 4.65, "6 Pins: Paper Sensors & Load Cell", fontsize=8.5, fontweight='bold', color=EMERALD, ha='center', va='center')

    ax.add_patch(FancyBboxPatch((6.4, 3.2), 3.2, 0.7, boxstyle="round,pad=0.08", facecolor="#1e293b", edgecolor=PURPLE))
    ax.text(8.0, 3.55, "GND & Power Isolation Rails", fontsize=8.5, fontweight='bold', color=PURPLE, ha='center', va='center')

    ax.add_patch(FancyBboxPatch((6.4, 1.7), 3.2, 1.1, boxstyle="round,pad=0.08", facecolor="#050811", edgecolor="#334155"))
    ax.text(8.0, 2.5, "FAILSAFE STATE (makeSafe)", fontsize=8.5, fontweight='bold', color=ROSE, ha='center')
    ax.text(8.0, 2.1, "All 6 Servos drive to 10°", fontsize=8, color=TEXT_WHITE, ha='center')
    ax.text(8.0, 1.85, "Upper apertures & drops locked", fontsize=7.5, color=TEXT_MUTED, ha='center')

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "rvm_arduino_mega_pinout_wiring.png")
    plt.savefig(output_path, facecolor=BG_COLOR, edgecolor='none')
    plt.close()
    print("Saved:", output_path)

# -------------------------------------------------------------
# 5. RVM State Machine & Serial Protocol Diagram
# -------------------------------------------------------------
def generate_state_machine_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=150, facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Header
    ax.text(8, 9.5, "RVM FIRMWARE FINITE STATE MACHINE & SERIAL PROTOCOL", 
            fontsize=20, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.text(8, 9.05, "Asynchronous Serial Handshake @ 115200 Baud • Event Telemetry • Timeout Guardrails", 
            fontsize=12, color=CYAN, ha='center', va='center')

    # Left: State Machine Flow
    bg_left = FancyBboxPatch((0.8, 0.8), 7.2, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                             facecolor=CARD_BG, edgecolor="#38bdf8", linewidth=2)
    ax.add_patch(bg_left)
    ax.text(1.2, 8.2, "FIRMWARE FINITE STATE MACHINE (FSM)", fontsize=14, fontweight='bold', color=CYAN)

    fsm_nodes = [
        ("BOOT / RESET", 7.2, "#475569", "Setup pins, attach servos, execute makeSafe()"),
        ("CALIBRATING", 5.8, PURPLE, "CALIBRATE command: Samples all sensors 5-7x\nTares HX711, verifies non-zero baseline"),
        ("MACHINE:IDLE", 4.4, EMERALD, "START command received. All gates 10° closed.\nPolls entrance ultrasonics every 40ms"),
        ("CHAMBER ACTIVE", 3.0, AMBER, "Object detected! Iris opens 120°.\nSizing array / Inductive / Load cell evaluated"),
        ("DISCHARGE & CLEAR", 1.6, CYAN, "Iris closes. Drop gate opens 120° (900ms).\nVerifies empty chute for 5 consecutive cycles")
    ]

    for title, y, col, sub in fsm_nodes:
        box = FancyBboxPatch((1.4, y - 0.4), 6.0, 0.9, boxstyle="round,pad=0.1,rounding_size=0.15",
                             facecolor="#151e32", edgecolor=col, linewidth=2)
        ax.add_patch(box)
        ax.text(1.6, y + 0.25, title, fontsize=10, fontweight='bold', color=col, va='center')
        ax.text(1.6, y - 0.1, sub, fontsize=7.5, color=TEXT_MUTED, va='center')

    # Connecting arrows
    for y in [6.75, 5.35, 3.95, 2.55]:
        ax.annotate("", xy=(4.4, y - 0.4), xytext=(4.4, y), arrowprops=dict(arrowstyle="->", color=TEXT_MUTED, lw=2))

    # Right: Serial Protocol & Telemetry Schema
    bg_right = FancyBboxPatch((8.4, 0.8), 6.8, 7.8, boxstyle="round,pad=0.3,rounding_size=0.2",
                              facecolor=CARD_BG, edgecolor="#1e293b", linewidth=1.5)
    ax.add_patch(bg_right)
    ax.text(8.8, 8.2, "SERIAL COMMAND & TELEMETRY PROTOCOL", fontsize=14, fontweight='bold', color=TEXT_WHITE)

    # Inbound Commands
    ax.text(8.8, 7.7, "HOST COMPUTER TO ARDUINO COMMANDS", fontsize=11, fontweight='bold', color=AMBER)
    cmds = [
        ("START", "Enables object detection & loop processing if calibrated"),
        ("STOP", "Suspends detection, executes makeSafe() safety lock"),
        ("RESET", "Resets detection counts, closes all servos, re-initializes"),
        ("CALIBRATE", "Re-baselines all ultrasonic empty distances and HX711 tare"),
        ("STATUS", "Queries real-time calibration baselines and sensor health")
    ]
    y_c = 7.3
    for cmd, desc in cmds:
        ax.text(8.8, y_c, cmd, fontsize=8.5, fontweight='bold', color=CYAN, fontfamily="monospace")
        ax.text(10.2, y_c, desc, fontsize=8, color=TEXT_WHITE)
        y_c -= 0.35

    # Outbound Telemetry
    ax.text(8.8, 5.3, "ARDUINO TO HOST EVENT TELEMETRY", fontsize=11, fontweight='bold', color=EMERALD)
    telemetry = [
        ("PLASTIC:OBJECT_DETECTED", "Chamber 1 entrance trigger"),
        ("SIZE:<S/M/L>;MATERIAL:PLASTIC", "Plastic item validated"),
        ("METAL:OBJECT_DETECTED", "Chamber 2 entrance trigger"),
        ("SIZE:<SIZE>;MATERIAL:CAN", "Metal inductive verified (>=9 LOWs)"),
        ("SIZE:<SIZE>;MATERIAL:REJECT", "Non-metal rejection (<9 LOWs)"),
        ("PAPER:OBJECT_DETECTED", "Chamber 3 entrance trigger"),
        ("SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:<val>", "HX711 mass reading"),
        ("BOTTLE:CLEARED", "Item successfully discharged"),
        ("ERROR:<CHAMBER>_ARRIVAL_TIMEOUT", "Item failed to drop within 5000ms"),
        ("ERROR:CLEAR_TIMEOUT", "Chute failed to clear after 5000ms")
    ]
    y_t = 4.9
    for event, desc in telemetry:
        ax.text(8.8, y_t, event, fontsize=7.5, fontweight='bold', color=TEXT_ACCENT, fontfamily="monospace")
        ax.text(12.7, y_t, desc, fontsize=7.5, color=TEXT_MUTED)
        y_t -= 0.32

    # Guardrails Box
    ax.text(8.8, 1.5, "FIRMWARE SAFETY GUARDRAILS", fontsize=9.5, fontweight='bold', color=ROSE)
    g_box = FancyBboxPatch((8.8, 1.0), 6.0, 0.4, boxstyle="round,pad=0.08", facecolor="#1e1b2e", edgecolor=ROSE)
    ax.add_patch(g_box)
    ax.text(8.9, 1.2, "ARRIVAL_TIMEOUT_MS = 5000 | CLEAR_TIMEOUT_MS = 5000 | IRIS_LOCK = 10°", 
            fontsize=7.5, fontweight='bold', color=ROSE, fontfamily="monospace")

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "rvm_state_machine_serial_protocol.png")
    plt.savefig(output_path, facecolor=BG_COLOR, edgecolor='none')
    plt.close()
    print("Saved:", output_path)

# -------------------------------------------------------------
# 6. Operator Kiosk Touchscreen Guide Diagram
# -------------------------------------------------------------
def generate_operator_guide_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=150, facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Header
    ax.text(8, 9.5, "PECO DROP RVM — OPERATOR & RECYCLING USER QUICK START GUIDE", 
            fontsize=20, fontweight='bold', color=TEXT_WHITE, ha='center', va='center')
    ax.text(8, 9.05, "Step-by-Step Recycling Deposit • Touchscreen Guidance • Mobile App QR Wallet Credit", 
            fontsize=12, color=CYAN, ha='center', va='center')

    # 4 Steps Cards Grid
    cards = [
        ("STEP 1: SELECT & PREPARE", 
         "Approach Kiosk Screen", 
         CYAN, 
         ["• Empty all residual liquids from containers",
          "• Remove bottle caps and external non-PET foil",
          "• Select deposit item on screen (Plastic, Can, Paper)",
          "• Verify corresponding intake port glows cyan/amber"],
         "مشین کے سامنے آئیں اور ری سائیکلنگ آئٹم کا انتخاب کریں"),

        ("STEP 2: INSERT RECYCLABLE", 
         "Insert into Illuminated Port", 
         AMBER, 
         ["• Chamber 1: Insert PET bottle base-first",
          "• Chamber 2: Insert uncrushed aluminum soda can",
          "• Chamber 3: Place clean flat paper or newsprint",
          "• Automatic Iris Servo will glide open to accept"],
         "مخصوص پورٹ میں بوتل، کین، یا کاغذ داخل کریں"),

        ("STEP 3: REAL-TIME VERIFICATION", 
         "Automated Internal Scanning", 
         EMERALD, 
         ["• 3-tier ultrasonics detect bottle size (S / M / L)",
          "• Inductive proximity sensor verifies metal conductivity",
          "• HX711 scale measures paper mass in grams",
          "• Bottom trapdoor opens and drops item to storage"],
         "سسٹم خودکار طور پر سائز، دھات اور وزن کی جانچ کرے گا"),

        ("STEP 4: CLAIM GREEN REWARDS", 
         "Scan Dynamic QR Code", 
         PURPLE, 
         ["• Touchscreen shows session total & earned points",
          "• Open PecoDrop Mobile App on iOS or Android",
          "• Scan on-screen dynamic QR code with app camera",
          "• Instant reward points credited to your digital wallet!"],
         "موبائل ایپ سے کیو آر کوڈ اسکین کریں اور فوری پوائنٹس حاصل کریں")
    ]

    card_coords = [(0.8, 4.8), (8.4, 4.8), (0.8, 0.8), (8.4, 0.8)]

    for idx, (title, subtitle, color, bullets, urdu) in enumerate(cards):
        x, y = card_coords[idx]
        card_bg = FancyBboxPatch((x, y), 6.8, 3.8, boxstyle="round,pad=0.2,rounding_size=0.15",
                                 facecolor=CARD_BG, edgecolor=color, linewidth=2)
        ax.add_patch(card_bg)

        # Step Number Badge
        badge = FancyBboxPatch((x + 0.3, y + 3.1), 3.2, 0.5, boxstyle="round,pad=0.08",
                               facecolor=color, edgecolor="none")
        ax.add_patch(badge)
        ax.text(x + 1.9, y + 3.35, title, fontsize=9.5, fontweight='bold', color="#070a14", ha='center', va='center')

        ax.text(x + 3.8, y + 3.35, subtitle, fontsize=9, fontweight='bold', color=TEXT_WHITE, va='center')

        # Bullets
        for b_idx, bullet in enumerate(bullets):
            ax.text(x + 0.4, y + 2.5 - b_idx * 0.48, bullet, fontsize=8.5, color=TEXT_WHITE)

        # Urdu Footer Ribbon
        urdu_box = FancyBboxPatch((x + 0.3, y + 0.25), 6.2, 0.45, boxstyle="round,pad=0.05",
                                  facecolor="#0b1324", edgecolor="#334155")
        ax.add_patch(urdu_box)
        ax.text(x + 3.4, y + 0.48, urdu, fontsize=8.5, color=EMERALD, fontfamily="Segoe UI", ha='center', va='center')

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, "operator_kiosk_touchscreen_guide.png")
    plt.savefig(output_path, facecolor=BG_COLOR, edgecolor='none')
    plt.close()
    print("Saved:", output_path)

if __name__ == "__main__":
    generate_chamber1_diagram()
    generate_chamber2_diagram()
    generate_chamber3_diagram()
    generate_pinout_wiring_diagram()
    generate_state_machine_diagram()
    generate_operator_guide_diagram()
    print("All diagrams generated successfully!")
