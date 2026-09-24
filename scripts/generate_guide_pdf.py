import os
import base64
import subprocess
import tempfile

def get_base64_file(filepath):
    with open(filepath, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

# Prepare base64 fonts & logo
font_regular_b64 = get_base64_file("docs/fonts/NotoNastaliqUrdu-Regular.ttf")
font_bold_b64 = get_base64_file("docs/fonts/NotoNastaliqUrdu-Bold.ttf")
logo_b64 = get_base64_file("public/isp_logo.png")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PecoDrop Enterprise User Guide | ISP Environmental Solutions</title>
<style>
  @font-face {{
    font-family: 'Noto Nastaliq Urdu';
    src: url('data:font/truetype;charset=utf-8;base64,{font_regular_b64}') format('truetype');
    font-weight: 400;
    font-style: normal;
  }}
  @font-face {{
    font-family: 'Noto Nastaliq Urdu';
    src: url('data:font/truetype;charset=utf-8;base64,{font_bold_b64}') format('truetype');
    font-weight: 700;
    font-style: normal;
  }}

  @page {{
    size: A4 portrait;
    margin: 7mm 9mm 7mm 9mm;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 10px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .urdu {{
    font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif;
    direction: rtl;
    text-align: right;
    line-height: 2.0;
  }}

  .page {{
    width: 100%;
    height: 100%;
    page-break-after: always;
    position: relative;
    padding-bottom: 22px;
  }}
  .page:last-child {{
    page-break-after: avoid;
  }}

  /* Top Header */
  .header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #059669;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }}
  .header-left {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .header-logo {{
    width: 58px;
    height: 58px;
    object-contain: fit;
  }}
  .header-title-box h1 {{
    font-size: 15px;
    font-weight: 900;
    color: #064e3b;
    letter-spacing: -0.3px;
    text-transform: uppercase;
  }}
  .header-title-box .sub {{
    font-size: 9.5px;
    font-weight: 700;
    color: #059669;
  }}
  .header-urdu {{
    text-align: right;
    direction: rtl;
  }}
  .header-urdu h2 {{
    font-size: 15px;
    color: #064e3b;
    font-weight: 700;
    line-height: 1.5;
  }}
  .header-urdu .sub {{
    font-size: 9.5px;
    color: #059669;
  }}

  /* Highlights Banner: Zero App Required */
  .badge-banner {{
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1.5px solid #10b981;
    border-radius: 8px;
    padding: 7px 12px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }}
  .banner-badge {{
    background: #059669;
    color: #ffffff;
    font-weight: 800;
    font-size: 9px;
    padding: 2px 7px;
    border-radius: 5px;
    text-transform: uppercase;
    display: inline-block;
    margin-bottom: 3px;
  }}
  .banner-en {{
    flex: 1;
  }}
  .banner-en h3 {{
    font-size: 11px;
    font-weight: 800;
    color: #064e3b;
  }}
  .banner-en p {{
    font-size: 9px;
    color: #065f46;
    line-height: 1.35;
  }}
  .banner-ur {{
    flex: 1;
    direction: rtl;
    text-align: right;
    border-right: 1.5px solid #a7f3d0;
    padding-right: 12px;
  }}
  .banner-ur h3 {{
    font-size: 12px;
    color: #064e3b;
    font-weight: 700;
    line-height: 1.5;
  }}
  .banner-ur p {{
    font-size: 9px;
    color: #065f46;
    line-height: 1.7;
  }}

  /* Section Title */
  .section-title {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border-left: 3.5px solid #059669;
    border-right: 3.5px solid #059669;
    padding: 4px 8px;
    margin: 7px 0 6px 0;
    border-radius: 4px;
  }}
  .section-title h3 {{
    font-size: 10px;
    font-weight: 800;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }}
  .section-title .urdu-title {{
    font-size: 12px;
    color: #064e3b;
    font-weight: 700;
    line-height: 1.4;
  }}

  /* Material Compartments 3-Columns */
  .materials-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin-bottom: 7px;
  }}
  .material-card {{
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 6px 8px;
    background: #ffffff;
  }}
  .mat-plastic {{
    border-top: 3px solid #0284c7;
    background: #f0f9ff;
  }}
  .mat-can {{
    border-top: 3px solid #d97706;
    background: #fffbeb;
  }}
  .mat-paper {{
    border-top: 3px solid #059669;
    background: #f0fdf4;
  }}
  .mat-header {{
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 3px;
  }}
  .mat-icon {{
    font-size: 15px;
  }}
  .mat-title {{
    font-weight: 800;
    font-size: 10px;
    color: #0f172a;
  }}
  .mat-title-ur {{
    font-size: 11px;
    color: #064e3b;
    font-weight: 700;
    line-height: 1.4;
  }}
  .mat-desc {{
    font-size: 8.5px;
    color: #334155;
    margin-bottom: 3px;
    line-height: 1.3;
  }}
  .mat-desc-ur {{
    font-size: 8.5px;
    color: #1e293b;
    line-height: 1.65;
    border-top: 1px dashed #cbd5e1;
    padding-top: 3px;
    margin-top: 3px;
  }}

  /* Dual Step Cards */
  .steps-container {{
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}
  .step-row {{
    display: grid;
    grid-template-columns: 36px 1fr 1fr;
    gap: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 4px 8px;
    align-items: center;
    background: #ffffff;
  }}
  .step-row:nth-child(even) {{
    background: #f8fafc;
  }}
  .step-num {{
    width: 28px;
    height: 28px;
    background: #059669;
    color: #ffffff;
    font-size: 11.5px;
    font-weight: 900;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(5,150,105,0.25);
  }}
  .step-en h4 {{
    font-size: 9.8px;
    font-weight: 800;
    color: #0f172a;
  }}
  .step-en p {{
    font-size: 8.3px;
    color: #475569;
    margin-top: 0.5px;
    line-height: 1.25;
  }}
  .step-ur {{
    border-right: 1px solid #cbd5e1;
    padding-right: 8px;
  }}
  .step-ur h4 {{
    font-size: 11px;
    font-weight: 700;
    color: #064e3b;
    line-height: 1.4;
  }}
  .step-ur p {{
    font-size: 8.3px;
    color: #334155;
    line-height: 1.65;
  }}

  /* Points & ESG Impact Table */
  .impact-table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 8.6px;
  }}
  .impact-table th {{
    background: #064e3b;
    color: #ffffff;
    padding: 4px 6px;
    text-align: left;
    font-size: 8.6px;
    font-weight: 700;
  }}
  .impact-table th.ur-th {{
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', serif;
    font-size: 9.5px;
  }}
  .impact-table td {{
    padding: 4px 6px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }}
  .impact-table tr:nth-child(even) td {{
    background: #f8fafc;
  }}
  .point-tag {{
    display: inline-block;
    background: #fef3c7;
    color: #b45309;
    border: 1px solid #fde68a;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 8.5px;
  }}

  /* Notice & Prohibited Items Box */
  .alert-box {{
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-left: 3.5px solid #e11d48;
    border-radius: 6px;
    padding: 5px 8px;
    margin-top: 6px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }}
  .alert-en {{
    flex: 1;
  }}
  .alert-en strong {{
    color: #be123c;
    font-size: 9px;
    text-transform: uppercase;
  }}
  .alert-en p {{
    font-size: 8px;
    color: #881337;
    margin-top: 0.5px;
    line-height: 1.25;
  }}
  .alert-ur {{
    flex: 1;
    direction: rtl;
    text-align: right;
    border-right: 1px solid #fecdd3;
    padding-right: 8px;
  }}
  .alert-ur strong {{
    color: #be123c;
    font-size: 10.5px;
  }}
  .alert-ur p {{
    font-size: 8px;
    color: #881337;
    line-height: 1.6;
  }}

  /* Footer */
  .footer {{
    position: absolute;
    bottom: 2px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #cbd5e1;
    padding-top: 4px;
    font-size: 7.8px;
    color: #64748b;
  }}
  .footer .brand {{
    font-weight: 700;
    color: #059669;
  }}
