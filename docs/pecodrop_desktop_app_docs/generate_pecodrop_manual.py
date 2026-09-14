import os
import base64
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

def generate_pecodrop_user_manual_html(html_path, snapshots_dir):
    fonts_dir = r"d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\Fonts"
    if not os.path.exists(fonts_dir):
        fonts_dir = r"d:\GIT-HUB\RVM-dash\RVMDesktopApp\Fonts"

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

    font_urdu_bold = get_base64_font(os.path.join(fonts_dir, "NotoNastaliqUrdu-Bold.ttf"))
    font_urdu_reg = get_base64_font(os.path.join(fonts_dir, "NotoNastaliqUrdu-Regular.ttf"))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PecoDrop Kiosk Citizen & User Operation Manual — Version 3.5</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 0;
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
    background: #E2E8F0;
    font-size: 8.5pt;
    line-height: 1.4;
  }}
  .page {{
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
    color: #64748B;
    font-weight: 600;
  }}
  .footer-right {{
    font-weight: 700;
    color: #0F172A;
  }}

  /* Cover Page Styling */
  .cover-page {{
    background: linear-gradient(145deg, #042E2B 0%, #073B28 50%, #0F172A 100%);
    color: #FFFFFF;
    padding: 22mm 20mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .cover-logos {{
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
    margin-top: 12mm;
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
    margin-bottom: 5mm;
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
    font-family: 'JameelNastaleeq', 'TrueNastaliq', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important;
    font-size: 26pt;
    font-weight: 700;
    color: #86EFAC;
    margin-bottom: 5mm;
    direction: rtl;
    line-height: 1.6;
  }}
  .cover-subtitle {{
    font-size: 11pt;
    line-height: 1.5;
    color: #CBD5E1;
    max-width: 155mm;
    margin-bottom: 6mm;
  }}
  .cover-features-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 6mm;
  }}
  .cover-feat-card {{
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 10px 12px;
  }}
  .cover-feat-title {{
    font-size: 8.5pt;
    font-weight: 800;
    color: #4ADE80;
    margin-bottom: 3px;
    text-transform: uppercase;
  }}
  .cover-feat-desc {{
    font-size: 7.5pt;
    color: #E2E8F0;
    line-height: 1.35;
  }}
  .cover-meta {{
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 10px 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 8mm;
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
    font-family: 'JameelNastaleeq', 'TrueNastaliq', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important;
    direction: rtl;
    line-height: 1.5;
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
  }}
  .step-details {{
    display: flex;
    flex-direction: column;
    gap: 8px;
  }}
  .step-badge {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #DCFCE7;
    border: 1px solid #86EFAC;
    color: #15803D;
    font-size: 8.5pt;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 6px;
    align-self: flex-start;
  }}
  .instruction-box {{
    background: #F8FAFC;
    border-left: 4px solid #073B28;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
  }}
  .instruction-en {{
    font-size: 8.5pt;
    font-weight: 600;
    color: #1E293B;
    line-height: 1.4;
    margin-bottom: 4px;
  }}
  .instruction-urdu {{
    font-family: 'JameelNastaleeq', 'TrueNastaliq', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important;
    font-size: 11.5pt;
    font-weight: 600;
    color: #073B28;
    direction: rtl;
    line-height: 1.6;
  }}
  .rules-card {{
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 12px;
  }}
  .rules-card h4 {{
    font-size: 8pt;
    font-weight: 800;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .rules-list {{
    list-style: none;
  }}
  .rules-list li {{
    font-size: 7.5pt;
    color: #334155;
    margin-bottom: 3px;
    padding-left: 12px;
    position: relative;
    line-height: 1.35;
  }}
  .rules-list li::before {{
    content: "•";
    position: absolute;
    left: 0;
    color: #22C55E;
    font-weight: bold;
    font-size: 10pt;
    line-height: 8pt;
  }}
  .hardware-note {{
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 7.2pt;
    color: #1E40AF;
    line-height: 1.35;
  }}
  .alert-box {{
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 7.2pt;
    color: #991B1B;
    line-height: 1.35;
  }}

  /* Tables */
  .table-clean {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 3mm;
    font-size: 7.5pt;
  }}
  .table-clean th {{
    background: #073B28;
    color: #FFFFFF;
    font-weight: 800;
    text-align: left;
    padding: 6px 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .table-clean td {{
    padding: 6px 10px;
    border-bottom: 1px solid #E2E8F0;
    color: #334155;
    line-height: 1.35;
  }}
  .table-clean tr:nth-child(even) td {{
    background: #F8FAFC;
  }}

  /* Dual Screen Callouts */
  .landscape-preview-frame {{
    width: 100%;
    background: #0F172A;
    border: 2px solid #CBD5E1;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin: 3mm 0;
  }}
  .landscape-preview-img {{
    width: 100%;
    display: block;
    height: auto;
  }}
</style>
</head>
<body>

<!-- ========================================================================== -->
<!-- PAGE 1: EXECUTIVE COVER PAGE                                               -->
<!-- ========================================================================== -->
<div class="page cover-page">
  <div class="cover-top">
    <div class="cover-logos">
      <div class="cover-rvm-badge">PECO-2026</div>
      <div style="font-weight: 800; font-size: 14pt; letter-spacing: -0.5px; color: #FFFFFF;">
        PecoDrop <span style="color: #4ADE80;">Kiosk System</span>
      </div>
    </div>
    {"<img class='cover-partner-logo' src='" + img_logo_isp + "' alt='ISPP Logo' />" if img_logo_isp else ""}
  </div>

  <div class="cover-body">
    <div class="cover-tag">🍃 CITIZEN & RECYCLER USER MANUAL — VER 3.5</div>
    <h1 class="cover-title">PecoDrop Kiosk<br>Operation Manual</h1>
    <div class="cover-urdu-title">پیکو ڈراپ ری سائیکلنگ کیوسک — شہری و صارف گائیڈ</div>
    <p class="cover-subtitle">
      Comprehensive step-by-step operating guidelines for citizens and recyclers. Learn how to initiate hybrid touchless sessions, deposit plastic bottles, aluminum cans, and tetra paks, track multi-sensor acceptance, earn instant reward points, and sync with your mobile wallet.
    </p>

    <div class="cover-features-grid">
      <div class="cover-feat-card">
        <div class="cover-feat-title">✨ Hybrid Touchless Start</div>
        <div class="cover-feat-desc">Scan dynamic on-screen QR Code via PecoDrop App or press Key '0' on the tactile keypad.</div>
      </div>
      <div class="cover-feat-card">
        <div class="cover-feat-title">🥫 Multi-Material Chute</div>
        <div class="cover-feat-desc">Intelligent sorting for Plastic Bottles (PET), Aluminum Cans, and Tetra Pak beverage cartons.</div>
      </div>
      <div class="cover-feat-card">
        <div class="cover-feat-title">🏆 1.15x Eco Leaderboard</div>
        <div class="cover-feat-desc">Expanded dual-screen landscape display showcasing top recyclers, avatars, live points, and eco-impact.</div>
      </div>
    </div>

    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Machine Identifier</div>
        <div class="cover-meta-val">PECO-2026 (Model K26)</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Installed Location</div>
        <div class="cover-meta-val">Katra Neem Wala, Lahore</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">GPS Coordinates</div>
        <div class="cover-meta-val">31.5826° N, 74.3276° E</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Document ID</div>
        <div class="cover-meta-val">DOC-PECO-UM-2026-V3.5</div>
      </div>
    </div>
  </div>

  <div style="font-size: 7.5pt; color: #94A3B8; text-align: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4mm;">
    Authorized by Department of Environmental Services & Sustainability • Clean & Green Pakistan Initiative • Confidential & Proprietary
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 2: TABLE OF CONTENTS & QUICK START GUIDE                              -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">TABLE OF CONTENTS & QUICK START</div>
  </div>

  <h2 class="section-title">Manual Directory & Hybrid Quick Start</h2>
  <div class="section-subtitle">A concise operational index and visual 60-second walkthrough for all users and citizens.</div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 2mm;">
    <!-- Directory -->
    <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 14px;">
      <h3 style="font-size: 9.5pt; font-weight: 800; color: #073B28; margin-bottom: 6px; border-bottom: 1.5px solid #073B28; padding-bottom: 4px;">
        📖 DOCUMENT DIRECTORY
      </h3>
      <table style="width: 100%; font-size: 7.5pt; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; font-weight: 700;">1. System Architecture & Multi-Material Depository</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 03</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">2. Welcome Screen & Kiosk Display Modes</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 04</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">3. 1-Minute Inactivity Screen & Auto-Wake</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 05</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">4. Step 1: Hybrid Session Initiation (Touchless / Keypad)</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 06</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">5. Step 2: Container Insertion & Multi-Material Sizing</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 07</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">6. Step 3: Interactive Sensing & Dancing Feedback</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 08</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">7. Step 4: Drop Confirmation & Anti-Cheat Gate</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 09</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">8. Steps 5 & 6: Touchless Wallet QR Sync & Claim</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 10</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">9. Step 7: Citizen Rating & Session Complete</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 11</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">10. Exclusive PecoDrop 1.15x Eco Leaderboard (Landscape)</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 12</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">11. Hardware Matrix & Keypad Reference Guide</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 13</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 700;">12. Citizen FAQ & Troubleshooting</td><td style="text-align: right; font-weight: 800; color: #073B28;">Page 14</td></tr>
      </table>
    </div>

    <!-- Hybrid Quick Start -->
    <div style="background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 10px 14px;">
      <h3 style="font-size: 9.5pt; font-weight: 800; color: #065F46; margin-bottom: 6px; border-bottom: 1.5px solid #10B981; padding-bottom: 4px;">
        ⚡ HYBRID QUICK START (60 SECONDS)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 7px; font-size: 7.5pt; color: #064E3B;">
        <div style="display: flex; gap: 8px;">
          <span style="background: #10B981; color: #FFF; font-weight: 800; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0;">1</span>
          <div><b>Start Session:</b> Scan on-screen QR with PecoDrop App OR press tactile Key <b>'0'</b> on machine.</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #10B981; color: #FFF; font-weight: 800; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0;">2</span>
          <div><b>Insert Items:</b> Insert empty Plastic Bottle, Aluminum Can, or Tetra Pak bottom-first into the illuminated chute.</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #10B981; color: #FFF; font-weight: 800; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0;">3</span>
          <div><b>Smart Classification:</b> Machine reads barcode, tests material via inductive sensors & ultrasonic profiling.</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #10B981; color: #FFF; font-weight: 800; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0;">4</span>
          <div><b>Flap Actuation:</b> Motorized servo flap opens 180° and deposits the container safely into the internal bin.</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #10B981; color: #FFF; font-weight: 800; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0;">5</span>
          <div><b>Touchless Claim:</b> Scan the dynamic wallet QR code on screen to claim points instantly, or type phone number on keypad.</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #10B981; color: #FFF; font-weight: 800; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0;">6</span>
          <div><b>Rating:</b> Rate your experience (1–5 Stars) to conclude the session.</div>
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 5mm; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px;">
    <h3 style="font-size: 9pt; font-weight: 800; color: #073B28; margin-bottom: 4px;">اردو فوری رہنمائی (فوری استعمال کا طریقہ)</h3>
    <div class="urdu-text" style="font-size: 10.5pt; color: #1E293B; line-height: 1.6;">
      ۱۔ <b>سیشن کا آغاز:</b> موبائل ایپ سے اسکرین پر موجود کیو آر کوڈ اسکین کریں یا کی پیڈ پر '0' کا بٹن دبائیں۔<br>
      ۲۔ <b>بوتل یا کین ڈالیں:</b> خالی پلاسٹک کی بوتل، کین، یا ٹیٹرا پیک نچلے حصے کی طرف سے اندر داخل کریں۔<br>
      ۳۔ <b>خودکار تصدیق:</b> مشین سینسرز اور کیمرے کی مدد سے بارکوڈ اور میٹریل کی تصدیق کرے گی۔<br>
      ۴۔ <b>پوائنٹس وصولی:</b> سیشن مکمل ہونے پر اپنے موبائل سے کیو آر کوڈ اسکین کر کے فوری ریوارڈ پوائنٹس حاصل کریں۔
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 2 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 3: CHAPTER 1: KIOSK ARCHITECTURE & SMART DEPOSITORY                   -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">CHAPTER 1: SYSTEM OVERVIEW</div>
  </div>

  <h2 class="section-title">1. System Overview & Depository Architecture</h2>
  <div class="section-subtitle">Understanding the PecoDrop Kiosk external interface, smart deposit chute, and sensing capabilities.</div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 2mm;">
    <div>
      <h3 style="font-size: 9pt; font-weight: 800; color: #073B28; margin-bottom: 5px;">Depository Anatomy & Hardware Components</h3>
      <p style="font-size: 7.8pt; color: #334155; line-height: 1.45; margin-bottom: 6px;">
        The <b>PecoDrop Kiosk</b> is engineered for high-throughput citizen recycling. It features a rugged industrial chassis, an ultra-responsive multi-sensor chamber, and a motorized intake hatch that provides active anti-cheat protection.
      </p>

      <table class="table-clean">
        <tr><th>Component</th><th>Function & Specification</th></tr>
        <tr><td><b>Intake Chute</b></td><td>Circular illuminated opening (Ø 125mm) with internal optical safety barrier.</td></tr>
        <tr><td><b>Material Sensors</b></td><td>Inductive metal sensor (cans) + Ultrasonic height/depth profiler (bottles/tetras).</td></tr>
        <tr><td><b>Servo Drop Flap</b></td><td>Motorized 180° swing flap that validates weight and drops accepted containers.</td></tr>
        <tr><td><b>Dual Display Modes</b></td><td>Supports Portrait (62/38 split) and Landscape (0.85/1.15 split) display orientations.</td></tr>
        <tr><td><b>Keypad & QR Engine</b></td><td>12-key tactile matrix alongside dynamic SVG QR engine for 100% touchless flow.</td></tr>
      </table>
    </div>

    <div>
      <h3 style="font-size: 9pt; font-weight: 800; color: #073B28; margin-bottom: 5px;">Accepted Multi-Material Containers</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #15803D; font-size: 8pt; margin-bottom: 2px;">🧴 1. Plastic PET Bottles (پلاسٹک کی بوتلیں)</div>
          <div style="font-size: 7.2pt; color: #166534; line-height: 1.35;">Water, soft drink, and juice bottles from 250ml to 2.5 Liters. Must be empty with intact readable barcode label.</div>
        </div>
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #1E40AF; font-size: 8pt; margin-bottom: 2px;">🥫 2. Aluminum Beverage Cans (مشروبات کے کین)</div>
          <div style="font-size: 7.2pt; color: #1E3A8A; line-height: 1.35;">Standard 250ml, 330ml, and 500ml beverage cans. Detected via inductive metal sensors. Must not be heavily crushed.</div>
        </div>
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #B45309; font-size: 8pt; margin-bottom: 2px;">🧃 3. Tetra Pak Cartons (ٹیٹرا پیک ڈبے)</div>
          <div style="font-size: 7.2pt; color: #92400E; line-height: 1.35;">Flavored milk and fruit juice cartons. Classified via geometric volume and ultrasonic depth measurements.</div>
        </div>
      </div>

      <div class="alert-box" style="margin-top: 8px;">
        <b>⚠️ Prohibited Items:</b> Glass bottles, liquid-filled containers, aerosol spray cans, and general trash will be instantly rejected by the optical classifier.
      </div>
    </div>
  </div>

  <div class="instruction-box" style="margin-top: 5mm;">
    <div class="instruction-en"><b>Smart Safety Note:</b> The machine entrance servo flap automatically locks if hands or foreign objects remain inside the chute. Never insert hands past the protective rim.</div>
    <div class="instruction-urdu"><b>حفاظتی نوٹ:</b> بوتل ڈالتے وقت ہاتھ مشین کے اندر مت داخل کریں۔ کسی بھی ہنگامی صورت میں مشین کا خودکار حفاظتی نظام کام روک دیتا ہے۔</div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 3 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 4: CHAPTER 2: PORTRAIT KIOSK DASHBOARD & SIGNAGE                      -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">CHAPTER 2: PORTRAIT KIOSK DASHBOARD</div>
  </div>

  <h2 class="section-title">2. Welcome Screen & Citizen Dashboard</h2>
  <div class="section-subtitle">Real-time diagnostics, dynamic touchless QR start card, and digital signage presentation.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_home}" alt="PecoDrop Portrait Home Screen" />
    </div>

    <div class="step-details">
      <div class="step-badge">FIGURE 4.1 • PORTRAIT DISPLAY INTERFACE</div>
      <div class="instruction-box">
        <div class="instruction-en">
          The main standby screen greets citizens with real-time hardware health, an animated deposit guide, dynamic start QR code, and public eco-signage.
        </div>
        <div class="instruction-urdu">
          اسکرین پر خوش آمدید کا پیغام، مشین کی حالت اور سیشن شروع کرنے کے لیے کیو آر کوڈ اور بٹن کا آپشن موجود ہے۔
        </div>
      </div>

      <div class="rules-card">
        <h4>🖥️ Interactive Screen Zones (62% / 38% Dual Split)</h4>
        <ul class="rules-list">
          <li><b>Top Diagnostics Bar:</b> Shows live machine status (<code>MACHINE: READY 🟢</code>, <code>HARDWARE: COM7 🟢</code>, <code>DB: OK 🟢</code>, <code>API: ONLINE 🟢</code>).</li>
          <li><b>Touchless QR Start Card:</b> Large dynamic QR code (<code>SCAN TO START / اسکین کریں</code>) for instant contactless session startup via the PecoDrop Mobile App.</li>
          <li><b>Tactile Start Button:</b> Key <code>0</code> on the physical keypad allows tactile start without a smartphone.</li>
          <li><b>Live Recycling Counter:</b> Displays today's total recycled units and cumulative eco-points distributed to citizens.</li>
          <li><b>Bottom 38% Signage Area:</b> Seamlessly plays environmental awareness videos, public service campaigns, and sponsor broadcasts.</li>
        </ul>
      </div>

      <table class="table-clean" style="margin-top: 4px;">
        <tr><th>Diagnostic Indicator</th><th>Operational Meaning</th></tr>
        <tr><td><code>MACHINE: READY 🟢</code></td><td>Chute door unlocked, intake motors armed, system ready for deposit.</td></tr>
        <tr><td><code>HARDWARE: COM7 🟢</code></td><td>Microcontroller sensors, IR beams, and servos communicating at 9600 baud.</td></tr>
        <tr><td><code>DB: OK 🟢</code></td><td>Local database operational, offline failover buffer active.</td></tr>
        <tr><td><code>API: ONLINE 🟢</code></td><td>Connected to Central Cloud at <code>isprvm.binishaqsoft.com</code> for instant points sync.</td></tr>
      </table>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 4 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 5: CHAPTER 2: 1-MINUTE INACTIVITY IDLE SCREEN                         -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">CHAPTER 2: 1-MIN IDLE EXPANSION</div>
  </div>

  <h2 class="section-title">2. 1-Minute Inactivity Idle Screen</h2>
  <div class="section-subtitle">Automatic power management, 50% promotional expansion, and instant touchless wake-up.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_idle}" alt="PecoDrop 1-Minute Idle Screen" />
    </div>

    <div class="step-details">
      <div class="step-badge">FIGURE 5.1 • EXPANDED IDLE STATE</div>
      <div class="instruction-box">
        <div class="instruction-en">
          When inactive for 60 seconds, the kiosk automatically transitions into an energy-efficient expanded instructional display.
        </div>
        <div class="instruction-urdu">
          ایک منٹ تک استعمال نہ ہونے پر اسکرین خودکار طریقے سے تعلیمی ویڈیو اور اشہارات کو بڑا کر دیتی ہے۔
        </div>
      </div>

      <div class="rules-card">
        <h4>⚙️ Idle Mode Architecture & Behaviors</h4>
        <ul class="rules-list">
          <li><b>50% Height Expansion:</b> The promotional and instructional video window expands to 50% screen height to capture passerby attention.</li>
          <li><b>Instant Touchless Wake-Up:</b> Scanning the floating on-screen QR code with your mobile app instantly wakes the kiosk and unlocks the session.</li>
          <li><b>Hardware Wake-Up:</b> Pressing tactile Key <code>0</code> or approaching within sensor range immediately restores the active deposit UI.</li>
          <li><b>Eco-Power Saver:</b> Chute illumination dims to standby levels to conserve electrical energy while maintaining sensor readiness.</li>
        </ul>
      </div>

      <div class="hardware-note">
        <b>💡 Citizen Convenience Tip:</b> You do not need to wait for the video to finish. Simply scan the QR code with your phone camera or PecoDrop App, and the machine will instantly return to the active deposit screen.
      </div>

      <div class="instruction-box" style="margin-top: 6px;">
        <div class="instruction-urdu" style="font-size: 11pt;">
          <b>فوری بیداری کا طریقہ:</b> جیسے ہی آپ اپنا فون اسکرین کے کیو آر کوڈ کے سامنے لائیں گے، مشین فوری طور پر بوتلیں جمع کرنے کے لیے تیار ہو جائے گی۔
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 5 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 6: CHAPTER 3 STEP 1: HYBRID SESSION INITIATION                        -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">STEP 1: SESSION INITIATION</div>
  </div>

  <h2 class="section-title">Step 1: Session Initiation (Touchless QR or Keypad)</h2>
  <div class="section-subtitle">Choose between 100% contactless mobile app interaction or tactile hardware keypad start.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_step01}" alt="Step 1 Session Initiation" />
    </div>

    <div class="step-details">
      <div class="step-badge">STEP 1 OF 7 • INITIATION MODES</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: #F0FDF4; border: 1.5px solid #22C55E; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #15803D; font-size: 8pt; margin-bottom: 3px;">📱 MODE A: TOUCHLESS QR SCAN</div>
          <div style="font-size: 7.2pt; color: #166534; line-height: 1.35;">
            1. Open PecoDrop Mobile App on your phone.<br>
            2. Point your camera at the on-screen <code>SCAN TO START</code> QR code.<br>
            3. Kiosk beeps, links your profile, and unlocks the deposit door instantly.
          </div>
        </div>
        <div style="background: #EFF6FF; border: 1.5px solid #3B82F6; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #1E40AF; font-size: 8pt; margin-bottom: 3px;">🔢 MODE B: TACTILE KEYPAD '0'</div>
          <div style="font-size: 7.2pt; color: #1E3A8A; line-height: 1.35;">
            1. Stand in front of the kiosk.<br>
            2. Press Key <code>0</code> on the rugged metallic keypad.<br>
            3. Chute lights green and session timer begins for guest recycling.
          </div>
        </div>
      </div>

      <div class="instruction-box" style="margin-top: 6px;">
        <div class="instruction-en">
          <b>Session Lock & Security:</b> Once a session is initiated, the kiosk is exclusively bound to the depositor. Other inputs are temporarily locked until the session completes.
        </div>
        <div class="instruction-urdu">
          <b>سیشن کا آغاز:</b> جب سیشن شروع ہوتا ہے تو مشین کا دروازہ کھل جاتا ہے اور اسکرین پر بوتل ڈالنے کی ہدایات ظاہر ہوتی ہیں۔
        </div>
      </div>

      <div class="rules-card">
        <h4>📋 Session Rules & Safety Checks</h4>
        <ul class="rules-list">
          <li><b>Session Timeout:</b> Each deposit step gives 60 seconds before auto-closing. Inserting an item resets the timer.</li>
          <li><b>Door Indicator:</b> The LED halo around the intake chute transitions from Pulsing Amber to Solid Emerald Green.</li>
          <li><b>Cancellation:</b> Press Key <code>*</code> (Cancel) anytime before inserting bottles to end the session safely.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 6 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 7: CHAPTER 3 STEP 2: CONTAINER INSERTION & MULTI-MATERIAL SIZING     -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">STEP 2: CONTAINER INSERTION</div>
  </div>

  <h2 class="section-title">Step 2: Container Insertion & Multi-Material Sizing</h2>
  <div class="section-subtitle">Proper orientation, material classification rules, and sensor sizing detection.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_step02}" alt="Step 2 Container Insertion" />
    </div>

    <div class="step-details">
      <div class="step-badge">STEP 2 OF 7 • INSERTION GUIDE</div>
      <div class="instruction-box">
        <div class="instruction-en">
          Insert your container <b>bottom first</b> into the illuminated chute with the barcode facing upward. Keep hands outside the safety zone.
        </div>
        <div class="instruction-urdu">
          بوتل یا کین کو نچلے حصے کی طرف سے اندر ڈالیں تاکہ بارکوڈ کیمرے کے سامنے آئے۔
        </div>
      </div>

      <div class="rules-card">
        <h4>📐 Multi-Material Acceptance Guidelines</h4>
        <table class="table-clean">
          <tr><th>Container Type</th><th>Acceptance Criteria</th><th>Reward</th></tr>
          <tr>
            <td><b>PET Bottle (Small)</b></td>
            <td>250ml – 500ml, empty, cap on/off, label readable.</td>
            <td><b>+5 Points</b></td>
          </tr>
          <tr>
            <td><b>PET Bottle (Large)</b></td>
            <td>1.0L – 2.5L, clean, barcode intact.</td>
            <td><b>+10 Points</b></td>
          </tr>
          <tr>
            <td><b>Aluminum Can</b></td>
            <td>250ml – 500ml beverage can, not flattened.</td>
            <td><b>+15 Points</b></td>
          </tr>
          <tr>
            <td><b>Tetra Pak Carton</b></td>
            <td>200ml – 1000ml juice/milk carton, straw removed.</td>
            <td><b>+8 Points</b></td>
          </tr>
        </table>
      </div>

      <div class="alert-box">
        <b>⚠️ Avoid Rejection:</b> Ensure containers are completely drained of liquids. Residual liquids trigger weight imbalance sensors and will cause immediate ejection.
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 7 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 8: CHAPTER 3 STEP 3: SENSING STATES & DANCING FEEDBACK               -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">STEP 3: SENSING & FEEDBACK</div>
  </div>

  <h2 class="section-title">Step 3: Interactive Sensing States & Overlays</h2>
  <div class="section-subtitle">Real-time classification, audio-visual feedback, and animated celebration characters.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_accepted}" alt="Step 3 Accepted Overlay" />
    </div>

    <div class="step-details">
      <div class="step-badge">STEP 3 OF 7 • SENSING & FEEDBACK</div>
      <div class="instruction-box">
        <div class="instruction-en">
          The kiosk triggers high-speed optical scanning and displays delightful animated characters celebrating your eco-contribution.
        </div>
        <div class="instruction-urdu">
          بوتل کی کامیاب جانچ پر اسکرین پر خوشگوار اینیمیشن اور پوائنٹس کا اضافہ دکھائی دیتا ہے۔
        </div>
      </div>

      <div class="rules-card">
        <h4>🎭 Exclusive PecoDrop Animated Feedback</h4>
        <ul class="rules-list">
          <li><b>DancingPlastic (پلاسٹک رقص):</b> An energetic green plastic character pops up celebrating successful bottle deposit.</li>
          <li><b>DancingCan (کین اینیمیشن):</b> A vibrant metallic character dancing to celebrate metal recycling.</li>
          <li><b>DancingTetra (ٹیٹرا اینیمیشن):</b> A friendly juice box character congratulating the citizen.</li>
          <li><b>Audio Confirmation:</b> A clean, pleasant chime confirms successful acceptance, followed by an Urdu voice prompt: <i>"شکریہ! آپ کے پوائنٹس شامل کر دیے گئے ہیں"</i>.</li>
        </ul>
      </div>

      <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 8px 10px; margin-top: 4px;">
        <div style="font-weight: 800; color: #991B1B; font-size: 8pt; margin-bottom: 2px;">❌ Rejection Overlay (مسترد ہونے کی صورت میں)</div>
        <div style="font-size: 7.2pt; color: #7F1D1D; line-height: 1.35;">
          If an unaccepted item (glass, paper cup, crushed can) is inserted, the chute lights pulse red, the screen displays a warning overlay, and the item is safely returned.
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 8 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 9: CHAPTER 3 STEP 4: DROP CONFIRMATION & ANTI-CHEAT SAFEGUARDS       -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">STEP 4: DROP CONFIRMATION</div>
  </div>

  <h2 class="section-title">Step 4: Drop Confirmation & Anti-Cheat Validation</h2>
  <div class="section-subtitle">Motorized 180° servo gate actuation, optical trap door, and fraud prevention.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_success}" alt="Step 4 Drop Confirmation" />
    </div>

    <div class="step-details">
      <div class="step-badge">STEP 4 OF 7 • DROP GATE ACTION</div>
      <div class="instruction-box">
        <div class="instruction-en">
          Once verified, the motorized servo gate swings downward 180°, dropping the container into the internal collection bin while secondary optic beams confirm transit.
        </div>
        <div class="instruction-urdu">
          تصدیق کے بعد اندرونی گیٹ کھلتا ہے اور بوتل خودکار طریقے سے محفوظ اسٹوریج میں چلی جاتی ہے۔
        </div>
      </div>

      <div class="rules-card">
        <h4>🛡️ Anti-Cheat & Tamper Prevention Safeguards</h4>
        <ul class="rules-list">
          <li><b>Anti-Fish Barrier:</b> A dual-tooth mechanical barrier prevents retrieving bottles with attached strings or wires.</li>
          <li><b>Secondary Optic Gate:</b> Bottom optical receivers verify that the bottle fully passed into the bin before crediting points.</li>
          <li><b>Servo Torque Limiting:</b> If resistance is detected during gate movement, the servo reverses instantly for safety.</li>
          <li><b>Continuous Deposit:</b> Citizens can immediately insert their next bottle without pressing any buttons.</li>
        </ul>
      </div>

      <div class="hardware-note">
        <b>Session Tally Counter:</b> The top right of the screen updates in real time, showing:
        <br>• Total Bottles: <b>4</b> | Total Cans: <b>2</b> | Total Tetra: <b>1</b> | Earned Points: <b>58</b>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 9 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 10: CHAPTER 3 STEPS 5 & 6: TOUCHLESS QR WALLET SCAN & SYNC            -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">STEPS 5 & 6: WALLET SYNC & CLAIM</div>
  </div>

  <h2 class="section-title">Steps 5 & 6: Touchless QR Wallet Scan & Reward Sync</h2>
  <div class="section-subtitle">Real-time reward tally, instant mobile QR claim, or 11-digit keypad entry fallback.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_wallet}" alt="Steps 5 and 6 Wallet Sync" />
    </div>

    <div class="step-details">
      <div class="step-badge">STEPS 5 & 6 OF 7 • CLAIM REWARDS</div>
      <div class="instruction-box">
        <div class="instruction-en">
          Press <b>FINISH / ختم کریں</b> (Key '#') to generate your dynamic reward claim QR code on screen.
        </div>
        <div class="instruction-urdu">
          پوائنٹس وصول کرنے کے لیے اسکرین پر ظاہر ہونے والے کیو آر کوڈ کو اپنے فون سے اسکین کریں۔
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: #F0FDF4; border: 1.5px solid #22C55E; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #15803D; font-size: 8pt; margin-bottom: 2px;">⚡ TOUCHLESS CLAIM (RECOMMENDED)</div>
          <div style="font-size: 7.2pt; color: #166534; line-height: 1.35;">
            1. Open PecoDrop App Wallet screen.<br>
            2. Scan the dynamic on-screen session QR.<br>
            3. Points transfer instantly to your citizen balance with instant push notification.
          </div>
        </div>
        <div style="background: #EFF6FF; border: 1.5px solid #3B82F6; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 800; color: #1E40AF; font-size: 8pt; margin-bottom: 2px;">📱 PHONE KEYPAD FALLBACK</div>
          <div style="font-size: 7.2pt; color: #1E3A8A; line-height: 1.35;">
            1. Enter your 11-digit mobile number (e.g. <code>03001234567</code>) on the physical keypad.<br>
            2. Press <code>#</code> to confirm.<br>
            3. SMS receipt is sent with your point balance.
          </div>
        </div>
      </div>

      <div class="rules-card" style="margin-top: 4px;">
        <h4>🎁 Reward Redemption Ecosystem</h4>
        <ul class="rules-list">
          <li><b>Utility Bill Discounts:</b> Redeem points for electricity, gas, or municipal water credits.</li>
          <li><b>Public Transport Vouchers:</b> Convert points to Metrobus and Orange Line transit passes.</li>
          <li><b>Eco-Store Coupons:</b> Get food and grocery discount coupons at partner retail outlets.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 10 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 11: CHAPTER 3 STEP 7: CITIZEN RATING & FEEDBACK                       -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">STEP 7: CITIZEN FEEDBACK & RATING</div>
  </div>

  <h2 class="section-title">Step 7: Citizen Rating & Session Complete</h2>
  <div class="section-subtitle">5-star citizen satisfaction rating, municipal service telemetry, and auto-reset.</div>

  <div class="step-screen-layout">
    <div class="snapshot-frame">
      <img class="snapshot-img" src="{img_feedback}" alt="Step 7 Feedback and Rating" />
    </div>

    <div class="step-details">
      <div class="step-badge">STEP 7 OF 7 • SERVICE RATING</div>
      <div class="instruction-box">
        <div class="instruction-en">
          Help us improve municipal recycling! Select your rating from <b>1 to 5 Stars</b> using the keypad or on-screen touch.
        </div>
        <div class="instruction-urdu">
          اپنی رائے کا اظہار کریں: کی پیڈ سے ۱ سے ۵ کا ہندسہ دبا کر سروس کا جائزہ لیں۔
        </div>
      </div>

      <div class="rules-card">
        <h4>⭐ Star Rating Keypad Shortcuts</h4>
        <table class="table-clean">
          <tr><th>Keypad Input</th><th>Rating Equivalent</th><th>Citizen Sentiment</th></tr>
          <tr><td><b>Key 5</b></td><td>⭐⭐⭐⭐⭐</td><td>Outstanding Service (بہترین)</td></tr>
          <tr><td><b>Key 4</b></td><td>⭐⭐⭐⭐</td><td>Good Experience (بہت اچھا)</td></tr>
          <tr><td><b>Key 3</b></td><td>⭐⭐⭐</td><td>Satisfactory (تسلی بخش)</td></tr>
          <tr><td><b>Key 2</b></td><td>⭐⭐</td><td>Needs Improvement (بہتری کی ضرورت)</td></tr>
          <tr><td><b>Key 1</b></td><td>⭐</td><td>Unsatisfactory (غیر تسلی بخش)</td></tr>
        </table>
      </div>

      <div class="hardware-note">
        <b>Auto-Reset Sequence:</b> After selecting a rating or after 10 seconds of inactivity, the kiosk displays a green checkmark thank you screen, flushes cache, and resets back to the Welcome Dashboard for the next citizen.
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 11 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 12: CHAPTER 4: EXCLUSIVE PECODROP 1.15X ECO LEADERBOARD               -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">CHAPTER 4: EXCLUSIVE PECODROP LEADERBOARD</div>
  </div>

  <h2 class="section-title">4. Exclusive PecoDrop 1.15x Eco Leaderboard</h2>
  <div class="section-subtitle">Wide-format landscape split screen featuring the expanded live citizen ranking engine.</div>

  <div class="landscape-preview-frame">
    <img class="landscape-preview-img" src="{img_landscape}" alt="PecoDrop Landscape Mode with 1.15x Leaderboard" />
  </div>

  <div style="font-size: 7.5pt; font-weight: 800; color: #073B28; text-align: center; margin-bottom: 2mm;">
    FIGURE 12.1 • PECODROP DUAL-ZONE LANDSCAPE KIOSK INTERFACE (LIVE CAPTURE)
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 12px;">
      <h4 style="font-size: 8.5pt; font-weight: 800; color: #073B28; margin-bottom: 4px;">
        👈 Left Column (0.85x Width): Kiosk Centerpiece
      </h4>
      <ul class="rules-list">
        <li><b>High-Definition Instructional Video:</b> Continuous looping instructional animation demonstrating the perfect bottle, can, and tetra insertion.</li>
        <li><b>Live Session Tally:</b> Compact live counter showing items inserted, current points accumulated, and session countdown timer.</li>
        <li><b>Hardware Diagnostics:</b> Live telemetry showing COM7 Arduino link, SQL Server health, and cloud sync status.</li>
      </ul>
    </div>

    <div style="background: #F0FDF4; border: 1.5px solid #22C55E; border-radius: 8px; padding: 10px 12px;">
      <h4 style="font-size: 8.5pt; font-weight: 800; color: #15803D; margin-bottom: 4px;">
        👉 Right Column (1.15x Width): Expanded Leaderboard
      </h4>
      <ul class="rules-list">
        <li><b>Top Citizen Recyclers:</b> Live ranking table displaying the city's premier recycling champions with real-time score updates.</li>
        <li><b>Custom Avatars:</b> High-resolution citizen avatars (<code>avatar1</code> to <code>avatar5</code>) bringing rich gamification to public spaces.</li>
        <li><b>Points & Trophy Badges:</b> Highlights gold, silver, and bronze badges alongside total bottles recycled this month.</li>
        <li><b>Community Impact:</b> Live stats showing total CO₂ offset and trees saved by the Katra Neem Wala community.</li>
      </ul>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 12 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 13: CHAPTER 5: HARDWARE MATRIX & KEYPAD CONTROLS                      -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">CHAPTER 5: HARDWARE INPUT MATRIX</div>
  </div>

  <h2 class="section-title">5. Hardware Keypad & Touchless Input Matrix</h2>
  <div class="section-subtitle">Comprehensive mapping of physical buttons, phone shortcuts, and touchless equivalents.</div>

  <table class="table-clean" style="margin-top: 2mm;">
    <tr>
      <th style="width: 15%;">Input Element</th>
      <th style="width: 25%;">Screen State / Screen Mode</th>
      <th style="width: 35%;">Action Triggered</th>
      <th style="width: 25%;">Touchless Alternative</th>
    </tr>
    <tr>
      <td><b>Key '0'</b></td>
      <td>Home / 1-Min Idle Screen</td>
      <td>Initiates a new recycling session. Wakes machine from idle power save.</td>
      <td>Scan on-screen QR Code.</td>
    </tr>
    <tr>
      <td><b>Keys 1 – 9</b></td>
      <td>Feedback / Rating Screen</td>
      <td>Submits citizen satisfaction rating (1 = Unsatisfactory, 5 = Outstanding).</td>
      <td>Tap rating star on screen.</td>
    </tr>
    <tr>
      <td><b>Keys 0 – 9</b></td>
      <td>Wallet Phone Number Screen</td>
      <td>Enters citizen's 11-digit mobile phone number (03XXXXXXXXX).</td>
      <td>Scan dynamic wallet QR.</td>
    </tr>
    <tr>
      <td><b>Key '#' (Enter)</b></td>
      <td>Active Deposit Session</td>
      <td>Finalizes the deposit phase and proceeds to points reward screen.</td>
      <td>Tap 'Finish' button.</td>
    </tr>
    <tr>
      <td><b>Key '#' (Enter)</b></td>
      <td>Phone Entry Screen</td>
      <td>Confirms mobile number and submits points to central wallet.</td>
      <td>Auto-submits on 11 digits.</td>
    </tr>
    <tr>
      <td><b>Key '*' (Clear)</b></td>
      <td>Phone Entry Screen</td>
      <td>Deletes the last typed digit (Backspace function).</td>
      <td>Tap 'Clear' on display.</td>
    </tr>
    <tr>
      <td><b>Key '*' (Cancel)</b></td>
      <td>Active Deposit (0 items)</td>
      <td>Cancels the session and returns kiosk to Welcome Dashboard.</td>
      <td>Auto-cancels in 60 seconds.</td>
    </tr>
    <tr>
      <td><b>Intake Light</b></td>
      <td>All Operation Modes</td>
      <td>Green = Ready to Insert | Amber = Sizing | Red = Reject/Locked.</td>
      <td>On-screen visual cues.</td>
    </tr>
  </table>

  <div style="margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div class="rules-card">
      <h4>⌨️ Physical Keypad Specifications</h4>
      <ul class="rules-list">
        <li><b>Material:</b> Vandal-proof stainless steel with engraved high-contrast numerals.</li>
        <li><b>Feedback:</b> Tactile click with electronic audio beep upon every valid keypress.</li>
        <li><b>Ingress Protection:</b> IP65 weather-sealed against rain, dust, and humidity.</li>
      </ul>
    </div>
    <div class="rules-card">
      <h4>📶 Touchless QR Sensor Specifications</h4>
      <ul class="rules-list">
        <li><b>Dynamic Generation:</b> QR codes refresh every session with cryptographic timestamp.</li>
        <li><b>Resolution:</b> High-contrast SVG rendering legible by all mobile cameras up to 2 meters.</li>
        <li><b>Zero Contact:</b> Complete session can be performed without touching any surface.</li>
      </ul>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 13 of 14</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 14: CHAPTER 6: CITIZEN FAQ & TROUBLESHOOTING                          -->
