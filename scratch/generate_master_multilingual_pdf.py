"""
Generate Master Professional Multilingual PDF:
PECODROP RVM — COMPLETE SYSTEM WORKFLOW & FIRMWARE MANUAL
Includes:
- Section 1: English Technical Workflow
- Section 2: Authentic Urdu Script in Noto Nastaliq Urdu Font (اردو نستعلیق رسم الخط)
- Section 3: True Roman Urdu Workflow (Aam Fehm Roman Urdu)
- Section 4: Complete Hardware Pinout & Wiring Matrix
Strictly matching PecoDropDesktopApp/Arduino/RVM_Arduino/RVM_Arduino.ino.
"""

import os
import sys
import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Font registration
FONT_PATH = r"docs\user_manuals\fonts\NotoNastaliqUrdu-Regular.ttf"
pdfmetrics.registerFont(TTFont('NotoNastaliq', FONT_PATH))

# Arabic / Urdu reshaper configuration
reshaper = arabic_reshaper.ArabicReshaper(configuration={
    'delete_harakat': False,
    'support_ligatures': True,
    'support_zwj': True
})

def u(text):
    """Reshapes and applies BiDi algorithm to Urdu text for ReportLab."""
    return get_display(reshaper.reshape(text))

PDF_OUTPUT_PATH = r"d:\GIT-HUB\RVM-dash\docs\user_manuals\RVM_Firmware_Workflow_Guide_English_RomanUrdu.pdf"
BRAIN_OUTPUT_PATH = r"C:\Users\BIN ISHAQ\.gemini\antigravity-ide\brain\b33351f0-eedc-4c59-93d1-b10ffbbaaa0c\RVM_Firmware_Workflow_Guide_English_RomanUrdu.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(18 * mm, 285 * mm, "PECODROP RVM — COMPLETE WORKFLOW (ENGLISH, URDU NASTALIQ & ROMAN URDU)")
            self.drawRightString(192 * mm, 285 * mm, "RVM_Arduino.ino")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(18 * mm, 282 * mm, 192 * mm, 282 * mm)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(18 * mm, 12 * mm, "CONFIDENTIAL & PROPRIETARY — PECODROP AUTOMATION")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(192 * mm, 12 * mm, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(18 * mm, 16 * mm, 192 * mm, 16 * mm)
        self.restoreState()

def build_pdf():
    os.makedirs(os.path.dirname(PDF_OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    styles = getSampleStyleSheet()

    # Color Palette
    primary = colors.HexColor("#0f172a")     # Deep Slate
    blue_accent = colors.HexColor("#0284c7") # Sky Blue
    green_accent = colors.HexColor("#059669")# Emerald Green
    purple_accent = colors.HexColor("#7c3aed")# Violet
    bg_subtle = colors.HexColor("#f8fafc")

    title_en = ParagraphStyle('TitleEN', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=primary, spaceAfter=4)
    title_ur = ParagraphStyle('TitleUR', parent=styles['Normal'], fontName='NotoNastaliq', fontSize=15, leading=26, textColor=green_accent, alignment=2, spaceAfter=8)
    subtitle = ParagraphStyle('SubTitle', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=colors.HexColor("#475569"), spaceAfter=10)

    h1_en = ParagraphStyle('H1EN', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=blue_accent, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h2_en = ParagraphStyle('H2EN', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=primary, spaceBefore=6, spaceAfter=3, keepWithNext=True)
    body_en = ParagraphStyle('BodyEN', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=colors.HexColor("#1e293b"), spaceAfter=4)
    bullet_en = ParagraphStyle('BulletEN', parent=body_en, leftIndent=10, bulletIndent=3, spaceAfter=2)
    code_text = ParagraphStyle('Code', parent=styles['Normal'], fontName='Courier', fontSize=7.5, leading=10, textColor=primary)

    # Urdu Nastaliq Styles
    h1_ur = ParagraphStyle('H1UR', parent=styles['Normal'], fontName='NotoNastaliq', fontSize=13, leading=24, textColor=green_accent, alignment=2, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h2_ur = ParagraphStyle('H2UR', parent=styles['Normal'], fontName='NotoNastaliq', fontSize=11, leading=22, textColor=colors.HexColor("#065f46"), alignment=2, spaceBefore=6, spaceAfter=2, keepWithNext=True)
    body_ur = ParagraphStyle('BodyUR', parent=styles['Normal'], fontName='NotoNastaliq', fontSize=9.5, leading=19, textColor=colors.HexColor("#1e293b"), alignment=2, spaceAfter=4)
    bullet_ur = ParagraphStyle('BulletUR', parent=body_ur, rightIndent=10, spaceAfter=3)

    # Roman Urdu Styles
    h1_ru = ParagraphStyle('H1RU', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=purple_accent, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h2_ru = ParagraphStyle('H2RU', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor("#5b21b6"), spaceBefore=6, spaceAfter=3, keepWithNext=True)
    body_ru = ParagraphStyle('BodyRU', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=colors.HexColor("#1e293b"), spaceAfter=4)
    bullet_ru = ParagraphStyle('BulletRU', parent=body_ru, leftIndent=10, bulletIndent=3, spaceAfter=2)

    story = []

    # -------------------------------------------------------------------------
    # COVER & BANNER
    # -------------------------------------------------------------------------
    story.append(Paragraph("PECODROP REVERSE VENDING MACHINE (RVM)", title_en))
    story.append(Paragraph(u("پیکو ڈراپ ریورس وینڈنگ مشین — مکمل سسٹم ورک فلو اور آپریٹنگ مینوئل"), title_ur))
    story.append(Paragraph("<b>Complete Firmware Workflow & Engineering Specification</b> | Target: <code>RVM_Arduino.ino</code><br/>"
                           "<i>Tri-Lingual Edition: English Technical Manual, Authentic Urdu Nastaliq Script, & True Roman Urdu</i>", subtitle))
    story.append(HRFlowable(width="100%", thickness=1.5, color=blue_accent, spaceBefore=0, spaceAfter=8))

    # Meta Table
    meta_data = [
        [Paragraph("<b>Hardware Target:</b> Arduino Mega 2560", body_en),
         Paragraph("<b>Baud Rate:</b> 115200 bps", body_en),
         Paragraph("<b>Active Modules:</b> Plastic, Metal, Paper", body_en)],
        [Paragraph("<b>Servo Angles:</b> Iris (10°/178°), Drop (170°/0°)", body_en),
         Paragraph("<b>Scale ADC:</b> HX711 (24-Bit, 420 counts/g)", body_en),
         Paragraph("<b>Sensors:</b> HC-SR04 US, Inductive (Pin 32)", body_en)]
    ]
    meta_table = Table(meta_data, colWidths=[59*mm, 59*mm, 60*mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_subtle),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # -------------------------------------------------------------------------
    # SECTION 1: ENGLISH TECHNICAL WORKFLOW
    # -------------------------------------------------------------------------
    story.append(Paragraph("SECTION 1: ENGLISH TECHNICAL WORKFLOW", h1_en))
    story.append(HRFlowable(width="100%", thickness=0.8, color=blue_accent, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("1. System Boot & Baseline Calibration", h2_en))
    story.append(Paragraph(
        "On startup, pins are configured and <code>makeSafe()</code> moves Iris Servos to <b>178° (Closed)</b> and Drop Gate Servos to <b>0° (Closed)</b>. "
        "The firmware then executes <code>calibrateAll()</code>:", body_en))
    story.append(Paragraph("• <b>Acoustic Baseline:</b> Takes 7 entrance samples and 5 sizing samples per chamber. Requires 100% stable echo spread ≤ 2 cm to eliminate phantom objects.", bullet_en))
    story.append(Paragraph("• <b>HX711 Tare:</b> Averages 12 raw samples on the Paper load cell to lock <code>paperTareRaw</code>.", bullet_en))
    story.append(Paragraph("• <b>Ready Output:</b> Emits <code>CALIBRATION:OK</code>, sets <code>calibrated = true</code>, and transitions to <code>MACHINE:IDLE</code>.", bullet_en))

    story.append(Paragraph("2. 3-Stage Entrance Debounce Engine", h2_en))
    story.append(Paragraph(
        "To filter false reflections from ambient air or waving hands, <code>updateDetection()</code> implements a 3-tier validation:", body_en))
    story.append(Paragraph("1. <b>Clearance Arming:</b> Entrance must see clear space matching baseline for ≥ 5 consecutive scans (1000 ms).", bullet_en))
    story.append(Paragraph("2. <b>Distance Consistency:</b> When an item approaches, readings must stay within a 2 cm window across 5 cycles.", bullet_en))
    story.append(Paragraph("3. <b>Hold Time:</b> The item must remain present for at least 600 ms before the iris is commanded to open.", bullet_en))

    story.append(Paragraph("3. Plastic Chamber Sizing & Sorting Flow", h2_en))
    story.append(Paragraph("• <b>Iris Open:</b> Opens to <b>10°</b> and emits <code>PLASTIC:OBJECT_DETECTED</code>.", bullet_en))
    story.append(Paragraph("• <b>Arrival & Settle:</b> Waits up to 5000 ms for bottle arrival at bottom sensor, then applies a <b>2000 ms settle delay</b> to stop bouncing.", bullet_en))
    story.append(Paragraph("• <b>Iris Snap Close:</b> Closes to <b>178°</b> to block user hands and prevent inserting a second item.", bullet_en))
    story.append(Paragraph("• <b>3-Tier Acoustic Sizing:</b> Evaluates Bottom, Middle, and Top ultrasonic sensors across 4 attempts (2 matching scans required):", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>LARGE:</b> Bottom=1, Middle=1, Top=1 (or Bottom=1, Top=1 if middle deflects).", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>MEDIUM:</b> Bottom=1, Middle=1, Top=0.", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>SMALL:</b> Bottom=1, Middle=0, Top=0.", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>INVALID:</b> Floating objects trigger <code>recoverSizingFault()</code>, dumping item without credit.", bullet_en))
    story.append(Paragraph("• <b>Drop Gate:</b> Opens to <b>170°</b> for 900 ms, verifies chamber cleared, closes to <b>0°</b>, and emits <code>BOTTLE:CLEARED</code>.", bullet_en))

    story.append(Paragraph("4. Metal Can Inductive Verification Flow", h2_en))
    story.append(Paragraph(
        "Follows the Plastic sequence, but adds hardware inductive sensing on <b>Pin 32</b>:", body_en))
    story.append(Paragraph("• <b>High-Speed Multi-Sampling:</b> Samples inductive sensor 12 times at 15 ms intervals.", bullet_en))
    story.append(Paragraph("• <b>Acceptance:</b> Requires at least <b>9 out of 12 readings</b> to read <code>LOW</code> (Metal Detected) $\\to$ <code>MATERIAL:CAN</code>.", bullet_en))
    story.append(Paragraph("• <b>Rejection:</b> Non-metallic items inserted into the metal chute emit <code>MATERIAL:REJECT</code> (0 credit).", bullet_en))

    story.append(Paragraph("5. Paper & Tetra Pak Load Cell Flow", h2_en))
    story.append(Paragraph("• <b>Placement & Iris:</b> Top entrance detects carton $\\to$ Paper Iris opens to 10°.", bullet_en))
    story.append(Paragraph("• <b>HX711 Precision Weighing:</b> Scales grams using <code>(raw - paperTareRaw) / 420.0</code>. Requires weight ≥ <b>20.0 grams</b> threshold.", bullet_en))
    story.append(Paragraph("• <b>Drop Gate:</b> Emits <code>SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:&lt;val&gt;</code>. Paper Drop Gate opens to <b>100°</b>, confirms scale returns to ≤ 8.0 g, and closes to <b>175°</b>.", bullet_en))

    story.append(Spacer(1, 4))
    story.append(Paragraph("6. Host PC Serial Command Reference (115200 Baud)", h2_en))
    cmd_data = [
        [Paragraph("<b>Command</b>", body_en), Paragraph("<b>Arduino Action</b>", body_en), Paragraph("<b>Serial Telemetry Response</b>", body_en)],
        [Paragraph("<code>START</code>", code_text), Paragraph("Enables sorting state machine", body_en), Paragraph("<code>MACHINE:STARTED</code>", code_text)],
        [Paragraph("<code>STOP / RESET</code>", code_text), Paragraph("Closes all gates, stops polling", body_en), Paragraph("<code>MACHINE:STOPPED / RESET:OK</code>", code_text)],
        [Paragraph("<code>CALIBRATE</code>", code_text), Paragraph("Re-measures all empty baselines & scale tare", body_en), Paragraph("<code>CALIBRATION:OK</code>", code_text)],
        [Paragraph("<code>STATUS</code>", code_text), Paragraph("Reports distance baselines & scale health", body_en), Paragraph("<code>STATUS:RUNNING;PLASTIC_CM:...;PAPER_SCALE:READY</code>", code_text)],
        [Paragraph("<code>SCALE</code>", code_text), Paragraph("Polls raw HX711 counts and current grams", body_en), Paragraph("<code>PAPER:SCALE_RAW:...;SIGNED_GRAMS:45.20</code>", code_text)]
    ]
    cmd_table = Table(cmd_data, colWidths=[30*mm, 68*mm, 80*mm])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(cmd_table)

    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SECTION 2: AUTHENTIC URDU SCRIPT (اردو نستعلیق رسم الخط)
    # -------------------------------------------------------------------------
    story.append(Paragraph(u("حصہ دوم: اردو نستعلیق میں مکمل ورک فلو اور آپریٹنگ گائیڈ"), h1_ur))
    story.append(HRFlowable(width="100%", thickness=0.8, color=green_accent, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph(u("۱۔ مشین کا آغاز اور خودکار کیلیبریشن (System Boot & Calibration)"), h2_ur))
    story.append(Paragraph(
        u("جب مشین آن ہوتی ہے تو آرڈوینو میگا تمام سینسرز اور سرووز کو محفوظ حالت میں لاتا ہے۔ تمام آئرس سرووز ۱۷۸ ڈگری (مکمل بند) اور نیچے والے ڈراپ گیٹ سرووز صفر ڈگری پر بند ہو جاتے ہیں۔ اس کے فوراً بعد کیلیبریشن شروع ہوتی ہے:"), body_ur))
    story.append(Paragraph(u("• خالی چیمبر کا فاصلہ ناپنا: داخلی سینسر سے ۷ بار اور اندرونی سائزنگ سینسرز سے ۵ بار فاصلہ ناپا جاتا ہے۔ اگر ریڈنگز میں ۲ سینٹی میٹر سے کم فرق ہو تو مشین اسے خالی چیمبر محفوظ کر لیتی ہے۔"), bullet_ur))
    story.append(Paragraph(u("• لوڈ سیل کا زیرو (Tare) کرنا: پیپر چیمبر کا ایچ ایکس ۷۱۱ لوڈ سیل ۱۲ بار وزن پڑھ کر اسے زیرو مان لیتا ہے۔"), bullet_ur))
    story.append(Paragraph(u("• ریڈی سگنل: تمام سینسرز درست ہونے پر آرڈوینو کمپیوٹر کو CALIBRATION:OK کا میسج بھیج کر انتظار کی حالت میں آ جاتا ہے۔"), bullet_ur))

    story.append(Paragraph(u("۲۔ داخلی سینسر پر بوتل یا کین کی شناخت (3-Stage Filter)"), h2_ur))
    story.append(Paragraph(
        u("ہوا کے جھونکے یا ہاتھ کے اچانک گزرنے سے غلط ٹریگر نہ ہو، اس کے لیے سافٹ ویئر میں ۳ سخت فلٹرز ہیں:"), body_ur))
    story.append(Paragraph(u("۱۔ راستہ صاف ہونا: داخلی سینسر کم از کم ۵ بار اور ۱ سیکنڈ تک خالی راستہ دیکھے۔"), bullet_ur))
    story.append(Paragraph(u("۲۔ فاصلے کی برابری: بوتل سامنے آنے پر مسلسل ۵ بار فاصلہ ۲ سینٹی میٹر سے زیادہ نہ بدلے۔"), bullet_ur))
    story.append(Paragraph(u("۳۔ ہولڈ ٹائم: بوتل کم از کم ۶۰۰ ملی سیکنڈ تک سینسر کے سامنے موجود رہنی چاہیے۔"), bullet_ur))

    story.append(Paragraph(u("۳۔ چیمبر ۱: پلاسٹک بوتل کا سائز ناپنا اور گرانا (Plastic Workflow)"), h2_ur))
    story.append(Paragraph(u("• آئرس کھلنا: بوتل سامنے آتے ہی آئرس سروو ۱۰ ڈگری پر کھلتا ہے اور کمپیوٹر کو PLASTIC:OBJECT_DETECTED بھیجتا ہے۔"), bullet_ur))
    story.append(Paragraph(u("• بوتل کا نیچے گرنا اور رکنا: بوتل نیچے جانے کے بعد مشین ۲ سیکنڈ (2000ms) کا وقفہ دیتی ہے تاکہ بوتل کا ہلنا بند ہو جائے۔"), bullet_ur))
    story.append(Paragraph(u("• آئرس کا بند ہونا: آئرس فوراً ۱۷۸ ڈگری پر بند ہو جاتا ہے تاکہ صارف کا ہاتھ اندر نہ جائے اور دوسری بوتل نہ ڈالی جا سکے۔"), bullet_ur))
    story.append(Paragraph(u("• ۳ الٹراسونک سینسرز سے سائز کی پیمائش:"), bullet_ur))
    story.append(Paragraph(u("– بڑی بوتل (LARGE): نیچے، درمیان اور اوپر تینوں سینسرز بوتل کو دیکھیں۔"), bullet_ur))
    story.append(Paragraph(u("– درمیانی بوتل (MEDIUM): نیچے اور درمیان والے سینسرز دیکھیں جبکہ اوپر والا خالی ہو۔"), bullet_ur))
    story.append(Paragraph(u("– چھوٹی بوتل (SMALL): صرف نیچے والا سینسر دیکھے اور باقی دونوں خالی ہوں۔"), bullet_ur))
    story.append(Paragraph(u("– غلط پیٹرن (INVALID): اگر کوئی غلط چیز ہو تو مشین کریڈٹ نہیں دیتی، نیچے کا گیٹ کھول کر کچرا نکال دیتی ہے اور خودبخود دوبارہ کیلیبریٹ ہو جاتی ہے۔"), bullet_ur))
    story.append(Paragraph(u("• ڈراپ گیٹ: نیچے کا گیٹ ۱۷۰ ڈگری پر کھلتا ہے، بوتل بن میں گر جاتی ہے اور کمپیوٹر کو BOTTLE:CLEARED آ جاتا ہے۔"), bullet_ur))

    story.append(Paragraph(u("۴۔ چیمبر ۲: میٹل کین اور انڈکٹیو سینسر کی جانچ (Metal Workflow)"), h2_ur))
    story.append(Paragraph(
        u("اس کا طریقہ کار پلاسٹک جیسا ہی ہے، لیکن اس میں پن ۳۲ پر میٹل انڈکٹیو سینسر لگا ہوا ہے:"), body_ur))
    story.append(Paragraph(u("• تیز پیمائش: کین گرنے کے بعد سینسر ۱۲ بار تیزی سے ریڈنگ لیتا ہے۔"), bullet_ur))
    story.append(Paragraph(u("• کین کی تصدیق: ۱۲ میں سے کم از کم ۹ بار سینسر کو میٹل ظاہر کرنا لازمی ہے۔"), bullet_ur))
    story.append(Paragraph(u("• نتیجہ: اصلی کین ہونے پر MATERIAL:CAN (کریڈٹ ملتا ہے)۔ اگر پلاسٹک ڈالا جائے تو MATERIAL:REJECT ہو جاتا ہے۔"), bullet_ur))

    story.append(Paragraph(u("۵۔ چیمبر ۳: کاغذ اور ٹیٹرا پیک کا وزن ناپنا (Paper Workflow)"), h2_ur))
    story.append(Paragraph(u("• ڈبہ رکھنا: اوپر والا سینسر ڈبہ دیکھ کر پیپر آئرس کو ۱۰ ڈگری پر کھولتا ہے۔"), bullet_ur))
    story.append(Paragraph(u("• وزن ناپنا: لوڈ سیل وزن ناپتا ہے۔ کم از کم وزن ۲۰ گرام ہونا لازمی شرط ہے۔"), bullet_ur))
    story.append(Paragraph(u("• گیٹ کھلنا: کمپیوٹر کو وزن کلوگرام میں بھیجا جاتا ہے، نیچے کا گیٹ ۱۰۰ ڈگری پر کھل کر ڈبے کو بن میں گرا دیتا ہے۔"), bullet_ur))

    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SECTION 3: TRUE ROMAN URDU WORKFLOW (AAM FEHM)
    # -------------------------------------------------------------------------
    story.append(Paragraph("SECTION 3: ROMAN URDU WORKFLOW (AAM FEHM AUR MUKAMMAL)", h1_ru))
    story.append(HRFlowable(width="100%", thickness=0.8, color=purple_accent, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("1. Machine Ka Start Hona Aur Auto-Calibration", h2_ru))
    story.append(Paragraph(
        "Jab machine on hoti hai to Arduino Mega tamam pins activate karke <code>makeSafe()</code> chalata hai. "
        "Tamam Iris Servos <b>178° (Band)</b> aur Drop Gate Servos <b>0° / 175° (Band)</b> par set ho jate hain. "
        "Is ke foran baad <code>calibrateAll()</code> chalta hai:", body_ru))
    story.append(Paragraph("• <b>Khali Chamber Ka Faasla (Baseline):</b> Entrance sensor 7 dafa aur andar ke sizing sensors 5 dafa faasla naapte hain. "
                           "Agar sab readings mein 2 cm se kam farq ho, to Arduino isay 'Chamber Khali Hai' ke tor par save kar leta hai.", bullet_ru))
    story.append(Paragraph("• <b>Paper Scale Ka Tare:</b> HX711 Load Cell 12 dafa wazan parh kar usay Zero maan leta hai.", bullet_ru))
    story.append(Paragraph("• <b>Ready Message:</b> Sab theek hone par Arduino computer ko bhejta hai: <code>CALIBRATION:OK</code> aur machine IDLE ho jati hai.", bullet_ru))

    story.append(Paragraph("2. Entrance Sensor: Cheez Ki Shanakht (3-Level Filter)", h2_ru))
    story.append(Paragraph(
        "Hawa ya user ke achanak haath guzarne se ghalat trigger na ho, is ke liye software mein 3 sakht checks hain:", body_ru))
    story.append(Paragraph("1. <b>Clearance:</b> Entrance sensor kam az kam 5 dafa aur 1 second tak bilkul khali rasta dekhe.", bullet_ru))
    story.append(Paragraph("2. <b>Faasla Barabar:</b> Bottle samne aane par lagatar 5 dafa faasla 2 cm se zyada na badle.", bullet_ru))
    story.append(Paragraph("3. <b>Hold Time:</b> Cheez kam az kam 600 ms tak samne thehri rahe.", bullet_ru))

    story.append(Paragraph("3. Chamber 1: Plastic Bottle Sizing aur Drop Ka Tareeqa", h2_ru))
    story.append(Paragraph("• <b>Iris Khulna:</b> Entrance sensor activate hote hi Iris Servo <b>10°</b> par khulta hai aur computer ko message jata hai: <code>PLASTIC:OBJECT_DETECTED</code>.", bullet_ru))
    story.append(Paragraph("• <b>Bottle Girna aur Settle Hona:</b> Bottle neeche girne ke baad <b>2 second (2000 ms) ka waqfa</b> diya jata hai taake bottle hilna band ho jaye.", bullet_ru))
    story.append(Paragraph("• <b>Iris Ka Band Hona:</b> Iris foran <b>178°</b> par band ho jata hai taake user ka haath andar na jaye aur doosri bottle na daali ja sake.", bullet_ru))
    story.append(Paragraph("• <b>3 Ultrasonic Sensors Se Size Naapna:</b>", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>LARGE (Bari Bottle):</b> Bottom, Middle aur Top teeno sensors bottle ko dekhein.", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>MEDIUM (Darmiyani):</b> Bottom aur Middle dekhein, Top khali ho.", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>SMALL (Chhoti):</b> Sirf Bottom sensor dekhe, baaqi dono khali hon.", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>Ghalat Cheez (INVALID):</b> Agar koi ajeeb cheez ho to machine credit nahi deti, drop gate khol kar kachra nikal deti hai aur khud-bakhud re-calibrate ho jati hai.", bullet_ru))
    story.append(Paragraph("• <b>Drop Gate:</b> Gate <b>170°</b> par khulta hai, bottle bin mein gir jati hai aur computer ko message aata hai: <code>BOTTLE:CLEARED</code>.", bullet_ru))

    story.append(Paragraph("4. Chamber 2: Metal Can aur Inductive Sensor Ka Kaam", h2_ru))
    story.append(Paragraph("• <b>Tez Pemaish:</b> Can girne ke baad Inductive sensor (Pin 32) 12 dafa tezi se check karta hai.", bullet_ru))
    story.append(Paragraph("• <b>Metal Confirm:</b> 12 mein se kam az kam <b>9 dafa</b> sensor ko 'Metal' detect karna zaroori hai.", bullet_ru))
    story.append(Paragraph("• <b>Nateeja:</b> Asal can hone par <code>MATERIAL:CAN</code> (Credit milta hai). Plastic daal di jaye to <code>MATERIAL:REJECT</code> ho jata hai.", bullet_ru))

    story.append(Paragraph("5. Chamber 3: Paper aur Tetra Pak (Load Cell Se Wazan)", h2_ru))
    story.append(Paragraph("• <b>Dabba Daalna:</b> Top sensor dabba dekhte hi Iris 10° par kholta hai.", bullet_ru))
    story.append(Paragraph("• <b>Wazan:</b> HX711 Load Cell wazan naapta hai. Kam az kam wazan <b>20 Gram</b> hona lazmi hai.", bullet_ru))
    story.append(Paragraph("• <b>Drop Gate:</b> Computer ko wazan jata hai aur Bottom Gate <b>100°</b> par khul kar dabbe ko neeche gira deta hai.", bullet_ru))

    story.append(Spacer(1, 4))

    # -------------------------------------------------------------------------
    # SECTION 4: HARDWARE PINOUT SUMMARY TABLE
    # -------------------------------------------------------------------------
    story.append(Paragraph("SECTION 4: HARDWARE PINOUT & WIRING MATRIX", h1_en))
    story.append(HRFlowable(width="100%", thickness=0.8, color=blue_accent, spaceBefore=2, spaceAfter=6))

    hw_data = [
        [Paragraph("<b>Subsystem</b>", body_en), Paragraph("<b>Components & Sensors</b>", body_en), Paragraph("<b>Arduino Mega 2560 Pins</b>", body_en)],
        [Paragraph("<b>Chamber 1 (Plastic)</b>", body_en), Paragraph("Entrance US, Bottom US, Mid US, Top US, Iris Servo, Drop Servo", body_en),
         Paragraph("Trig/Echo: <b>9/10, 22/23, 24/41, 42/43</b> | Servos: <b>11, 12</b>", code_text)],
        [Paragraph("<b>Chamber 2 (Metal)</b>", body_en), Paragraph("Entrance US, Bottom US, Mid US, Top US, Inductive Sensor, 2x Servos", body_en),
         Paragraph("Trig/Echo: <b>25/26, 29/30, 31/44, 45/46</b> | Inductive: <b>32</b> | Servos: <b>27, 28</b>", code_text)],
        [Paragraph("<b>Chamber 3 (Paper)</b>", body_en), Paragraph("Top US, Bottom US, HX711 Load Cell Module, Iris Servo, Drop Servo", body_en),
         Paragraph("Trig/Echo: <b>33/34, 39/40</b> | HX711: <b>DOUT 37, SCK 38</b> | Servos: <b>35, 36</b>", code_text)],
        [Paragraph("<b>Power Distribution</b>", body_en), Paragraph("Logic +5V, High-Current Servos +5V (10A PSU), Inductive Sensor +12V", body_en),
         Paragraph("5V Logic (Arduino Pin 5V) | Servo Power (External 5V 10A PSU) | Inductive (+12V DC)", code_text)]
    ]
    hw_table = Table(hw_data, colWidths=[38*mm, 66*mm, 74*mm])
    hw_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0f2fe")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#93c5fd")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(hw_table)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Master Trilingual PDF Successfully Generated: {PDF_OUTPUT_PATH}")

    # Copy to brain
    import shutil
    shutil.copy2(PDF_OUTPUT_PATH, BRAIN_OUTPUT_PATH)
    print(f"Copied to Brain Artifacts: {BRAIN_OUTPUT_PATH}")

if __name__ == '__main__':
    build_pdf()
