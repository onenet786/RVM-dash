import os
import base64
import subprocess

def get_base64_img(img_path):
    if not os.path.exists(img_path):
        return ""
    with open(img_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    ext = os.path.splitext(img_path)[1].lower().replace(".", "")
    mime = "image/png" if ext == "png" else "image/jpeg"
    return f"data:{mime};base64,{data}"

def generate_printable_html(html_path, snapshots_dir):
    # Prepare base64 images
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

    # Prepare ISP Logo
    isp_src = os.path.join(snapshots_dir, "isp.jpg")
    isp_cropped = os.path.join(snapshots_dir, "isp_logo.png")
    if os.path.exists(isp_src):
        try:
            from PIL import Image, ImageChops, ImageOps
            im = Image.open(isp_src)
            im = ImageOps.exif_transpose(im).convert("RGB")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            diff = ImageChops.difference(im, bg)
            bbox = diff.getbbox()
            if bbox:
                pad = 14
                crop_box = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(im.width, bbox[2]+pad), min(im.height, bbox[3]+pad))
                im.crop(crop_box).save(isp_cropped)
        except Exception as e:
            print("Auto-crop notice:", e)

    img_logo_isp = get_base64_img(isp_cropped) if os.path.exists(isp_cropped) else get_base64_img(isp_src)

    screens = [
        {
            "num": "01",
            "title": "Splash Screen",
            "urdu": "شروعاتی اسکرین اور ہارڈویئر ٹیسٹ",
            "desc": "This screen indicates that the Reverse Vending Machine (RVM) is starting up and initializing subsystems. The system automatically tests the Arduino serial COM port, verifies local SQL database connectivity, connects to the Central Master Cloud, and calibrates the ultrasonic chamber distance.",
            "action": "Citizen Action: No action required. Stand by while the machine auto-calibrates (3–5 seconds). The Home Screen will appear automatically.",
            "specs": [
                ("Serial Port", "COM3 @ 9600 Baud (Auto-Detect)"),
                ("Local Storage", "Microsoft SQL Server RVMDB"),
                ("Cloud Telemetry", "HTTPS isprvm.binishaqsoft.com"),
                ("Chamber Baseline", "25.0 cm ± 2.0 cm (Ultrasonic)")
            ],
            "highlight_key": None,
            "img": img_splash,
            "is_modal": False
        },
        {
            "num": "02",
            "title": "Home Page",
            "urdu": "مرکزی اسکرین اور طریقہ کار",
            "desc": "This is the primary standby welcome screen. Citizens are greeted with bilingual Urdu/English environmental messaging, live container intake counts, today's top community eco-champions, and cumulative environmental impact meters (CO2 & Water saved).",
            "action": "Citizen Action: Press the '0' or '*' button on the physical keypad to start recycling.",
            "specs": [
                ("Keypad Trigger", "Press '0' or '*' Key to Start"),
                ("Hardware Keypad", "Dedicated 12-Key Matrix Input"),
                ("Bilingual Display", "English + Urdu Nastaliq Type"),
                ("Community Board", "Top 5 Recyclers + Live Pulse")
            ],
            "highlight_key": "0",
            "img": img_home,
            "is_modal": False
        },
        {
            "num": "03",
            "title": "Step: 01",
            "urdu": "پہلا مرحلہ: بوتل ڈالنے کی تیاری",
            "desc": "This is the first active step of the recycling process. By pressing the '0' button on the physical keypad, the citizen indicates readiness. The motorized security gate opens, internal chamber lights turn ON, and optical sensors prepare for container entry.",
            "action": "Citizen Action: Ensure container is empty of liquid. Insert bottle or can bottom-first into the open circular aperture.",
            "specs": [
                ("Intake Gate Servo", "Rotates to 90° (Aperture Open)"),
                ("Chamber LED Ring", "Pin D13 HIGH (Bright White)"),
                ("Inactivity Timer", "30-Second Citizen Timeout"),
                ("Optical Baseline", "Ultrasonic Distance Armed")
            ],
            "highlight_key": "0",
            "img": img_step01,
            "is_modal": False
        },
        {
            "num": "04",
            "title": "Step: 02",
            "urdu": "دوسرا مرحلہ: اسکیننگ اور پیمائش",
            "desc": "The RVM is actively detecting and classifying the inserted item. The multi-sensor array reads container height via 3-tier IR beams, tests for metal conductivity via the inductive sensor, and measures exact drop length via ultrasonic acoustic bounce.",
            "action": "Citizen Action: Allow container to settle inside chamber. Press '1' on keypad or wait for automatic confirmation.",
            "specs": [
                ("Height Sizing (IR)", "Bottom (D2), Mid (D7), Top (D8)"),
                ("Inductive Metal (D5)", "Metal Can (HIGH) / Plastic (LOW)"),
                ("Ultrasonic Cones", "Pins D3/D4 (Length in cm)"),
                ("Classification Time", "< 850 ms Real-Time Response")
            ],
            "highlight_key": "1",
            "img": img_step02,
            "is_modal": False
        },
        {
            "num": "05",
            "title": "Step: 02 (Continue...)",
            "urdu": "نامنظور یا بوتل پھنس جانے کا انتباہ",
            "desc": "If no bottle or cup is inserted, if non-recyclable garbage is detected, or if a bottle containing liquid is placed inside, the machine protects itself and displays a clear advisory alert, safely opening the gate for retrieval.",
            "action": "Citizen Action: Remove the rejected item from the aperture. Insert an empty and acceptable plastic bottle or can.",
            "specs": [
                ("Liquid Rejection", "Optical refraction detects residual liquid"),
                ("Anti-Pinch Safety", "Servo gate reverses upon resistance"),
                ("Jam Timeout", "Triggers after 4.0s blocked beam"),
                ("Audit Counter", "Increments RejectedTotalCount")
            ],
            "highlight_key": None,
            "img": img_reject,
            "is_modal": False
        },
        {
            "num": "06",
            "title": "Step: 03",
            "urdu": "تیسرا مرحلہ: بوتل قبول اور پوائنٹس کا اندراج",
            "desc": "Once the insertion is complete and verified, the servo drop gate drops the item into the collection bin. The celebratory modal triggers, reward points are allocated, and live environmental metrics increment immediately.",
            "action": "Citizen Action: Insert another container for more points, OR press 'Enter' on keypad to claim your rewards.",
            "specs": [
                ("Drop Confirmation", "BOTTLE:CLEARED Ping Received"),
                ("Point Rules", "+5 S, +10 M, +15 L Points"),
                ("CO2 Ratio", "+0.15 kg CO2 Saved per container"),
                ("Water Ratio", "+0.75 L Fresh Water Saved")
            ],
            "highlight_key": "Enter",
            "img": img_accepted,
            "is_modal": True,
            "backdrop": img_home
        },
        {
            "num": "07",
            "title": "Step: 04",
            "urdu": "چوتھا مرحلہ: انعام کیلئے موبائل نمبر کا اندراج",
            "desc": "This screen prompts the citizen to enter their 11-digit Pakistani mobile phone number (03xxxxxxxxx) to receive reward points in their wallet. Upon supplying the number and pressing Enter, the citizen is immediately directed to the experience rating screen.",
            "action": "Citizen Action: Enter your 11-digit mobile number using the physical keypad, then press 'Enter' to proceed to rating and claim points.",
            "specs": [
                ("Mobile Format", "03xxxxxxxxx (Standard 11 Digits)"),
                ("Validation Regex", "^03[0-9]{9}$ (Strict Digit-Only)"),
                ("Local Ledger", "dbo.WalletAccounts Account Commit"),
                ("Next Transition", "Seamless transition to Experience Rating")
            ],
            "highlight_key": "Enter",
            "img": img_wallet,
            "is_modal": True,
            "backdrop": img_home
        },
        {
            "num": "08",
            "title": "Step: 04 (Continue...)",
            "urdu": "کامیابی: پوائنٹس اکاؤنٹ میں منتقل ہوگئے",
            "desc": "This screen confirms that the session points have been credited to the citizen's mobile wallet, recorded locally in the database, and synchronized via secure API to the Central Cloud platform.",
            "action": "Citizen Action: Review your credit confirmation and updated points balance. Proceed to customer experience rating.",
            "specs": [
                ("Cloud Endpoint", "POST /api/machine/sync-session"),
                ("Local Record", "dbo.Transactions Inserted"),
                ("Sync Flag", "IsSynced = 1 (Real-Time Cloud)"),
                ("Account Dispatch", "Real-time mobile wallet balance update")
            ],
            "highlight_key": None,
            "img": img_success,
            "is_modal": False
        },
        {
            "num": "09",
            "title": "Feedback",
            "urdu": "تجربے کی درجہ بندی اور فیڈبیک",
            "desc": "On this screen, the citizen is prompted to rate their recycling experience on an interactive 5-star scale (Very Bad to Excellent), with feedback recorded locally and pushed to central QA telemetry.",
            "action": "Citizen Action: Press a keypad digit from '1' to '5' to select your rating, then press 'Enter' to confirm (or wait for 8s auto-completion).",
            "specs": [
                ("Keypad Input", "Press '1' to '5', Enter to Confirm"),
                ("Rating Scale", "1 = Very Bad to 5 = Excellent"),
                ("Cloud Endpoint", "POST /api/machine/feedback"),
                ("Auto-Finish", "8-Second Inactivity Auto-Submit")
            ],
            "highlight_key": "5",
            "img": img_feedback,
            "is_modal": False
        },
        {
            "num": "10",
            "title": "Process Completed",
            "urdu": "عمل مکمل اور مشین کی بحالی",
            "desc": "The final acknowledgement screen thanking the citizen for their contribution to a clean and green environment. An automated 5-second countdown timer safely resets the machine for the next user.",
            "action": "Citizen Action: Process is complete! Enjoy your rewards and continue recycling for a cleaner Pakistan.",
            "specs": [
                ("Countdown Timer", "5 Seconds Auto-Reset"),
                ("Gate Security", "Aperture locked in closed state"),
                ("Session Buffer", "Flushed and ready for next user"),
                ("Signage Player", "Resumes commercial Ads loop")
            ],
            "highlight_key": None,
            "img": img_complete,
            "is_modal": False
        }
    ]

    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RVM Machine User Manual & SOP — Environmental Solutions Pvt. Ltd</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  }
  body {
    background: #FFFFFF;
    color: #0F172A;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pdf-page {
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
  }

  /* COVER PAGE */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    background: linear-gradient(180deg, #073B28 0%, #032015 100%);
    color: #FFFFFF;
    padding: 26mm 18mm;
  }
  .cover-logo-card {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 10px 18px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.4), 0 0 0 3px rgba(34, 197, 94, 0.45);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6mm;
  }
  .cover-logo-img {
    height: 85px;
    width: auto;
    object-fit: contain;
    display: block;
  }
  .cover-corp-title {
    font-size: 19px;
    font-weight: 800;
    color: #86EFAC;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .cover-main-h1 {
    font-size: 36px;
    font-weight: 900;
    line-height: 1.2;
    margin: 6mm 0;
    color: #FFFFFF;
    letter-spacing: 1px;
  }
  .cover-sub-txt {
    font-size: 14.5px;
    color: #CBD5E1;
    max-width: 155mm;
    line-height: 1.6;
  }
  .cover-metadata-card {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid #1E3A2F;
    border-radius: 12px;
    padding: 5mm 9mm;
    width: 100%;
    max-width: 160mm;
    text-align: left;
    font-size: 11px;
  }
  .cover-meta-row {
    display: flex;
    justify-content: space-between;
    padding: 3.5px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.15);
  }
  .cover-meta-row:last-child { border-bottom: none; }
  .cover-meta-lbl { color: #94A3B8; }
  .cover-meta-val { color: #38BDF8; font-weight: 700; }
  .cover-footer {
    font-size: 10.5px;
    color: #86EFAC;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* PAGE HEADER */
  .page-top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 3.5mm;
    border-bottom: 2px solid #E2E8F0;
    margin-bottom: 5mm;
  }
  .header-left-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .header-logo-pill {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 4px;
    padding: 1px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .header-logo-img {
    height: 18px;
    width: auto;
    max-width: 42px;
    object-fit: contain;
    display: block;
  }
  .header-left-guide {
    font-size: 13px;
    font-weight: 900;
    color: #073B28;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .header-right-pg {
    font-size: 13px;
    font-weight: 800;
    color: #64748B;
  }

  /* TWO-COLUMN STAGE */
  .two-col-stage {
    display: grid;
    grid-template-columns: 80mm 98mm;
    gap: 6mm;
    flex: 1;
    align-items: stretch;
  }

  /* LEFT TEXT COLUMN */
  .left-text-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .step-h-num {
    font-size: 26px;
    font-weight: 900;
    color: #073B28;
    line-height: 1.1;
    margin-bottom: 1.5mm;
  }
  .step-h-urdu {
    font-size: 15px;
    font-weight: 700;
    color: #15803D;
    direction: rtl;
    margin-bottom: 3.5mm;
  }
  .step-desc-p {
    font-size: 11.2px;
    line-height: 1.55;
    color: #334155;
    margin-bottom: 3.5mm;
  }
  .action-callout-box {
    background: #F0FDF4;
    border-left: 4px solid #16A34A;
    border-radius: 0 8px 8px 0;
    padding: 3.5mm 4mm;
    font-size: 10.2px;
    color: #14532D;
    line-height: 1.45;
    margin-bottom: 3.5mm;
  }
  .action-callout-box strong {
    color: #15803D;
    display: block;
    font-size: 9.5px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .specs-box-table {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 3mm 4mm;
    font-size: 9.8px;
  }
  .spec-row {
    display: flex;
    justify-content: space-between;
    padding: 2.8px 0;
    border-bottom: 1px dashed #E2E8F0;
  }
  .spec-row:last-child { border-bottom: none; }
  .spec-lbl { color: #64748B; }
  .spec-val { color: #0284C7; font-weight: 700; }

  /* RIGHT KIOSK FASCIA COLUMN */
  .right-fascia-col {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .kiosk-chassis-mockup {
    width: 98mm;
    background: #0F172A;
    border: 3.5px solid #334155;
    border-radius: 18px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.22);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .fascia-top-banner {
    background: #E0F2FE;
    color: #0369A1;
    padding: 2.8mm 3mm;
    text-align: center;
    border-bottom: 2px solid #BAE6FD;
  }
  .fascia-banner-h1 {
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .fascia-banner-sub {
    font-size: 7.8px;
    font-weight: 700;
    color: #0284C7;
  }

  .fascia-inner-body {
    padding: 3mm;
    display: grid;
    grid-template-columns: 29mm 58mm;
    gap: 3mm;
    background: #1E293B;
  }
  .fascia-left-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.8mm;
  }
  .apertures-pair {
    display: flex;
    gap: 2mm;
  }
  .aperture-hole {
    width: 12.5mm;
    height: 12.5mm;
    border-radius: 6.5mm;
    background: radial-gradient(circle, #050B14 40%, #1E293B 90%);
    border: 1.8px solid #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }
  .fascia-rules-box {
    background: #0F172A;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 2mm;
    font-size: 7px;
    color: #E2E8F0;
    line-height: 1.4;
    width: 100%;
  }
  .fascia-rules-box strong { color: #22C55E; }

  /* 4x4 KEYPAD */
  .keypad-matrix {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5px;
    background: #0A0F1D;
    padding: 1.5mm;
    border-radius: 5px;
    border: 1px solid #334155;
    width: 26mm;
  }
  .key-pill {
    background: #1E293B;
    color: #F8FAFC;
    border: 0.8px solid #475569;
    border-radius: 2px;
    padding: 2px 0;
    text-align: center;
    font-size: 8px;
    font-weight: 800;
  }
  .key-active {
    background: #047857;
    border-color: #10B981;
    color: #FFFFFF;
    box-shadow: 0 0 6px #10B981;
  }

  /* SCREEN DISPLAY BEZEL WITH ACTUAL SCREENSHOT */
  .screen-display-bezel {
    background: #000000;
    border: 2px solid #334155;
    border-radius: 8px;
    height: 104mm;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .screen-capture-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
    border-radius: 5px;
  }
  .backdrop-dimmed {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    filter: brightness(0.25) blur(1px);
    display: block;
  }
  .modal-overlay-img {
    position: absolute;
    width: 90%;
    max-height: 85%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8);
    border: 1.5px solid rgba(255,255,255,0.2);
  }

  .fascia-bottom-footer {
    background: #0B1320;
    padding: 2.2mm 3.2mm;
    border-top: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-isp-brand {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .fascia-isp-mini-logo {
    height: 12px;
    width: auto;
    background: #FFFFFF;
    border-radius: 2px;
    padding: 0.5px 2px;
    object-fit: contain;
    display: block;
  }
  .footer-logo-tag { font-size: 6.5px; font-weight: 800; color: #94A3B8; }
  .footer-logo-tag.green { color: #22C55E; }
  .footer-logo-tag.blue { color: #38BDF8; }
  .qr-chip-sm { background: #1E293B; border: 0.8px solid #475569; border-radius: 3px; padding: 1px 3.5px; font-size: 6px; color: #F8FAFC; }

  /* SOP PAGES STYLING */
  .sop-title-banner {
    background: #073B28;
    color: #FFFFFF;
    padding: 3.5mm 5mm;
    border-radius: 8px;
    margin-bottom: 4.5mm;
  }
  .sop-main-h { font-size: 15px; font-weight: 900; }
  .sop-sub-h { font-size: 9.5px; color: #86EFAC; }
  .sop-quad-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
    flex: 1;
  }
  .sop-card-box {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 3.5mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .sop-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 2mm;
    margin-bottom: 2mm;
  }
  .sop-id-badge { background: #073B28; color: #86EFAC; font-size: 8px; font-weight: 800; padding: 1.5px 5px; border-radius: 3px; }
  .sop-freq-tag { font-size: 8px; color: #64748B; }
  .sop-card-h2 { font-size: 10.5px; font-weight: 800; color: #0F172A; margin-bottom: 2mm; }
  .sop-item-list { list-style: none; font-size: 8.8px; line-height: 1.45; color: #334155; }
  .sop-item-list li { margin-bottom: 1.2mm; display: flex; align-items: flex-start; gap: 2mm; }
  .sop-item-list li::before { content: "✓"; color: #15803D; font-weight: 900; }

  /* MATRIX TABLE */
  .matrix-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.2px;
    margin-top: 2.5mm;
  }
  .matrix-table th {
    background: #073B28;
    color: #FFFFFF;
    padding: 2.2mm 2.8mm;
    text-align: left;
    font-weight: 800;
  }
  .matrix-table td {
    padding: 2.2mm 2.8mm;
    border-bottom: 1px solid #E2E8F0;
    color: #334155;
  }
  .matrix-table tr:nth-child(even) { background: #F8FAFC; }

  /* LANDSCAPE ARCHITECTURE PAGE */
  .landscape-showcase-box {
    background: #0F172A;
    border: 3px solid #334155;
    border-radius: 12px;
    padding: 3mm;
    margin-top: 4mm;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }
  .landscape-img-full {
    width: 100%;
    max-height: 110mm;
    object-fit: contain;
    border-radius: 6px;
    display: block;
  }
</style>
</head>
<body>

<!-- PAGE 1: COVER -->
<div class="pdf-page cover-page">
  <div style="display: flex; flex-direction: column; align-items: center;">
    <div class="cover-logo-card">
      <img src="__ISP_LOGO__" class="cover-logo-img" alt="ISP Environmental Solutions Logo" />
    </div>
    <div class="cover-corp-title">ISP Environmental Solutions Pvt. Ltd</div>
    <div class="cover-main-h1">RVM MACHINE USER MANUAL & SOP</div>
    <div class="cover-sub-txt">
      Comprehensive Reverse Vending Machine Kiosk Manual, Screen-by-Screen Citizen Walkthrough with Real-Time Snapshots, and Technical Standard Operating Procedures (SOP)
    </div>
  </div>

  <div class="cover-metadata-card">
    <div class="cover-meta-row"><span class="cover-meta-lbl">Operating Organization:</span><span class="cover-meta-val">ISP Environmental Solutions Pvt. Ltd</span></div>
    <div class="cover-meta-row"><span class="cover-meta-lbl">Project Initiative:</span><span class="cover-meta-val">EcoDrop Reverse Vending Kiosk Network</span></div>
    <div class="cover-meta-row"><span class="cover-meta-lbl">Partner Organization:</span><span class="cover-meta-val">World Bank Group — Sustainable Circular Economy</span></div>
    <div class="cover-meta-row"><span class="cover-meta-lbl">Software System:</span><span class="cover-meta-val">RVMDesktopApp (.NET 8.0 WPF / Arduino Uno)</span></div>
    <div class="cover-meta-row"><span class="cover-meta-lbl">Screen Captures:</span><span class="cover-meta-val">Actual High-Resolution WPF Application Snapshots</span></div>
    <div class="cover-meta-row"><span class="cover-meta-lbl">Document Ref ID:</span><span class="cover-meta-val">ISP-RVM-SOP-2026-V2.5</span></div>
    <div class="cover-meta-row"><span class="cover-meta-lbl">Publication Date:</span><span class="cover-meta-val">September 2026</span></div>
  </div>

  <div class="cover-footer">
    ISP Environmental Solutions Pvt. Ltd • In Partnership with World Bank Group
  </div>
</div>
"""

    # Build 10 Screen Pages
    for s in screens:
        keys = ['1','2','3','4','5','6','7','8','9','*','0','#']
        keypad_html = '<div class="keypad-matrix">'
        for k in keys:
            is_active = (k == s["highlight_key"])
            keypad_html += f'<div class="key-pill {"key-active" if is_active else ""}">{k}</div>'
        keypad_html += '</div>'

        specs_html = '<div class="specs-box-table">'
        for lbl, val in s["specs"]:
            specs_html += f'<div class="spec-row"><span class="spec-lbl">{lbl}:</span><span class="spec-val">{val}</span></div>'
        specs_html += '</div>'

        # Screen Bezel Content
        if s.get("is_modal"):
            bezel_content = f"""
              <img src="{s['backdrop']}" class="backdrop-dimmed" alt="Kiosk Standby" />
              <img src="{s['img']}" class="modal-overlay-img" alt="{s['title']} Modal" />
            """
        else:
            bezel_content = f"""
              <img src="{s['img']}" class="screen-capture-img" alt="{s['title']} Screen" />
            """

        page_html = f"""
<!-- PAGE: {s['title']} -->
<div class="pdf-page">
  <div class="page-top-header">
    <div class="header-left-brand">
      <div class="header-logo-pill">
        <img src="__ISP_LOGO__" class="header-logo-img" alt="ISP Logo" />
      </div>
      <div class="header-left-guide">RVM MACHINE USER GUIDE</div>
    </div>
    <div class="header-right-pg">page {s['num']}</div>
  </div>

  <div class="two-col-stage">
    <!-- LEFT TEXT COLUMN -->
    <div class="left-text-col">
      <div>
        <div class="step-h-num">{s['title']}</div>
        <div class="step-h-urdu">{s['urdu']}</div>
        <div class="step-desc-p">{s['desc']}</div>
      </div>

      <div>
        <div class="action-callout-box">
          <strong>Action Required:</strong>
          {s['action']}
        </div>

        {specs_html}
      </div>
    </div>

    <!-- RIGHT KIOSK FASCIA COLUMN (EMBEDDING ACTUAL SCREENSHOT) -->
    <div class="right-fascia-col">
      <div class="kiosk-chassis-mockup">
        <div class="fascia-top-banner">
          <div class="fascia-banner-h1">Recycle Plastic • Win Rewards</div>
          <div class="fascia-banner-sub">Institute of Southern Punjab (ISP) • World Bank</div>
        </div>

        <div class="fascia-inner-body">
          <div class="fascia-left-panel">
            <div class="apertures-pair">
              <div class="aperture-hole">🧴</div>
              <div class="aperture-hole">🥫</div>
            </div>

            <div class="fascia-rules-box">
              <div>1- <strong>Insert bottle</strong> one by one</div>
              <div style="margin-top:2px;">2- <strong>Enter Phone</strong> to get rewards</div>
            </div>

            {keypad_html}
          </div>

          <div class="screen-display-bezel">
            {bezel_content}
          </div>
        </div>

        <div class="fascia-bottom-footer">
          <div class="footer-isp-brand">
            <img src="__ISP_LOGO__" class="fascia-isp-mini-logo" alt="ISP" />
            <span class="footer-logo-tag green">ISP Enviro Solutions</span>
          </div>
          <div class="qr-chip-sm">📱 Scan QR</div>
          <div class="footer-logo-tag blue">🌐 WORLD BANK GROUP</div>
        </div>
      </div>
    </div>
  </div>
</div>
"""
        html += page_html

    # PAGE 12: LANDSCAPE KIOSK SHOWCASE
    html += f"""
<!-- PAGE 12: LANDSCAPE KIOSK ARCHITECTURE -->
<div class="pdf-page">
  <div class="page-top-header">
    <div class="header-left-brand">
      <div class="header-logo-pill">
        <img src="__ISP_LOGO__" class="header-logo-img" alt="ISP Logo" />
      </div>
      <div class="header-left-guide">DUAL-SCREEN &amp; LANDSCAPE KIOSK ARCHITECTURE</div>
    </div>
    <div class="header-right-pg">page 11</div>
  </div>

  <div class="sop-title-banner" style="background:#0F172A;">
    <div class="sop-main-h" style="color:#38BDF8;">LANDSCAPE KIOSK LAYOUT — RVMDesktopApp (1920 × 1080 Full HD)</div>
    <div class="sop-sub-h" style="color:#CBD5E1;">Optimized Horizontal Display: Interactive Kiosk Dashboard (Left 56%) + Digital Video Signage (Right 44%)</div>
  </div>

  <div class="landscape-showcase-box">
    <img src="{img_landscape}" class="landscape-img-full" alt="Landscape Kiosk Real Screen Capture" />
  </div>

  <div style="margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm;">
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:3.5mm; font-size:9.5px; line-height:1.5;">
      <div style="font-weight:800; color:#073B28; margin-bottom:1.5mm;">🖥️ LEFT HALF (56%): INTERACTIVE TOUCH KIOSK</div>
      <div>• Full bilingual English + Urdu Nastaliq Header with live machine diagnostics.</div>
      <div>• Circular "Insert Bottle/Can/UBC" start action button with live counter updates.</div>
      <div>• Live Session Breakdown: Plastic, Aluminium Can, UBC Cartons, and Rejected items.</div>
      <div>• Teal Glassmorphic 7-Step guide and Top 5 Recyclers community leaderboard.</div>
    </div>
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:3.5mm; font-size:9.5px; line-height:1.5;">
      <div style="font-weight:800; color:#0284C7; margin-bottom:1.5mm;">📺 RIGHT HALF (44%): DIGITAL SIGNAGE &amp; ADS</div>
      <div>• Continuous commercial video advertising loop in high-definition 1080p.</div>
      <div>• Top hero signage banner: "Small Actions Big Impact — Recycle Today".</div>
      <div>• Bottom eco sustainability footer: Reduce, Reuse, Recycle awareness slogans.</div>
      <div>• Hidden slide-out real-time serial telemetry console accessible via hotkey '8'.</div>
    </div>
  </div>
</div>
"""

    # PAGE 13: SOP PART 1
    html += """
<!-- PAGE 13: SOP PART 1 -->
<div class="pdf-page">
  <div class="page-top-header">
    <div class="header-left-brand">
      <div class="header-logo-pill">
        <img src="__ISP_LOGO__" class="header-logo-img" alt="ISP Logo" />
      </div>
      <div class="header-left-guide">STANDARD OPERATING PROCEDURES (SOP)</div>
    </div>
    <div class="header-right-pg">page 12</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 1 (OPERATIONS & MAINTENANCE)</div>
    <div class="sop-sub-h">Official Field Guidelines for Caretakers, Municipal Handlers & Technicians</div>
  </div>

  <div class="sop-quad-grid">
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-OPS-01</span>
        <span class="sop-freq-tag">Daily 07:00 AM</span>
      </div>
      <div class="sop-card-h2">Daily Morning Startup & Diagnostics</div>
      <ul class="sop-item-list">
        <li>Inspect AC 220V UPS connection and power on master rocker switch.</li>
        <li>Confirm Windows IoT executes `launch-kiosk.ps1` in portrait mode on Screen 1.</li>
        <li>Verify Diagnostics: `SERIAL: CONNECTED 🟢`, `DB: OK 🟢`, `API: ONLINE 🟢`.</li>
        <li>Execute test cycle: Insert test container and verify +10 point allocation.</li>
        <li>Log pre-flight sign-off in physical door register.</li>
      </ul>
    </div>

    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-OPS-02</span>
        <span class="sop-freq-tag">Continuous Public</span>
      </div>
      <div class="sop-card-h2">Citizen Operation & Material Rules</div>
      <ul class="sop-item-list">
        <li>Accepted: Clear & colored PET bottles, Aluminium UBC Cans, Paper cups.</li>
        <li>Prohibited: Glass, chemical/oil containers, filled liquids, crushed cans.</li>
        <li>Enforce single container feed: Insert one-by-one, base-first.</li>
        <li>Validate Pakistani mobile phone numbers (`03xxxxxxxxx` - 11 digits).</li>
        <li>Assist citizens with QR code mobile app onboarding and redemption.</li>
      </ul>
    </div>

    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-MAINT-03</span>
        <span class="sop-freq-tag">At 85% Capacity</span>
      </div>
      <div class="sop-card-h2">Storage Bin Emptying & Sensor Reset</div>
      <ul class="sop-item-list">
        <li>Type `888` + Admin PIN on keypad to pause active sessions.</li>
        <li>Unlock bottom cabinet with master key; extract full 120L trolley liner.</li>
        <li>Wipe dust from Pin D10 (Plastic IR) and D11 (Can IR) level sensor lenses.</li>
        <li>Insert fresh heavy-duty transparent collection liner; lock cabinet door.</li>
        <li>In Admin Panel Tab 4, click "Reset Bin Full Counter".</li>
      </ul>
    </div>

    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-MAINT-04</span>
        <span class="sop-freq-tag">Weekly (Friday)</span>
      </div>
      <div class="sop-card-h2">Chamber Cleaning & Calibration</div>
      <ul class="sop-item-list">
        <li>Wipe Bottom (D2), Mid (D7), Top (D8) IR lenses using 90%+ IPA wipes.</li>
        <li>Wipe inductive metal faceplate (D5); clean dust from ultrasonic cones.</li>
        <li>Lubricate servo drop flap pivot hinge with dry silicone spray.</li>
        <li>Press `33` on physical keypad to execute 20-ping baseline calibration.</li>
        <li>Verify standard 500ml PET bottle registers correctly.</li>
      </ul>
    </div>
  </div>
</div>
"""

    # PAGE 14: SOP PART 2
    html += """
<!-- PAGE 14: SOP PART 2 -->
<div class="pdf-page">
  <div class="page-top-header">
    <div class="header-left-brand">
      <div class="header-logo-pill">
        <img src="__ISP_LOGO__" class="header-logo-img" alt="ISP Logo" />
      </div>
      <div class="header-left-guide">STANDARD OPERATING PROCEDURES (SOP)</div>
    </div>
    <div class="header-right-pg">page 13</div>
  </div>

  <div class="sop-title-banner">
    <div class="sop-main-h">STANDARD OPERATING PROCEDURES — PART 2 (SYSTEM & SAFETY)</div>
    <div class="sop-sub-h">Network Resiliency, Emergency Protocols, Signage & Security</div>
  </div>

  <div class="sop-quad-grid">
    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-NET-05</span>
        <span class="sop-freq-tag">Network Failover</span>
      </div>
      <div class="sop-card-h2">Offline Resiliency & Cloud Sync</div>
      <ul class="sop-item-list">
        <li>When 4G drops, system stays 100% operational in offline caching mode.</li>
        <li>Transactions commit locally to SQL Server with flag `IsSynced = 0`.</li>
        <li>Upon network recovery, background service auto-pushes FIFO batches.</li>
        <li>Technician force override: Admin Window Tab 3 -> "Sync Pending".</li>
        <li>Confirm pending records drop to 0 after sync completes.</li>
      </ul>
    </div>

    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-SAFE-06</span>
        <span class="sop-freq-tag">Emergency Jam</span>
      </div>
      <div class="sop-card-h2">Emergency Jam Clearance & Safety</div>
      <ul class="sop-item-list">
        <li>PINCH HAZARD: Immediately press Red Mushroom Emergency Stop button.</li>
        <li>Unlock upper chamber service hatch using physical maintenance key.</li>
        <li>Using rubberized tongs or gloves, extract stuck container or debris.</li>
        <li>Inspect sensor optical pathways for scratches or physical damage.</li>
        <li>Twist and release Emergency Stop button clockwise to reboot system.</li>
      </ul>
    </div>

    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-MKT-07</span>
        <span class="sop-freq-tag">Weekly Media</span>
      </div>
      <div class="sop-card-h2">Digital Signage Video Ads Management</div>
      <ul class="sop-item-list">
        <li>Standard Format: MP4 (H.264 / AAC), 1080x720 or 1080x1920, 25/30 fps.</li>
        <li>Copy approved promotional media files into `C:\\RVM\\Ads\\` directory.</li>
        <li>Open Admin Window (`888`) -> Tab 6 (Advertisement & Video Signage).</li>
        <li>Select active videos, verify preview playback, and save playlist.</li>
        <li>Confirm seamless loop transitions on secondary signage display.</li>
      </ul>
    </div>

    <div class="sop-card-box">
      <div class="sop-card-header">
        <span class="sop-id-badge">SOP-RVM-ADMIN-08</span>
        <span class="sop-freq-tag">As Needed</span>
      </div>
      <div class="sop-card-h2">Technician Hotkeys & Threshold Tuning</div>
      <ul class="sop-item-list">
        <li>`888`: Open Admin Security PIN login prompt.</li>
        <li>`111`: Direct service mode bypass for field debugging.</li>
        <li>`33`: Trigger instant 20-sample chamber acoustic recalibration.</li>
        <li>`8`: Toggle hidden real-time serial telemetry console terminal.</li>
        <li>Adjust container sizing thresholds inside root `config.txt` file.</li>
      </ul>
    </div>
  </div>
</div>
"""

    # PAGE 15: HARDWARE PINOUT & TROUBLESHOOTING MATRIX
    html += """
<!-- PAGE 15: PINOUT & TROUBLESHOOTING -->
<div class="pdf-page">
  <div class="page-top-header">
    <div class="header-left-brand">
      <div class="header-logo-pill">
        <img src="__ISP_LOGO__" class="header-logo-img" alt="ISP Logo" />
      </div>
      <div class="header-left-guide">HARDWARE DIAGNOSTICS &amp; TROUBLESHOOTING MATRIX</div>
    </div>
    <div class="header-right-pg">page 14</div>
  </div>

  <div class="sop-title-banner" style="background:#0F172A;">
    <div class="sop-main-h" style="color:#38BDF8;">ARDUINO UNO PINOUT & RAPID TROUBLESHOOTING GUIDE</div>
    <div class="sop-sub-h" style="color:#CBD5E1;">Industrial Pin Assignments & Field Corrective Action Matrix</div>
  </div>

  <table class="matrix-table">
    <thead>
      <tr>
        <th style="width:14mm;">Pin</th>
        <th style="width:18mm;">Direction</th>
        <th style="width:48mm;">Hardware Subsystem</th>
        <th>Operational Logic & Pin Function</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>D2</td><td>INPUT</td><td>Bottom IR Photoelectric Sensor</td><td>Detects container entrance; triggers classification timer.</td></tr>
      <tr><td>D3</td><td>OUTPUT</td><td>Ultrasonic Distance Sensor (Trig)</td><td>Emits 40 kHz acoustic burst to gauge container drop speed & height.</td></tr>
      <tr><td>D4</td><td>INPUT</td><td>Ultrasonic Distance Sensor (Echo)</td><td>Measures reflected acoustic return pulse in microseconds.</td></tr>
      <tr><td>D5</td><td>INPUT</td><td>Inductive Proximity Sensor</td><td>HIGH = Aluminium Can / Metal. LOW = PET Plastic / Paper.</td></tr>
      <tr><td>D7</td><td>INPUT</td><td>Middle IR Photoelectric Sensor</td><td>Height trigger for Medium containers (> 18 cm threshold).</td></tr>
      <tr><td>D8</td><td>INPUT</td><td>Top IR Photoelectric Sensor</td><td>Height trigger for Large bottles (> 26 cm threshold).</td></tr>
      <tr><td>D9</td><td>OUTPUT</td><td>Drop Gate Servo Motor (PWM)</td><td>0° = Closed Security Gate, 90° = Drop Open into collection bin.</td></tr>
      <tr><td>D10</td><td>INPUT</td><td>Plastic Bin Level Optical Sensor</td><td>Infrared reflective sensor at rim. LOW = Storage Bin Full Alert.</td></tr>
      <tr><td>D11</td><td>INPUT</td><td>Can/Metal Bin Level Sensor</td><td>Infrared beam at metal bin rim. LOW = Storage Bin Full Alert.</td></tr>
      <tr><td>D13</td><td>OUTPUT</td><td>Internal Chamber LED Ring</td><td>Illuminates intake scanning chamber during active deposits.</td></tr>
    </tbody>
  </table>

  <div style="margin-top: 4mm; font-size: 10.5px; font-weight: 800; color: #073B28; border-bottom: 1.5px solid #073B28; padding-bottom: 1.5mm;">
    RAPID FAULT RESOLUTION MATRIX
  </div>

  <table class="matrix-table">
    <thead>
      <tr style="background:#334155;">
        <th style="width:45mm;">Symptom / Fault Code</th>
        <th style="width:45mm;">Probable Root Cause</th>
        <th>Immediate Corrective Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SERIAL: DISCONNECTED 🔴</strong><br>"HARDWARE CONNECTION ERROR"</td>
        <td>USB cable dislodged; Arduino unpowered; incorrect COM port in `config.txt`.</td>
        <td>1. Re-seat USB cable. 2. Verify COM port in Device Manager. 3. Click RETRY 🔄.</td>
      </tr>
      <tr>
        <td><strong>API: OFFLINE 🟡</strong><br>Yellow telemetry indicator</td>
        <td>4G router outage; SIM data expired; DNS resolution timeout.</td>
        <td>1. System auto-switches to offline mode; recycling continues. 2. Auto-syncs upon reconnection.</td>
      </tr>
      <tr>
        <td><strong>BIN FULL ALERT 🔴</strong><br>"Storage Bin Full - Call Operator"</td>
        <td>120L storage trolley at capacity; dust covering D10/D11 optical lenses.</td>
        <td>1. Follow SOP-03. 2. Replace collection liner. 3. Wipe lenses with IPA. 4. Reset counter in Tab 4.</td>
      </tr>
      <tr>
        <td><strong>BOTTLE STUCK / JAM ⚠️</strong><br>"Bottle stuck - Remove container"</td>
        <td>Oversized or bent container; servo gate obstruction; beam blocked > 4s.</td>
        <td>1. Follow SOP-06. 2. Press Emergency Stop. 3. Clear chamber with safety tongs.</td>
      </tr>
      <tr>
        <td><strong>INVALID PHONE NUMBER 📱</strong><br>"Must be 11 digits (03...)"</td>
        <td>User entered landline, incomplete digits, or non-numeric characters.</td>
        <td>1. Ensure number begins with 03. 2. Exactly 11 digits required (e.g. 03001234567).</td>
      </tr>
    </tbody>
  </table>
</div>

</body>
</html>
"""

    html = html.replace("__ISP_LOGO__", img_logo_isp)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated printable HTML with embedded real snapshots: {html_path}")

def print_to_pdf(html_path, pdf_path):
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

    browser_bin = edge_path if os.path.exists(edge_path) else chrome_path
    print(f"Using browser binary for PDF generation: {browser_bin}")

    cmd = [
        browser_bin,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]

    print("Running headless render command...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(pdf_path):
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        print(f"SUCCESS! Recreated Modernized PDF with Real Screen Captures: {pdf_path} ({size_mb:.2f} MB)")
        return True
    else:
        print(f"Error generating PDF. Exit code: {res.returncode}")
        print("Stderr:", res.stderr)
        return False

if __name__ == '__main__':
    base_dir = r"d:\GIT-HUB\RVM-dash\docs\rvm_desktop_app_docs"
    snapshots_dir = os.path.join(base_dir, "snapshots")
    printable_html = os.path.join(base_dir, "User_Manual_and_SOP_Printable.html")
    output_pdf = os.path.join(base_dir, "RVM_Machine_User_Manual_and_SOP.pdf")

    generate_printable_html(printable_html, snapshots_dir)
    print_to_pdf(printable_html, output_pdf)
