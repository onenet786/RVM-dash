import os
import sys
import base64
import shutil
import subprocess

def get_base64_font(font_path):
    if not os.path.exists(font_path):
        return ""
    with open(font_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:font/truetype;charset=utf-8;base64,{data}"

def get_base64_img(img_path):
    if not os.path.exists(img_path):
        return ""
    with open(img_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    ext = os.path.splitext(img_path)[1].lower().replace(".", "")
    mime = "image/png" if ext == "png" else "image/jpeg"
    return f"data:{mime};base64,{data}"

def build_master_html():
    fonts_dir = r"d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\Fonts"
    font_urdu_bold = get_base64_font(os.path.join(fonts_dir, "NotoNastaliqUrdu-Bold.ttf"))
    font_urdu_reg = get_base64_font(os.path.join(fonts_dir, "NotoNastaliqUrdu-Regular.ttf"))

    img_dir = r"d:\GIT-HUB\RVM-dash\docs\user_manuals\images"
    img_kiosk = get_base64_img(os.path.join(img_dir, "rvm_kiosk_system_overview.png"))
    img_touch = get_base64_img(os.path.join(img_dir, "operator_kiosk_touchscreen_guide.png"))
    img_ch1 = get_base64_img(os.path.join(img_dir, "chamber1_plastic_sizing_flow.png"))
    img_ch2 = get_base64_img(os.path.join(img_dir, "chamber2_metal_inductive_flow.png"))
    img_ch3 = get_base64_img(os.path.join(img_dir, "chamber3_paper_loadcell_flow.png"))
    img_pinout = get_base64_img(os.path.join(img_dir, "rvm_arduino_mega_pinout_wiring.png"))
    img_state = get_base64_img(os.path.join(img_dir, "rvm_state_machine_serial_protocol.png"))
    img_shield = get_base64_img(os.path.join(img_dir, "rvm_arduino_mega_shield_hardware_map.png"))
    img_schem = get_base64_img(os.path.join(img_dir, "rvm_arduino_mega_shield_schematic.png"))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PecoDrop RVM — Master System &amp; Engineering Manual (Complete Single Edition)</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 10mm 12mm;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  @font-face {{
    font-family: 'TrueNastaliq';
    src: url('{font_urdu_bold}') format('truetype');
    font-weight: bold;
    font-style: normal;
  }}
  @font-face {{
    font-family: 'TrueNastaliq';
    src: url('{font_urdu_reg}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }}
  @font-face {{
    font-family: 'JameelNastaleeq';
    src: local('Jameel Noori Nastaleeq'), local('Noto Nastaliq Urdu');
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0F172A;
    background: #FFFFFF;
    font-size: 8.2pt;
    line-height: 1.4;
  }}

  .page {{
    page-break-before: always;
    clear: both;
  }}
  .page:first-of-type {{
    page-break-before: avoid;
  }}

  /* Top Running Header */
  .page-running-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #E2E8F0;
    padding-bottom: 3px;
    margin-bottom: 8px;
    font-size: 7.5pt;
    color: #64748B;
    font-weight: 600;
  }}
  .page-running-header .brand {{
    color: #059669;
    font-weight: 800;
    letter-spacing: 0.5px;
  }}

  /* Running Footer */
  .page-running-footer {{
    margin-top: 10px;
    border-top: 1px solid #E2E8F0;
    padding-top: 3px;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: #94A3B8;
    font-weight: 500;
  }}

  /* Hero Cover */
  .hero-cover {{
    background: linear-gradient(145deg, #022C22 0%, #064E3B 40%, #0F172A 100%);
    color: #FFFFFF;
    padding: 24px 22px;
    border-radius: 10px;
    margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }}
  .hero-cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }}
  .hero-cover h1 {{
    font-size: 20pt;
    font-weight: 900;
    letter-spacing: -0.5px;
    line-height: 1.2;
    color: #FFFFFF;
    margin-bottom: 6px;
  }}
  .hero-cover-urdu-title {{
    font-family: 'TrueNastaliq', 'JameelNastaleeq', serif !important;
    font-size: 16pt;
    color: #A7F3D0;
    line-height: 1.8;
    direction: rtl;
    margin-bottom: 6px;
  }}
  .hero-cover p {{
    font-size: 9pt;
    color: #CBD5E1;
    line-height: 1.45;
  }}
  .hero-badge {{
    background: #10B981;
    color: #022C22;
    font-size: 8pt;
    font-weight: 900;
    padding: 5px 12px;
    border-radius: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }}

  /* Section Title Bar */
  .section-title-bar {{
    background: #F1F5F9;
    border-left: 4px solid #0284C7;
    padding: 6px 10px;
    margin: 8px 0 6px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 0 4px 4px 0;
  }}
  .section-title-bar.urdu {{
    border-left: none;
    border-right: 4px solid #059669;
    background: #ECFDF5;
    direction: rtl;
  }}
  .section-title-bar h2 {{
    font-size: 9.5pt;
    font-weight: 800;
    color: #0F172A;
  }}
  .section-title-bar .meta {{
    font-size: 7.5pt;
    color: #64748B;
    font-weight: 600;
  }}

  /* Cards */
  .card {{
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 7px;
    page-break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }}
  .card-title {{
    font-size: 8.8pt;
    font-weight: 800;
    color: #0284C7;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .card-body {{
    font-size: 8pt;
    color: #334155;
    line-height: 1.4;
  }}
  .card-body ul {{
    margin-left: 16px;
    margin-top: 3px;
  }}
  .card-body li {{
    margin-bottom: 2px;
  }}

  /* Grid Layouts */
  .grid-2 {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin: 6px 0;
    page-break-inside: avoid;
  }}
  .grid-3 {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 6px 0;
    page-break-inside: avoid;
  }}
  .diagram-box {{
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    overflow: hidden;
    background: #F8FAFC;
    text-align: center;
    padding: 3px;
  }}
  .diagram-box img {{
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
  }}
  .diagram-box .caption {{
    font-size: 7pt;
    font-weight: 700;
    color: #475569;
    margin-top: 3px;
  }}

  /* True Urdu Nastaliq Styles */
  .urdu-container {{
    direction: rtl;
    text-align: right;
  }}
  .urdu-banner-text {{
    font-family: 'TrueNastaliq', 'JameelNastaleeq', serif !important;
    font-size: 13.5pt;
    font-weight: bold;
    color: #064E3B;
    line-height: 1.6;
  }}
  .urdu-card {{
    background: #FFFFFF;
    border: 1px solid #D1FAE5;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 7px;
    direction: rtl;
    text-align: right;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(6, 78, 59, 0.04);
  }}
  .urdu-step-header {{
    font-family: 'TrueNastaliq', 'JameelNastaleeq', serif !important;
    font-size: 12.5pt;
    font-weight: bold;
    color: #047857;
    margin-bottom: 4px;
    line-height: 1.7;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .urdu-badge {{
    background: #047857;
    color: #FFFFFF;
    font-family: -apple-system, sans-serif;
    font-size: 7pt;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
  }}
  .urdu-body {{
    font-family: 'TrueNastaliq', 'JameelNastaleeq', serif !important;
    font-size: 10.5pt;
    line-height: 1.95;
    color: #1F2937;
  }}
  .urdu-bullet {{
    list-style-type: none;
    margin-right: 8px;
    margin-top: 2px;
  }}
  .urdu-bullet li {{
    position: relative;
    padding-right: 14px;
    margin-bottom: 4px;
  }}
  .urdu-bullet li::before {{
    content: "•";
    position: absolute;
    right: 0;
    color: #059669;
    font-weight: bold;
    font-size: 11pt;
  }}

  /* Roman Urdu Styles */
  .roman-card {{
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-left: 4px solid #D97706;
    border-radius: 4px;
    padding: 7px 10px;
    margin-bottom: 6px;
    page-break-inside: avoid;
  }}
  .roman-header {{
    font-size: 8.5pt;
    font-weight: 800;
    color: #B45309;
    margin-bottom: 3px;
  }}
  .roman-body {{
    font-size: 7.8pt;
    color: #451A03;
    line-height: 1.35;
  }}

  /* Tables */
  table.matrix-table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 5px;
    margin-bottom: 6px;
    font-size: 7.5pt;
    page-break-inside: avoid;
  }}
  table.matrix-table th {{
    background: #0F172A;
    color: #FFFFFF;
    padding: 4px 6px;
    text-align: left;
    font-weight: 700;
    border: 1px solid #334155;
  }}
  table.matrix-table td {{
    padding: 3.5px 6px;
    border: 1px solid #CBD5E1;
    color: #1E293B;
  }}
  table.matrix-table tr:nth-child(even) {{
    background: #F8FAFC;
  }}
  .tag-in {{
    background: #E0F2FE;
    color: #0369A1;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 6.8pt;
  }}
  .tag-out {{
    background: #FEF3C7;
    color: #B45309;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 6.8pt;
  }}
  .tag-pwr {{
    background: #DCFCE7;
    color: #15803D;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 6.8pt;
  }}