<!-- ========================================================================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="badge-app">PECO-2026</span>
      <span class="header-title">PECO-DROP KIOSK • CITIZEN OPERATION MANUAL</span>
    </div>
    <div class="header-right">CHAPTER 6: CITIZEN FAQ & TROUBLESHOOTING</div>
  </div>

  <h2 class="section-title">6. Citizen FAQ & Troubleshooting</h2>
  <div class="section-subtitle">Answers to common recycling questions, error recovery, and citizen support helpline.</div>

  <div style="display: flex; flex-direction: column; gap: 7px; margin-top: 2mm;">
    <div style="background: #F8FAFC; border-left: 3px solid #073B28; padding: 6px 10px; border-radius: 0 6px 6px 0;">
      <div style="font-weight: 800; font-size: 8pt; color: #073B28;">Q1: Why did the machine reject my plastic bottle? (میری بوتل مسترد کیوں ہوئی؟)</div>
      <div style="font-size: 7.3pt; color: #334155; line-height: 1.35; margin-top: 2px;">
        <b>Answer:</b> Common reasons include: (1) Residual liquid remaining inside, (2) Torn or missing barcode label, (3) Bottle heavily squashed or crumpled. Empty any liquid, reshape the bottle, and insert bottom-first.
      </div>
    </div>

    <div style="background: #F8FAFC; border-left: 3px solid #073B28; padding: 6px 10px; border-radius: 0 6px 6px 0;">
      <div style="font-weight: 800; font-size: 8pt; color: #073B28;">Q2: Can I recycle beverage cans and tetra paks in PecoDrop?</div>
      <div style="font-size: 7.3pt; color: #334155; line-height: 1.35; margin-top: 2px;">
        <b>Answer:</b> Yes! Unlike basic reverse vending machines, PecoDrop features multi-material classification supporting Aluminum Cans (+15 points) and Tetra Pak juice cartons (+8 points) alongside PET bottles (+5 to +10 points).
      </div>
    </div>

    <div style="background: #F8FAFC; border-left: 3px solid #073B28; padding: 6px 10px; border-radius: 0 6px 6px 0;">
      <div style="font-weight: 800; font-size: 8pt; color: #073B28;">Q3: What if I don't have a smartphone or the mobile app?</div>
      <div style="font-size: 7.3pt; color: #334155; line-height: 1.35; margin-top: 2px;">
        <b>Answer:</b> You do not need a smartphone! Start the session by pressing Key '0' on the keypad. When finished, enter your 11-digit mobile phone number on the keypad. Your reward points will be credited via SMS.
      </div>
    </div>

    <div style="background: #F8FAFC; border-left: 3px solid #073B28; padding: 6px 10px; border-radius: 0 6px 6px 0;">
      <div style="font-weight: 800; font-size: 8pt; color: #073B28;">Q4: What happens if the internet goes offline during my deposit?</div>
      <div style="font-size: 7.3pt; color: #334155; line-height: 1.35; margin-top: 2px;">
        <b>Answer:</b> PecoDrop is equipped with offline failover. All points are securely stored in the local SQL Server database. As soon as the network reconnects, your points automatically sync to your cloud wallet.
      </div>
    </div>

    <div style="background: #F8FAFC; border-left: 3px solid #073B28; padding: 6px 10px; border-radius: 0 6px 6px 0;">
      <div style="font-weight: 800; font-size: 8pt; color: #073B28;">Q5: How do I get featured on the 1.15x Eco Leaderboard?</div>
      <div style="font-size: 7.3pt; color: #334155; line-height: 1.35; margin-top: 2px;">
        <b>Answer:</b> Register your profile in the PecoDrop Mobile App, link your custom avatar, and deposit consistently. The city's top 5 recyclers are featured live on the kiosk's right-hand landscape screen!
      </div>
    </div>
  </div>

  <div style="margin-top: 4mm; background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-weight: 800; font-size: 8.5pt; color: #065F46;">📞 Citizen Support & Assistance Helpline</div>
      <div style="font-size: 7.5pt; color: #047857; margin-top: 1px;">Operating 24/7 for citizen inquiries, feedback, and machine maintenance requests.</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11pt; font-weight: 900; color: #065F46;">0800-RECYCLE (73292)</div>
      <div style="font-size: 7pt; color: #047857;">support@isprvm.binishaqsoft.com</div>
    </div>
  </div>

  <div class="page-footer">
    <div>PecoDrop Kiosk Citizen Manual • Version 3.5</div>
    <div class="footer-right">Page 14 of 14</div>
  </div>
</div>

</body>
</html>"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[GENERATED] PecoDrop User Manual HTML: {html_path}")
    return True

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    snapshots_dir = os.path.join(base_dir, "snapshots")

    html_file = os.path.join(base_dir, "PecoDrop_Kiosk_User_Manual.html")
    pdf_file = os.path.join(base_dir, "PecoDrop_Kiosk_User_Manual.pdf")

    print("=" * 70)
    print("GENERATING PECODROP KIOSK CITIZEN OPERATION MANUAL (PDF & HTML)")
    print("=" * 70)

    generate_pecodrop_user_manual_html(html_file, snapshots_dir)
    print_to_pdf(html_file, pdf_file)
    print("=" * 70)
    print("PECODROP MANUAL GENERATION COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    main()
