"""
Generate Flawless, Professional PDF in Clean English Font (Helvetica):
PECODROP RVM — COMPLETE SYSTEM WORKFLOW & FIRMWARE MANUAL
Dual-Section Manual:
- SECTION 1: English Technical Workflow & Engineering Specifications
- SECTION 2: True Roman Urdu Workflow (Mukammal Aam Fehm Roman Urdu in English Font)
- SECTION 3: Host PC Serial Command Reference Table
- SECTION 4: Complete Hardware Pinout & Wiring Matrix
100% Clean English Typography - ZERO Broken Fonts, ZERO Scrambled Glyphs.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

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
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0284c7"))
            self.drawString(16 * mm, 285 * mm, "PECODROP RVM")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(42 * mm, 285 * mm, "— Complete Firmware Workflow Manual (English & Roman Urdu)")
            self.drawRightString(194 * mm, 285 * mm, "RVM_Arduino.ino")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(16 * mm, 282 * mm, 194 * mm, 282 * mm)

        # Running Footer
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f172a"))
        self.drawString(16 * mm, 12 * mm, "PECODROP AUTOMATION")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(55 * mm, 12 * mm, "| Confidential & Proprietary System Documentation")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(194 * mm, 12 * mm, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(16 * mm, 16 * mm, 194 * mm, 16 * mm)
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
    primary = colors.HexColor("#0f172a")      # Deep Slate
    blue_accent = colors.HexColor("#0284c7")  # Sky Blue
    green_accent = colors.HexColor("#059669") # Emerald Green
    amber_accent = colors.HexColor("#d97706") # Amber
    bg_subtle = colors.HexColor("#f8fafc")

    # Standard High-Quality Helvetica Typography (ZERO Broken Glyphs)
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=primary, spaceAfter=4)
    subtitle_style = ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor("#475569"), spaceAfter=12)

    h1_en = ParagraphStyle('H1_EN', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=blue_accent, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h2_en = ParagraphStyle('H2_EN', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=primary, spaceBefore=6, spaceAfter=3, keepWithNext=True)
    body_en = ParagraphStyle('Body_EN', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=colors.HexColor("#1e293b"), spaceAfter=4)
    bullet_en = ParagraphStyle('Bullet_EN', parent=body_en, leftIndent=10, bulletIndent=3, spaceAfter=2)

    h1_ru = ParagraphStyle('H1_RU', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=green_accent, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h2_ru = ParagraphStyle('H2_RU', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor("#065f46"), spaceBefore=6, spaceAfter=3, keepWithNext=True)
    body_ru = ParagraphStyle('Body_RU', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=colors.HexColor("#1e293b"), spaceAfter=4)
    bullet_ru = ParagraphStyle('Bullet_RU', parent=body_ru, leftIndent=10, bulletIndent=3, spaceAfter=2)

    code_text = ParagraphStyle('Code', parent=styles['Normal'], fontName='Courier-Bold', fontSize=7.5, leading=10, textColor=colors.HexColor("#0f172a"))

    story = []

    # =========================================================================
    # COVER / HEADER
    # =========================================================================
    story.append(Paragraph("PECODROP REVERSE VENDING MACHINE (RVM)", title_style))
    story.append(Paragraph("<b>Complete System Firmware Workflow & Operating Guide</b><br/>"
                           "Strict 1:1 Implementation Reference for: <code>RVM_Arduino.ino</code><br/>"
                           "<i>Dual Edition: English Technical Manual & True Roman Urdu (Aam Fehm Roman Urdu)</i>", subtitle_style))
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

    # =========================================================================
    # SECTION 1: ENGLISH TECHNICAL WORKFLOW
    # =========================================================================
    story.append(Paragraph("SECTION 1: ENGLISH TECHNICAL WORKFLOW", h1_en))
    story.append(HRFlowable(width="100%", thickness=0.8, color=blue_accent, spaceBefore=2, spaceAfter=6))

    story.append(Paragraph("1. System Boot, Safe State & Baseline Auto-Calibration", h2_en))
    story.append(Paragraph(
        "Upon boot, the Arduino Mega initializes all assigned I/O pins and executes <code>makeSafe()</code>, "
        "moving all Iris Servos to <b>178° (Closed)</b> and Drop Gate Servos to <b>0° (Closed)</b>. "
        "The firmware then immediately triggers <code>calibrateAll()</code>:", body_en))
    story.append(Paragraph("• <b>Acoustic Baseline Measurement:</b> Samples the entrance ultrasonic 7 times and internal sizing ultrasonics 5 times. "
                           "Requires 100% stable echoes where the difference between maximum and minimum distance is ≤ 2 cm to eliminate false/jumping readings.", bullet_en))
    story.append(Paragraph("• <b>HX711 Load Cell Tare:</b> Takes 12 consecutive 24-bit readings from the HX711 Paper scale to record <code>paperTareRaw</code> (zero baseline).", bullet_en))
    story.append(Paragraph("• <b>Ready Handshake:</b> Outputs <code>CALIBRATION:OK</code>, sets <code>calibrated = true</code>, and enters <code>MACHINE:IDLE</code> mode.", bullet_en))

    story.append(Paragraph("2. 3-Stage Entrance Anti-Cheat & False-Alarm Filter", h2_en))
    story.append(Paragraph(
        "To prevent accidental triggers from waving hands, shadows, or ambient air currents, <code>updateDetection()</code> enforces 3 sequential filters:", body_en))
    story.append(Paragraph("1. <b>Clearance Arming:</b> The entrance must see clear empty space matching baseline for ≥ 5 consecutive scans and 1000 ms.", bullet_en))
    story.append(Paragraph("2. <b>Distance Consistency:</b> When an object approaches, all readings must stay within a tight 2 cm window for 5 consecutive cycles.", bullet_en))
    story.append(Paragraph("3. <b>Hold Time Verification:</b> The item must remain physically present for at least 600 ms before the iris is commanded to open.", bullet_en))

    story.append(Paragraph("3. Compartment 1: Plastic Bottle Sizing & Sorting Flow", h2_en))
    story.append(Paragraph("• <b>Iris Opening:</b> Iris opens to <b>10°</b> and transmits <code>PLASTIC:OBJECT_DETECTED</code> over Serial (115200 baud).", bullet_en))
    story.append(Paragraph("• <b>Arrival & Settle:</b> Waits up to 5000 ms for bottle arrival at the bottom sensor, followed by a <b>2000 ms settle delay</b> to stop rolling and bouncing.", bullet_en))
    story.append(Paragraph("• <b>Anti-Cheat Close:</b> Iris snaps shut to <b>178°</b> to block user hands and prevent inserting a second item during measurement.", bullet_en))
    story.append(Paragraph("• <b>3-Tier Acoustic Sizing Matrix:</b> Reads Bottom, Middle, and Top ultrasonic sensors across 4 attempts (2 consecutive matches required):", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>LARGE:</b> Bottom=Occupied, Middle=Occupied, Top=Occupied (or Bottom=1, Top=1 fallback if middle deflects).", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>MEDIUM:</b> Bottom=Occupied, Middle=Occupied, Top=Clear.", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>SMALL:</b> Bottom=Occupied, Middle=Clear, Top=Clear.", bullet_en))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>INVALID:</b> Floating objects trigger <code>recoverSizingFault()</code>, dumping item without awarding credit.", bullet_en))
    story.append(Paragraph("• <b>Drop Actuation:</b> Drop Gate opens to <b>170°</b> for 900 ms, verifies chamber cleared, closes to <b>0°</b>, and emits <code>BOTTLE:CLEARED</code>.", bullet_en))

    story.append(Paragraph("4. Compartment 2: Metal Can Inductive Verification Flow", h2_en))
    story.append(Paragraph(
        "Follows the Plastic sizing sequence, but adds hardware inductive sensing on <b>Pin 32</b>:", body_en))
    story.append(Paragraph("• <b>High-Speed Multi-Sampling:</b> Samples inductive sensor 12 times consecutively at 15 ms intervals.", bullet_en))
    story.append(Paragraph("• <b>Acceptance:</b> Requires at least <b>9 out of 12 readings</b> to read <code>LOW</code> (Metal Detected) $\\to$ <code>MATERIAL:CAN</code>.", bullet_en))
    story.append(Paragraph("• <b>Rejection:</b> Non-metallic items inserted into the metal chute emit <code>MATERIAL:REJECT</code> (0 credit awarded).", bullet_en))

    story.append(Paragraph("5. Compartment 3: Paper & Tetra Pak Load Cell Flow", h2_en))
    story.append(Paragraph("• <b>Carton Arrival & Iris:</b> Top entrance detects carton $\\to$ Paper Iris opens to 10°.", bullet_en))
    story.append(Paragraph("• <b>HX711 Precision Weighing:</b> Scales grams using <code>(raw - paperTareRaw) / 420.0</code>. Requires weight ≥ <b>20.0 grams</b> threshold.", bullet_en))
    story.append(Paragraph("• <b>Drop Gate Action:</b> Emits <code>SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:&lt;val&gt;</code>. Paper Drop Gate opens to <b>100°</b>, confirms scale returns to ≤ 8.0 g, and closes to <b>175°</b>.", bullet_en))

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

    # =========================================================================
    # SECTION 2: TRUE ROMAN URDU WORKFLOW (MUKAMMAL AAM FEHM)
    # =========================================================================
    story.append(Paragraph("SECTION 2: ROMAN URDU WORKFLOW (MUKAMMAL AAM FEHM)", h1_ru))
    story.append(HRFlowable(width="100%", thickness=0.8, color=green_accent, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("<b>PecoDrop Reverse Vending Machine (RVM) Firmware Ka Mukammal Tareeqa-e-Kaar</b>", subtitle_style))

    story.append(Paragraph("1. Machine Ka Start Hona Aur Auto-Calibration (Shuruati Tayyari)", h2_ru))
    story.append(Paragraph(
        "Jab machine ko power di jati hai ya restart kiya jata hai, to Arduino Mega sab se pehle tamam pins activate karke <code>makeSafe()</code> chalata hai. "
        "Tamam Iris Servos <b>178 Degree (Mukammal Band)</b> aur Drop Gate Servos <b>0 Degree / 175 Degree (Band)</b> par set ho jate hain taake koi gate khula na rahe. "
        "Is ke foran baad <code>calibrateAll()</code> chalta hai:", body_ru))
    story.append(Paragraph("• <b>Khali Chamber Ka Faasla (Baseline):</b> Entrance sensor 7 dafa aur andar ke sizing sensors 5 dafa faasla naapte hain. "
                           "Agar sab readings mein 2 cm se kam farq ho, to Arduino isay 'Chamber Khali Hai' ke tor par memory mein save kar leta hai.", bullet_ru))
    story.append(Paragraph("• <b>Paper Scale Ka Tare:</b> HX711 Load Cell 12 dafa wazan parh kar usay Zero (Tare) maan leta hai.", bullet_ru))
    story.append(Paragraph("• <b>Ready Message:</b> Sab theek hone par Arduino computer ko bhejta hai: <code>CALIBRATION:OK</code> aur machine <code>IDLE</code> mode mein chali jati hai.", bullet_ru))

    story.append(Paragraph("2. Entrance Sensor: Cheez Ki Shanakht (3-Level Filter)", h2_ru))
    story.append(Paragraph(
        "Hawa ke jhonke ya user ke achanak haath guzarne se jhoota trigger (false alarm) na ho, is ke liye software mein 3 sakht checks hain:", body_ru))
    story.append(Paragraph("1. <b>Clearance:</b> Entrance sensor kam az kam 5 dafa aur 1 second tak bilkul khali rasta dekhe.", bullet_ru))
    story.append(Paragraph("2. <b>Faasla Barabar:</b> Bottle samne aane par lagatar 5 dafa faasla 2 cm se zyada na badle.", bullet_ru))
    story.append(Paragraph("3. <b>Hold Time:</b> Cheez kam az kam 600 ms (aadhe second se zyada) tak samne thehri rahe.", bullet_ru))

    story.append(Paragraph("3. Chamber 1: Plastic Bottle Sizing aur Drop Ka Tareeqa", h2_ru))
    story.append(Paragraph("• <b>Iris Khulna:</b> Entrance sensor activate hote hi Iris Servo <b>10 Degree</b> par khulta hai aur computer ko message jata hai: <code>PLASTIC:OBJECT_DETECTED</code>.", bullet_ru))
    story.append(Paragraph("• <b>Bottle Girna aur Settle Hona:</b> Bottle neeche girne ke baad <b>2 second (2000 ms) ka waqfa</b> diya jata hai taake bottle hilna band ho jaye aur seedhi beth jaye.", bullet_ru))
    story.append(Paragraph("• <b>Iris Ka Band Hona:</b> Iris foran <b>178 Degree</b> par band ho jata hai taake user ka haath andar na jaye aur doosri bottle na daali ja sake.", bullet_ru))
    story.append(Paragraph("• <b>3 Ultrasonic Sensors Se Size Naapna:</b>", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>LARGE (Bari Bottle):</b> Bottom, Middle aur Top teeno sensors bottle ko dekhein.", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>MEDIUM (Darmiyani Bottle):</b> Bottom aur Middle dekhein, Top khali ho.", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>SMALL (Chhoti Bottle):</b> Sirf Bottom sensor dekhe, baaqi dono khali hon.", bullet_ru))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>Ghalat Cheez (INVALID):</b> Agar koi ajeeb pattern bane to machine credit nahi deti, drop gate khol kar kachra nikal deti hai aur khud-bakhud re-calibrate ho jati hai.", bullet_ru))
    story.append(Paragraph("• <b>Drop Gate Khulna:</b> Gate <b>170 Degree</b> par khulta hai, bottle bin mein gir jati hai, sensor confirm karte hain ke rasta saaf hai, phir gate band ho kar computer ko message aata hai: <code>BOTTLE:CLEARED</code>.", bullet_ru))

    story.append(Paragraph("4. Chamber 2: Metal Can aur Inductive Sensor Ka Kaam", h2_ru))
    story.append(Paragraph(
        "Is chamber ka structure Plastic jaisa hi hai, lekin is mein Pin 32 par <b>Metal Inductive Sensor</b> laga hua hai:", body_ru))
    story.append(Paragraph("• <b>Tez Pemaish:</b> Can girne ke baad Inductive sensor 12 dafa tezi se check karta hai.", bullet_ru))
    story.append(Paragraph("• <b>Metal Confirm:</b> 12 mein se kam az kam <b>9 dafa</b> sensor ko 'Metal' detect karna zaroori hai (Logic LOW).", bullet_ru))
    story.append(Paragraph("• <b>Nateeja:</b> Asal can hone par <code>MATERIAL:CAN</code> (Credit milta hai). Agar plastic daal di jaye to <code>MATERIAL:REJECT</code> ho jata hai (User ko credit nahi milega).", bullet_ru))

    story.append(Paragraph("5. Chamber 3: Paper aur Tetra Pak (Load Cell Se Wazan)", h2_ru))
    story.append(Paragraph("• <b>Dabba Daalna:</b> Top entrance sensor dabba dekhte hi Iris 10 Degree par kholta hai.", bullet_ru))
    story.append(Paragraph("• <b>Wazan Ki Pemaish:</b> HX711 Load Cell wazan naapta hai. Kam az kam wazan <b>20 Gram</b> hona lazmi hai.", bullet_ru))
    story.append(Paragraph("• <b>Wazan Mustahkam Hona:</b> 3 dafa lagatar wazan barabar aane par 8 readings ka average nikaal kar final wazan tay hota hai.", bullet_ru))
    story.append(Paragraph("• <b>Drop Gate:</b> Computer ko wazan jata hai aur Bottom Gate <b>100 Degree</b> par khul kar dabbe ko neeche gira deta hai. Wazan 8 gram se kam hone par gate wapis 175 Degree par band ho jata hai.", bullet_ru))

    story.append(Spacer(1, 4))

    # =========================================================================
    # SECTION 3: HARDWARE PINOUT SUMMARY TABLE
    # =========================================================================
    story.append(Paragraph("SECTION 3: HARDWARE PINOUT & WIRING MATRIX", h1_en))
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
    print(f"Master Clean English Font PDF Successfully Generated: {PDF_OUTPUT_PATH}")

    # Copy to brain
    import shutil
    shutil.copy2(PDF_OUTPUT_PATH, BRAIN_OUTPUT_PATH)
    print(f"Copied to Brain Artifacts: {BRAIN_OUTPUT_PATH}")

if __name__ == '__main__':
    build_pdf()