</style>
</head>
<body>

  <!-- ==================== PAGE 1: MASTER COVER & SYSTEM ARCHITECTURE ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PECODROP RVM &bull; MASTER SYSTEM DOCUMENTATION</span>
      <span>Document Code: PECO-RVM-MASTER-REV6</span>
      <span>Master Omnibus Edition</span>
    </div>

    <div class="hero-cover">
      <div class="hero-cover-top">
        <span class="hero-badge">Verified System Edition &bull; Rev 6.0</span>
        <span style="font-size:8pt; color:#A7F3D0; font-family:monospace;">STRICT 1:1 FIRMWARE MATCH</span>
      </div>
      <h1>PECODROP REVERSE VENDING MACHINE (RVM)</h1>
      <div class="hero-cover-urdu-title">پیکوڈراپ اسمارٹ ریورس وینڈنگ مشین — مکمل جامع ماسٹر مینوئل</div>
      <p>
        The complete, definitive technical reference and operating guide covering Citizen Kiosk Operations, 
        3-Chamber Mechatronics Engineering, Arduino Mega 2560 Firmware Architecture, Tri-Lingual Workflow 
        (English, True Urdu Nastaliq &amp; Roman Urdu), 115200 Baud Serial Telemetry, Maintenance Diagnostics, 
        and Custom Mega Shield REV 6.0 PCB Fabrication.
      </p>
    </div>

    <div class="grid-2">
      <div class="diagram-box">
        <img src="{img_kiosk}" alt="Kiosk 3D CAD Overview">
        <div class="caption">Figure 1: PecoDrop 3-Chamber Automated Kiosk with Multi-Port Recycling</div>
      </div>
      <div class="card" style="border-left:4px solid #059669;">
        <div class="card-title" style="color:#059669;">Master Table of Contents</div>
        <div class="card-body">
          <ul>
            <li><strong>Part 1:</strong> Citizen &amp; Operator Kiosk Manual (4-Step Deposit &amp; Acceptance)</li>
            <li><strong>Part 2:</strong> Firmware Architecture &amp; English Technical Workflow</li>
            <li><strong>Part 3:</strong> True Urdu Nastaliq Workflow (نستعلیق رسم الخط میں ۶ مراحل)</li>
            <li><strong>Part 4:</strong> Roman Urdu Field Guide (Mukammal Aam Fehm)</li>
            <li><strong>Part 5:</strong> Host PC Serial Telemetry &amp; API Protocol (115200 Baud)</li>
            <li><strong>Part 6:</strong> Hardware Mechatronics &amp; Arduino Mega Pinout Matrix</li>
            <li><strong>Part 7:</strong> Maintenance Diagnostics, Error Trees &amp; Preventive Schedule</li>
            <li><strong>Part 8:</strong> Custom Mega Shield REV 6.0 PCB Design &amp; Fabrication</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:6px;">
      <div class="card-title">System Core Specifications at a Glance</div>
      <div class="card-body">
        <strong>Microcontroller:</strong> Atmel ATmega2560 @ 16 MHz &bull; 
        <strong>Firmware Source:</strong> <code>RVM_Arduino.ino</code> &bull; 
        <strong>Baud Rate:</strong> 115200 bps (8-N-1) &bull; 
        <strong>Sorting Chambers:</strong> Chamber 1 (PET Bottles), Chamber 2 (Aluminum Cans), Chamber 3 (Paper/Tetra Pak) &bull; 
        <strong>Actuators:</strong> 5x MG996R Servos (2x Iris, 3x Drop Gates) &bull; 
        <strong>Sensors:</strong> 4x Ultrasonic, 1x NPN Inductive, 1x HX711 24-Bit ADC Load Cell &bull; 
        <strong>Power Distribution:</strong> 12V 15A DC Main Rail with dual buck step-downs (5V 3A Logic &amp; 6V 5A Servos).
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; ISO-9001 COMPLIANT MASTER MANUAL</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 1 of 8</span>
    </div>
  </div>


  <!-- ==================== PAGE 2: PART 1: OPERATOR & CITIZEN MANUAL ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PART 1 &bull; CITIZEN &amp; OPERATOR KIOSK OPERATION</span>
      <span>Touchscreen Recycling &amp; Acceptance Guide</span>
      <span>Page 2 of 8</span>
    </div>

    <div class="section-title-bar">
      <h2>PART 1: CITIZEN KIOSK RECYCLING WORKFLOW &amp; ACCEPTANCE CRITERIA</h2>
      <span class="meta">End-User Operation</span>
    </div>

    <div style="text-align:center; margin-bottom:8px;">
      <img src="{img_touch}" style="max-width:98%; height:auto; border:1px solid #CBD5E1; border-radius:6px;" alt="Touchscreen Workflow">
      <p style="font-size:7pt; color:#64748B; font-weight:700; margin-top:2px;">Figure 2: 4-Card Citizen Touchscreen Interaction &amp; Mobile App Reward Flow</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">4-Step Citizen Recycling Process</div>
        <div class="card-body">
          <ul>
            <li><strong>Step 1 (Touch Screen):</strong> Citizen taps "START RECYCLING" on the 10.1" kiosk display. Voice &amp; screen prompts guide the user.</li>
            <li><strong>Step 2 (Select Material):</strong> Tap Plastic Bottle, Beverage Can, or Paper Cartons. The corresponding illuminated aperture unlocks.</li>
            <li><strong>Step 3 (Insert Container):</strong> User places container horizontally. Ultrasonic and inductive arrays verify size and material purity.</li>
            <li><strong>Step 4 (Claim Rewards):</strong> Scan dynamic QR code with PecoDrop App to receive instant loyalty credits or cash vouchers.</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Daily Operator Routine &amp; Bin Service</div>
        <div class="card-body">
          <ul>
            <li><strong>Morning Inspection:</strong> Verify green LED indicators on all 3 chamber mouths and check serial link to IPC.</li>
            <li><strong>Optical Lens Cleaning:</strong> Wipe ultrasonic transducer cones with microfiber cloth to prevent false clearance triggers.</li>
            <li><strong>Bin Clearance:</strong> Empty Chamber 1, 2, and 3 waste bins when telemetry signals reach &ge; 85% volumetric threshold.</li>
            <li><strong>Load Cell Zero Check:</strong> Clean weighing platform of Chamber 3 and issue <code>CMD:TARE_LOADCELL</code> if scale offset &gt; 5g.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="section-title-bar" style="margin-top:6px;">
      <h2>ACCEPTED VS. REJECTED MATERIALS MATRIX</h2>
      <span class="meta">Sensor Validation Criteria</span>
    </div>

    <table class="matrix-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Accepted Containers</th>
          <th>Strictly Rejected Items</th>
          <th>Urdu Summary (مقبول اور غیر مقبول اشیاء)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Chamber 1 (Plastic)</strong></td>
          <td>PET beverage bottles (250ml to 1.5L), empty, transparent/tinted.</td>
          <td>Oil bottles, detergent jugs, glass bottles, filled liquid containers.</td>
          <td style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#0369A1; direction:rtl; text-align:right;">پلاسٹک کی خالی بوتلیں (۲۵۰ ملی لیٹر تا ۱.۵ لیٹر)۔ گلاس یا تیل کی بوتل ممنوع ہے۔</td>
        </tr>
        <tr>
          <td><strong>Chamber 2 (Metal)</strong></td>
          <td>Aluminum beverage cans (250ml - 500ml), tin cans, soda cans.</td>
          <td>Aerosol spray cans, heavy iron parts, batteries, contaminated foil.</td>
          <td style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#B45309; direction:rtl; text-align:right;">ایلومینیم اور ٹن کے کینز۔ سپرے کین یا بیٹری چیمبر میں ڈالنا سخت منع ہے۔</td>
        </tr>
        <tr>
          <td><strong>Chamber 3 (Paper)</strong></td>
          <td>Tetra Pak drink cartons, clean dry paper packaging, cardboard cups.</td>
          <td>Wet soggy cardboard, food boxes, thermocol foam, plastic bags.</td>
          <td style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#059669; direction:rtl; text-align:right;">خشک کاغذ اور ٹیٹرا پیک کارٹن (وزن ۲۰ گرام سے زائد)۔ گیلا کچرا ممنوع ہے۔</td>
        </tr>
      </tbody>
    </table>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; CITIZEN INTERACTION MANUAL</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 2 of 8</span>
    </div>
  </div>


  <!-- ==================== PAGE 3: PART 2: FIRMWARE SPECIFICATIONS & CAD FLOWS ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PART 2 &bull; FIRMWARE ARCHITECTURE &amp; WORKFLOW</span>
      <span>Deterministic State Machine</span>
      <span>Page 3 of 8</span>
    </div>

    <div class="section-title-bar">
      <h2>PART 2: FIRMWARE FINITE STATE MACHINE &amp; TECHNICAL WORKFLOW</h2>
      <span class="meta">Interrupt-Driven Architecture</span>
    </div>

    <div class="card">
      <div class="card-title">1. State 0: System Initialization &amp; Auto-Calibration Routine</div>
      <div class="card-body">
        Upon boot or reset, the firmware immediately executes <code>makeSafe()</code>:
        <ul>
          <li><strong>Mechanical Failsafe:</strong> Iris Servos are forced to 178&deg; (Fully Closed) and Drop Gate Servos to 0&deg;/175&deg; (Firmly Locked) to prevent unauthorized manual access.</li>
          <li><strong>Baseline Acoustic Profiling:</strong> Takes 7 sonar bursts on the entrance sensor and 5 bursts on chamber sensors. If variance is &lt; 2.0 cm, measurements are saved into EEPROM as the baseline empty reference.</li>
          <li><strong>Load Cell Tare:</strong> The HX711 24-bit strain gauge acquires 12 continuous readings to establish digital zero (tare).</li>
          <li><strong>Telemetry Emission:</strong> Sends <code>CALIBRATION:OK</code> to Host PC over UART and enters <code>STATE_IDLE</code>.</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <div class="card-title">2. State 1: Entrance Detection Pipeline (3-Stage Validation)</div>
      <div class="card-body">
        To prevent false triggers from passing shadows, reflections, or casual hand movements:
        <ul>
          <li><strong>Stage 1 (Clearance):</strong> Ultrasonic distance must read clear (&gt; 25 cm) for &ge; 5 consecutive cycles (1000 ms).</li>
          <li><strong>Stage 2 (Insertion Trigger):</strong> Distance drops below 18 cm continuously for &ge; 4 consecutive ping cycles.</li>
          <li><strong>Stage 3 (Confirmation Telemetry):</strong> Emits <code>ENTRANCE:DETECTED</code>. Host PC locks kiosk screen and commands aperture opening.</li>
        </ul>
      </div>
    </div>

    <div class="grid-3">
      <div class="diagram-box">
        <img src="{img_ch1}" alt="Chamber 1 Plastic Flow">
        <div class="caption">Chamber 1: Plastic Sizing Flow</div>
      </div>
      <div class="diagram-box">
        <img src="{img_ch2}" alt="Chamber 2 Metal Flow">
        <div class="caption">Chamber 2: Metal Inductive Flow</div>
      </div>
      <div class="diagram-box">
        <img src="{img_ch3}" alt="Chamber 3 Paper Flow">
        <div class="caption">Chamber 3: Paper Load Cell Flow</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">3. Multi-Chamber Material Processing &amp; Failsafe Watchdogs</div>
      <div class="card-body">
        <ul>
          <li><strong>Chamber 1 (Plastic):</strong> Host sends <code>CMD:START_CH1</code> &rarr; Iris opens to 5&deg; &rarr; 2000 ms settle delay &rarr; Ultrasonic (Pins 4/5) takes 5 samples &rarr; Classifies as <em>Small (&lt; 250ml)</em>, <em>Medium (500ml)</em>, or <em>Large (&gt; 1.5L)</em> &rarr; Actuates Drop Gate Servo (Pin 8) to 175&deg; &rarr; Returns to 0&deg; after 1500 ms &rarr; Emits <code>RESULT:BOTTLE:SIZE:ACCEPTED</code>.</li>
          <li><strong>Chamber 2 (Metal Cans):</strong> Host sends <code>CMD:START_CH2</code> &rarr; Reads Inductive Sensor (Pin 32, Active LOW) &rarr; If conductive metal verified, actuates Drop Gate Servo (Pin 9) &rarr; Emits <code>RESULT:CAN:ACCEPTED</code>.</li>
          <li><strong>Chamber 3 (Paper / Tetra Pak):</strong> Host sends <code>CMD:START_CH3</code> &rarr; HX711 (Pins A14/A15) measures gross weight (&gt; 20g threshold) &rarr; Drop Gate Servo (Pin 10) actuates &rarr; Emits <code>RESULT:PAPER:ACCEPTED</code>.</li>
          <li><strong>12-Second Hardware Watchdog:</strong> If item is not detected within 12,000 ms, Arduino cancels routine, secures gates, and emits <code>TIMEOUT:ABORT</code>.</li>
        </ul>
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; FIRMWARE ENGINEERING SPECIFICATIONS</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 3 of 8</span>
    </div>
  </div>


  <!-- ==================== PAGE 4: PART 3: TRUE URDU NASTALIQ WORKFLOW (STEPS 1-3) ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">پیکوڈراپ ریورس وینڈنگ مشین &bull; مکمل اردو ورک فلو</span>
      <span style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#064E3B;">نستعلیق رسم الخط میں مستند گائیڈ</span>
      <span>صفحہ ۴ از ۸</span>
    </div>

    <div class="section-title-bar urdu">
      <div class="urdu-banner-text">تیسرا حصہ: مکمل اردو رہنما و تفصیلی ورک فلو (نستعلیق رسم الخط) — مرحلہ ۱ تا ۳</div>
      <span class="meta" style="font-family:sans-serif; color:#065F46;">مستند اور تصدیق شدہ فریم ورک</span>
    </div>

    <div class="urdu-container">

      <div class="urdu-card">
        <div class="urdu-step-header">
          <span class="urdu-badge">مرحلہ ۱</span>
          <span>مشین کا آغاز اور خودکار کیلیبریشن (ابتدائی تیاری اور سنسرز کی جانچ)</span>
        </div>
        <div class="urdu-body">
          جب مشین کو بجلی فراہم کی جاتی ہے یا آرڈوینو میگا کو دوبارہ آن کیا جاتا ہے، تو فرم ویئر فوری طور پر <code>makeSafe()</code> کا فنکشن چلاتا ہے تاکہ تمام مکینیکل گیٹس مکمل طور پر بند اور محفوظ ہو جائیں:
          <ul class="urdu-bullet">
            <li><strong>حفاظتی گیٹ پوزیشن:</strong> تمام آئرس سروو موٹرز ۱۷۸ ڈگری پر سیٹ ہو کر خودکار بند ہو جاتی ہیں اور ڈراپ گیٹس ۰ ڈگری پر لاک ہو جاتے ہیں۔</li>
            <li><strong>چیمبر کی گہرائی کی پیمائش (بیس لائن):</strong> انٹری سنسر ۷ مرتبہ اور اندرونی سنسرز ۵ مرتبہ الٹراسونک لہریں بھیج کر خالی چیمبر کا فاصلہ ناپتے ہیں۔ اگر پیمائش میں ۲ سینٹی میٹر سے کم فرق ہو تو اسے بیس لائن محفوظ کر لیا جاتا ہے۔</li>
            <li><strong>لوڈ سیل کی زیرو سیٹنگ (Tare):</strong> پیپر چیمبر کا HX711 لوڈ سیل ۱۲ مرتبہ وزن ناپ کر خالی ترازو کو صفر گرام پر سیٹ کرتا ہے۔</li>
            <li><strong>کامیابی کا سگنل:</strong> تیاری مکمل ہونے پر آرڈوینو کمپیوٹر کو <code>CALIBRATION:OK</code> کا سگنل بھیجتا ہے اور مشین آئیڈل (تیار) موڈ میں چلی جاتی ہے۔</li>
          </ul>
        </div>
      </div>

      <div class="urdu-card">
        <div class="urdu-step-header">
          <span class="urdu-badge">مرحلہ ۲</span>
          <span>انٹری سنسر: بوتل یا کین کی آمد اور ۳ سطحی شور کا فلٹر</span>
        </div>
        <div class="urdu-body">
          شہری کی آمد اور بوتل ڈالنے کے عمل کو درست طریقے سے پہچاننے کے لیے ۳ سطحی تصدیق کی جاتی ہے تاکہ ہاتھ ہلانے یا سائے سے غلط ٹریگر نہ ہو:
          <ul class="urdu-bullet">
            <li><strong>راستہ صاف ہونے کی تصدیق:</strong> سنسر مسلسل ۵ مرتبہ (کم از کم ۱ سیکنڈ) راستہ بالکل خالی پائے۔</li>
            <li><strong>بوتل داخل ہونے کا فاصلہ:</strong> الٹراسونک فاصلہ ۱۸ سینٹی میٹر سے کم ہو اور مسلسل ۴ ریڈنگز تک برقرار رہے۔</li>
            <li><strong>کمپیوٹر کو اطلاع:</strong> تصدیق کے بعد آرڈوینو فوری طور پر <code>ENTRANCE:DETECTED</code> بھیجتا ہے اور کیوسک سکرین پر ہدایت ظاہر ہوتی ہے۔</li>
          </ul>
        </div>
      </div>

      <div class="urdu-card">
        <div class="urdu-step-header">
          <span class="urdu-badge">مرحلہ ۳</span>
          <span>چیمبر ۱: پلاسٹک بوتل کا سائز ناپنا اور تصدیق (چھوٹی، درمیانی، بڑی بوتل)</span>
        </div>
        <div class="urdu-body">
          جب صارف پلاسٹک بوتل ڈالتا ہے تو آرڈوینو درج ذیل طریقہ کار اختیار کرتا ہے:
          <ul class="urdu-bullet">
            <li><strong>آئرس گیٹ کا کھلنا:</strong> انٹری آئرس سروو ۵ ڈگری پر کھلتا ہے تاکہ بوتل اندر چلی جائے، پھر محفوظ طریقے سے بند ہو جاتا ہے۔</li>
            <li><strong>دو سیکنڈ کا ٹھہراؤ (Settle Delay):</strong> بوتل کے حرکت بند ہونے کے لیے ۲۰۰۰ ملی سیکنڈ کا وقفہ دیا جاتا ہے۔</li>
            <li><strong>سائز کی درجہ بندی:</strong> پن ۴ اور ۵ سے منسلک سنسر ۵ ریڈنگز لے کر بوتل کو سمال (۲۵۰ ملی لیٹر)، میڈیم (۵۰۰ ملی لیٹر)، یا لارج (۱.۵ لیٹر) قرار دیتا ہے۔</li>
            <li><strong>نیچے گرانے کا گیٹ:</strong> پن ۸ پر موجود ڈراپ سروو ۱۷۵ ڈگری پر کھلتا ہے اور ۱۵۰۰ ملی سیکنڈ بعد بند ہو جاتا ہے۔ کمپیوٹر کو <code>RESULT:BOTTLE:SIZE:ACCEPTED</code> موصول ہوتا ہے۔</li>
          </ul>
        </div>
      </div>

    </div>

    <div class="page-running-footer">
      <span>پیکوڈراپ آٹومیشن &bull; مستند اردو دستور العمل</span>
      <span>Confidential &amp; Proprietary</span>
      <span>صفحہ ۴ از ۸</span>
    </div>
  </div>


  <!-- ==================== PAGE 5: PART 3 & 4: TRUE URDU (STEPS 4-6) & ROMAN URDU ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PECODROP RVM &bull; WORKFLOW CONTINUATION</span>
      <span style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#064E3B;">اردو اور رومن اردو ورک فلو</span>
      <span>صفحہ ۵ از ۸</span>
    </div>

    <div class="urdu-container">

      <div class="urdu-card">
        <div class="urdu-step-header">
          <span class="urdu-badge">مرحلہ ۴</span>
          <span>چیمبر ۲: دھاتی کین کی انڈکٹیو سنسر سے تصدیق اور فلٹرنگ</span>
        </div>
        <div class="urdu-body">
          ایلومینیم یا ٹن کے کینز کی الگ پہچان کے لیے چیمبر ۲ میں خصوصی میٹل سنسر لگایا گیا ہے:
          <ul class="urdu-bullet">
            <li><strong>انڈکٹیو پراکسیمٹی سنسر (پن ۳۲):</strong> جیسے ہی دھاتی کین چیمبر میں گرتا ہے، سنسر میٹل ڈیٹیکٹ کرتا ہے۔</li>
            <li><strong>ڈراپ گیٹ ایکٹیویشن:</strong> تصدیق کے فوراً بعد پن ۹ کا سروو موٹر گیٹ کھولتا ہے اور کین میٹل بن میں گر جاتا ہے۔ کمپیوٹر کو <code>RESULT:CAN:ACCEPTED</code> بھیجا جاتا ہے۔</li>
          </ul>
        </div>
      </div>

      <div class="urdu-card">
        <div class="urdu-step-header">
          <span class="urdu-badge">مرحلہ ۵</span>
          <span>چیمبر ۳: کاغذ اور ٹیٹرا پیک کارٹن کی لوڈ سیل سے تصدیق</span>
        </div>
        <div class="urdu-body">
          کاغذ اور کارٹن کے وزن کی درست تصدیق کے لیے ڈیجیٹل ترازو کام کرتا ہے:
          <ul class="urdu-bullet">
            <li><strong>لوڈ سیل پیمائش:</strong> پن A14 اور A15 پر جڑا HX711 لوڈ سیل وزن ناپتا ہے۔ اگر وزن ۲۰ گرام سے زیادہ ہو تو شے تسلیم کی جاتی ہے۔</li>
            <li><strong>محفوظ ڈراپ:</strong> پن ۱۰ کا ڈراپ سروو کچرا بن میں ڈراپ کرواتا ہے اور کمپیوٹر کو <code>RESULT:PAPER:ACCEPTED</code> ملتا ہے۔</li>
          </ul>
        </div>
      </div>

      <div class="urdu-card">
        <div class="urdu-step-header">
          <span class="urdu-badge">مرحلہ ۶</span>
          <span>خودکار گیٹ کنٹرول، جیمنگ کا تحفظ اور ۱۲ سیکنڈ کا سیفٹی ٹائم آؤٹ</span>
        </div>
        <div class="urdu-body">
          مشین کو محفوظ رکھنے اور بوتل پھنسنے سے بچانے کے لیے خودکار واچ ڈاگ فعال رہتا ہے:
          <ul class="urdu-bullet">
            <li><strong>۱۲ سیکنڈ کا سیفٹی ٹائم آؤٹ:</strong> اگر صارف ۱۲۰۰۰ ملی سیکنڈ کے اندر بوتل نہیں ڈالتا تو آرڈوینو فوری طور پر آئرس گیٹ بند کر کے <code>TIMEOUT:ABORT</code> جاری کرتا ہے۔</li>
            <li><strong>محفوظ پوزیشن:</strong> کسی بھی خرابی یا بجلی کے جھٹکے کی صورت میں فرم ویئر گیٹس کو تالا لگا دیتا ہے۔</li>
          </ul>
        </div>
      </div>

    </div>

    <!-- Roman Urdu Section -->
    <div class="section-title-bar" style="margin-top:8px;">
      <h2>PART 4: ROMAN URDU FIELD GUIDE (MUKAMMAL AAM FEHM)</h2>
      <span class="meta">Technician Field Guide in Roman Urdu</span>
    </div>

    <div class="roman-card">
      <div class="roman-header">1. Machine Ka Start Hona Aur Auto-Calibration:</div>
      <div class="roman-body">
        Jab machine restart hoti hai, Arduino Mega sab se pehle tamam pins par <code>makeSafe()</code> chalata hai. Tamam Iris Servos 178&deg; (Mukammal Band) aur Drop Gate Servos 0&deg;/175&deg; par lock ho jate hain.<br>
        • <strong>Chamber Baseline:</strong> Entrance sensor 7 dafa aur chamber sensors 5 dafa faasla naap kar empty baseline save karte hain (&lt; 2cm difference).<br>
        • <strong>Tare:</strong> HX711 load cell 12 readings se scale zero (tare) karta hai. Ready hone par Arduino <code>CALIBRATION:OK</code> bhejta hai.
      </div>
    </div>

    <div class="roman-card">
      <div class="roman-header">2. Entrance Shanakht &amp; Sorting Flow:</div>
      <div class="roman-body">
        • <strong>Entrance 3-Stage Filter:</strong> Sensor 1 second tak khali rasta dekhe &rarr; Faasla 18 cm se kam ho kar 4 readings qaim rahe &rarr; Arduino bhejta hai <code>ENTRANCE:DETECTED</code>.<br>
        • <strong>Chamber 1 (Plastic):</strong> Iris 5&deg; khulta hai &rarr; 2 second settle delay &rarr; Ultrasonic height naap kar Small, Medium ya Large karta hai &rarr; Pin 8 Drop Gate open ho kar bottle gira deta hai &rarr; <code>RESULT:BOTTLE:SIZE:ACCEPTED</code>.<br>
        • <strong>Chamber 2 (Metal):</strong> Pin 32 Inductive Sensor metal pehchanta hai &rarr; Pin 9 Drop Gate open hota hai &rarr; <code>RESULT:CAN:ACCEPTED</code>.<br>
        • <strong>Chamber 3 (Paper):</strong> HX711 load cell wazan naap kar Pin 10 Gate kholta hai &rarr; <code>RESULT:PAPER:ACCEPTED</code>.<br>
        • <strong>12s Safety Watchdog:</strong> Agar 12000 ms mein bottle na aye to Arduino <code>TIMEOUT:ABORT</code> bhej kar gates secure karta hai.
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; URDU &amp; ROMAN URDU WORKFLOW</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 5 of 8</span>
    </div>
  </div>


  <!-- ==================== PAGE 6: PART 5: HOST PC SERIAL PROTOCOL ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PART 5 &bull; SERIAL COMMUNICATION PROTOCOL</span>
      <span>UART 115200 Baud, 8-N-1 Standard</span>
      <span>Page 6 of 8</span>
    </div>

    <div class="section-title-bar">
      <h2>PART 5: HOST PC SERIAL COMMANDS REFERENCE MATRIX</h2>
      <span class="meta">Bidirectional ASCII Protocol</span>
    </div>

    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width:22%;">Command String</th>
          <th style="width:14%;">Direction</th>
          <th style="width:36%;">Firmware Internal Operation</th>
          <th style="width:28%;">Expected Arduino Response</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>CMD:STATUS</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Polls current state machine execution state and sensor readouts</td>
          <td><code>STATUS:IDLE</code> / <code>STATUS:BUSY:CH[1-3]</code></td>
        </tr>
        <tr>
          <td><code>CMD:START_CH1</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Opens Chamber 1 Iris, arms ultrasonic sizing, actuates Pin 8 drop gate</td>
          <td><code>RESULT:BOTTLE:[SIZE]:ACCEPTED</code></td>
        </tr>
        <tr>
          <td><code>CMD:START_CH2</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Opens Chamber 2 Iris, monitors Pin 32 Inductive, actuates Pin 9 gate</td>
          <td><code>RESULT:CAN:ACCEPTED</code> / <code>REJECTED</code></td>
        </tr>
        <tr>
          <td><code>CMD:START_CH3</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Opens Chamber 3 Iris, acquires HX711 load cell tare &amp; weight, operates Pin 10 gate</td>
          <td><code>RESULT:PAPER:ACCEPTED</code> / <code>REJECTED</code></td>
        </tr>
        <tr>
          <td><code>CMD:REJECT</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Aborts active cycle, locks drop gates, reverses motorized entry</td>
          <td><code>ACTION:REJECTED:SAFE</code></td>
        </tr>
        <tr>
          <td><code>CMD:TEST_SERVOS</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Sequentially exercises all 5 servos through full travel arc (0&deg; &rarr; 180&deg; &rarr; 0&deg;)</td>
          <td><code>DIAG:SERVOS:COMPLETE</code></td>
        </tr>
        <tr>
          <td><code>CMD:TEST_SENSORS</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Returns real-time diagnostic stream of all 4 ultrasonics, proximity, and load cell</td>
          <td><code>DATA:US:[D1,D2,D3,D4]:IND:[0/1]:WT:[G]</code></td>
        </tr>
        <tr>
          <td><code>CMD:FORCE_GATE:CH1</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Manual override to toggle Chamber 1 drop flap for bin emptying/service</td>
          <td><code>GATE:CH1:[OPEN/CLOSED]</code></td>
        </tr>
        <tr>
          <td><code>CMD:FORCE_GATE:CH2</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Manual override to toggle Chamber 2 drop flap for metal bin maintenance</td>
          <td><code>GATE:CH2:[OPEN/CLOSED]</code></td>
        </tr>
        <tr>
          <td><code>CMD:FORCE_GATE:CH3</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Manual override to toggle Chamber 3 drop flap for paper waste clearing</td>
          <td><code>GATE:CH3:[OPEN/CLOSED]</code></td>
        </tr>
        <tr>
          <td><code>CMD:TARE_LOADCELL</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Forces recalibration of HX711 zero-offset baseline</td>
          <td><code>LOADCELL:TARE:OK</code></td>
        </tr>
        <tr>
          <td><code>CMD:RESET</code></td>
          <td><span class="tag-in">PC &rarr; Mega</span></td>
          <td>Triggers internal software reset, executes makeSafe(), re-baselines</td>
          <td><code>CALIBRATION:OK</code></td>
        </tr>
      </tbody>
    </table>

    <div class="grid-2">
      <div class="diagram-box">
        <img src="{img_state}" alt="State Machine Protocol Flow">
        <div class="caption">Figure 3: Finite State Machine &amp; Serial Telemetry Flow</div>
      </div>
      <div class="card">
        <div class="card-title">Serial Bus Characteristics &amp; Timing</div>
        <div class="card-body">
          <ul>
            <li><strong>Baud Rate:</strong> 115200 bps &bull; <strong>Data Bits:</strong> 8 &bull; <strong>Parity:</strong> None &bull; <strong>Stop Bits:</strong> 1.</li>
            <li><strong>Line Ending:</strong> All commands must terminate with Carriage Return + Line Feed (<code>\r\n</code>).</li>
            <li><strong>Heartbeat Watchdog:</strong> Host PC queries <code>CMD:STATUS</code> every 500 ms during active processing.</li>
            <li><strong>Safety Fallback:</strong> If no ACK received within 15,000 ms, host flags serial bus fault and invokes auto-reconnect.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; SERIAL INTERFACE PROTOCOL</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 6 of 8</span>
    </div>
  </div>


  <!-- ==================== PAGE 7: PART 6 & 7: PINOUT & MAINTENANCE ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PART 6 &amp; 7 &bull; HARDWARE PINOUT &amp; MAINTENANCE</span>
      <span>Electrical Interconnect &amp; Preventive Maintenance</span>
      <span>Page 7 of 8</span>
    </div>

    <div class="section-title-bar">
      <h2>PART 6: ARDUINO MEGA 2560 HARDWARE PINOUT MATRIX</h2>
      <span class="meta">Shield Header &amp; Wiring Allocation</span>
    </div>

    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width:13%;">Mega Pin</th>
          <th style="width:24%;">Peripheral / Sensor</th>
          <th style="width:15%;">Signal Type</th>
          <th style="width:13%;">Voltage</th>
          <th style="width:35%;">Hardware Functional Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Pin 2 / 3</strong></td>
          <td>Entrance Ultrasonic (Trig / Echo)</td>
          <td><span class="tag-out">DIGITAL OUT</span> / <span class="tag-in">IN</span></td>
          <td>5.0V DC</td>
          <td>10&micro;s pulse emitter &amp; echo timer for customer presence</td>
        </tr>
        <tr>
          <td><strong>Pin 4 / 5</strong></td>
          <td>Chamber 1 Ultrasonic (Trig / Echo)</td>
          <td><span class="tag-out">DIGITAL OUT</span> / <span class="tag-in">IN</span></td>
          <td>5.0V DC</td>
          <td>Height &amp; volume profiling array for PET plastic bottles</td>
        </tr>
        <tr>
          <td><strong>Pin 6 / 7</strong></td>
          <td>Chamber 1 &amp; 2 Iris Servos</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Rotary iris motorized apertures for container deposit entry</td>
        </tr>
        <tr>
          <td><strong>Pin 8, 9, 10</strong></td>
          <td>Chamber 1, 2, 3 Drop Gate Servos</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Drop floor flap actuation into separate bottom sorting bins</td>
        </tr>
        <tr>
          <td><strong>Pin 32</strong></td>
          <td>Inductive Proximity Sensor</td>
          <td><span class="tag-in">DIGITAL IN (NPN)</span></td>
          <td>5.0V (Divider)</td>
          <td>High-frequency eddy current metallic detection (Active LOW)</td>
        </tr>
        <tr>
          <td><strong>Pin A14 / A15</strong></td>
          <td>HX711 Load Cell (DT / SCK)</td>
          <td><span class="tag-in">DIGITAL IN</span> / <span class="tag-out">OUT</span></td>
          <td>5.0V DC</td>
          <td>24-bit serial ADC data and clock lines for paper scale tare &amp; weight</td>
        </tr>
        <tr>
          <td><strong>VIN / GND</strong></td>
          <td>Main Shield DC Power Input</td>
          <td><span class="tag-pwr">POWER INPUT</span></td>
          <td>12V DC (15A)</td>
          <td>Dual on-board regulators: 5V (Logic) and 6V 5A (Servo Rail)</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title-bar" style="margin-top:6px;">
      <h2>PART 7: PREVENTIVE MAINTENANCE SCHEDULE &amp; ERROR CODE TREES</h2>
      <span class="meta">Field Service Guide</span>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Preventive Maintenance Schedule</div>
        <div class="card-body">
          <ul>
            <li><strong>Daily:</strong> Clean entrance ultrasonic cones with dry lint-free cloth. Empty recycling bins. Check touchscreen response.</li>
            <li><strong>Weekly:</strong> Clean Chamber 3 load cell acrylic plate. Inspect servo linkage horns for mechanical play or looseness.</li>
            <li><strong>Monthly:</strong> Check 12V PSU voltage rail. Check TVS diodes and ensure servo temperature is below 55&deg;C under full cycle load.</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Diagnostic Error Trees</div>
        <div class="card-body">
          <ul>
            <li><strong>Error E-01 (Sensor Crosstalk):</strong> Chamber reads false distance. <em>Remedy:</em> Check ground pin on HC-SR04, clean optical cones.</li>
            <li><strong>Error E-02 (Gate Jam):</strong> Drop gate fails to return to 0&deg;. <em>Remedy:</em> Check servo horn alignment, inspect chute for trapped bottle.</li>
            <li><strong>Error E-03 (Scale Drift):</strong> HX711 tare &gt; 15g offset. <em>Remedy:</em> Remove debris from platform and execute <code>CMD:TARE_LOADCELL</code>.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; MAINTENANCE &amp; TROUBLESHOOTING</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 7 of 8</span>
    </div>
  </div>


  <!-- ==================== PAGE 8: PART 8: CUSTOM SHIELD PCB FABRICATION ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PART 8 &bull; ARDUINO MEGA SHIELD REV 6.0 PCB DESIGN</span>
      <span>Hardware Engineering &amp; Fabrication Master</span>
      <span>Page 8 of 8</span>
    </div>

    <div class="section-title-bar">
      <h2>PART 8: ARDUINO MEGA 2560 EXPANSION SHIELD REV 6.0 HARDWARE ARCHITECTURE</h2>
      <span class="meta">100% Verified Production Shield</span>
    </div>

    <div style="text-align:center; margin-bottom:6px;">
      <img src="{img_shield}" style="max-width:88%; height:auto; border:1px solid #CBD5E1; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.06);" alt="Shield Hardware Map">
      <p style="font-size:7pt; color:#64748B; font-weight:700; margin-top:3px;">Figure 4: Custom Arduino Mega 2560 Dedicated RVM Expansion Shield REV 6.0 Hardware Assembly Map</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Shield Fabrication &amp; Electrical Protection</div>
        <div class="card-body">
          <ul>
            <li><strong>2-Layer FR4 Substrate:</strong> 1.6mm thickness, 1oz copper (35&micro;m), ENIG/HASL lead-free finish.</li>
            <li><strong>Dual-Rail Galvanic Separation:</strong> Optocoupler isolation (PC817) between 12V noisy inductive sensor and 5V ATmega2560 logic.</li>
            <li><strong>Flyback &amp; TVS Clamping:</strong> Dedicated 1N4007 flyback diodes across inductive loads and TVS diodes on VIN rail to suppress voltage spikes.</li>
            <li><strong>High-Current Servo Rail:</strong> 60-mil widened copper tracks backed by solid GND copper pour supporting 5A continuous servo current.</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Production Bill of Materials (BOM Summary)</div>
        <div class="card-body">
          <ul>
            <li><strong>Buck Converter 1:</strong> LM2596S / MP1584 5V 3A Step-down (Logic &amp; Sensors).</li>
            <li><strong>Buck Converter 2:</strong> XL4015 6V 5A High-Efficiency Buck (Servos).</li>
            <li><strong>Optocoupler Stage:</strong> PC817 Photocoupler + 10k&Omega; pull-up resistor.</li>
            <li><strong>Terminals:</strong> 5.08mm screw terminal blocks for 12V main DC power input.</li>
            <li><strong>Headers:</strong> Standard 2.54mm Dupont headers for sensors and servos.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; HARDWARE ENGINEERING &amp; PCB FABRICATION</span>
      <span>Confidential &amp; Proprietary</span>
      <span>Page 8 of 8</span>
    </div>
  </div>

