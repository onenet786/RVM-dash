import os
import base64

def get_base64_img(img_path):
    if not os.path.exists(img_path):
        return ""
    with open(img_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    ext = os.path.splitext(img_path)[1].lower().replace(".", "")
    mime = "image/png" if ext == "png" else "image/jpeg"
    return f"data:{mime};base64,{data}"

def generate_sop_html(html_path, snapshots_dir):
    img_landscape = get_base64_img(os.path.join(snapshots_dir, "screen_landscape_kiosk.png"))
    img_idle = get_base64_img(os.path.join(snapshots_dir, "screen_idle_expanded.png"))
    img_home = get_base64_img(os.path.join(snapshots_dir, "screen_02_home_page.png"))
    img_step02 = get_base64_img(os.path.join(snapshots_dir, "screen_04_step_02.png"))
    img_accepted = get_base64_img(os.path.join(snapshots_dir, "screen_06_step_03_accepted.png"))
    img_reject = get_base64_img(os.path.join(snapshots_dir, "screen_05_step_02_rejection.png"))
    img_complete = get_base64_img(os.path.join(snapshots_dir, "screen_10_complete.png"))

    isp_src = os.path.join(snapshots_dir, "isp_logo.png")
    if not os.path.exists(isp_src):
        isp_src = os.path.join(snapshots_dir, "isp.jpg")
    img_logo_isp = get_base64_img(isp_src)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RVM Kiosk Standard Operating Procedures (SOP) & Engineering Manual — Version 3.2</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 0;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  }}
  body {{
    background: #FFFFFF;
    color: #0F172A;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  .pdf-page {{
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    padding: 12mm 15mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #FFFFFF;
  }}
  .page-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0F172A;
    padding-bottom: 3mm;
    margin-bottom: 4mm;
  }}
  .header-left {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .badge-app {{
    background: #0F172A;
    color: #38BDF8;
    font-size: 8pt;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }}
  .header-title {{
    font-size: 9.5pt;
    font-weight: 800;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .header-right {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
  }}
  .page-footer {{
    margin-top: auto;
    border-top: 1px solid #CBD5E1;
    padding-top: 3mm;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #64748B;
    font-weight: 600;
  }}
  .section-title {{
    font-size: 15pt;
    font-weight: 900;
    color: #0F172A;
    margin-bottom: 2px;
    letter-spacing: -0.3px;
  }}
  .section-subtitle {{
    font-size: 8.5pt;
    color: #475569;
    margin-bottom: 4mm;
    line-height: 1.35;
  }}
  .sop-title-banner {{
    background: #0F172A;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 8px 14px;
    margin-bottom: 4mm;
  }}
  .sop-main-h {{
    font-size: 11pt;
    font-weight: 900;
    color: #38BDF8;
    letter-spacing: 0.5px;
  }}
  .sop-sub-h {{
    font-size: 8pt;
    color: #94A3B8;
    margin-top: 2px;
  }}
  .sop-quad-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }}
  .sop-card-box {{
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
  }}
  .sop-card-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 4px;
  }}
  .sop-id-badge {{
    background: #0F172A;
    color: #38BDF8;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 3px;
  }}
  .sop-freq-tag {{
    font-size: 7.5pt;
    color: #64748B;
    font-weight: 700;
  }}
  .sop-card-h2 {{
    font-size: 9.5pt;
    font-weight: 800;
    color: #0F172A;
    margin-bottom: 6px;
  }}
  .sop-item-list {{
    font-size: 7.8pt;
    color: #334155;
    line-height: 1.45;
    padding-left: 14px;
    margin: 0;
  }}
  .sop-item-list li {{
    margin-bottom: 3.5px;
  }}
  .sop-item-list li strong {{
    color: #0F172A;
  }}
  .matrix-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.6pt;
    margin-bottom: 3mm;
  }}
  .matrix-table th {{
    background: #0F172A;
    color: #38BDF8;
    padding: 5px 8px;
    font-weight: 800;
    text-align: left;
    border: 1px solid #334155;
    font-size: 7.8pt;
  }}
  .matrix-table td {{
    padding: 4.5px 8px;
    border: 1px solid #CBD5E1;
    color: #1E293B;
    vertical-align: middle;
  }}
  .matrix-table tr:nth-child(even) {{
    background: #F8FAFC;
  }}
  .matrix-table strong {{
    color: #0F172A;
  }}
  .callout-warning {{
    background: #FEF2F2;
    border-left: 4px solid #EF4444;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 3mm 0;
  }}
  .callout-warning-title {{
    font-size: 8.5pt;
    font-weight: 800;
    color: #991B1B;
    text-transform: uppercase;
    margin-bottom: 2px;
  }}
  .callout-warning-desc {{
    font-size: 7.8pt;
    color: #7F1D1D;
    line-height: 1.35;
  }}
  .callout-info {{
    background: #F0FDF4;
    border-left: 4px solid #10B981;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 3mm 0;
  }}
  .callout-info-title {{
    font-size: 8.5pt;
    font-weight: 800;
    color: #065F46;
    text-transform: uppercase;
    margin-bottom: 2px;
  }}
  .callout-info-desc {{
    font-size: 7.8pt;
    color: #047857;
    line-height: 1.35;
  }}
  .callout-tech {{
    background: #F0F9FF;
    border-left: 4px solid #0284C7;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 3mm 0;
  }}
  .callout-tech-title {{
    font-size: 8.5pt;
    font-weight: 800;
    color: #075985;
    text-transform: uppercase;
    margin-bottom: 2px;
  }}
  .callout-tech-desc {{
    font-size: 7.8pt;
    color: #0369A1;
    line-height: 1.35;
  }}
  .two-col-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }}
  .three-col-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }}
  .stat-chip {{
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 8px 10px;
    text-align: center;
  }}
  .stat-chip-num {{
    font-size: 13pt;
    font-weight: 900;
    color: #0F172A;
  }}
  .stat-chip-lbl {{
    font-size: 7pt;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    margin-top: 2px;
  }}
  .diag-pill-ok {{
    background: #DCFCE7;
    color: #15803D;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 7.2pt;
    display: inline-block;
  }}
  .diag-pill-warn {{
    background: #FEF9C3;
    color: #A16207;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 7.2pt;
    display: inline-block;
  }}
  .diag-pill-err {{
    background: #FEE2E2;
    color: #B91C1C;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 7.2pt;
    display: inline-block;
  }}
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- PAGE 1: ENGINEERING STANDARD COVER PAGE                                   -->
<!-- ========================================================================= -->
<div class="pdf-page" style="background: linear-gradient(145deg, #0B1120 0%, #0F172A 45%, #1E293B 100%); color: #FFFFFF;">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #334155; padding-bottom:5mm; margin-bottom:8mm;">
    <div>
      <div style="font-size:8.5pt; font-weight:800; color:#38BDF8; letter-spacing:1.5px; text-transform:uppercase;">
        ISLAMIC UNIVERSITY OF BAHAWALPUR · DEPARTMENT OF ELECTRICAL & COMPUTER ENGINEERING
      </div>
      <div style="font-size:7.5pt; color:#94A3B8; margin-top:3px;">
        Industrial IoT & Environmental Automation Laboratory
      </div>
    </div>
    <div style="background:#FFFFFF; padding:4px 10px; border-radius:6px; height:38px; display:flex; align-items:center;">
      <img src="{img_logo_isp}" style="height:30px; object-fit:contain;" alt="Logo"/>
    </div>
  </div>

  <div style="margin-top: 6mm;">
    <div style="display:inline-block; background:#0284C7; color:#FFFFFF; font-size:8.5pt; font-weight:800; padding:4px 12px; border-radius:4px; letter-spacing:1px; margin-bottom:5mm;">
      OFFICIAL ENGINEERING SPECIFICATION & FIELD OPERATING PROTOCOL
    </div>
    <div style="font-size:26pt; font-weight:900; line-height:1.15; color:#FFFFFF; letter-spacing:-0.5px; margin-bottom:4mm;">
      REVERSE VENDING MACHINE (RVM)<br>
      <span style="color:#38BDF8;">STANDARD OPERATING PROCEDURES (SOP)</span><br>
      & FIELD ENGINEERING MANUAL
    </div>
    <div style="font-size:10.5pt; color:#CBD5E1; max-width:170mm; line-height:1.45; margin-bottom:8mm;">
      Technical Standard Operating Procedures (SOP-01 through SOP-10), Microcontroller Pinout Specifications, Cloud Sync & Offline Queueing Protocols, Diagnostic Fault Trees, and Preventive Maintenance Schedules.
    </div>
  </div>

  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:8mm;">
    <div style="background:rgba(255,255,255,0.05); border:1px solid #334155; border-radius:8px; padding:12px 16px;">
      <div style="font-size:8pt; font-weight:800; color:#38BDF8; text-transform:uppercase; margin-bottom:6px;">
        DOCUMENT CONTROL & SPECIFICATION
      </div>
      <table style="width:100%; font-size:8pt; color:#E2E8F0; line-height:1.6;">
        <tr><td style="color:#94A3B8; width:45%;">Document ID:</td><td><strong>DOC-RVM-SOP-2026-V3.2</strong></td></tr>
        <tr><td style="color:#94A3B8;">Firmware Build:</td><td><strong>v3.2.0-STABLE</strong></td></tr>
        <tr><td style="color:#94A3B8;">Desktop Kiosk Engine:</td><td><strong>WPF .NET 8.0 / C# 12</strong></td></tr>
        <tr><td style="color:#94A3B8;">Target Controller:</td><td><strong>Windows 10/11 IoT Enterprise</strong></td></tr>
        <tr><td style="color:#94A3B8;">Microcontroller:</td><td><strong>Arduino Uno R3 (ATmega328P)</strong></td></tr>
      </table>
    </div>

    <div style="background:rgba(255,255,255,0.05); border:1px solid #334155; border-radius:8px; padding:12px 16px;">
      <div style="font-size:8pt; font-weight:800; color:#38BDF8; text-transform:uppercase; margin-bottom:6px;">
        DEPLOYMENT TOPOLOGY
      </div>
      <table style="width:100%; font-size:8pt; color:#E2E8F0; line-height:1.6;">
        <tr><td style="color:#94A3B8; width:45%;">Primary Screen:</td><td><strong>1080x1920 Portrait Touch</strong></td></tr>
        <tr><td style="color:#94A3B8;">Secondary Screen:</td><td><strong>1920x1080 Landscape Signage</strong></td></tr>
        <tr><td style="color:#94A3B8;">Local Database:</td><td><strong>SQL Server LocalDB (MDF)</strong></td></tr>
        <tr><td style="color:#94A3B8;">Central Cloud API:</td><td><strong>HTTPS REST / JSON FIFO Queue</strong></td></tr>
        <tr><td style="color:#94A3B8;">Telemetry Stream:</td><td><strong>Serial COM 9600 Baud / 60s Ping</strong></td></tr>
      </table>
    </div>
  </div>

  <div style="background:rgba(255,255,255,0.03); border:1px solid #334155; border-radius:8px; padding:10px 14px; margin-bottom:8mm;">
    <div style="font-size:8pt; font-weight:800; color:#38BDF8; text-transform:uppercase; margin-bottom:6px;">
      DOCUMENT REVISION HISTORY
    </div>
    <table class="matrix-table" style="margin:0; font-size:7.5pt;">
      <tr style="background:#1E293B;">
        <th style="color:#38BDF8;">Version</th>
        <th style="color:#38BDF8;">Date</th>
        <th style="color:#38BDF8;">Author / Engineering Group</th>
        <th style="color:#38BDF8;">Description of Significant Engineering Modifications</th>
      </tr>
      <tr style="background:#0F172A; color:#CBD5E1;">
        <td><strong>v1.0</strong></td><td>Jan 2026</td><td>Embedded Systems Team</td><td>Initial prototype build, single screen interface, basic optical pulse sizing.</td>
      </tr>
      <tr style="background:#0F172A; color:#CBD5E1;">
        <td><strong>v2.0</strong></td><td>May 2026</td><td>IoT Software Engineering</td><td>Dual-screen topology, SQL Server LocalDB offline ledger, ultrasonic drop validation.</td>
      </tr>
      <tr style="background:#0F172A; color:#CBD5E1;">
        <td><strong>v3.0</strong></td><td>Aug 2026</td><td>Systems Integration Dept</td><td>Central Cloud API sync, QR code mobile wallet onboarding, telemetry terminal.</td>
      </tr>
      <tr style="background:#0F172A; color:#CBD5E1;">
        <td><strong>v3.2</strong></td><td>Sep 2026</td><td>Lead Software & Industrial Team</td><td>1-min Idle Mode 50% expansion, contained zoom, zero-overlap geometry, 001 demo hotkey.</td>
      </tr>
    </table>
  </div>

  <div style="margin-top:auto; border-top:1px solid #334155; padding-top:4mm; display:flex; justify-content:space-between; font-size:7.5pt; color:#94A3B8;">
    <span>CONFIDENTIAL & PROPRIETARY — FOR AUTHORIZED ENGINEERING & FIELD PERSONNEL ONLY</span>
    <span>DOC-RVM-SOP-2026-V3.2 · Page 1</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 2: SYSTEM HARDWARE & DUAL-SCREEN TOPOLOGY                            -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-ENG</span>
      <span class="header-title">Hardware Architecture & Dual-Screen Topology</span>
    </div>
    <div class="header-right">1. SYSTEM TOPOLOGY</div>
  </div>

  <div class="section-title">1. System Hardware & Display Topology</div>
  <div class="section-subtitle">Architectural overview of the dual-screen industrial kiosk, computer controller, power subsystems, and failover watchdogs.</div>

  <div class="two-col-grid" style="margin-bottom:4mm;">
    <div style="display:flex; flex-direction:column; gap:8px;">
      <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
        <div style="font-size:9pt; font-weight:800; color:#0F172A; margin-bottom:4px;">
          PRIMARY INTERACTIVE TOUCH KIOSK (SCREEN 1)
        </div>
        <div style="font-size:7.8pt; color:#334155; line-height:1.4;">
          <strong>Resolution:</strong> 1080 x 1920 Portrait Touchscreen (55" Industrial IPS).<br>
          <strong>Host Window:</strong> <code>MainWindow.xaml</code> (WPF Direct3D Accelerated).<br>
          <strong>Primary Function:</strong> Drives citizen deposit guidance, live container breakdown, mobile wallet entry modal, star rating UI, and 50% expanded idle video standby.
        </div>
      </div>

      <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
        <div style="font-size:9pt; font-weight:800; color:#0F172A; margin-bottom:4px;">
          SECONDARY PUBLIC AWARENESS DISPLAY (SCREEN 0)
        </div>
        <div style="font-size:7.8pt; color:#334155; line-height:1.4;">
          <strong>Resolution:</strong> 1920 x 1080 Landscape Signage (43" Ultra-Bright LED).<br>
          <strong>Host Window:</strong> <code>LandscapeWindow.xaml</code>.<br>
          <strong>Primary Function:</strong> Ambient pedestrian attraction, real-time campus recycling leaderboard, daily CO2 savings aggregate, and commercial video signage reel.
        </div>
      </div>
    </div>

    <div style="border:1px solid #CBD5E1; border-radius:6px; overflow:hidden; background:#0B1120; display:flex; flex-direction:column;">
      <div style="background:#0F172A; color:#38BDF8; font-size:7.5pt; font-weight:800; padding:4px 8px;">
        SECONDARY DISPLAY PREVIEW (1920 x 1080 LANDSCAPE)
      </div>
      <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:4px;">
        <img src="{img_landscape}" style="width:100%; height:auto; border-radius:4px;" alt="Secondary Screen Preview"/>
      </div>
    </div>
  </div>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    INDUSTRIAL PC & ELECTRICAL POWER SPECIFICATIONS
  </div>

  <table class="matrix-table">
    <thead>
      <tr>
        <th style="width:25%;">Subsystem</th>
        <th style="width:30%;">Component Specification</th>
        <th>Operational Parameters & Engineering Margin</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Industrial PC (IPC)</strong></td>
        <td>Intel Core i5-1135G7, 16GB DDR4 RAM, 256GB NVMe SSD</td>
        <td>Fanless industrial chassis; operational temp range -10°C to +55°C. Windows 10 IoT Enterprise.</td>
      </tr>
      <tr>
        <td><strong>Power Conditioning</strong></td>
        <td>1000VA / 900W Online Double-Conversion Sine Wave UPS</td>
        <td>Zero-transfer-time AC battery backup. Provides 45 minutes of complete runtime during grid brownouts.</td>
      </tr>
      <tr>
        <td><strong>DC Power Rails</strong></td>
        <td>Mean Well 12V 10A (Sensors) + 5V 5A Buck (Logic & Servos)</td>
        <td>Independent isolated DC power supplies prevent inductive motor spikes from resetting Arduino logic.</td>
      </tr>
      <tr>
        <td><strong>Serial COM Interface</strong></td>
        <td>Industrial FTDI USB-to-UART Opto-Isolated Cable</td>
        <td>Baud rate 9600, 8-N-1. Hardware keep-alive ping every 5000ms. Auto-reconnect thread upon disconnect.</td>
      </tr>
      <tr>
        <td><strong>Safety Watchdog</strong></td>
        <td>WPF Application Watchdog + Hardware Reset Relay</td>
        <td>Monitors thread responsiveness; auto-restarts kiosk process if UI message pump stalls for > 15 seconds.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-tech">
    <div class="callout-tech-title">DUAL-SCREEN COORDINATION ENGINE</div>
    <div class="callout-tech-desc">
      <code>App.xaml.cs</code> executes display enumeration via <code>System.Windows.Forms.Screen.AllScreens</code>. The secondary display is bound to <code>Screen.AllScreens[0]</code> while the primary portrait touch interface launches full-screen on <code>Screen.AllScreens[1]</code>. When only one display is detected, secondary display gracefully defaults to background virtual rendering.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 2</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 3: ARDUINO UNO PINOUT & SENSOR WIRING MATRIX                         -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-ENG</span>
      <span class="header-title">Microcontroller Pinout & Wiring Specifications</span>
    </div>
    <div class="header-right">2. PINOUT & SENSOR BUS</div>
  </div>

  <div class="section-title">2. Microcontroller Pinout & Sensor Wiring</div>
  <div class="section-subtitle">Complete physical pinout assignments, signaling logic, and optical thresholds for the Arduino Uno R3 controller.</div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:12mm;">Pin</th>
        <th style="width:18mm;">Direction</th>
        <th style="width:40mm;">Subsystem / Sensor</th>
        <th style="width:25mm;">Electrical Signal</th>
        <th>Functional Logic & Trigger Conditions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>D2</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Bottom IR Photoelectric Sensor</td>
        <td>Active LOW (NPN NO)</td>
        <td>Detects container entrance at intake aperture. Starts the 500ms classification timer.</td>
      </tr>
      <tr>
        <td><strong>D3</strong></td>
        <td><span class="diag-pill-warn">OUTPUT</span></td>
        <td>Ultrasonic Transducer (Trig)</td>
        <td>5V TTL 10μs Pulse</td>
        <td>Emits 40 kHz acoustic burst to measure container drop velocity and baseline distance.</td>
      </tr>
      <tr>
        <td><strong>D4</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Ultrasonic Transducer (Echo)</td>
        <td>Pulse Width (μs)</td>
        <td>Calculates flight distance. Used for drop verification and container length profiling.</td>
      </tr>
      <tr>
        <td><strong>D5</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Inductive Proximity Sensor</td>
        <td>Active HIGH (PNP NO)</td>
        <td>Detects ferrous and non-ferrous metal. HIGH = Aluminium Can (UBC), LOW = PET Plastic.</td>
      </tr>
      <tr>
        <td><strong>D7</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Mid-Level IR Photoelectric</td>
        <td>Active LOW (NPN NO)</td>
        <td>Optical height threshold for Medium containers (> 18cm). Beam broken = Medium size.</td>
      </tr>
      <tr>
        <td><strong>D8</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Top-Level IR Photoelectric</td>
        <td>Active LOW (NPN NO)</td>
        <td>Optical height threshold for Large bottles (> 26cm). Beam broken = Large size.</td>
      </tr>
      <tr>
        <td><strong>D9</strong></td>
        <td><span class="diag-pill-warn">OUTPUT</span></td>
        <td>Drop Gate Servo Motor</td>
        <td>50Hz PWM (1000–2000μs)</td>
        <td>0° = Closed Security Gate; 90° = Accept/Drop into bin; 180° = Reject Return to User.</td>
      </tr>
      <tr>
        <td><strong>D10</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Plastic Bin Optical Level Beam</td>
        <td>Active LOW (NPN NC)</td>
        <td>Infrared through-beam across 120L plastic bin rim. Beam broken > 3s = Storage Bin Full.</td>
      </tr>
      <tr>
        <td><strong>D11</strong></td>
        <td><span class="diag-pill-ok">INPUT</span></td>
        <td>Metal Can Bin Optical Level</td>
        <td>Active LOW (NPN NC)</td>
        <td>Infrared through-beam across metal collection bin. Beam broken > 3s = Can Bin Full.</td>
      </tr>
      <tr>
        <td><strong>D13</strong></td>
        <td><span class="diag-pill-warn">OUTPUT</span></td>
        <td>Internal Chamber LED Ring</td>
        <td>5V Logic -> MOSFET</td>
        <td>Illuminates scanning chamber during citizen intake; flashes green on accepted deposit.</td>
      </tr>
    </tbody>
  </table>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    CONTAINER SIZING LOGIC & REWARD POINT MATRIX
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th>Classification</th>
        <th>Optical Sensor States (D2, D7, D8)</th>
        <th>Inductive (D5)</th>
        <th>Height Window</th>
        <th>Reward Credited</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Small Plastic Bottle</strong></td>
        <td>D2 = HIGH, D7 = LOW, D8 = LOW</td>
        <td>D5 = LOW (Non-metal)</td>
        <td>Height &le; 18 cm</td>
        <td><strong>+5 Points</strong> / 0.015 kg CO2</td>
      </tr>
      <tr>
        <td><strong>Medium Plastic Bottle</strong></td>
        <td>D2 = HIGH, D7 = HIGH, D8 = LOW</td>
        <td>D5 = LOW (Non-metal)</td>
        <td>18 cm &lt; Height &le; 26 cm</td>
        <td><strong>+10 Points</strong> / 0.025 kg CO2</td>
      </tr>
      <tr>
        <td><strong>Large Plastic Bottle</strong></td>
        <td>D2 = HIGH, D7 = HIGH, D8 = HIGH</td>
        <td>D5 = LOW (Non-metal)</td>
        <td>Height &gt; 26 cm (max 32cm)</td>
        <td><strong>+15 Points</strong> / 0.040 kg CO2</td>
      </tr>
      <tr>
        <td><strong>Aluminium Can (UBC)</strong></td>
        <td>D2 = HIGH (Any height)</td>
        <td>D5 = HIGH (Metal detected)</td>
        <td>Standard UBC Dimensions</td>
        <td><strong>+10 Points</strong> / 0.050 kg CO2</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-warning">
    <div class="callout-warning-title">ELECTRICAL ISOLATION MANDATE</div>
    <div class="callout-warning-desc">
      The high-torque MG996R servo motor draw up to 2.5A peak during rapid gate actuation. Under no circumstances may servo VCC be powered from the Arduino 5V regulator. Servo VCC must connect directly to the external 5V 5A regulated buck rail with shared common ground.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 3</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 4: SOFTWARE STACK, DATABASE SCHEMAS & CLOUD SYNC                      -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-ENG</span>
      <span class="header-title">Software Stack, Database & Cloud Sync Architecture</span>
    </div>
    <div class="header-right">3. SOFTWARE & DATA ARCHITECTURE</div>
  </div>

  <div class="section-title">3. Software Stack & Data Resiliency</div>
  <div class="section-subtitle">WPF application lifecycle, local Microsoft SQL Server ledger schemas, and resilient Central Cloud synchronization.</div>

  <div class="two-col-grid" style="margin-bottom:4mm;">
    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:8.5pt; font-weight:800; color:#0F172A; margin-bottom:4px; text-transform:uppercase;">
        LOCAL SQL SERVER DATABASE SCHEMAS
      </div>
      <div style="font-size:7.6pt; color:#334155; line-height:1.45;">
        The kiosk maintains a persistent Microsoft SQL Server LocalDB database at <code>C:\RVM\Data\RVM_LocalDB.mdf</code>:
        <ul style="padding-left:14px; margin-top:3px;">
          <li><code>dbo.Transactions</code>: Records GUID, Timestamp, CitizenMobile, PlasticS/M/L, CanCount, TotalPoints, Co2SavedKg, and <code>IsSynced (BIT)</code>.</li>
          <li><code>dbo.WalletAccounts</code>: Tracks MobileNumber, LifetimePoints, AvailablePoints, and LastActiveDate for instant offline balance lookup.</li>
          <li><code>dbo.FeedbackRecords</code>: Stores Rating (1-5), TagChips, Timestamp, and <code>IsSynced</code>.</li>
        </ul>
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:8.5pt; font-weight:800; color:#0F172A; margin-bottom:4px; text-transform:uppercase;">
        CENTRAL CLOUD SYNCHRONIZATION PIPELINE
      </div>
      <div style="font-size:7.6pt; color:#334155; line-height:1.45;">
        Managed by background worker <code>CentralSyncService.cs</code>:
        <ul style="padding-left:14px; margin-top:3px;">
          <li>Executes FIFO upload batches of pending transactions (<code>WHERE IsSynced = 0</code>) via HTTPS REST API.</li>
          <li>Uses Bearer JWT Machine Token authentication for secure transmission.</li>
          <li>Upon HTTP 200 OK receipt from Central Cloud, local records are flagged <code>IsSynced = 1</code>.</li>
          <li>If network is offline, transactions buffer safely in local SQL Server without citizen disruption.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    TELEMETRY & HEARTBEAT PROTOCOL (HEARTBEATSERVICE.CS)
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:25%;">Telemetry Field</th>
        <th style="width:25%;">Reporting Interval</th>
        <th>Payload Description & Alert Triggering Thresholds</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Machine Health Status</strong></td>
        <td>Every 60 Seconds</td>
        <td>Reports <code>ONLINE</code>, <code>MAINTENANCE</code>, or <code>FAULT</code> based on serial and DB connectivity.</td>
      </tr>
      <tr>
        <td><strong>Storage Bin Capacity</strong></td>
        <td>Every 60 Seconds</td>
        <td>Reports percentage full (0-100%). Triggers cloud SMS warning to caretaker when &ge; 85%.</td>
      </tr>
      <tr>
        <td><strong>Serial Hardware Link</strong></td>
        <td>Real-Time Event</td>
        <td>Monitors USB COM port carrier detect. If disconnected, triggers critical dashboard alert.</td>
      </tr>
      <tr>
        <td><strong>Internal Chamber Temp</strong></td>
        <td>Every 300 Seconds</td>
        <td>Monitors internal chassis temperature. Triggers warning if internal ambient &gt; 48°C.</td>
      </tr>
      <tr>
        <td><strong>Sync Queue Depth</strong></td>
        <td>Every 60 Seconds</td>
        <td>Counts un-synced transactions. Alert raised if queue exceeds 50 unsynced records.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-info">
    <div class="callout-info-title">OFFLINE FAULT TOLERANCE GUARANTEE</div>
    <div class="callout-info-desc">
      The RVM Desktop App is completely resilient to internet outages. All transactions, points credits, and citizen ratings are committed locally to ACID-compliant SQL Server storage before the UI proceeds. When 4G connectivity recovers, synchronization resumes automatically without data loss or duplicate point crediting.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 4</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 5: SOP-01 & SOP-02                                                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-OPS</span>
      <span class="header-title">Daily Startup & Material Intake Verification</span>
    </div>
    <div class="header-right">4. STANDARD PROCEDURES: PART 1</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 1 (OPERATIONS & MATERIAL RULES)</div>
    <div class="sop-sub-h">Mandatory Operating Procedures for Daily Startup, Pre-Flight Self-Test, and Acceptance Validation</div>
  </div>

  <div class="sop-quad-grid" style="margin-bottom:4mm;">
    <!-- SOP-01 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-OPS-01</span>
        <span class="sop-freq-tag">Daily 07:00 AM</span>
      </div>
      <div class="sop-card-h2">Daily Startup & Pre-Flight Self-Test</div>
      <ul class="sop-item-list">
        <li>Inspect external kiosk chassis, intake aperture, and touch screen for vandalism or damage.</li>
        <li>Verify AC 220V UPS connection; power on master rocker switch on the internal rear breaker panel.</li>
        <li>Confirm Windows 10 IoT executes <code>launch-kiosk.ps1</code> and launches WPF full screen.</li>
        <li>Inspect the top diagnostics bar on primary screen:
          <br>&bull; <code>SERIAL: CONNECTED 🟢</code>
          <br>&bull; <code>DB: OK 🟢</code>
          <br>&bull; <code>API: ONLINE 🟢</code>
        </li>
        <li>Perform 1 test deposit using a clean 500ml PET bottle to verify gate servo sweep and point ledger update.</li>
        <li>Verify audio chime playback on successful acceptance.</li>
        <li>Sign daily morning pre-flight sign-off register.</li>
      </ul>
    </div>

    <!-- SOP-02 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-OPS-02</span>
        <span class="sop-freq-tag">Continuous Public</span>
      </div>
      <div class="sop-card-h2">Material Rules & Anti-Cheat Validation</div>
      <ul class="sop-item-list">
        <li><strong>Accepted Materials:</strong> Clear/colored PET plastic beverage bottles (0.25L to 2.5L), Aluminium UBC drink cans, and paper cups.</li>
        <li><strong>Strictly Prohibited:</strong> Glass bottles (shatter hazard), motor oil or agrochemical containers, unemptied bottles containing liquid, crushed cans.</li>
        <li><strong>Single Feed Enforcement:</strong> Containers must be inserted one-by-one, base first. Feeding multiple bottles simultaneously triggers anti-cheat rejection.</li>
        <li><strong>Liquid Contamination Check:</strong> Optical refraction sensor detects residual liquid; gate rejects wet bottles to protect collection bin hygiene.</li>
        <li><strong>String/Foreign Object Detection:</strong> If bottom sensor D2 remains continuously blocked for > 4.0 seconds, gate automatically enters lockout return mode.</li>
      </ul>
    </div>
  </div>

  <div class="two-col-grid" style="margin-bottom:4mm;">
    <div class="callout-tech" style="margin:0;">
      <div class="callout-tech-title">DIAGNOSTICS BAR INDICATOR LOGIC</div>
      <div class="callout-tech-desc">
        The top diagnostics bar dynamically updates every 1000ms. If <code>SERIAL</code> changes to 🔴 (RED), click the <strong>RETRY 🔄</strong> button to re-poll COM ports. If <code>API</code> changes to 🟡 (YELLOW), system continues functioning in offline mode without disruption.
      </div>
    </div>

    <div class="callout-warning" style="margin:0;">
      <div class="callout-warning-title">GLASS BOTTLE SAFETY PROHIBITION</div>
      <div class="callout-warning-desc">
        Under NO circumstances should glass containers be allowed. The high-torque servo drop mechanism and drop chamber are engineered exclusively for non-shattering PET, HDPE, and aluminium UBC materials.
      </div>
    </div>
  </div>

  <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:8px 12px;">
    <div style="font-size:8pt; font-weight:800; color:#0F172A; margin-bottom:4px; text-transform:uppercase;">
      SOP-01 & 02 COMPLIANCE AUDIT CRITERIA
    </div>
    <div style="font-size:7.5pt; color:#475569; line-height:1.4;">
      Station supervisors must verify that kiosks passing morning self-test have zero amber or red indicator pills. If any sensor test fails during initial test deposit, the machine must be placed in maintenance mode using the physical service key.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 5</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 6: SOP-03 & SOP-04                                                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-MAINT</span>
      <span class="header-title">Bin Servicing & Preventative Chamber Maintenance</span>
    </div>
    <div class="header-right">5. STANDARD PROCEDURES: PART 2</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 2 (COLLECTION & PREVENTIVE CLEANING)</div>
    <div class="sop-sub-h">Protocols for Emptying Collection Storage Bins, Resetting Level Sensors, and Optical Maintenance</div>
  </div>

  <div class="sop-quad-grid" style="margin-bottom:4mm;">
    <!-- SOP-03 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-MAINT-03</span>
        <span class="sop-freq-tag">At 85% Capacity or Bin Full</span>
      </div>
      <div class="sop-card-h2">Storage Bin Servicing & Level Reset</div>
      <ul class="sop-item-list">
        <li>Type <code>888</code> on physical keypad to open Admin Security PIN prompt; pause active user sessions.</li>
        <li>Unlock bottom cabinet service door using the dual master security key.</li>
        <li>Pull out the 120L wheeled plastic collection trolley; tie off heavy-duty liner.</li>
        <li>Inspect plastic bin level sensor (D10) and metal bin sensor (D11) optical lenses. Wipe dust using dry microfiber cloth.</li>
        <li>Insert a fresh heavy-duty 120L transparent liner; ensure liner rim does not obscure the optical beam line.</li>
        <li>Slide trolley back into place and firmly latch bottom cabinet door.</li>
        <li>In Admin Panel -> Tab 4, click <strong>"Reset Bin Full Counter"</strong> to recalibrate capacity to 0%.</li>
        <li>Verify diagnostics bar clears the <code>STORAGE BIN FULL 🔴</code> alert.</li>
      </ul>
    </div>

    <!-- SOP-04 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-MAINT-04</span>
        <span class="sop-freq-tag">Weekly (Every Friday)</span>
      </div>
      <div class="sop-card-h2">Chamber Cleaning & Calibration</div>
      <ul class="sop-item-list">
        <li>Power down 12V sensor rail using internal service toggle switch.</li>
        <li>Wipe bottom (D2), mid (D7), and top (D8) IR lenses using 99% Isopropyl Alcohol (IPA) optical wipes.</li>
        <li>Clean inductive metal faceplate (D5) to remove adhesive residue and dust buildup.</li>
        <li>Clear dust particles from ultrasonic transducer emitter/receiver cones (D3/D4) using dry compressed air (< 30 PSI).</li>
        <li>Lubricate servo pivot hinge and nylon drop gate bushings with dry PTFE silicone spray.</li>
        <li>Restore 12V sensor power; press <code>33</code> on keypad to execute 20-sample baseline acoustic recalibration.</li>
        <li>Test 1 aluminium UBC can and 1 large PET bottle to verify classification accuracy.</li>
      </ul>
    </div>
  </div>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    OPTICAL SENSOR CLEANING & CARE REQUIREMENTS
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:25%;">Component</th>
        <th style="width:25%;">Approved Cleaning Agent</th>
        <th>Technique & Prohibited Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Photoelectric Lenses (D2/7/8)</strong></td>
        <td>99% Isopropyl Alcohol (IPA)</td>
        <td>Gently dab with lint-free optical swab. Do NOT use abrasive cloths, acetone, or window cleaners.</td>
      </tr>
      <tr>
        <td><strong>Ultrasonic Cones (D3/D4)</strong></td>
        <td>Clean Compressed Air (< 30 PSI)</td>
        <td>Hold nozzle 15cm away; blow dust out. NEVER probe inside transducer meshes with sharp instruments.</td>
      </tr>
      <tr>
        <td><strong>Inductive Sensor (D5)</strong></td>
        <td>Mild Degreaser / Dry Cloth</td>
        <td>Wipe flat sensor face clean of conductive beverage syrup. Ensure 2mm detection gap is unobstructed.</td>
      </tr>
      <tr>
        <td><strong>Touchscreen Glass</strong></td>
        <td>70% Ethanol / Screen Wipe</td>
        <td>Spray onto microfiber cloth first; never spray liquid directly onto screen frame or bezel edges.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-warning">
    <div class="callout-warning-title">LINER BAG OBSTRUCTION HAZARD</div>
    <div class="callout-warning-desc">
      When fitting replacement collection liners, caretakers must tuck bag excess firmly around trolley handles. If bag edges flap upwards into the D10/D11 infrared beam path, the kiosk will falsely report "Storage Bin Full" and lock out deposits.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 6</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 7: SOP-05 & SOP-06                                                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-SAFE</span>
      <span class="header-title">Emergency Jam Clearance & Real-Time Telemetry</span>
    </div>
    <div class="header-right">6. STANDARD PROCEDURES: PART 3</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 3 (SAFETY & DIAGNOSTIC TELEMETRY)</div>
    <div class="sop-sub-h">Emergency Jam Removal Protocols, Pinch Hazard Protection, and Hidden Telemetry Console Usage</div>
  </div>

  <div class="sop-quad-grid" style="margin-bottom:4mm;">
    <!-- SOP-05 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-SAFE-05</span>
        <span class="sop-freq-tag">Emergency Condition</span>
      </div>
      <div class="sop-card-h2">Emergency Jam Clearance & Safety</div>
      <ul class="sop-item-list">
        <li><strong>PINCH HAZARD WARNING:</strong> Immediately slap the Red Mushroom Emergency Stop button on the kiosk side panel.</li>
        <li>Verify all servo motors instantly de-energize and lock out.</li>
        <li>Unlock the upper chamber service hatch using the physical maintenance key.</li>
        <li>Using rubberized safety tongs or heavy work gloves, carefully remove stuck bottle, debris, or foreign objects.</li>
        <li><strong>NEVER insert bare hands or fingers into active servo gate mechanism.</strong></li>
        <li>Inspect acrylic chamber walls and optical sensor lenses for physical damage or scratches.</li>
        <li>Close and lock upper inspection hatch securely.</li>
        <li>Twist Red Emergency Stop button clockwise to release; system will automatically re-home servo gate to 0°.</li>
      </ul>
    </div>

    <!-- SOP-06 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-DIAG-06</span>
        <span class="sop-freq-tag">Diagnostic Tool</span>
      </div>
      <div class="sop-card-h2">Real-Time Telemetry Console</div>
      <ul class="sop-item-list">
        <li>On the kiosk hardware keypad, press <strong>ESC</strong> or key <strong>8</strong> to toggle the hidden real-time diagnostic terminal.</li>
        <li>The terminal appears as a semi-transparent black overlay displaying live serial COM packets:
          <br>&bull; <code>IR_BEAMS: [D2:1, D7:0, D8:0]</code>
          <br>&bull; <code>ULTRA_DIST: 23.4 cm</code>
          <br>&bull; <code>INDUCTIVE: 0 (PET)</code>
          <br>&bull; <code>SERVO_POS: 0 DEG</code>
        </li>
        <li>Verify memory allocation (WPF Managed Heap &lt; 180 MB).</li>
        <li>Check SQL Server local connection pool status and API round-trip latency.</li>
        <li>Press <strong>ESC</strong> or key <strong>8</strong> again to dismiss the diagnostic console and restore citizen UI.</li>
      </ul>
    </div>
  </div>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    TELEMETRY CONSOLE SERIAL PACKET STRUCTURE
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:22%;">Packet Token</th>
        <th style="width:25%;">Expected Range / Values</th>
        <th>Description & Fault Diagnosis</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>PING_OK</code></td>
        <td>Periodic heartbeat</td>
        <td>Confirms bidirectional serial link between Windows IoT host and ATmega328P.</td>
      </tr>
      <tr>
        <td><code>SENS:[D2,D7,D8]</code></td>
        <td>Binary (0 or 1 for each)</td>
        <td>Real-time optical beam state. 1 = Beam clear; 0 = Beam interrupted by container.</td>
      </tr>
      <tr>
        <td><code>IND:[0|1]</code></td>
        <td>0 = Non-metal, 1 = Metal</td>
        <td>Inductive sensor output. If permanently 1 with chamber empty, sensor requires recalibration.</td>
      </tr>
      <tr>
        <td><code>DIST:[value]</code></td>
        <td>04.0 cm to 80.0 cm</td>
        <td>Ultrasonic distance. Baseline without bottle is typically 35.0 cm &plusmn; 2.0 cm.</td>
      </tr>
      <tr>
        <td><code>GATE:[0|90|180]</code></td>
        <td>Angle in degrees</td>
        <td>Commanded servo position. 0° = Closed, 90° = Drop, 180° = Return/Reject.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-warning">
    <div class="callout-warning-title">EMERGENCY STOP ELECTRICAL DISCONNECT</div>
    <div class="callout-warning-desc">
      The Emergency Stop circuit is hard-wired directly into the 12V/5V DC actuator bus. Pressing E-Stop mechanically breaks power to all motors independent of software state, guaranteeing fail-safe operator protection even during total software hangs.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 7</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 8: SOP-07 & SOP-08                                                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-PROTO</span>
      <span class="header-title">Direct Demo Mode & Idle Mode Geometry</span>
    </div>
    <div class="header-right">7. STANDARD PROCEDURES: PART 4</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 4 (DEMO MODE & IDLE EXPANSION)</div>
    <div class="sop-sub-h">Direct Demo Sequence Protocol (001), Hardware Key 0 Reservation, and Idle Geometry Standards</div>
  </div>

  <div class="sop-quad-grid" style="margin-bottom:4mm;">
    <!-- SOP-07 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-DEV-07</span>
        <span class="sop-freq-tag">Testing / Offline Demo</span>
      </div>
      <div class="sop-card-h2">Direct Demo Mode (001 Sequence)</div>
      <ul class="sop-item-list">
        <li><strong>Sequence 001:</strong> When Arduino hardware is disconnected, typing the numeric sequence <code>0-0-1</code> on the keypad starts demo mode directly on the kiosk screen without dialogs.</li>
        <li><strong>Key 0 Reservation:</strong> Key <code>0</code> is strictly reserved for physical hardware when connected. Pressing 0 triggers the physical gate opening and arms optical sensors.</li>
        <li><strong>Direct Simulation:</strong> The kiosk transitions directly to <code>PleaseInsert</code> state with animated video overlay, simulated laser scanning, and point allocation.</li>
        <li>Allows field technicians to demonstrate complete citizen workflows to university administrators without physical bottles.</li>
        <li>Pressing <code>ESC</code> or completing the session cleanly returns to the home screen.</li>
      </ul>
    </div>

    <!-- SOP-08 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-UI-08</span>
        <span class="sop-freq-tag">Standby Feature (60s)</span>
      </div>
      <div class="sop-card-h2">1-Minute Idle Expansion & Geometry</div>
      <ul class="sop-item-list">
        <li><strong>Idle Trigger:</strong> Inactivity timer fires after exactly 60 seconds (1 minute) of zero touch or keypad input.</li>
        <li><strong>50% Video Expansion:</strong> <code>InstructionalVideoRowDef</code> expands to 50% screen height (960px).</li>
        <li><strong>Contained Inner Zoom:</strong> Inner video media element scales cleanly with <code>ScaleTransform</code> constrained inside container boundaries.</li>
        <li><strong>Clean Card Visibility:</strong> "How to Use RVM" card and Ad Video section remain 100% visible with zero clipping.</li>
        <li><strong>Header Auto-Collapse:</strong> Top header and hardware status bar collapse to 0 height.</li>
        <li><strong>Restoring Default Screen:</strong> Pressing <code>0</code> or touching anywhere immediately zooms out and restores default screen.</li>
      </ul>
      <div style="margin-top:5px; border:1.5px solid #CBD5E1; border-radius:6px; overflow:hidden; max-height:45mm; background:#0F172A; display:flex; align-items:center; justify-content:center;">
        <img src="{img_idle}" style="width:100%; height:auto; display:block; object-fit:contain;" alt="1-Minute Idle Standby Snapshot"/>
      </div>
    </div>
  </div>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    GRID ROW DEFINITIONS & ZERO-OVERLAP ARCHITECTURAL STANDARDS
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:30%;">Grid Element</th>
        <th style="width:25%;">Default Screen Height</th>
        <th style="width:25%;">Idle Mode Height (60s)</th>
        <th>Layout Behavior & Constraint</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>HeaderRowDef</code></td>
        <td><code>Auto</code> (~80px)</td>
        <td><code>0</code> (Collapsed)</td>
        <td>Fades opacity to 0 and collapses row height for full visual immersion.</td>
      </tr>
      <tr>
        <td><code>InstructionalVideoRowDef</code></td>
        <td><code>Auto</code> (480px)</td>
        <td><code>50*</code> (960px = 50%)</td>
        <td>Expands smoothly; contained inner zoom ensures video never spills outside.</td>
      </tr>
      <tr>
        <td><code>HowToUseRowDef</code></td>
        <td><code>Auto</code> (~220px)</td>
        <td><code>Auto</code> (~220px)</td>
        <td>Remains 100% visible below video with 16px bottom margin; zero overlap.</td>
      </tr>
      <tr>
        <td><code>SignageVideoRowDef</code></td>
        <td><code>*</code> (Remaining height)</td>
        <td><code>*</code> (Remaining 740px)</td>
        <td>Ad video continues looping cleanly without distortion or clipping.</td>
      </tr>
      <tr>
        <td><code>BottomStatsRowDef</code></td>
        <td><code>Auto</code> (~140px)</td>
        <td><code>0</code> (Collapsed)</td>
        <td>Live counters collapse to make full room for the 50% video expansion.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-info">
    <div class="callout-info-title">HOTKEY QUICK-TESTING CONVENIENCE</div>
    <div class="callout-info-desc">
      Field engineers can instantly toggle Idle Mode standby expansion at any moment by pressing <strong>Ctrl + I</strong> on a service keyboard, without having to wait the full 60 seconds. Pressing <strong>Ctrl + I</strong> or pressing <strong>0</strong> returns immediately to the default screen.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 8</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 9: SOP-09 & SOP-10                                                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-SYS</span>
      <span class="header-title">Offline Queueing & Video Signage Management</span>
    </div>
    <div class="header-right">8. STANDARD PROCEDURES: PART 5</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 5 (OFFLINE SYNC & MEDIA ADS)</div>
    <div class="sop-sub-h">Data Ledger Reconciliation, Offline Queueing Protocols, and Digital Signage Management</div>
  </div>

  <div class="sop-quad-grid" style="margin-bottom:4mm;">
    <!-- SOP-09 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-NET-09</span>
        <span class="sop-freq-tag">Network Failover</span>
      </div>
      <div class="sop-card-h2">Offline Queueing & Data Reconciliation</div>
      <ul class="sop-item-list">
        <li>When 4G router disconnects or cloud API is unreachable, kiosk continues 100% normal operation.</li>
        <li>Transactions commit locally to SQL Server with column <code>IsSynced = 0</code>.</li>
        <li>Background worker retries every 30 seconds with exponential backoff.</li>
        <li>Upon network recovery, pending batches push automatically in chronological FIFO order.</li>
        <li><strong>Technician Manual Sync:</strong> Open Admin Window (<code>888</code>) -> Tab 3 -> Click <strong>"Sync Pending Records"</strong>.</li>
        <li>Verify pending queue count drops to 0 and confirmation dialog reports sync success.</li>
      </ul>
    </div>

    <!-- SOP-10 -->
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-MKT-10</span>
        <span class="sop-freq-tag">Weekly Media</span>
      </div>
      <div class="sop-card-h2">Digital Signage Video Ads Management</div>
      <ul class="sop-item-list">
        <li><strong>Format Requirements:</strong> MP4 container, H.264 video codec, AAC audio, 25/30 FPS.</li>
        <li><strong>Resolution:</strong> 1080x720 (Primary Kiosk) / 1920x1080 (Secondary Landscape Display).</li>
        <li>Copy approved promotional media files into <code>C:\RVM\Ads\</code> directory.</li>
        <li>Open Admin Window (<code>888</code>) -> Tab 6 (Advertisement & Video Signage).</li>
        <li>Select active playlist videos, set loop duration, and verify smooth preview playback.</li>
        <li>Click <strong>"Save Playlist"</strong>; both screens immediately apply the updated media reel.</li>
      </ul>
    </div>
  </div>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    OFFLINE RECONCILIATION VERIFICATION CHECKLIST
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:25%;">Verification Step</th>
        <th style="width:30%;">Expected Result</th>
        <th>Corrective Action if Validation Fails</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Local DB Record Count</strong></td>
        <td><code>SELECT COUNT(*) FROM Transactions</code></td>
        <td>Matches total accepted sessions displayed on kiosk counter.</td>
      </tr>
      <tr>
        <td><strong>Unsynced Queue Depth</strong></td>
        <td><code>WHERE IsSynced = 0</code> returns 0 records</td>
        <td>If > 0, verify internet connection and click "Sync Pending" in Admin Tab 3.</td>
      </tr>
      <tr>
        <td><strong>Cloud API Endpoint Ping</strong></td>
        <td>HTTP GET <code>/api/health</code> returns 200 OK</td>
        <td>Check SIM card data balance, APN settings, and 4G antenna cable.</td>
      </tr>
      <tr>
        <td><strong>Wallet Balance Integrity</strong></td>
        <td>Citizen mobile balance matches cloud balance</td>
        <td>Run reconciliation query: <code>EXEC sp_ReconcileWallets</code>.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-tech">
    <div class="callout-tech-title">BANDWIDTH OPTIMIZATION PROTOCOL</div>
    <div class="callout-tech-desc">
      Sync payloads are compressed with GZIP and transmitted as lightweight JSON arrays. An entire day of 500 recycling deposits consumes less than 450 KB of cellular data, allowing dependable operation on modest 4G IoT SIM plans.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 9</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 10: HARDWARE DIAGNOSTICS & FAULT RESOLUTION MATRIX                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-DIAG</span>
      <span class="header-title">Diagnostic Codes & Rapid Fault Resolution</span>
    </div>
    <div class="header-right">9. TROUBLESHOOTING MATRIX</div>
  </div>

  <div class="sop-title-banner" style="background:#0F172A;">
    <div class="sop-main-h" style="color:#38BDF8;">HARDWARE DIAGNOSTIC CODES & RAPID FAULT RESOLUTION MATRIX</div>
    <div class="sop-sub-h" style="color:#CBD5E1;">Standard Field Corrective Action Procedures for Caretakers & Field Technicians</div>
  </div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr style="background:#1E293B;">
        <th style="width:38mm; color:#38BDF8;">Fault Symptom / Indicator</th>
        <th style="width:40mm; color:#38BDF8;">Probable Root Cause</th>
        <th style="color:#38BDF8;">Immediate Corrective Action Procedure</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>SERIAL: DISCONNECTED 🔴</strong><br>
          <span style="font-size:7pt; color:#B91C1C;">Hardware Connection Error</span>
        </td>
        <td>
          USB cable dislodged; Arduino unpowered; incorrect COM port assigned in <code>config.txt</code>.
        </td>
        <td>
          1. Re-seat USB cable firmly into IPC port.<br>
          2. Check 5V power LED on Arduino board.<br>
          3. Click <strong>RETRY 🔄</strong> on diagnostics bar to re-enumerate serial ports.<br>
          4. If still unresolved, verify COM port number in Windows Device Manager.
        </td>
      </tr>
      <tr>
        <td>
          <strong>API: OFFLINE 🟡</strong><br>
          <span style="font-size:7pt; color:#A16207;">Cloud Sync Deferred</span>
        </td>
        <td>
          Cellular 4G router offline; SIM data package expired; DNS server timeout.
        </td>
        <td>
          1. Kiosk continues operating normally in offline mode.<br>
          2. Inspect 4G router status LEDs (Green = Connected, Red = SIM Fault).<br>
          3. Recharge SIM data pack if depleted.<br>
          4. Upon reconnection, background sync will auto-upload pending records.
        </td>
      </tr>
      <tr>
        <td>
          <strong>STORAGE BIN FULL 🔴</strong><br>
          <span style="font-size:7pt; color:#B91C1C;">Deposits Temporarily Locked</span>
        </td>
        <td>
          120L collection trolley at maximum capacity; or dust covering D10/D11 optical lenses.
        </td>
        <td>
          1. Follow <strong>SOP-03</strong>: Unlock bottom door and replace liner bag.<br>
          2. Clean D10/D11 through-beam lenses with dry microfiber cloth.<br>
          3. Open Admin Window (<code>888</code>) -> Tab 4 -> Click "Reset Bin Full Counter".
        </td>
      </tr>
      <tr>
        <td>
          <strong>BOTTLE STUCK / JAM ⚠️</strong><br>
          <span style="font-size:7pt; color:#B91C1C;">Gate Jam Alarm</span>
        </td>
        <td>
          Oversized bottle (> 32cm); deformed can; foreign debris blocking drop gate.
        </td>
        <td>
          1. Follow <strong>SOP-05</strong>: Press Red Emergency Stop button immediately.<br>
          2. Unlock upper service hatch.<br>
          3. Extract jammed item using safety tongs.<br>
          4. Release E-Stop; press <code>33</code> on keypad to execute acoustic calibration.
        </td>
      </tr>
      <tr>
        <td>
          <strong>GATE SERVO UNRESPONSIVE ⚡</strong><br>
          <span style="font-size:7pt; color:#B91C1C;">Servo Stalled</span>
        </td>
        <td>
          PWM signal lead loose on Pin D9; 5V 5A buck power rail voltage drop; stripped servo horn.
        </td>
        <td>
          1. Measure voltage across 5V servo rail with digital multimeter (must be &ge; 4.85V).<br>
          2. Inspect D9 DuPont connector.<br>
          3. Replace servo motor if internal nylon/metal gears are stripped.
        </td>
      </tr>
      <tr>
        <td>
          <strong>IDLE MODE NOT EXPANDING</strong><br>
          <span style="font-size:7pt; color:#475569;">Standby Delay</span>
        </td>
        <td>
          Continuous touch input detected (ghost touch on dirty glass); timer paused.
        </td>
        <td>
          1. Clean touchscreen surface with screen wipe to eliminate ghost touches.<br>
          2. Press <strong>Ctrl + I</strong> to manually verify expansion animation.<br>
          3. Verify idle timeout threshold in <code>config.txt</code> is set to 60 seconds.
        </td>
      </tr>
    </tbody>
  </table>

  <div class="callout-warning">
    <div class="callout-warning-title">HOTKEY MATRIX QUICK-SUMMARY</div>
    <div class="callout-warning-desc">
      <code>888</code>: Admin Security PIN Prompt &bull; <code>001</code>: Direct Demo Testing &bull; <code>0</code>: Hardware Trigger / Idle Exit &bull; <code>33</code>: Chamber Acoustic Calibration &bull; <code>8</code> / <code>ESC</code>: Telemetry Terminal Console &bull; <code>Ctrl + I</code>: Idle Expansion Toggle.
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 10</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 11: PREVENTIVE MAINTENANCE SCHEDULE & SIGN-OFF LOG                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">SOP-RVM-LOG</span>
      <span class="header-title">Preventive Maintenance Schedule & Field Sign-Off</span>
    </div>
    <div class="header-right">10. MAINTENANCE SCHEDULE</div>
  </div>

  <div class="section-title">10. Maintenance Schedule & Field Sign-Off</div>
  <div class="section-subtitle">Mandatory service frequencies, preventive maintenance tasks, and official technician audit sign-off ledger.</div>

  <table class="matrix-table" style="margin-bottom:4mm;">
    <thead>
      <tr>
        <th style="width:20%;">Cadence</th>
        <th style="width:35%;">Mandatory Preventive Action</th>
        <th>Inspection Standard & Criteria</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Daily (07:00 AM)</strong></td>
        <td>Pre-flight diagnostics, test deposit, bin fullness check.</td>
        <td>Zero red indicators; clean touchscreen; bin capacity &lt; 85%.</td>
      </tr>
      <tr>
        <td><strong>Weekly (Friday)</strong></td>
        <td>Optical lens cleaning (IPA), dust blowing, acoustic calibration (33).</td>
        <td>Clean lenses (D2/7/8/10/11); distance reading 35cm &plusmn; 2cm.</td>
      </tr>
      <tr>
        <td><strong>Monthly (1st)</strong></td>
        <td>Servo gear inspection, PTFE lubrication, SQL Server database maintenance.</td>
        <td>Smooth 90° gate sweep; DB log truncation; queue depth = 0.</td>
      </tr>
      <tr>
        <td><strong>Quarterly</strong></td>
        <td>AC UPS battery capacity test, chassis exhaust fan cleaning, screw torque check.</td>
        <td>UPS runtime &gt; 35 mins on battery; all wiring terminals torqued.</td>
      </tr>
    </tbody>
  </table>

  <div class="sop-main-h" style="font-size:9.5pt; color:#0F172A; margin-bottom:2mm;">
    FIELD SERVICE & ENGINEERING SIGN-OFF AUDIT LOG
  </div>

  <table class="matrix-table" style="margin-bottom:5mm;">
    <thead>
      <tr style="background:#1E293B;">
        <th style="width:22mm; color:#38BDF8;">Date</th>
        <th style="width:20mm; color:#38BDF8;">Time</th>
        <th style="width:38mm; color:#38BDF8;">Technician Name</th>
        <th style="width:22mm; color:#38BDF8;">Machine ID</th>
        <th style="color:#38BDF8;">Action / Maintenance Performed</th>
        <th style="width:28mm; color:#38BDF8;">Status</th>
        <th style="width:32mm; color:#38BDF8;">Signature</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>___/___/2026</td>
        <td>__:__ AM</td>
        <td>__________________</td>
        <td>RVM-001</td>
        <td>Morning startup, test deposit, diagnostics check</td>
        <td><span class="diag-pill-ok">PASSED</span></td>
        <td>________________</td>
      </tr>
      <tr>
        <td>___/___/2026</td>
        <td>__:__ AM</td>
        <td>__________________</td>
        <td>RVM-001</td>
        <td>Storage bin emptied, fresh 120L liner installed</td>
        <td><span class="diag-pill-ok">RESET OK</span></td>
        <td>________________</td>
      </tr>
      <tr>
        <td>___/___/2026</td>
        <td>__:__ AM</td>
        <td>__________________</td>
        <td>RVM-001</td>
        <td>Weekly optical IPA wipe, acoustic calibration</td>
        <td><span class="diag-pill-ok">CALIBRATED</span></td>
        <td>________________</td>
      </tr>
      <tr>
        <td>___/___/2026</td>
        <td>__:__ AM</td>
        <td>__________________</td>
        <td>RVM-001</td>
        <td>Monthly servo maintenance, queue audit</td>
        <td><span class="diag-pill-ok">VERIFIED</span></td>
        <td>________________</td>
      </tr>
      <tr>
        <td>___/___/2026</td>
        <td>__:__ AM</td>
        <td>__________________</td>
        <td>RVM-001</td>
        <td>_____________________________________________</td>
        <td>___________</td>
        <td>________________</td>
      </tr>
    </tbody>
  </table>

  <div class="two-col-grid">
    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:8px 12px;">
      <div style="font-size:8pt; font-weight:800; color:#0F172A; margin-bottom:2px; text-transform:uppercase;">
        LEAD FIELD ENGINEER CERTIFICATION
      </div>
      <div style="font-size:7.5pt; color:#475569; line-height:1.4;">
        I hereby certify that this Reverse Vending Machine has been serviced, tested, and calibrated in accordance with the specifications in SOP-RVM-ENG-2026-V3.2.
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:8px 12px;">
      <div style="font-size:8pt; font-weight:800; color:#0F172A; margin-bottom:2px; text-transform:uppercase;">
        EMERGENCY HOTLINE & TECHNICAL DISPATCH
      </div>
      <div style="font-size:7.5pt; color:#475569; line-height:1.4;">
        Field Engineering Central Dispatch: <strong>0800-RECYCLE (0800-73292)</strong><br>
        Engineering Support Portal: <strong>isprvm.binishaqsoft.com/eng</strong>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span>DOC-RVM-SOP-2026-V3.2</span>
    <span>Page 11</span>
  </div>
</div>

</body>
</html>"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[GENERATED] SOP Manual HTML: {html_path}")
