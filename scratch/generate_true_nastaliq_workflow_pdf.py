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

def build_html_manual():
    fonts_dir = r"d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\Fonts"
    font_urdu_bold = get_base64_font(os.path.join(fonts_dir, "NotoNastaliqUrdu-Bold.ttf"))
    font_urdu_reg = get_base64_font(os.path.join(fonts_dir, "NotoNastaliqUrdu-Regular.ttf"))

    brain_dir = r"C:\Users\BIN ISHAQ\.gemini\antigravity-ide\brain\b33351f0-eedc-4c59-93d1-b10ffbbaaa0c"
    img_ch1 = get_base64_img(os.path.join(brain_dir, "chamber1_plastic_sizing_flow.png"))
    img_ch2 = get_base64_img(os.path.join(brain_dir, "chamber2_metal_inductive_flow.png"))
    img_ch3 = get_base64_img(os.path.join(brain_dir, "chamber3_paper_loadcell_flow.png"))
    img_shield = get_base64_img(os.path.join(brain_dir, "rvm_arduino_mega_shield_hardware_map.png"))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PecoDrop RVM — Complete System Workflow & Firmware Manual</title>
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

  /* Hero Header */
  .hero-header {{
    background: linear-gradient(135deg, #042E2B 0%, #064E3B 50%, #0F172A 100%);
    color: #FFFFFF;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .hero-header h1 {{
    font-size: 14pt;
    font-weight: 900;
    letter-spacing: 0.5px;
    color: #FFFFFF;
  }}
  .hero-header p {{
    font-size: 8pt;
    color: #A7F3D0;
    font-weight: 500;
    margin-top: 2px;
  }}
  .hero-badge {{
    background: #10B981;
    color: #042E2B;
    font-size: 7.5pt;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 20px;
    letter-spacing: 0.8px;
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

  /* Diagram Flow Grid */
  .diagram-grid {{
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

  <!-- ==================== PAGE 1: OVERVIEW & ENGLISH WORKFLOW ==================== -->
  <div class="page" style="page-break-before:avoid;">
    <div class="page-running-header">
      <span class="brand">PECODROP RVM &bull; FIRMWARE ARCHITECTURE</span>
      <span>Document Ref: RVM-ENG-MAN-V6.0</span>
      <span>Page 1 of 5</span>
    </div>

    <div class="hero-header">
      <div>
        <h1>PECODROP REVERSE VENDING MACHINE (RVM)</h1>
        <p>Complete 3-Chamber Sorting Firmware Workflow & Hardware Architecture Manual</p>
      </div>
      <div>
        <span class="hero-badge">Firmware Rev 6.0</span>
      </div>
    </div>

    <div class="card" style="border-left: 4px solid #059669;">
      <div class="card-title" style="color:#059669;">System Core Specifications & State Machine Fundamentals</div>
      <div class="card-body">
        The PecoDrop RVM is operated by an <strong>Arduino Mega 2560 R3</strong> microcontroller running a deterministic interrupt-driven state machine at <strong>115200 baud</strong>. 
        It integrates 3 independent chambers: <strong>Chamber 1 (Plastic Bottles)</strong> with vertical ultrasonic volume profiling, 
        <strong>Chamber 2 (Beverage Cans)</strong> with high-frequency NPN inductive sensing, and <strong>Chamber 3 (Paper / Tetra Pak)</strong> with a dual-gauge HX711 24-bit ADC load cell.
      </div>
    </div>

    <div class="section-title-bar">
      <h2>SECTION 1: ENGINEERING SPECIFICATIONS & DETAILED EXECUTION FLOW</h2>
      <span class="meta">English Technical Workflow</span>
    </div>

    <div class="card">
      <div class="card-title">1. State 0: System Initialization & Auto-Calibration Routine</div>
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

    <div class="diagram-grid">
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
      <div class="card-title">3. Multi-Chamber Material Processing & Failsafe Watchdogs</div>
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
      <span>PECODROP AUTOMATION &bull; ISO-9001 COMPLIANT FIRMWARE</span>
      <span>Confidential & Proprietary</span>
      <span>Page 1 of 5</span>
    </div>
  </div>


  <!-- ==================== PAGE 2: TRUE URDU NASTALIQ WORKFLOW (PART 1) ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">پیکوڈراپ ریورس وینڈنگ مشین &bull; مکمل اردو ورک فلو</span>
      <span style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#064E3B;">نستعلیق رسم الخط میں مستند گائیڈ</span>
      <span>صفحہ ۲ از ۵</span>
    </div>

    <div class="section-title-bar urdu">
      <div class="urdu-banner-text">دوسرا حصہ: مکمل اردو رہنما و تفصیلی ورک فلو (نستعلیق رسم الخط)</div>
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
      <span>Confidential & Proprietary</span>
      <span>صفحہ ۲ از ۵</span>
    </div>
  </div>


  <!-- ==================== PAGE 3: TRUE URDU NASTALIQ (PART 2) & ROMAN URDU ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PECODROP RVM &bull; WORKFLOW CONTINUATION</span>
      <span style="font-family:'TrueNastaliq', serif; font-size:9pt; color:#064E3B;">اردو اور رومن اردو ورک فلو</span>
      <span>صفحہ ۳ از ۵</span>
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
    <div class="section-title-bar" style="margin-top:10px;">
      <h2>SECTION 3: ROMAN URDU WORKFLOW (MUKAMMAL AAM FEHM)</h2>
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
      <div class="roman-header">2. Entrance Shanakht & Sorting Flow:</div>
      <div class="roman-body">
        • <strong>Entrance 3-Stage Filter:</strong> Sensor 1 second tak khali rasta dekhe &rarr; Faasla 18 cm se kam ho kar 4 readings qaim rahe &rarr; Arduino bhejta hai <code>ENTRANCE:DETECTED</code>.<br>
        • <strong>Chamber 1 (Plastic):</strong> Iris 5&deg; khulta hai &rarr; 2 second settle delay &rarr; Ultrasonic height naap kar Small, Medium ya Large karta hai &rarr; Pin 8 Drop Gate open ho kar bottle gira deta hai &rarr; <code>RESULT:BOTTLE:SIZE:ACCEPTED</code>.<br>
        • <strong>Chamber 2 (Metal):</strong> Pin 32 Inductive Sensor metal pehchanta hai &rarr; Pin 9 Drop Gate open hota hai &rarr; <code>RESULT:CAN:ACCEPTED</code>.<br>
        • <strong>Chamber 3 (Paper):</strong> HX711 load cell wazan naap kar Pin 10 Gate kholta hai &rarr; <code>RESULT:PAPER:ACCEPTED</code>.<br>
        • <strong>12s Safety Watchdog:</strong> Agar 12000 ms mein bottle na aye to Arduino <code>TIMEOUT:ABORT</code> bhej kar gates secure karta hai.
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; URDU & ROMAN URDU WORKFLOW</span>
      <span>Confidential & Proprietary</span>
      <span>Page 3 of 5</span>
    </div>
  </div>


  <!-- ==================== PAGE 4: HOST PC SERIAL COMMAND REFERENCE ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PECODROP RVM &bull; SERIAL COMMUNICATION PROTOCOL</span>
      <span>UART 115200 Baud, 8-N-1 Standard</span>
      <span>Page 4 of 5</span>
    </div>

    <div class="section-title-bar">
      <h2>SECTION 4: HOST PC SERIAL COMMANDS REFERENCE MATRIX</h2>
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
          <td>Opens Chamber 3 Iris, acquires HX711 load cell tare & weight, operates Pin 10 gate</td>
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

    <div class="card" style="margin-top:8px;">
      <div class="card-title">Serial Bus Characteristics & Handshaking Timing</div>
      <div class="card-body">
        <ul>
          <li><strong>Baud Rate:</strong> 115200 bps &bull; <strong>Data Bits:</strong> 8 &bull; <strong>Parity:</strong> None &bull; <strong>Stop Bits:</strong> 1 &bull; <strong>Flow Control:</strong> None.</li>
          <li><strong>Command Termination:</strong> Every outgoing command must terminate with standard ASCII Carriage Return & Line Feed (<code>\r\n</code>).</li>
          <li><strong>Timeout Enforcement:</strong> Host PC must implement a 500 ms heartbeat watchdog. If no response is received within 15 seconds of item dispatch, host invokes <code>CMD:RESET</code>.</li>
        </ul>
      </div>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; SERIAL INTERFACE PROTOCOL</span>
      <span>Confidential & Proprietary</span>
      <span>Page 4 of 5</span>
    </div>
  </div>


  <!-- ==================== PAGE 5: ARDUINO MEGA PINOUT & SHIELD HARDWARE MAP ==================== -->
  <div class="page">
    <div class="page-running-header">
      <span class="brand">PECODROP RVM &bull; HARDWARE PINOUT & SHIELD MAP</span>
      <span>Arduino Mega 2560 R3 Dedicated REV 6.0 Shield</span>
      <span>Page 5 of 5</span>
    </div>

    <div class="section-title-bar">
      <h2>SECTION 5: ARDUINO MEGA 2560 HARDWARE PINOUT MATRIX</h2>
      <span class="meta">Shield Header & Wiring Allocation</span>
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
          <td><strong>Pin 2</strong></td>
          <td>Entrance Ultrasonic Trigger</td>
          <td><span class="tag-out">DIGITAL OUT</span></td>
          <td>5.0V DC</td>
          <td>10&micro;s ultrasonic pulse emitter for user presence detection</td>
        </tr>
        <tr>
          <td><strong>Pin 3</strong></td>
          <td>Entrance Ultrasonic Echo</td>
          <td><span class="tag-in">DIGITAL IN</span></td>
          <td>5.0V DC</td>
          <td>Pulse duration measurement (&lt; 18cm confirms item insertion)</td>
        </tr>
        <tr>
          <td><strong>Pin 4</strong></td>
          <td>Chamber 1 Ultrasonic Trigger</td>
          <td><span class="tag-out">DIGITAL OUT</span></td>
          <td>5.0V DC</td>
          <td>Trigger pin for plastic bottle vertical height profiling</td>
        </tr>
        <tr>
          <td><strong>Pin 5</strong></td>
          <td>Chamber 1 Ultrasonic Echo</td>
          <td><span class="tag-in">DIGITAL IN</span></td>
          <td>5.0V DC</td>
          <td>Echo pin for plastic bottle volume classification</td>
        </tr>
        <tr>
          <td><strong>Pin 6</strong></td>
          <td>Chamber 1 Iris Servo</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Motorized mechanical iris for plastic intake chamber</td>
        </tr>
        <tr>
          <td><strong>Pin 7</strong></td>
          <td>Chamber 2 Iris Servo</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Motorized mechanical iris for beverage can intake chamber</td>
        </tr>
        <tr>
          <td><strong>Pin 8</strong></td>
          <td>Chamber 1 Drop Gate Servo</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Actuates drop floor flap discharging plastic bottle into bin</td>
        </tr>
        <tr>
          <td><strong>Pin 9</strong></td>
          <td>Chamber 2 Drop Gate Servo</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Actuates drop floor flap discharging beverage can into bin</td>
        </tr>
        <tr>
          <td><strong>Pin 10</strong></td>
          <td>Chamber 3 Drop Gate Servo</td>
          <td><span class="tag-out">PWM OUT</span></td>
          <td>6.0V DC (Ext)</td>
          <td>Actuates drop floor flap discharging paper cartons into bin</td>
        </tr>
        <tr>
          <td><strong>Pin 32</strong></td>
          <td>Inductive Proximity Sensor</td>
          <td><span class="tag-in">DIGITAL IN (NPN)</span></td>
          <td>5.0V (Divider)</td>
          <td>High-frequency eddy current metallic detection (Active LOW)</td>
        </tr>
        <tr>
          <td><strong>Pin A14</strong></td>
          <td>HX711 Load Cell DT (Data)</td>
          <td><span class="tag-in">DIGITAL IN</span></td>
          <td>5.0V DC</td>
          <td>Serial digital data stream from 24-bit strain gauge ADC</td>
        </tr>
        <tr>
          <td><strong>Pin A15</strong></td>
          <td>HX711 Load Cell SCK (Clock)</td>
          <td><span class="tag-out">DIGITAL OUT</span></td>
          <td>5.0V DC</td>
          <td>Clock oscillation line to clock out conversion words</td>
        </tr>
        <tr>
          <td><strong>VIN / GND</strong></td>
          <td>Main Terminal Input</td>
          <td><span class="tag-pwr">POWER INPUT</span></td>
          <td>12V DC (5A)</td>
          <td>Dual on-board regulators: 5V (Logic) and 6V 3A (Servos)</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align:center; margin-top:8px;">
      <img src="{img_shield}" style="max-width:88%; height:auto; border:1px solid #CBD5E1; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.06);" alt="Hardware Shield Architecture Map">
      <p style="font-size:7.2pt; color:#64748B; font-weight:700; margin-top:4px;">Figure 1: Custom Arduino Mega 2560 RVM Shield REV 6.0 Integrated Hardware Architecture</p>
    </div>

    <div class="page-running-footer">
      <span>PECODROP AUTOMATION &bull; HARDWARE INTEGRATION GUIDE</span>
      <span>Confidential & Proprietary</span>
      <span>Page 5 of 5</span>
    </div>
  </div>

</body>
</html>"""

    html_file = os.path.abspath("scratch/rvm_firmware_workflow_guide.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[HTML GENERATED] Saved to: {html_file} ({os.path.getsize(html_file)} bytes)")
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
        img_out = os.path.abspath(f"scratch/workflow_manual_page_{i+1}.png")
        pix.save(img_out)
        preview_paths.append(img_out)
        print(f"[PREVIEW] Saved Page {i+1} preview: {img_out}")
    return preview_paths

if __name__ == "__main__":
    html_path = build_html_manual()
    pdf_out = os.path.abspath(r"docs/user_manuals/RVM_Firmware_Workflow_Guide_English_RomanUrdu.pdf")
    brain_pdf = os.path.abspath(r"C:\Users\BIN ISHAQ\.gemini\antigravity-ide\brain\b33351f0-eedc-4c59-93d1-b10ffbbaaa0c\RVM_Firmware_Workflow_Guide_English_RomanUrdu.pdf")

    success = print_pdf(html_path, pdf_out)
    if success:
        shutil.copyfile(pdf_out, brain_pdf)
        print(f"[COPIED] Mirrored to Brain: {brain_pdf}")
        render_preview_images(pdf_out)