</body>
</html>"""

    html_file = os.path.abspath("scratch/rvm_master_system_manual.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[MASTER HTML GENERATED] Saved to: {html_file} ({os.path.getsize(html_file)} bytes)")
    return html_file

def print_pdf(html_path, pdf_path):
    edge_bin = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_bin):
        edge_bin = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

    user_data_dir = os.path.abspath("scratch/browser_profile")
    os.makedirs(user_data_dir, exist_ok=True)
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

    cmd = [
        edge_bin,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-software-rasterizer",
        f"--user-data-dir={user_data_dir}",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]

    print(f"[RENDERING] Executing Edge Headless to produce: {pdf_path}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(pdf_path):
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        print(f"[SUCCESS] Generated PDF: {pdf_path} ({size_mb:.2f} MB)")
        return True
    else:
        print(f"[ERROR] Return code: {res.returncode}")
        print("Stderr:", res.stderr)
        return False

def render_preview_images(pdf_path):
    import fitz # PyMuPDF
    doc = fitz.open(pdf_path)
    preview_paths = []
    for i in range(len(doc)):
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=150)
        img_out = os.path.abspath(f"scratch/master_manual_page_{i+1}.png")
        pix.save(img_out)
        preview_paths.append(img_out)
        print(f"[PREVIEW] Saved Page {i+1} preview: {img_out}")
    return preview_paths

if __name__ == "__main__":
    html_path = build_master_html()
    pdf_out = os.path.abspath(r"docs/user_manuals/PecoDrop_RVM_Master_System_Manual.pdf")
    brain_pdf = os.path.abspath(r"C:\Users\BIN ISHAQ\.gemini\antigravity-ide\brain\b33351f0-eedc-4c59-93d1-b10ffbbaaa0c\PecoDrop_RVM_Master_System_Manual.pdf")

    success = print_pdf(html_path, pdf_out)
    if success:
        shutil.copyfile(pdf_out, brain_pdf)
        print(f"[COPIED] Mirrored to Brain: {brain_pdf}")
        render_preview_images(pdf_out)
