import os
import base64
import subprocess
from generate_sop_doc import generate_sop_html

def get_base64_img(img_path):
    if not os.path.exists(img_path):
        return ""
    with open(img_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    ext = os.path.splitext(img_path)[1].lower().replace(".", "")
    mime = "image/png" if ext == "png" else "image/jpeg"
    return f"data:{mime};base64,{data}"

def print_to_pdf(html_path, pdf_path):
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

    browser_bin = edge_path if os.path.exists(edge_path) else chrome_path
    print(f"[PDF ENGINE] Using browser binary: {browser_bin}")

    cmd = [
        browser_bin,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]

    print(f"[RENDERING] Generating PDF: {os.path.basename(pdf_path)}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(pdf_path):
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        print(f"[SUCCESS] Created: {pdf_path} ({size_mb:.2f} MB)")
        return True
    else:
        print(f"[ERROR] Failed to generate PDF. Exit code: {res.returncode}")
        print("Stderr:", res.stderr)
        return False

# ==============================================================================
# DOCUMENT 1: RVM KIOSK USER MANUAL GENERATOR
# ==============================================================================
def generate_user_manual_html(html_path, snapshots_dir):
    img_splash = get_base64_img(os.path.join(snapshots_dir, "screen_01_splash.png"))
    img_home = get_base64_img(os.path.join(snapshots_dir, "screen_02_home_page.png"))
    img_step01 = get_base64_img(os.path.join(snapshots_dir, "screen_03_step_01.png"))
    img_step02 = get_base64_img(os.path.join(snapshots_dir, "screen_04_step_02.png"))
    img_reject = get_base64_img(os.path.join(snapshots_dir, "screen_05_step_02_rejection.png"))
    img_accepted = get_base64_img(os.path.join(snapshots_dir, "screen_06_step_03_accepted.png"))
    img_wallet = get_base64_img(os.path.join(snapshots_dir, "screen_07_step_04_wallet.png"))
    img_success = get_base64_img(os.path.join(snapshots_dir, "screen_08_step_04_success.png"))
    img_feedback = get_base64_img(os.path.join(snapshots_dir, "screen_09_feedback.png"))
    img_complete = get_base64_img(os.path.join(snapshots_dir, "screen_10_complete.png"))
    img_landscape = get_base64_img(os.path.join(snapshots_dir, "screen_landscape_kiosk.png"))
    img_idle = get_base64_img(os.path.join(snapshots_dir, "screen_idle_expanded.png"))

    isp_src = os.path.join(snapshots_dir, "isp_logo.png")
    if not os.path.exists(isp_src):
        isp_src = os.path.join(snapshots_dir, "isp.jpg")
    img_logo_isp = get_base64_img(isp_src)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RVM Kiosk Citizen & User Operation Manual — Version 3.2</title>
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
    border-bottom: 2px solid #E2E8F0;
    padding-bottom: 3mm;
    margin-bottom: 4mm;
  }}
  .header-left {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .badge-app {{
    background: #073B28;
    color: #FFFFFF;
    font-size: 8pt;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }}
  .header-title {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #334155;
  }}
  .header-right {{
    font-size: 8pt;
    font-weight: 600;
    color: #64748B;
  }}
  .page-footer {{
    position: absolute;
    bottom: 8mm;
    left: 15mm;
    right: 15mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #E2E8F0;
    padding-top: 2.5mm;
    font-size: 7.5pt;
    color: #94A3B8;
  }}
  .footer-left {{ font-weight: 600; color: #047857; }}
  .footer-center {{ color: #64748B; }}
  .footer-right {{ font-weight: 700; color: #0F172A; }}

  /* Cover Page */
  .cover-page {{
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
    padding: 18mm 18mm 12mm 18mm;
    background: linear-gradient(145deg, #073B28 0%, #0F5338 50%, #042E2B 100%);
    color: #FFFFFF;
    border-radius: 0;
  }}
  .cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .cover-logo-group {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .cover-rvm-badge {{
    background: #22C55E;
    color: #042E2B;
    font-size: 16pt;
    font-weight: 900;
    padding: 6px 14px;
    border-radius: 8px;
    letter-spacing: 1px;
  }}
  .cover-partner-logo {{
    height: 48px;
    background: #FFFFFF;
    padding: 4px 10px;
    border-radius: 6px;
  }}
  .cover-body {{
    margin-top: 15mm;
  }}
  .cover-tag {{
    display: inline-block;
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid #4ADE80;
    color: #86EFAC;
    font-size: 9pt;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6mm;
  }}
  .cover-title {{
    font-size: 32pt;
    font-weight: 900;
    line-height: 1.15;
    color: #FFFFFF;
    margin-bottom: 4mm;
    letter-spacing: -0.5px;
  }}
  .cover-urdu-title {{
    font-family: 'Tahoma', 'Noto Nastaliq Urdu', serif;
    font-size: 24pt;
    font-weight: 700;
    color: #86EFAC;
    margin-bottom: 6mm;
    direction: rtl;
  }}
  .cover-subtitle {{
    font-size: 12.5pt;
    color: #E2E8F0;
    line-height: 1.5;
    max-width: 90%;
    margin-bottom: 8mm;
  }}
  .cover-feature-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 8mm;
  }}
  .cover-feature-card {{
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 10px;
  }}
  .cover-feature-icon {{ font-size: 16pt; margin-bottom: 4px; }}
  .cover-feature-title {{ font-size: 9pt; font-weight: 800; color: #FFFFFF; margin-bottom: 2px; }}
  .cover-feature-desc {{ font-size: 7.5pt; color: #94A3B8; line-height: 1.3; }}
  
  .cover-meta-box {{
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 12px 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 10mm;
  }}
  .cover-meta-item {{ display: flex; flex-direction: column; }}
  .cover-meta-label {{ font-size: 7pt; color: #86EFAC; text-transform: uppercase; font-weight: 800; }}
  .cover-meta-val {{ font-size: 9pt; color: #FFFFFF; font-weight: 700; margin-top: 2px; }}

  /* Content Styling */
  .section-title {{
    font-size: 17pt;
    font-weight: 900;
    color: #073B28;
    margin-bottom: 1.5mm;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .section-subtitle {{
    font-size: 9pt;
    color: #64748B;
    margin-bottom: 4mm;
    line-height: 1.4;
  }}
  .urdu-text {{
    font-family: 'Tahoma', 'Noto Nastaliq Urdu', serif;
    direction: rtl;
  }}

  /* Walkthrough Step Card */
  .step-screen-layout {{
    display: grid;
    grid-template-columns: 88mm 1fr;
    gap: 14px;
    align-items: start;
    margin-top: 2mm;
  }}
  .snapshot-frame {{
    background: #0F172A;
    border: 2.5px solid #CBD5E1;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    max-height: 200mm;
  }}
  .snapshot-img {{
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
  }}
  .step-content {{
    display: flex;
    flex-direction: column;
    gap: 10px;
  }}
  .step-pill {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #DCFCE7;
    border: 1px solid #86EFAC;
    color: #15803D;
    font-size: 8pt;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 20px;
    width: fit-content;
  }}
  .step-heading {{
    font-size: 15pt;
    font-weight: 900;
    color: #0F172A;
    line-height: 1.2;
  }}
  .step-urdu-heading {{
    font-size: 14pt;
    font-weight: 700;
    color: #047857;
    margin-top: -4px;
  }}
  .step-narrative {{
    font-size: 8.8pt;
    color: #334155;
    line-height: 1.45;
  }}
  .action-callout {{
    background: #FEFCE8;
    border-left: 4px solid #EAB308;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
  }}
  .action-title {{
    font-size: 8pt;
    font-weight: 900;
    color: #854D0E;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }}
  .action-desc {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #713F12;
  }}
  .specs-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
    margin-top: 4px;
  }}
  .specs-table th {{
    background: #F1F5F9;
    color: #475569;
    padding: 5px 8px;
    text-align: left;
    font-weight: 800;
    border: 1px solid #E2E8F0;
  }}
  .specs-table td {{
    padding: 5px 8px;
    border: 1px solid #E2E8F0;
    color: #0F172A;
  }}
  .specs-table tr:nth-child(even) {{
    background: #F8FAFC;
  }}
  .specs-table td:first-child {{
    font-weight: 700;
    color: #047857;
    width: 42%;
  }}

  /* Callout Card */
  .info-box {{
    background: #F0FDF4;
    border: 1.5px solid #BBF7D0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-top: 4px;
  }}
  .info-box-title {{
    font-size: 8.5pt;
    font-weight: 800;
    color: #166534;
    margin-bottom: 2px;
  }}
  .info-box-desc {{
    font-size: 8pt;
    color: #15803D;
    line-height: 1.4;
  }}

  /* Table of Contents */
  .toc-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 6mm;
  }}
  .toc-card {{
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    border-radius: 8px;
    padding: 12px;
  }}
  .toc-chapter {{
    font-size: 8pt;
    font-weight: 800;
    color: #047857;
    text-transform: uppercase;
    margin-bottom: 4px;
  }}
  .toc-title {{
    font-size: 11pt;
    font-weight: 800;
    color: #0F172A;
    margin-bottom: 6px;
  }}
  .toc-list {{
    list-style: none;
    font-size: 8pt;
    color: #475569;
    line-height: 1.6;
  }}
  .toc-list li {{
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dotted #CBD5E1;
    padding-bottom: 1px;
    margin-bottom: 2px;
  }}

  /* Grid 2 Column for Specs */
  .two-col-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 4mm;
  }}
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- PAGE 1: USER MANUAL COVER PAGE                                            -->
<!-- ========================================================================= -->
<div class="pdf-page" style="padding:0;">
  <div class="cover-page">
    <div class="cover-top">
      <div class="cover-logo-group">
        <div class="cover-rvm-badge">RVM-001</div>
        <div style="font-size: 10pt; font-weight: 800; color: #86EFAC;">REVERSE VENDING KIOSK</div>
      </div>
      <img src="{img_logo_isp}" class="cover-partner-logo" alt="ISP Logo"/>
    </div>

    <div class="cover-body">
      <div class="cover-tag">Official Citizen & Operator Documentation</div>
      <div class="cover-title">USER OPERATION<br>MANUAL</div>
      <div class="cover-urdu-title">صارفین اور شہریوں کیلئے معلوماتی رہنما</div>
      <div class="cover-subtitle">
        Comprehensive guide for public recycling, interactive screen navigation, multi-sensor deposit validation, points redemption, and intelligent kiosk display features.
      </div>

      <div class="cover-feature-grid">
        <div class="cover-feature-card">
          <div class="cover-feature-icon">♻️</div>
          <div class="cover-feature-title">7-Step Flow</div>
          <div class="cover-feature-desc">Frictionless deposit from Key 0 trigger to wallet credit and live rating.</div>
        </div>
        <div class="cover-feature-card">
          <div class="cover-feature-icon">📺</div>
          <div class="cover-feature-title">Idle Expansion</div>
          <div class="cover-feature-desc">50% screen instructional expansion with active digital signage playback.</div>
        </div>
        <div class="cover-feature-card">
          <div class="cover-feature-icon">🎁</div>
          <div class="cover-feature-title">Instant Rewards</div>
          <div class="cover-feature-desc">Real-time mobile wallet sync with Central Cloud and SQL Server ledger.</div>
        </div>
      </div>
    </div>

    <div class="cover-meta-box">
      <div class="cover-meta-item">
        <span class="cover-meta-label">DOCUMENT ID</span>
        <span class="cover-meta-val">DOC-RVM-UM-2026-V3.2</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">DATE / RELEASE</span>
        <span class="cover-meta-val">September 2026</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">APPLICABILITY</span>
        <span class="cover-meta-val">RVM Kiosk Model RVM-001</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">CLASSIFICATION</span>
        <span class="cover-meta-val">Public / User Manual</span>
      </div>
    </div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 2: TABLE OF CONTENTS & QUICK START SUMMARY                           -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">TABLE OF CONTENTS</div>
  </div>

  <div class="section-title">Manual Overview & Navigation</div>
  <div class="section-subtitle">A structured roadmap of all user interactions, kiosk screen displays, and environmental reward steps.</div>

  <div class="toc-grid">
    <div class="toc-card">
      <div class="toc-chapter">Chapter 1</div>
      <div class="toc-title">Kiosk Architecture & Overview</div>
      <ul class="toc-list">
        <li><span>1.1 Purpose & Environmental Mission</span><span>Page 3</span></li>
        <li><span>1.2 Dual-Screen Layout Concept</span><span>Page 3</span></li>
        <li><span>1.3 Hardware Safety Features</span><span>Page 3</span></li>
      </ul>
    </div>

    <div class="toc-card">
      <div class="toc-chapter">Chapter 2</div>
      <div class="toc-title">Standby & Idle Modes</div>
      <ul class="toc-list">
        <li><span>2.1 Default Welcome Screen & Live Dashboard</span><span>Page 4</span></li>
        <li><span>2.2 1-Minute Inactivity Idle Screen (50% Expansion)</span><span>Page 5</span></li>
        <li><span>2.3 Instant Wake-up via Key 0 Trigger</span><span>Page 5</span></li>
      </ul>
    </div>

    <div class="toc-card" style="grid-column: span 2;">
      <div class="toc-chapter">Chapter 3</div>
      <div class="toc-title">The 7-Step Recycling Journey</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <ul class="toc-list">
          <li><span>Step 1: Session Initiation (Key 0)</span><span>Page 6</span></li>
          <li><span>Step 2: Container Insertion & Sizing</span><span>Page 7</span></li>
          <li><span>Step 3: Interactive Sensing States & Overlays</span><span>Page 8</span></li>
        </ul>
        <ul class="toc-list">
          <li><span>Step 4: Drop Confirmation & Anti-Cheat</span><span>Page 9</span></li>
          <li><span>Steps 5 & 6: QR Scan & Mobile Wallet Sync</span><span>Page 10</span></li>
          <li><span>Step 7: Citizen Feedback & Completion</span><span>Page 11</span></li>
        </ul>
      </div>
    </div>

    <div class="toc-card">
      <div class="toc-chapter">Chapter 4</div>
      <div class="toc-title">Hardware Keypad Reference</div>
      <ul class="toc-list">
        <li><span>4.1 Keypad Mapping Matrix</span><span>Page 12</span></li>
        <li><span>4.2 Key 0 Session Trigger & Keypad Operations</span><span>Page 12</span></li>
      </ul>
    </div>

    <div class="toc-card">
      <div class="toc-chapter">Chapter 5</div>
      <div class="toc-title">FAQ & Citizen Troubleshooting</div>
      <ul class="toc-list">
        <li><span>5.1 Item Rejection Causes</span><span>Page 13</span></li>
        <li><span>5.2 Offline Resiliency & Points Safety FAQ</span><span>Page 13</span></li>
      </ul>
    </div>
  </div>

  <div class="info-box" style="margin-top: 6mm;">
    <div class="info-box-title">⚡ QUICK START FOR CITIZENS</div>
    <div class="info-box-desc">
      To recycle: Walk up to the RVM kiosk &rarr; <strong>Press '0' on the keypad</strong> &rarr; Insert your empty bottle/can bottom-first &rarr; Wait for the green checkmark &rarr; <strong>Press Enter</strong> &rarr; Scan on-screen QR code with RVM Mobile App or type 11-digit mobile number &rarr; Rate your experience &rarr; Collect your reward points!
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 2</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 3: KIOSK ARCHITECTURE OVERVIEW                                       -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">1. KIOSK ARCHITECTURE OVERVIEW</div>
  </div>

  <div class="section-title">1. Reverse Vending Machine Overview</div>
  <div class="section-subtitle">An intelligent, multi-material automated recovery unit engineered for university campuses and public plazas.</div>

  <div class="two-col-grid">
    <div>
      <div style="font-size: 10pt; font-weight: 800; color: #047857; margin-bottom: 4px;">DUAL-DISPLAY KIOSK DESIGN</div>
      <p style="font-size: 8.5pt; color: #334155; line-height: 1.45; margin-bottom: 8px;">
        The RVM Kiosk employs a dual-display architecture engineered for maximum citizen engagement and continuous environmental education:
      </p>
      <ul style="font-size: 8.2pt; color: #334155; line-height: 1.5; margin-left: 14px; margin-bottom: 8px;">
        <li><strong>Interactive Portrait Kiosk Display (Screen 1 - 1080x1920):</strong> The primary operational interface where citizens view animated instructions, live telemetry, sensor sizing results, point balances, and leaderboard standings.</li>
        <li><strong>Digital Signage Video Screen (Screen 0 / Lower Display):</strong> Continuously loops high-definition environmental public service announcements (PSAs), commercial partner advertisements, and sustainability metrics without disrupting the active recycling transaction.</li>
      </ul>
      <div class="info-box">
        <div class="info-box-title">🌱 SUSTAINABILITY MISSION</div>
        <div class="info-box-desc">
          Every container deposited into the RVM directly prevents municipal landfill overflow and saves precious natural resources: <strong>+0.15 kg CO2</strong> emission prevented and <strong>+0.75 Liters</strong> of clean water conserved per verified container.
        </div>
      </div>
    </div>

    <div>
      <div style="font-size: 10pt; font-weight: 800; color: #047857; margin-bottom: 4px;">KEY CITIZEN TOUCHPOINTS</div>
      <table class="specs-table">
        <tr>
          <th>Touchpoint Component</th>
          <th>Citizen Function</th>
        </tr>
        <tr>
          <td>Illuminated Aperture</td>
          <td>Circular entry slot with white LED guide ring. Accepts PET bottles, cans, and UBC cartons.</td>
        </tr>
        <tr>
          <td>Motorized Safety Gate</td>
          <td>Anti-pinch protective door opens only when the citizen indicates readiness by pressing 0.</td>
        </tr>
        <tr>
          <td>Physical Matrix Keypad</td>
          <td>12-key tactile keypad mounted at ergonomic height. Resistant to rain, dust, and direct sunlight.</td>
        </tr>
        <tr>
          <td>Instructional Container</td>
          <td>High-visibility animated display showing real-time feedback, sensor diagnostics, and celebration animations.</td>
        </tr>
        <tr>
          <td>Reward Balance Display</td>
          <td>Instant point tracker displaying accumulated session points in 56pt high-contrast bold digits.</td>
        </tr>
      </table>

      <div class="action-callout" style="margin-top: 6px;">
        <div class="action-title">CITIZEN SAFETY NOTICE</div>
        <div class="action-desc">
          The intake chamber is monitored by safety sensors. Never attempt to force foreign objects, glass, or pressurized cans into the machine. The safety door will immediately halt if an obstruction is detected.
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 6mm;">
    <div style="font-size: 9.5pt; font-weight: 800; color: #073B28; margin-bottom: 2px;">SUPPORTED RECYCLABLE MATERIALS</div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 2px;">
      <div style="background:#F0FDFA; border:1px solid #99F6E4; border-radius:6px; padding:8px;">
        <div style="font-size:12pt;">🍾 <strong>Plastic PET Bottles</strong></div>
        <div style="font-size:7.5pt; color:#0F766E; margin-top:2px;">Water, soda, juice bottles (250ml to 2.25L). Must be empty of liquid. S, M, L accepted.</div>
      </div>
      <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:6px; padding:8px;">
        <div style="font-size:12pt;">🥫 <strong>Aluminium Cans</strong></div>
        <div style="font-size:7.5pt; color:#B91C1C; margin-top:2px;">Beverage cans, soda tins. Verified by internal inductive sensor. S, M, L accepted.</div>
      </div>
      <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:6px; padding:8px;">
        <div style="font-size:12pt;">🧃 <strong>UBC TetraPak Cartons</strong></div>
        <div style="font-size:7.5pt; color:#15803D; margin-top:2px;">Juice cartons, milk packs. Verified by ultrasonic acoustic bounce. S, M, L accepted.</div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 3</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 4: HOME WELCOME SCREEN & CITIZEN DASHBOARD                           -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">2. STANDBY: DEFAULT SCREEN</div>
  </div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_home}" class="snapshot-img" alt="Screen 02 Home Page"/>
    </div>

    <div class="step-content">
      <div class="step-pill">STANDBY SCREEN · SCREEN 02</div>
      <div class="step-heading">Home Page & Citizen Dashboard</div>
      <div class="step-urdu-heading urdu-text">مرکزی اسکرین اور طریقہ کار</div>

      <div class="step-narrative">
        When the RVM is in its ready standby state, it presents the primary welcome screen. The interface is meticulously balanced with high-contrast typography, emerald eco-card containers, and bilingual Urdu and English text.
      </div>

      <div class="action-callout">
        <div class="action-title">HOW TO BEGIN</div>
        <div class="action-desc">Press the '0' key on the keypad or tap the glowing green button on the screen.</div>
      </div>

      <table class="specs-table">
        <tr>
          <th>Dashboard Section</th>
          <th>Citizen Feature & Information</th>
        </tr>
        <tr>
          <td>Top Header Bar</td>
          <td>Machine ID (RVM-001), Real-time Live Status badge, and current Pakistan Standard Time.</td>
        </tr>
        <tr>
          <td>Hardware Diagnostics</td>
          <td>Green status dots confirming Serial connection, Local Database (OK), and Central Cloud API (ONLINE).</td>
        </tr>
        <tr>
          <td>Instructional Player</td>
          <td>16:9 high-definition video widget running bilingual instructional motion guides.</td>
        </tr>
        <tr>
          <td>How to Use RVM Bar</td>
          <td>Teal glassmorphism card outlining the 7 chronological steps of the recycling journey.</td>
        </tr>
        <tr>
          <td>Session Breakdown</td>
          <td>Live material tallies (Plastic, Cans, UBC, Rejected) and large 56pt Reward Balance.</td>
        </tr>
        <tr>
          <td>Top 5 Eco Champions</td>
          <td>Live community leaderboard celebrating top campus recyclers and recent recycling activity.</td>
        </tr>
      </table>

      <div class="info-box">
        <div class="info-box-title">🏆 COMMUNITY RECOGNITION</div>
        <div class="info-box-desc">
          Top campus recyclers are automatically ranked on the right-hand leaderboard. Your name and reward points will be showcased to motivate the community!
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 4</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 5: 1-MINUTE INACTIVITY IDLE SCREEN                                   -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">2. STANDBY: 1-MINUTE IDLE SCREEN</div>
  </div>

  <div class="section-title">2.2 Kiosk Idle Mode & Display Expansion</div>
  <div class="section-subtitle">Automatic display optimization when the kiosk is inactive for more than 1 minute to attract pedestrians and showcase educational content.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_idle}" class="snapshot-img" alt="Screen Idle Expanded Mode"/>
    </div>

    <div class="step-content">
      <div class="step-pill">STANDBY MODE · 60s INACTIVITY</div>
      <div class="step-heading">1-Minute Inactivity Idle Screen</div>
      <div class="step-urdu-heading urdu-text">ایک منٹ بعد اسکرین کی خودکار توسیع</div>

      <div class="step-narrative">
        When no citizen interacts with the kiosk for over <strong>1 minute (60 seconds)</strong>, the application automatically transitions into cinematic standby mode:
      </div>

      <table class="specs-table">
        <tr>
          <th>Layout Element</th>
          <th>Behavior During Idle Mode</th>
        </tr>
        <tr>
          <td>Instructional Video</td>
          <td><strong>Expands to 50% of screen height</strong> (960px) with smooth zoom-in styling inside container.</td>
        </tr>
        <tr>
          <td>How to Use RVM Card</td>
          <td><strong>Stays 100% visible</strong> with all 7 step cards and Urdu text clearly legible below the video.</td>
        </tr>
        <tr>
          <td>Ad Video Section</td>
          <td><strong>Stays 100% visible & playing</strong> in the remaining lower 740px screen area.</td>
        </tr>
        <tr>
          <td>Header & Status Bar</td>
          <td>Automatically fade out and collapse to 0 height for clean visual immersion.</td>
        </tr>
        <tr>
          <td>Lower Dashboard</td>
          <td>Live session breakdown & leaderboard collapse to 0 height.</td>
        </tr>
        <tr>
          <td>Zero Overlap Geometry</td>
          <td>Strict Auto row stacking guarantees zero visual clipping or touching between cards.</td>
        </tr>
      </table>

      <div class="action-callout">
        <div class="action-title">HOW TO RETURN TO DEFAULT SCREEN</div>
        <div class="action-desc">Press the '0' key on the keypad to start recycling. The kiosk instantly wakes up, exits idle mode, and prepares the intake chamber!</div>
      </div>

      <div class="info-box">
        <div class="info-box-title">🌿 ECO-FRIENDLY STANDBY MODE</div>
        <div class="info-box-desc">
          The 1-minute idle mode automatically expands instructional visuals to welcome new citizens while optimizing kiosk power efficiency.
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 5</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 6: STEP 1 - SESSION INITIATION                                       -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">3. RECYCLING JOURNEY: STEP 1</div>
  </div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_step01}" class="snapshot-img" alt="Screen 03 Step 01"/>
    </div>

    <div class="step-content">
      <div class="step-pill">STEP 1 OF 7 · KEYPAD KEY '0'</div>
      <div class="step-heading">Starting Your Recycling Session</div>
      <div class="step-urdu-heading urdu-text">پہلا مرحلہ: سیشن کا آغاز اور تیاری</div>

      <div class="step-narrative">
        To start a recycling session, press the <strong>'0'</strong> key on the physical hardware keypad or touch the circular start button. The RVM acknowledges citizen presence immediately: the motorized entrance gate opens, internal chamber lights turn on, and sensors arm for container entry.
      </div>

      <div class="action-callout">
        <div class="action-title">CITIZEN ACTION REQUIRED</div>
        <div class="action-desc">Ensure your bottle or can is completely empty. Insert container bottom-first into the illuminated circular aperture.</div>
      </div>

      <table class="specs-table">
        <tr>
          <th>Mechanical & Electronic Event</th>
          <th>Technical State</th>
        </tr>
        <tr>
          <td>Entrance Door Servo</td>
          <td>Rotates 90° to open position (Aperture Ready)</td>
        </tr>
        <tr>
          <td>Chamber Lighting</td>
          <td>High-intensity white LED ring illuminates interior</td>
        </tr>
        <tr>
          <td>Acoustic Sensor Ping</td>
          <td>Ultrasonic transducer arms (Pin D12/D13)</td>
        </tr>
        <tr>
          <td>Safety Gate Sensor</td>
          <td>Infrared safety beam active to prevent finger pinching</td>
        </tr>
        <tr>
          <td>Session Timer</td>
          <td>30-second activity countdown initiated</td>
        </tr>
      </table>

      <div class="info-box">
        <div class="info-box-title">💡 TIP FOR OPTIMAL RECYCLING</div>
        <div class="info-box-desc">
          Always insert bottles bottom-first with the cap facing toward you. Keep barcodes visible if present to assist high-speed classification.
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 6</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 7: STEP 2 - CONTAINER INSERTION & SIZING                             -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">3. RECYCLING JOURNEY: STEP 2</div>
  </div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_step02}" class="snapshot-img" alt="Screen 04 Step 02"/>
    </div>

    <div class="step-content">
      <div class="step-pill">STEP 2 OF 7 · DETECTION & SIZING</div>
      <div class="step-heading">Real-Time Sensor Scanning</div>
      <div class="step-urdu-heading urdu-text">دوسرا مرحلہ: اسکیننگ اور پیمائش</div>

      <div class="step-narrative">
        As the container settles inside the chamber, the RVM executes a sub-second multi-sensor sweep. The system cross-references optical height beams, inductive metallic response, and ultrasonic distance to classify material and calculate dimensions.
      </div>

      <div class="action-callout">
        <div class="action-title">CITIZEN ACTION REQUIRED</div>
        <div class="action-desc">Allow container to rest inside chamber. Wait 1 second while sensors verify dimensions and confirm acceptance.</div>
      </div>

      <table class="specs-table">
        <tr>
          <th>Sensor Subsystem</th>
          <th>Detection Criteria & Result</th>
        </tr>
        <tr>
          <td>Inductive Sensor (D5)</td>
          <td>Metal conductivity check (1 = Can / Metal, 0 = Plastic / UBC)</td>
        </tr>
        <tr>
          <td>IR Optical Array (D2, D7, D8)</td>
          <td>3-tier height measurement: Small (&lt;16cm), Medium (16-24cm), Large (&gt;24cm)</td>
        </tr>
        <tr>
          <td>Ultrasonic Chamber (D12/D13)</td>
          <td>Precise length measurement via high-frequency acoustic bounce</td>
        </tr>
        <tr>
          <td>Liquid Detection</td>
          <td>Weight & optical refraction test to detect residual liquids</td>
        </tr>
        <tr>
          <td>Arbitration Time</td>
          <td>Under 850 milliseconds for complete item classification</td>
        </tr>
      </table>

      <div class="info-box">
        <div class="info-box-title">⚖️ ACCEPTED SIZE CATEGORIES</div>
        <div class="info-box-desc">
          <strong>Small:</strong> 250ml–350ml (+5 pts) &bull; <strong>Medium:</strong> 500ml–1.0L (+10 pts) &bull; <strong>Large:</strong> 1.5L–2.25L (+15 pts). All sizes are automatically awarded appropriate points!
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 7</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 8: STEP 3 - INTERACTIVE STATE OVERLAYS                               -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">3. RECYCLING JOURNEY: SENSING STATES</div>
  </div>

  <div class="section-title">Interactive Motion Overlays on Video Widget</div>
  <div class="section-subtitle">During the recycling transaction, the video player displays rich dynamic overlays that guide the citizen through detection stages.</div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 2mm;">
    <!-- Overlay 1 -->
    <div style="border:1.5px solid #86EFAC; background:#F0FDF4; border-radius:8px; padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:8pt; font-weight:800; background:#DCFCE7; color:#15803D; padding:2px 6px; border-radius:4px;">STATE 1</span>
        <span style="font-size:8pt; color:#166534; font-weight:700;">Please Insert Item</span>
      </div>
      <div style="font-size:11pt; font-weight:900; color:#073B28;">PLEASE INSERT BOTTLE / CAN</div>
      <div style="font-size:10pt; font-weight:700; color:#15803D;" class="urdu-text">برائے مہربانی خالی بوتل یا کین ڈالیں</div>
      <p style="font-size:7.8pt; color:#334155; margin-top:4px; line-height:1.35;">
        Displays an animated pulsating circular aperture showing bottles entering smoothly. Reassures citizens that the machine is armed and awaiting container deposit.
      </p>
    </div>

    <!-- Overlay 2 -->
    <div style="border:1.5px solid #FDE047; background:#FEFCE8; border-radius:8px; padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:8pt; font-weight:800; background:#FEF08A; color:#854D0E; padding:2px 6px; border-radius:4px;">STATE 2</span>
        <span style="font-size:8pt; color:#854D0E; font-weight:700;">Detecting & Sizing</span>
      </div>
      <div style="font-size:11pt; font-weight:900; color:#713F12;">DETECTING & SIZING ITEM...</div>
      <div style="font-size:10pt; font-weight:700; color:#854D0E;" class="urdu-text">بوتل کی شناخت اور پیمائش ہو رہی ہے</div>
      <p style="font-size:7.8pt; color:#334155; margin-top:4px; line-height:1.35;">
        Features a simulated bidirectional laser beam scanning vertically across the container. Confirms to the citizen that sensors are measuring material dimensions in real-time.
      </p>
    </div>

    <!-- Overlay 3 -->
    <div style="border:1.5px solid #99F6E4; background:#F0FDFA; border-radius:8px; padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:8pt; font-weight:800; background:#CCFBF1; color:#0F766E; padding:2px 6px; border-radius:4px;">STATE 3</span>
        <span style="font-size:8pt; color:#0F766E; font-weight:700;">Accepted + Points</span>
      </div>
      <div style="font-size:11pt; font-weight:900; color:#042E2B;">ITEM ACCEPTED! +10 PTS</div>
      <div style="font-size:10pt; font-weight:700; color:#0F766E;" class="urdu-text">بوتل قبول! پوائنٹس کا اندراج ہو گیا</div>
      <p style="font-size:7.8pt; color:#334155; margin-top:4px; line-height:1.35;">
        Celebratory green notification with confetti graphics. Automatically plays material dancing animation (Plastic, Can, or TetraPak) matching the recognized item.
      </p>
    </div>

    <!-- Overlay 4 -->
    <div style="border:1.5px solid #FECACA; background:#FEF2F2; border-radius:8px; padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:8pt; font-weight:800; background:#FEE2E2; color:#B91C1C; padding:2px 6px; border-radius:4px;">STATE 4</span>
        <span style="font-size:8pt; color:#B91C1C; font-weight:700;">Item Rejected</span>
      </div>
      <div style="font-size:11pt; font-weight:900; color:#7F1D1D;">ITEM REJECTED! PLEASE RETRIEVE</div>
      <div style="font-size:10pt; font-weight:700; color:#B91C1C;" class="urdu-text">آئٹم نامنظور! برائے مہربانی واپس نکال لیں</div>
      <p style="font-size:7.8pt; color:#334155; margin-top:4px; line-height:1.35;">
        Clear safety warning with gentle audio alert. Gate unlocks to allow retrieval of non-recyclable garbage, glass, or containers with remaining liquid.
      </p>
    </div>
  </div>

  <div style="margin-top: 6mm;">
    <div class="snapshot-frame" style="max-height: 110mm;">
      <img src="{img_reject}" class="snapshot-img" alt="Rejection Screen"/>
    </div>
    <div style="font-size: 8pt; color: #64748B; text-align: center; margin-top: 4px;">
      Figure 7.1: Real Kiosk Rejection Screen displaying safety alert and retrieval instructions.
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 8</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 9: STEP 4 - ANTI-CHEAT DROP CONFIRMATION                             -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">3. RECYCLING JOURNEY: STEP 4</div>
  </div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_accepted}" class="snapshot-img" alt="Screen 06 Step 03 Accepted"/>
    </div>

    <div class="step-content">
      <div class="step-pill">STEP 4 OF 7 · ANTI-CHEAT VALIDATION</div>
      <div class="step-heading">Drop Confirmation & Claiming Rewards</div>
      <div class="step-urdu-heading urdu-text">چوتھا مرحلہ: بوتل چیمبر میں گرنے کی تصدیق</div>

      <div class="step-narrative">
        To maintain reward integrity, points are only awarded after the anti-cheat drop gate actuates 180° and the ultrasonic sensor verifies the physical fall of the container into the internal bin. Once confirmed, the citizen can insert another item or press <strong>Enter</strong> to proceed to wallet credit.
      </div>

      <div class="action-callout">
        <div class="action-title">CITIZEN ACTION REQUIRED</div>
        <div class="action-desc">Insert another container to earn more points, OR press 'Enter' on the keypad to finalize session and claim rewards.</div>
      </div>

      <table class="specs-table">
        <tr>
          <th>Verification Parameter</th>
          <th>Anti-Cheat Mechanism</th>
        </tr>
        <tr>
          <td>Drop Gate Actuator</td>
          <td>Servo Pin D8 rotates 180° downward to drop container into bin</td>
        </tr>
        <tr>
          <td>Ultrasonic Fall Ping</td>
          <td>Acoustic bounce detects item clearing chamber (BOTTLE:CLEARED)</td>
        </tr>
        <tr>
          <td>String-Tie Anti-Cheat</td>
          <td>If an item is pulled back via string, machine flags ERROR:CLEAR_TIMEOUT</td>
        </tr>
        <tr>
          <td>Session Accumulation</td>
          <td>Points and items increment live on dashboard breakdown</td>
        </tr>
      </table>

      <div class="info-box">
        <div class="info-box-title">🎁 MULTI-CONTAINER SESSIONS</div>
        <div class="info-box-desc">
          You do not need to enter your phone number for each bottle! Keep depositing containers one after another. When you are completely done, press <strong>Enter</strong> once to credit all accumulated points simultaneously.
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 9</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 10: STEP 5 & 6 - QR SCAN & MOBILE WALLET SYNC                         -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">3. RECYCLING JOURNEY: WALLET SYNC</div>
  </div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_wallet}" class="snapshot-img" alt="Screen 07 Step 04 Wallet"/>
    </div>

    <div class="step-content">
      <div class="step-pill">STEPS 5 & 6 · QR SCAN & WALLET CLAIM</div>
      <div class="step-heading">Claiming Points via QR Code Scan or Mobile Entry</div>
      <div class="step-urdu-heading urdu-text">پانچواں مرحلہ: کیو آر کوڈ اسکین یا موبائل نمبر سے انعام کا حصول</div>

      <div class="step-narrative">
        After pressing <strong>Enter</strong> to conclude container deposits, the kiosk displays the Points Claim modal. Citizens can claim points in two convenient ways: instantly scan the on-screen dynamic QR Code using the RVM Mobile App, or type their 11-digit mobile number using the physical keypad.
      </div>

      <div class="action-callout">
        <div class="action-title">CITIZEN ACTION REQUIRED</div>
        <div class="action-desc">
          Scan the on-screen QR Code using your RVM Mobile App (or phone camera), enter the 6-character Session Code in the app, OR type your 11-digit mobile number on the keypad and press 'Enter'.
        </div>
      </div>

      <table class="specs-table">
        <tr>
          <th>Claim Method / Rule</th>
          <th>Specification & Citizen Experience</th>
        </tr>
        <tr>
          <td>Dynamic QR Code Scan</td>
          <td>Instant, touchless wallet sync via RVM Mobile App or smartphone camera</td>
        </tr>
        <tr>
          <td>Session Code (App Entry)</td>
          <td>6-character code under QR for quick manual entry in the mobile app</td>
        </tr>
        <tr>
          <td>Keypad Mobile Input</td>
          <td>Enter 11-digit Pakistani mobile number (03001234567) + press 'Enter'</td>
        </tr>
        <tr>
          <td>Backspace / Delete</td>
          <td>Press '*' key on physical keypad to clear the last typed digit</td>
        </tr>
        <tr>
          <td>Cancel Transaction</td>
          <td>Press '#' key on keypad to cancel entry and return to deposit screen</td>
        </tr>
        <tr>
          <td>90-Second Active Timer</td>
          <td>Ensures session privacy and triggers safe automatic fallback if uncollected</td>
        </tr>
      </table>

      <div class="info-box">
        <div class="info-box-title">📱 POINTS REDEMPTION & WALLET BALANCE</div>
        <div class="info-box-desc">
          Your points never expire! Rewards sync directly to your centralized account across all campus and public RVM kiosks, redeemable for mobile balance top-ups, cafeteria discounts, and gift cards.
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 10</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 11: STEP 7 - CITIZEN FEEDBACK & THANK YOU                            -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">3. RECYCLING JOURNEY: STEP 7</div>
  </div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img src="{img_feedback}" class="snapshot-img" alt="Screen 09 Feedback"/>
    </div>
    

    <div class="step-content">
      <div class="step-pill">STEP 7 OF 7 · CITIZEN EXPERIENCE RATING</div>
      <div class="step-heading">Rating Your Recycling Experience</div>
      <div class="step-urdu-heading urdu-text">ساتواں مرحلہ: تجربے کی درجہ بندی اور رائے</div>

      <div class="step-narrative">
        Following point crediting, the kiosk presents a 1-to-5 star experience rating screen. Citizens can touch the stars to submit their rating and tap quick feedback tag chips ("Fast & Easy", "Clean Machine", "Great Rewards").
      </div>

      <div class="action-callout">
        <div class="action-title">CITIZEN ACTION REQUIRED</div>
        <div class="action-desc">Tap 1 to 5 stars on the screen or press a keypad digit (1-5), then press Enter to submit your feedback.</div>
      </div>

      <table class="specs-table">
        <tr>
          <th>Feedback Parameter</th>
          <th>Citizen Feature</th>
        </tr>
        <tr>
          <td>Star Rating Scale</td>
          <td>1 to 5 Gold Stars (Poor to Excellent)</td>
        </tr>
        <tr>
          <td>Feedback Tags</td>
          <td>Fast & Easy, Clean Machine, Great Rewards, Needs Help</td>
        </tr>
        <tr>
          <td>Auto-Skip Timeout</td>
          <td>10-second timer automatically completes if citizen walks away</td>
        </tr>
        <tr>
          <td>Final Receipt Screen</td>
          <td>Displays total points earned and CO2 prevented</td>
        </tr>
        <tr>
          <td>Auto-Reset</td>
          <td>Machine cleanly resets session buffer for next user</td>
        </tr>
      </table>

      <div class="info-box">
        <div class="info-box-title">🌟 CONTINUOUS IMPROVEMENT</div>
        <div class="info-box-desc">
          Your feedback is transmitted directly to the University Administration and Municipal Waste Management dashboard to ensure the kiosk remains clean and well-maintained.
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 11</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 12: KEYPAD MATRIX & CITIZEN INPUT QUICK REFERENCE                    -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">4. KEYPAD REFERENCE MATRIX</div>
  </div>

  <div class="section-title">4. Keypad & Input Quick Reference</div>
  <div class="section-subtitle">Comprehensive guide to all tactile keypad inputs, QR claim options, and citizen commands.</div>

  <table class="specs-table" style="margin-top: 4mm;">
    <tr>
      <th style="width: 22%;">Input Method</th>
      <th style="width: 26%;">Screen State</th>
      <th>Function & Kiosk Response</th>
    </tr>
    <tr>
      <td><strong>Key 0</strong></td>
      <td>Standby / Idle Mode</td>
      <td><strong>Hardware Session Trigger:</strong> Opens safety entrance door, activates chamber lighting, and arms sensors. Exits idle video mode.</td>
    </tr>
    <tr>
      <td><strong>Enter ↵</strong></td>
      <td>Container Deposited</td>
      <td><strong>Finalize & Proceed:</strong> Concludes container intake and opens the points claim dialog.</td>
    </tr>
    <tr>
      <td><strong>QR Code Scan</strong></td>
      <td>Wallet Claim Screen</td>
      <td><strong>Touchless Points Claim:</strong> Scan the dynamic on-screen QR code with RVM Mobile App or phone camera for instant wallet crediting.</td>
    </tr>
    <tr>
      <td><strong>Session Code</strong></td>
      <td>Wallet Claim Screen</td>
      <td><strong>Manual Mobile App Entry:</strong> Type the 6-character session code shown below the QR code directly in the RVM Mobile App.</td>
    </tr>
    <tr>
      <td><strong>Digits 0–9</strong></td>
      <td>Wallet Claim Screen</td>
      <td><strong>Mobile Number Input:</strong> Types 11 digits for Pakistani mobile number (03xxxxxxxxx) via physical keypad.</td>
    </tr>
    <tr>
      <td><strong>Enter ↵</strong></td>
      <td>Wallet Claim Screen</td>
      <td><strong>Submit Wallet:</strong> Validates 11-digit mobile number, credits points to database, and proceeds to rating screen.</td>
    </tr>
    <tr>
      <td><strong>Star Key (*)</strong></td>
      <td>Wallet Claim Screen</td>
      <td><strong>Backspace / Delete:</strong> Removes the last typed digit for instant correction.</td>
    </tr>
    <tr>
      <td><strong>Hash Key (#)</strong></td>
      <td>Any Modal / Dialog</td>
      <td><strong>Cancel / Back:</strong> Closes active dialog and returns to the previous screen.</td>
    </tr>
    <tr>
      <td><strong>Digits 1–5</strong></td>
      <td>Feedback Rating</td>
      <td><strong>Citizen Rating:</strong> Selects satisfaction level from 1 (Very Bad) to 5 (Excellent), followed by Enter.</td>
    </tr>
  </table>

  <div class="two-col-grid" style="margin-top: 6mm;">
    <div class="info-box">
      <div class="info-box-title">🔑 KEY 0 SESSION INITIATION</div>
      <div class="info-box-desc">
        Pressing <strong>Key 0</strong> on the tactile keypad immediately initiates your recycling journey: the motorized safety gate opens, internal chamber lights activate, and deposit sensors arm ready for your containers.
      </div>
    </div>
    <div class="action-callout">
      <div class="action-title">ERGONOMIC ACCESSIBILITY</div>
      <div class="action-desc">
        The hardware keypad features embossed numbers and high-contrast tactile feedback compliant with universal accessibility standards for wheelchair users and visually impaired citizens.
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 12</span>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 13: FAQ & CITIZEN TROUBLESHOOTING                                    -->
<!-- ========================================================================= -->
<div class="pdf-page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">RVM-001</span>
      <span class="header-title">Citizen & User Operation Manual</span>
    </div>
    <div class="header-right">5. FAQ & CITIZEN TROUBLESHOOTING</div>
  </div>

  <div class="section-title">5. Frequently Asked Questions & Troubleshooting</div>
  <div class="section-subtitle">Common questions regarding recycling rewards, container acceptance, and citizen assistance.</div>

  <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4mm;">
    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:9pt; font-weight:800; color:#073B28;">Q1: Why did the machine reject my plastic bottle?</div>
      <div style="font-size:8.2pt; color:#334155; margin-top:3px; line-height:1.4;">
        <strong>Answer:</strong> The most common cause is residual liquid inside the bottle. Optical sensors detect liquid refraction and reject the bottle to prevent sticky contamination inside the bin. Please empty all liquids completely before inserting. Rejection can also occur if the bottle is severely crushed or is an unsupported plastic type (e.g. PVC or HDPE detergent jugs).
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:9pt; font-weight:800; color:#073B28;">Q2: What happens if the internet connection is temporarily offline?</div>
      <div style="font-size:8.2pt; color:#334155; margin-top:3px; line-height:1.4;">
        <strong>Answer:</strong> Your points are 100% safe! The RVM kiosk operates a resilient local Microsoft SQL Server database. When the cloud connection is offline, points are saved locally in an offline queue and automatically synchronized to the Central Cloud server as soon as the network reconnects.
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:9pt; font-weight:800; color:#073B28;">Q3: How many containers can I deposit in a single session?</div>
      <div style="font-size:8.2pt; color:#334155; margin-top:3px; line-height:1.4;">
        <strong>Answer:</strong> There is no limit! You can insert as many bottles, cans, and cartons as you wish during one session. The live counter tracks every accepted container. When you are finished, press <strong>Enter</strong> to claim all points together.
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:9pt; font-weight:800; color:#073B28;">Q4: How do I redeem my points for balance or gifts?</div>
      <div style="font-size:8.2pt; color:#334155; margin-top:3px; line-height:1.4;">
        <strong>Answer:</strong> Visit the official web portal at <strong>isprvm.binishaqsoft.com</strong> or visit the campus partner desk. Enter your registered 11-digit mobile number to view balance vouchers, mobile recharge codes, and gift rewards.
      </div>
    </div>

    <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:10px;">
      <div style="font-size:9pt; font-weight:800; color:#073B28;">Q5: How do I scan the QR code to claim my points?</div>
      <div style="font-size:8.2pt; color:#334155; margin-top:3px; line-height:1.4;">
        <strong>Answer:</strong> Open the <strong>RVM Mobile App</strong> on your smartphone, tap the <strong>Scan QR</strong> tab, and point your camera at the kiosk screen. Your points will be credited immediately to your account. Alternatively, you can type the 6-character session code shown below the QR code into the app.
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">ENVIRONMENTAL SOLUTIONS PVT. LTD</span>
    <span class="footer-center">DOC-RVM-UM-2026-V3.2</span>
    <span class="footer-right">Page 13</span>
  </div>
</div>

</body>
</html>"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[GENERATED] User Manual HTML: {html_path}")

if __name__ == '__main__':
    base_dir = r"d:\GIT-HUB\RVM-dash\docs\rvm_desktop_app_docs"
    snapshots_dir = os.path.join(base_dir, "snapshots")

    # Document 1: Citizen & User Operation Manual
    user_manual_html = os.path.join(base_dir, "RVM_Kiosk_User_Manual.html")
    user_manual_pdf = os.path.join(base_dir, "RVM_Kiosk_User_Manual.pdf")

    print("\n" + "="*70)
    print("STEP 1: GENERATING CITIZEN & USER OPERATION MANUAL (PDF)")
    print("="*70)
    generate_user_manual_html(user_manual_html, snapshots_dir)
    print_to_pdf(user_manual_html, user_manual_pdf)

    # Document 2: Standard Operating Procedures (SOP) & Engineering Manual
    sop_html = os.path.join(base_dir, "RVM_Kiosk_Standard_Operating_Procedure_SOP.html")
    sop_pdf = os.path.join(base_dir, "RVM_Kiosk_Standard_Operating_Procedure_SOP.pdf")

    print("\n" + "="*70)
    print("STEP 2: GENERATING STANDARD OPERATING PROCEDURES (SOP) MANUAL (PDF)")
    print("="*70)
    generate_sop_html(sop_html, snapshots_dir)
    print_to_pdf(sop_html, sop_pdf)

    print("\n" + "="*70)
    print("DOCUMENT RECREATION COMPLETE: TWO SEPARATE PDFS GENERATED")
    print("="*70)