</style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="page">
    
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <img src="data:image/png;base64,{logo_b64}" class="header-logo" alt="ISP Logo" />
        <div class="header-title-box">
          <h1>PecoDrop Enterprise System</h1>
          <div class="sub">Touchless Smart Recycling & ESG Reward Protocol</div>
        </div>
      </div>
      <div class="header-urdu">
        <h2 class="urdu">پیکوڈراپ اسمارٹ ری سائیکلنگ سسٹم</h2>
        <div class="sub urdu">کارپوریٹ ملازمین کے لیے معلوماتی گائیڈ اور پوائنٹس کا طریقہ کار</div>
      </div>
    </div>

    <!-- ZERO APP DOWNLOAD BANNER -->
    <div class="badge-banner">
      <div class="banner-en">
        <span class="banner-badge">⚡ Zero App Installation Required</span>
        <h3>Use Your Default Smartphone Camera!</h3>
        <p>No need to download any application from App Store or Google Play. Employees simply deposit recyclables, scan the screen QR code with their camera, and log in with Corporate Google SSO.</p>
      </div>
      <div class="banner-ur urdu">
        <span class="banner-badge" style="float: right;">موبائل ایپ کی ضرورت نہیں</span>
        <div style="clear: both;"></div>
        <h3>اپنے اسمارٹ فون کے عام کیمرے سے اسکین کریں!</h3>
        <p>ملازمین کو پلے اسٹور یا ایپ اسٹور سے کوئی بھی ایپ ڈاؤن لوڈ کرنے کی ضرورت نہیں ہے۔ ری سائیکلنگ کے بعد مشین اسکرین پر آنے والے کیو آر کوڈ کو اپنے فون کیمرے سے اسکین کریں اور دفتری گوگل اکاؤنٹ سے لاگ ان کریں۔</p>
      </div>
    </div>

    <!-- SECTION 1: ACCEPTED MATERIALS -->
    <div class="section-title">
      <h3>1. Accepted Material Streams & Preparation</h3>
      <div class="urdu-title urdu">۱۔ مشین میں قبول کی جانے والی اشیاء اور ان کی ترتیب</div>
    </div>

    <div class="materials-grid">
      <!-- Compartment 1: Plastic -->
      <div class="material-card mat-plastic">
        <div class="mat-header">
          <span class="mat-icon">🧴</span>
          <div>
            <div class="mat-title">Compartment 1: PET Bottles</div>
            <div class="mat-title-ur urdu">خانہ نمبر ۱: پی ای ٹی پلاسٹک بوتلیں</div>
          </div>
        </div>
        <div class="mat-desc">
          <strong>Accepted:</strong> Mineral water, carbonated soft drinks, juice bottles (Small, Medium, Large).<br>
          <strong>Condition:</strong> Must be completely empty and clean. Insert one-by-one.
        </div>
        <div class="mat-desc-ur urdu">
          <strong>قابل قبول:</strong> پینے کے پانی اور کولڈ ڈرنکس کی تمام پلاسٹک بوتلیں (چھوٹی، درمیانی، بڑی)۔<br>
          <strong>شرط:</strong> بوتل اندر سے خالی اور صاف ہونی چاہیے۔ ایک ایک کر کے مشین کے سلاٹ میں داخل کریں۔
        </div>
      </div>

      <!-- Compartment 2: Metal Cans -->
      <div class="material-card mat-can">
        <div class="mat-header">
          <span class="mat-icon">🥫</span>
          <div>
            <div class="mat-title">Compartment 2: Metal Cans</div>
            <div class="mat-title-ur urdu">خانہ نمبر ۲: دھاتی و ایلومینیم کینز</div>
          </div>
        </div>
        <div class="mat-desc">
          <strong>Accepted:</strong> Aluminium soda cans, energy drink cans, beverage tins.<br>
          <strong>Condition:</strong> Liquid-free, uncrushed or lightly compressed. Insert one-by-one.
        </div>
        <div class="mat-desc-ur urdu">
          <strong>قابل قبول:</strong> کولڈ ڈرنکس، جوس اور انرجی ڈرنکس کے تمام ایلومینیم کینز۔<br>
          <strong>شرط:</strong> اندر مشروب یا پانی نہ ہو۔ کین کو ایک ایک کر کے متعلقہ سلاٹ میں داخل کریں۔
        </div>
      </div>

      <!-- Compartment 3: Paper -->
      <div class="material-card mat-paper">
        <div class="mat-header">
          <span class="mat-icon">📄</span>
          <div>
            <div class="mat-title">Compartment 3: Office Paper</div>
            <div class="mat-title-ur urdu">خانہ نمبر ۳: دفتری کاغذ اور گتہ</div>
          </div>
        </div>
        <div class="mat-desc">
          <strong>Accepted:</strong> Printing paper, shredded confidential paper, documents, carton boxes.<br>
          <strong>Measurement:</strong> Weighed automatically on the precision digital load cell scale.
        </div>
        <div class="mat-desc-ur urdu">
          <strong>قابل قبول:</strong> دفتری پرنٹنگ پیپر، شریڈڈ کاغذ، فائلوں کا ضائع کاغذ اور گتہ کے کارٹن۔<br>
          <strong>پیمائش:</strong> کاغذ کو ڈیجیٹل اسکیل کے ٹرے پر رکھیں؛ وزن گرام اور کلوگرام میں خودکار ریکارڈ ہوگا۔
        </div>
      </div>
    </div>

    <!-- PROHIBITED ITEMS ALERT -->
    <div class="alert-box">
      <div class="alert-en">
        <strong>⚠️ Strictly Prohibited in PecoDrop:</strong>
        <p>Food waste, wet trash, liquids, glass bottles, metal wires, chemical containers, and hazardous batteries. Inserting prohibited items will trigger the automatic reject bin.</p>
      </div>
      <div class="alert-ur urdu">
        <strong>⚠️ مشین میں ممنوعہ اشیاء:</strong>
        <p>کھانے پینے کا گیلا کچرا، بچا ہوا پانی یا مشروبات، شیشے کی بوتلیں، تاریں اور کیمیکل ڈبے ہرگز نہ ڈالیں۔ ممنوعہ چیزیں مشین کا ریجیکٹ سینسر خودکار طور پر مسترد کر دے گا۔</p>
      </div>
    </div>

    <!-- SECTION 2: 6-STEP PROCEDURE -->
    <div class="section-title" style="margin-top: 8px;">
      <h3>2. Complete Step-by-Step Procedure to Recycle & Earn Points</h3>
      <div class="urdu-title urdu">۲۔ ری سائیکلنگ اور پوائنٹس حاصل کرنے کا مکمل مرحلہ وار طریقہ کار</div>
    </div>

    <div class="steps-container">
      
      <!-- Step 1 -->
      <div class="step-row">
        <div class="step-num">01</div>
        <div class="step-en">
          <h4>Deposit Your Recyclables</h4>
          <p>Place paper/cardboard onto the digital weight scale tray, or feed PET bottles and cans one-by-one into their respective slots.</p>
        </div>
        <div class="step-ur urdu">
          <h4>مشین میں اشیاء داخل کریں</h4>
          <p>کاغذ اور گتے کو ڈیجیٹل وزن ٹرے پر رکھیں، یا بوتلیں اور کینز متعلقہ سلاٹ میں ایک ایک کر کے داخل کریں۔</p>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-row">
        <div class="step-num">02</div>
        <div class="step-en">
          <h4>Live Tally on Kiosk Touchscreen</h4>
          <p>Watch the screen update in real time: bottle count, can count, exact paper weight in kg, and total points earned.</p>
        </div>
        <div class="step-ur urdu">
          <h4>اسکرین پر لائیو تفصیلات دیکھیں</h4>
          <p>مشین کی بڑی اسکرین پر بوتلوں اور کینز کی تعداد، کاغذ کا درست وزن اور حاصل ہونے والے پوائنٹس لائیو دیکھیں۔</p>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-row">
        <div class="step-num">03</div>
        <div class="step-en">
          <h4>Tap "Finish & Claim Points"</h4>
          <p>Press the green Finish button on the touchscreen. A unique dynamic claim QR code is generated instantly for your session.</p>
        </div>
        <div class="step-ur urdu">
          <h4>'پوائنٹس حاصل کریں' کا بٹن دبائیں</h4>
          <p>جب تمام اشیاء جمع ہو جائیں تو اسکرین پر سبز بٹن دبائیں۔ آپ کے اس سیشن کا مخصوص کیو آر کوڈ اسکرین پر نمودار ہو جائے گا۔</p>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step-row">
        <div class="step-num">04</div>
        <div class="step-en">
          <h4>Scan QR with Smartphone Camera</h4>
          <p>Open your normal phone camera (iOS or Android) or Google Lens. Point at the screen QR code and tap the notification link.</p>
        </div>
        <div class="step-ur urdu">
          <h4>موبائل کیمرے سے کیو آر کوڈ اسکین کریں</h4>
          <p>اپنے اسمارٹ فون کا عام کیمرہ کھولیں اور اسکرین پر موجود کیو آر کوڈ کے سامنے رکھیں۔ اسکرین پر آنے والے لنک پر کلک کریں۔</p>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="step-row">
        <div class="step-num">05</div>
        <div class="step-en">
          <h4>One-Tap Corporate Google SSO Login</h4>
          <p>Select your official corporate email address (e.g. <code>@bankalfalah.com</code>). No registration or password required!</p>
        </div>
        <div class="step-ur urdu">
          <h4>دفتری ای میل سے فوری لاگ ان</h4>
          <p>گوگل سائن ان کے ذریعے اپنی سرکاری کارپوریٹ ای میل منتخب کریں۔ کوئی رجسٹریشن یا پاس ورڈ ڈالنے کی ضرورت نہیں۔</p>
        </div>
      </div>

      <!-- Step 6 -->
      <div class="step-row">
        <div class="step-num">06</div>
        <div class="step-en">
          <h4>Instant Credit & Leaderboard Recognition</h4>
          <p>Points credit immediately to your corporate account. Your department rises on the leaderboard, helping achieve the company's ESG Target!</p>
        </div>
        <div class="step-ur urdu">
          <h4>فوری پوائنٹس، شعبہ جاتی رینکنگ اور انعامات</h4>
          <p>پوائنٹس فوراً آپ کے پروفائل میں جمع ہو جائیں گے۔ آپ کا ڈیپارٹمنٹ رینکنگ میں اوپر جائے گا اور کمپنی کے ماحولیاتی ہدف میں اضافہ ہوگا!</p>
        </div>
      </div>

    </div>

    <!-- Footer Page 1 -->
    <div class="footer">
      <div><strong>ISP Environmental Solutions</strong> • Smart Reverse Vending & Circular Economy Platform</div>
      <div>Page 1 of 2 • Enterprise Client Operational Standard</div>
    </div>

  </div>

  <!-- ================= PAGE 2 ================= -->
  <div class="page">
    
    <!-- Header Page 2 -->
    <div class="header">
      <div class="header-left">
        <img src="data:image/png;base64,{logo_b64}" class="header-logo" alt="ISP Logo" />
        <div class="header-title-box">
          <h1>PecoDrop Enterprise System</h1>
          <div class="sub">Points Valuation, Department Leaderboards & ESG Compliance</div>
        </div>
      </div>
      <div class="header-urdu">
        <h2 class="urdu">پوائنٹس، انعامات اور ماحولیاتی سرٹیفکیٹ</h2>
        <div class="sub urdu">کارپوریٹ ملازمین اور شعبہ جات کے فوائد کی مکمل تفصیل</div>
      </div>
    </div>

    <!-- SECTION 3: POINTS & IMPACT FORMULA -->
    <div class="section-title">
      <h3>3. Material Points Valuation & Lifecycle Impact Standard</h3>
      <div class="urdu-title urdu">۳۔ پوائنٹس کا حسابی فارمولا اور ماحولیاتی فوائد (EPA & ISO 14044)</div>
    </div>

    <table class="impact-table">
      <thead>
        <tr>
          <th>Recyclable Stream</th>
          <th>Unit / Measurement</th>
          <th>Points Earned</th>
          <th>CO₂ Avoided</th>
          <th>Water Conserved</th>
          <th class="ur-th">اردو تفصیل اور ماحولیاتی بچت</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>🧴 Plastic PET Bottle (Small/Med)</strong></td>
          <td>1 Bottle (~25 grams)</td>
          <td><span class="point-tag">10 Pts / pc</span></td>
          <td>0.035 kg CO₂</td>
          <td>3.0 Liters</td>
          <td class="urdu" style="font-size: 9px;">ہر ایک بوتل پر ۱۰ پوائنٹس اور ۳ لیٹر پانی کی بچت</td>
        </tr>
        <tr>
          <td><strong>🧴 Plastic PET Bottle (Large)</strong></td>
          <td>1 Bottle (>1.5 Liter)</td>
          <td><span class="point-tag">20 Pts / pc</span></td>
          <td>0.070 kg CO₂</td>
          <td>6.0 Liters</td>
          <td class="urdu" style="font-size: 9px;">بڑی بوتل پر ۲۰ پوائنٹس اور کاربن اخراج میں نمایاں کمی</td>
        </tr>
        <tr>
          <td><strong>🥫 Aluminium Can (Soda/Energy)</strong></td>
          <td>1 Can (~15 grams)</td>
          <td><span class="point-tag">15 Pts / pc</span></td>
          <td>0.135 kg CO₂</td>
          <td>14 kWh Energy</td>
          <td class="urdu" style="font-size: 9px;">ہر کین پر ۱۵ پوائنٹس اور بجلی کی بڑی بچت</td>
        </tr>
        <tr>
          <td><strong>📄 Office Paper & Shreds</strong></td>
          <td>1 Kilogram (Digital Scale)</td>
          <td><span class="point-tag">50 Pts / kg</span></td>
          <td>1.500 kg CO₂</td>
          <td>26.0 Liters</td>
          <td class="urdu" style="font-size: 9px;">ایک کلو کاغذ پر ۵۰ پوائنٹس اور ۰.۰۱۷ درختوں کی حفاظت</td>
        </tr>
        <tr>
          <td><strong>📦 Cardboard / Folded Cartons</strong></td>
          <td>1 Kilogram (Digital Scale)</td>
          <td><span class="point-tag">40 Pts / kg</span></td>
          <td>1.300 kg CO₂</td>
          <td>20.0 Liters</td>
          <td class="urdu" style="font-size: 9px;">ایک کلو گتے پر ۴۰ پوائنٹس اور لینڈ فل فضلے سے مکمل نجات</td>
        </tr>
      </tbody>
    </table>

    <!-- SECTION 4: DEPARTMENT LEADERBOARDS & ESG -->
    <div class="section-title" style="margin-top: 8px;">
      <h3>4. Department Leaderboard & Monthly Corporate ESG Target</h3>
      <div class="urdu-title urdu">۴۔ شعبہ جاتی مقابلہ، ماہانہ ٹارگٹ اور سرکاری ماحولیاتی سرٹیفکیٹ</div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
      
      <div style="border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px 9px; background: #f8fafc;">
        <h4 style="font-size: 10px; font-weight: 800; color: #064e3b; margin-bottom: 2px;">🏆 Corporate Department Leaderboard</h4>
        <p style="font-size: 8.5px; color: #334155; line-height: 1.35;">
          Every time an employee recycles, their points and diverted mass are credited toward their respective department (e.g. Operations, IT, Finance, Marketing).
        </p>
        <ul style="font-size: 8.2px; color: #475569; margin: 4px 0 0 12px; line-height: 1.3;">
          <li>Top departments receive monthly corporate green champions trophies.</li>
          <li>Points can be redeemed for cafeteria vouchers, company perks, or green causes.</li>
        </ul>
      </div>

      <div class="urdu" style="border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px 9px; background: #f8fafc; border-right: 3px solid #059669;">
        <h4 style="font-size: 12px; font-weight: 700; color: #064e3b; margin-bottom: 2px;">🏆 شعبہ جاتی مسابقت اور کارپوریٹ رینکنگ</h4>
        <p style="font-size: 8.5px; color: #334155; line-height: 1.7;">
          جب بھی کوئی ملازم ری سائیکل کرتا ہے تو اس کے پوائنٹس اور جمع شدہ وزن خودکار طور پر اس کے ڈیپارٹمنٹ (جیسے آئی ٹی، فنانس، آپریشنز) کے کھاتے میں جمع ہوتے ہیں۔
        </p>
        <ul style="font-size: 8.2px; color: #475569; margin: 4px 12px 0 0; line-height: 1.7;">
          <li>بہترین کارکردگی دکھانے والے شعبے کو ماہانہ چیمپئن اعزاز دیا جاتا ہے۔</li>
          <li>پوائنٹس کو کیفے ٹیریا واؤچرز، کارپوریٹ تحائف یا گرین انعامات میں تبدیل کیا جا سکتا ہے۔</li>
        </ul>
      </div>

    </div>

    <!-- ESG AUDIT CERTIFICATION BANNER -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); color: #ffffff; border-radius: 7px; padding: 7px 10px; margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1.2;">
        <span style="background: #10b981; color: #ffffff; font-weight: 800; font-size: 8px; padding: 1.5px 5px; border-radius: 3px; text-transform: uppercase;">Official Audit Standard</span>
        <h4 style="font-size: 10.5px; font-weight: 800; margin-top: 2px;">Audited ESG Sustainability Certificate</h4>
        <p style="font-size: 8.2px; color: #a7f3d0; margin-top: 1px; line-height: 1.3;">
          At the end of each billing cycle, an official ISO 14044-compliant ESG Certificate is automatically issued to your organization, documenting total kg diverted, trees saved, water conserved, and net CO₂ offset for annual corporate ESG reporting.
        </p>
      </div>
      <div class="urdu" style="flex: 1; text-align: right; border-right: 1px solid #047857; padding-right: 10px;">
        <span style="background: #10b981; color: #ffffff; font-weight: 700; font-size: 8px; padding: 1.5px 5px; border-radius: 3px; float: right;">ماہانہ ماحولیاتی آڈٹ</span>
        <div style="clear: both;"></div>
        <h4 style="font-size: 12px; font-weight: 700; margin-top: 2px;">آفیشل کارپوریٹ ای ایس جی (ESG) سرٹیفکیٹ</h4>
        <p style="font-size: 8.2px; color: #a7f3d0; margin-top: 1px; line-height: 1.7;">
          ہر ماہ کے اختتام پر آپ کی کمپنی کو بین الاقوامی معیار کے مطابق ماحولیاتی سرٹیفکیٹ جاری کیا جاتا ہے جس میں بچائے گئے درخت، کاربن اخراج میں کمی اور محفوظ کیا گیا پانی سرکاری طور پر تصدیق شدہ ہوتا ہے۔
        </p>
      </div>
    </div>

    <!-- SECTION 5: FREQUENTLY ASKED QUESTIONS -->
    <div class="section-title" style="margin-top: 8px;">
      <h3>5. Frequently Asked Questions & Troubleshooting</h3>
      <div class="urdu-title urdu">۵۔ اکثر پوچھے گئے سوالات اور رہنما ہدایات</div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 4px;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border: 1px solid #e2e8f0; border-radius: 5px; padding: 4px 8px; background: #ffffff;">
        <div>
          <strong style="color: #0f172a; font-size: 8.8px;">Q: What if I do not have a company Google account?</strong>
          <p style="color: #475569; font-size: 8px; margin-top: 1px; line-height: 1.25;">
            A: You can log in with your verified company email address via a 1-time secure access link. Contact your HR or Sustainability Department for instant enrollment.
          </p>
        </div>
        <div class="urdu" style="border-right: 1px solid #cbd5e1; padding-right: 8px;">
          <strong style="color: #064e3b; font-size: 10px;">سوال: اگر میرا کمپنی گوگل اکاؤنٹ فعال نہ ہو تو کیا کروں؟</strong>
          <p style="color: #334155; font-size: 8px; line-height: 1.6;">
            جواب: آپ دفتری ای میل پر ون ٹائم کوڈ کے ذریعے بھی لاگ ان ہو سکتے ہیں۔ کمپنی کے ایچ آر یا ایڈمن سے فوری معاونت حاصل کریں۔
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border: 1px solid #e2e8f0; border-radius: 5px; padding: 4px 8px; background: #ffffff;">
        <div>
          <strong style="color: #0f172a; font-size: 8.8px;">Q: Can multiple employees deposit together in one session?</strong>
          <p style="color: #475569; font-size: 8px; margin-top: 1px; line-height: 1.25;">
            A: Each kiosk session issues one unique QR code. We recommend depositing individually so each employee gets personal reward points and green credit.
          </p>
        </div>
        <div class="urdu" style="border-right: 1px solid #cbd5e1; padding-right: 8px;">
          <strong style="color: #064e3b; font-size: 10px;">سوال: کیا ایک ہی وقت میں ایک سے زیادہ ساتھی اکٹھے اشیاء ڈال سکتے ہیں؟</strong>
          <p style="color: #334155; font-size: 8px; line-height: 1.6;">
            جواب: ہر سیشن کا ایک مخصوص کیو آر کوڈ ہوتا ہے۔ انفرادی طور پر ڈالنے سے ہر ملازم کو اس کے اپنے نام کے پوائنٹس حاصل ہوتے ہیں۔
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border: 1px solid #e2e8f0; border-radius: 5px; padding: 4px 8px; background: #ffffff;">
        <div>
          <strong style="color: #0f172a; font-size: 8.8px;">Q: Who do I contact if the kiosk scale or camera reports an error?</strong>
          <p style="color: #475569; font-size: 8px; margin-top: 1px; line-height: 1.25;">
            A: PecoDrop kiosks are monitored 24/7 via telemetry. For assistance, contact ISP Environmental Helpdesk at <code>support@ispenv.com</code> or your office facility manager.
          </p>
        </div>
        <div class="urdu" style="border-right: 1px solid #cbd5e1; padding-right: 8px;">
          <strong style="color: #064e3b; font-size: 10px;">سوال: مشین میں کسی خرابی یا مدد کی صورت میں کس سے رابطہ کریں؟</strong>
          <p style="color: #334155; font-size: 8px; line-height: 1.6;">
            جواب: تمام مشینیں کلاؤڈ نیٹ ورک سے چوبیس گھنٹے جڑی ہیں۔ فوری مدد کے لیے کمپنی فیسلٹی مینیجر یا آئی ایس پی ہیلپ ڈیسک سے رابطہ کریں۔
          </p>
        </div>
      </div>

    </div>

    <!-- Contact & Sign-off -->
    <div style="border-top: 1.5px solid #059669; margin-top: 8px; padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 8px; color: #475569;">
        <strong>ISP Environmental Solutions</strong> • Smart Cities & Waste Diverting Technology<br>
        Web: <code>www.ispenv.com</code> • Support: <code>support@ispenv.com</code> • Phone: +92 42 111-ISP-ENV
      </div>
      <div class="urdu" style="font-size: 8.5px; color: #064e3b; text-align: right;">
        <strong>آئی ایس پی انوائرنمنٹل سلوشنز</strong> — سرسبز، صاف اور ماحول دوست پاکستان کی طرف اہم قدم۔
      </div>
    </div>

    <!-- Footer Page 2 -->
    <div class="footer">
      <div><strong>ISP Environmental Solutions</strong> • Enterprise Client Touchless User Manual</div>
      <div>Page 2 of 2 • Certified ESG Sustainability Standard</div>
    </div>

  </div>

</body>
</html>
"""

os.makedirs("docs", exist_ok=True)
html_file_path = os.path.abspath("docs/PecoDrop_Enterprise_User_Guide.html")
pdf_file_path = os.path.abspath("docs/PecoDrop_Enterprise_User_Guide.pdf")

with open(html_file_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML guide generated at: {html_file_path}")

# Render to PDF via Chrome headless
temp_user_data_dir = tempfile.mkdtemp()
chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_exe):
    chrome_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

cmd = [
    chrome_exe,
    "--headless=new",
    "--disable-gpu",
    f"--user-data-dir={temp_user_data_dir}",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_file_path}",
    f"file:///{html_file_path.replace(os.sep, '/')}"
]

res = subprocess.run(cmd, capture_output=True, timeout=30)
if os.path.exists(pdf_file_path):
    print(f"[SUCCESS] PDF successfully generated at: {pdf_file_path} (Size: {os.path.getsize(pdf_file_path)} bytes)")
else:
    print("Error generating PDF. Stderr:", res.stderr.decode("utf-8", errors="ignore"))
