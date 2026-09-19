"""
Generate a professional, multi-page PDF Document:
PECODROP RVM — COMPLETE SYSTEM WORKFLOW & FIRMWARE MANUAL
Includes both English & True Roman Urdu side-by-side / structured sections.
Strictly matching PecoDropDesktopApp/Arduino/RVM_Arduino/RVM_Arduino.ino.
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
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(20 * mm, 285 * mm, "PECODROP RVM — FIRMWARE WORKFLOW MANUAL (ENGLISH & ROMAN URDU)")
            self.drawRightString(190 * mm, 285 * mm, "RVM_Arduino.ino")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(20 * mm, 282 * mm, 190 * mm, 282 * mm)

        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(20 * mm, 12 * mm, "CONFIDENTIAL & PROPRIETARY — PECODROP AUTOMATION")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(190 * mm, 12 * mm, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(20 * mm, 16 * mm, 190 * mm, 16 * mm)
        self.restoreState()

def build_pdf():
    os.makedirs(os.path.dirname(PDF_OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=22 * mm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Dark Slate
    accent_blue = colors.HexColor("#0284c7")   # Sky Blue
    accent_green = colors.HexColor("#059669")  # Emerald Green
    bg_light = colors.HexColor("#f8fafc")      # Light Slate

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=accent_blue,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=12,
        bulletIndent=4,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    urdu_title_style = ParagraphStyle(
        'UrduTitle',
        parent=h1_style,
        textColor=accent_green
    )

    urdu_h2_style = ParagraphStyle(
        'UrduH2',
        parent=h2_style,
        textColor=colors.HexColor("#065f46")
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # =========================================================================
    # COVER / HEADER
    # =========================================================================
    story.append(Paragraph("PECODROP REVERSE VENDING MACHINE (RVM)", title_style))
    story.append(Paragraph("<b>Complete System Firmware Workflow & Operating Manual</b><br/>"
                           "Strict 1:1 Implementation Reference for: <code>RVM_Arduino.ino</code><br/>"
                           "<i>Dual-Language Edition: English Technical Guide & True Roman Urdu (Aam Fehm)</i>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=0, spaceAfter=12))

    # Meta Table
    meta_data = [
        [Paragraph("<b>Target Hardware:</b> Arduino Mega 2560", body_style),
         Paragraph("<b>Baud Rate:</b> 115200 bps", body_style),
         Paragraph("<b>Active Modules:</b> Plastic, Metal, Paper", body_style)],
        [Paragraph("<b>Servo Frequency:</b> 50 Hz PWM", body_style),
         Paragraph("<b>ADC / Load Cell:</b> HX711 (24-bit)", body_style),
         Paragraph("<b>Ultrasonics:</b> HC-SR04 (40 kHz)", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[58*mm, 58*mm, 58*mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 1: ENGLISH TECHNICAL WORKFLOW
    # =========================================================================
    story.append(Paragraph("SECTION 1: ENGLISH TECHNICAL WORKFLOW", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=accent_blue, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("1. System Boot & Empty Calibration Phase", h2_style))
    story.append(Paragraph(
        "Upon power-up, the firmware initializes all digital I/O pins and executes <code>makeSafe()</code>, "
        "moving all Iris Servos to <b>178° (Closed)</b> and Drop Gate Servos to <b>0° (Closed)</b>. "
        "It then immediately runs <code>calibrateAll()</code>:", body_style))
    story.append(Paragraph("• <b>Ultrasonic Baseline Acquisition:</b> Samples entrance sensors 7 times and internal sizing sensors 5 times. "
                           "Requires 100% stable readings where max-min deviation is ≤ 2 cm to eliminate false/jumping reflections.", bullet_style))
    story.append(Paragraph("• <b>HX711 Load Cell Tare:</b> Averages 12 raw 24-bit readings from the HX711 module to establish <code>paperTareRaw</code>.", bullet_style))
    story.append(Paragraph("• <b>Ready Handshake:</b> Once verified, Arduino outputs <code>CALIBRATION:OK</code>, sets <code>calibrated = true</code>, "
                           "and enters <code>MACHINE:IDLE</code> mode.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("2. 3-Tier Entrance Detection & Debounce Engine", h2_style))
    story.append(Paragraph(
        "To prevent accidental triggers from ambient air currents or quick hand passes, <code>updateDetection()</code> implements a 3-stage filter:", body_style))
    story.append(Paragraph("1. <b>Clearance Arming:</b> Entrance must see clear space matching baseline for ≥ 5 consecutive scans and 1000 ms.", bullet_style))
    story.append(Paragraph("2. <b>Distance Consistency:</b> When an object approaches, all readings must stay within a tight 2 cm window for 5 cycles.", bullet_style))
    story.append(Paragraph("3. <b>Hold Time Verification:</b> Object must remain present for ≥ 600 ms before iris actuation begins.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("3. Compartment 1: Plastic Bottle Sizing & Sorting Flow", h2_style))
    story.append(Paragraph("• <b>Iris Opening:</b> Iris opens to <b>10°</b>. Arduino sends <code>PLASTIC:OBJECT_DETECTED</code>.", bullet_style))
    story.append(Paragraph("• <b>Arrival & Settle:</b> Waits up to 5000 ms for bottle to trigger bottom sensor, followed by a <b>2000 ms settle delay</b> to stop bouncing.", bullet_style))
    story.append(Paragraph("• <b>Anti-Cheat Close:</b> Iris snaps shut to <b>178°</b> to block user hands and prevent insertion of a second bottle.", bullet_style))
    story.append(Paragraph("• <b>3-Tier Acoustic Sizing:</b> Reads Bottom, Middle, and Top ultrasonic sensors across 4 scan attempts (2 consecutive matches required):", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>LARGE:</b> Bottom=Occupied, Middle=Occupied, Top=Occupied (Fallback: Bottom=1, Top=1 if middle deflects).", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>MEDIUM:</b> Bottom=Occupied, Middle=Occupied, Top=Clear.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>SMALL:</b> Bottom=Occupied, Middle=Clear, Top=Clear.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>INVALID:</b> Any impossible pattern triggers <code>recoverSizingFault()</code>, dumping the item without credit.", bullet_style))
    story.append(Paragraph("• <b>Drop Actuation:</b> Drop Gate opens to <b>170°</b> for 900 ms, confirms chamber cleared, closes, and emits <code>BOTTLE:CLEARED</code>.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("4. Compartment 2: Metal Can Inductive Verification Flow", h2_style))
    story.append(Paragraph(
        "Operates identically to the Plastic sizing sequence, but adds hardware inductive sensing on <b>Pin 32</b>:", body_style))
    story.append(Paragraph("• <b>High-Speed Multi-Sampling:</b> Reads inductive sensor 12 times consecutively with 15 ms intervals.", bullet_style))
    story.append(Paragraph("• <b>Acceptance Criteria:</b> Requires at least <b>9 out of 12 readings</b> to read <code>LOW</code> (Metal Detected).", bullet_style))
    story.append(Paragraph("• <b>Classification:</b> Metal verified $\\to$ <code>MATERIAL:CAN</code> (Credit awarded). Non-metal inserted $\\to$ <code>MATERIAL:REJECT</code>.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("5. Compartment 3: Paper & Tetra Pak Load Cell Flow", h2_style))
    story.append(Paragraph("• <b>Placement & Iris:</b> Top entrance detects carton $\\to$ Paper Iris opens to 10°.", bullet_style))
    story.append(Paragraph("• <b>HX711 Precision Weighing:</b> Reads scale using conversion factor (<code>Counts / 420.0</code>). Must exceed <b>20.0 grams</b> threshold.", bullet_style))
    story.append(Paragraph("• <b>Stability Evaluation:</b> Requires weight stability within ±5 grams across 3 consecutive readings, then averages 8 samples.", bullet_style))
    story.append(Paragraph("• <b>Gate Action & Clear:</b> Emits <code>SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:&lt;val&gt;</code>. Paper Drop Gate opens to <b>100°</b>, "
                           "verifies weight returns to $\\le 8.0\\text{ g}$, and re-closes to <b>175°</b>.", bullet_style))

    story.append(Spacer(1, 6))

    # Serial Protocol Table
    story.append(Paragraph("6. Host PC Serial Command Reference (115200 Baud)", h2_style))
    cmd_data = [
        [Paragraph("<b>Command</b>", body_style), Paragraph("<b>Arduino Action</b>", body_style), Paragraph("<b>Serial Telemetry Response</b>", body_style)],
        [Paragraph("<code>START</code>", code_style), Paragraph("Enables sorting state machine", body_style), Paragraph("<code>MACHINE:STARTED</code>", code_style)],
        [Paragraph("<code>STOP</code> / <code>RESET</code>", code_style), Paragraph("Closes all gates, stops polling", body_style), Paragraph("<code>MACHINE:STOPPED</code> / <code>RESET:OK</code>", code_style)],
        [Paragraph("<code>CALIBRATE</code>", code_style), Paragraph("Re-measures all empty baselines & scale tare", body_style), Paragraph("<code>CALIBRATION:OK</code> / <code>CALIBRATION:FAILED</code>", code_style)],
        [Paragraph("<code>STATUS</code>", code_style), Paragraph("Reports distance baselines & scale health", body_style), Paragraph("<code>STATUS:RUNNING;PLASTIC_CM:...;PAPER_SCALE:READY</code>", code_style)],
        [Paragraph("<code>SCALE</code>", code_style), Paragraph("Polls raw HX711 counts and current grams", body_style), Paragraph("<code>PAPER:SCALE_RAW:...;SIGNED_GRAMS:45.20</code>", code_style)],
        [Paragraph("<code>DEBUG ON/OFF</code>", code_style), Paragraph("Toggles real-time entrance distance stream", body_style), Paragraph("<code>DEBUG:ON</code> / <code>DEBUG:OFF</code>", code_style)]
    ]
    cmd_table = Table(cmd_data, colWidths=[32*mm, 62*mm, 80*mm])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(cmd_table)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 2: ROMAN URDU WORKFLOW (AAM FEHM AUR MUKAMMAL)
    # =========================================================================
    story.append(Paragraph("SECTION 2: ROMAN URDU WORKFLOW (AAM FEHM AUR MUKAMMAL)", urdu_title_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=accent_green, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("PecoDrop Reverse Vending Machine (RVM) ka Software aur Hardware Workflow", subtitle_style))

    story.append(Paragraph("1. Machine Ka On Hona Aur Auto-Calibration (Shuruati Tayyari)", urdu_h2_style))
    story.append(Paragraph(
        "Jab machine ko on kiya jata hai ya reset kiya jata hai, to Arduino Mega sab se pehle tamam pins ko activate karta hai. "
        "Is ke foran baad <code>makeSafe()</code> function chal kar tamam Iris Servos ko <b>178° (Mukammal Band)</b> aur Drop Gate Servos ko "
        "<b>0° / 175° (Band)</b> position par le jata hai taake koi bhi gate khula na rahe.", body_style))
    story.append(Paragraph("• <b>Khali Chamber Ki Pemaish (Empty Distance Baseline):</b> Machine chalte hi har chamber ka khali hone ka faasla naapti hai. "
                           "Entrance sensor 7 dafa aur andar ke sizing sensors 5 dafa faasla naapte hain. "
                           "Agar sab readings mein 2 cm se kam farq ho, to Arduino isay 'Chamber Khali Hai' ke tor par save kar leta hai.", bullet_style))
    story.append(Paragraph("• <b>Paper Scale Ka Zero (Tare) Karna:</b> HX711 Load Cell se 12 dafa wazan parha jata hai aur usay <b>Zero (Tare)</b> maan liya jata hai.", bullet_style))
    story.append(Paragraph("• <b>Ready Message:</b> Sab theek hone par Arduino computer ko message bhejta hai: <code>CALIBRATION:OK</code> aur machine <code>IDLE</code> mode mein chali jati hai.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("2. Entrance Sensor: Cheez Ki Shanakht (3-Level Filter)", urdu_h2_style))
    story.append(Paragraph(
        "Hawa ke jhonke ya user ke achanak haath guzarne se ghalat trigger (false alarm) na ho, is ke liye software mein 3 sakht checks hain:", body_style))
    story.append(Paragraph("1. <b>Chamber Clearance:</b> Entrance sensor kam az kam 5 dafa aur 1 second tak bilkul khali rasta dekhe.", bullet_style))
    story.append(Paragraph("2. <b>Faasle Ki Barabari:</b> Jab bottle ya can samne aaye, to lagatar 5 dafa faasla 2 cm se zyada na badle.", bullet_style))
    story.append(Paragraph("3. <b>Hold Time:</b> Cheez kam az kam 600 milliseconds (aadhe second se zyada) samne thehri rahe.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("3. Chamber 1: Plastic Bottle Sizing aur Drop Ka Tareeqa", urdu_h2_style))
    story.append(Paragraph("• <b>Iris Khulna:</b> Entrance sensor activate hote hi Iris Servo <b>10°</b> par khulta hai aur computer ko message jata hai: <code>PLASTIC:OBJECT_DETECTED</code>.", bullet_style))
    story.append(Paragraph("• <b>Bottle Ka Girna aur Settle Hona:</b> Machine 5 second intezar karti hai ke bottle neeche pohanch jaye. "
                           "Neeche aane ke baad <b>2 second ($2000\\text{ ms}$) ka waqfa</b> diya jata hai taake bottle hilna band ho jaye aur theek se beth jaye.", bullet_style))
    story.append(Paragraph("• <b>Iris Ka Band Hona:</b> Iris foran <b>178°</b> par band ho jata hai taake user ka haath andar na jaye aur doosri bottle na daali ja sake.", bullet_style))
    story.append(Paragraph("• <b>Size Ki Pemaish (3 Ultrasonic Sensors):</b>", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>LARGE (Bari Bottle):</b> Bottom, Middle aur Top teeno sensors bottle ko detect karein.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>MEDIUM (Darmiyani Bottle):</b> Bottom aur Middle sensor detect karein, jabke Top khali ho.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>SMALL (Chhoti Bottle):</b> Sirf Bottom sensor detect kare, Middle aur Top khali hon.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>Ghalat Pattern (INVALID):</b> Agar koi ajeeb pattern bane to machine credit nahi deti, "
                           "drop gate khol kar kachra nikal deti hai aur khud-bakhud re-calibrate ho jati hai.", bullet_style))
    story.append(Paragraph("• <b>Drop Gate Khulna:</b> Drop Gate <b>170°</b> par khulta hai, bottle bin mein gir jati hai, sensor confirm karte hain ke rasta saaf hai, "
                           "phir gate band ho kar computer ko aata hai: <code>BOTTLE:CLEARED</code>.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("4. Chamber 2: Metal Can aur Inductive Sensor Ka Kaam", urdu_h2_style))
    story.append(Paragraph(
        "Is chamber ka structure Plastic jaisa hi hai, lekin is mein <b>Metal Inductive Sensor (Pin 32)</b> ka izafa hai:", body_style))
    story.append(Paragraph("• <b>Tez Pemaish (12 Samples):</b> Can girne ke baad sensor 12 dafa tezi se parhta hai.", bullet_style))
    story.append(Paragraph("• <b>Metal Ki Tasdeeq:</b> 12 mein se kam az kam <b>9 dafa</b> sensor ko 'Metal' detect karna zaroori hai.", bullet_style))
    story.append(Paragraph("• <b>Nateeja:</b> Agar asal metal can ho to <code>MATERIAL:CAN</code> (Credit milta hai). "
                           "Agar kisi ne plastic bottle is mein daal di ho to <code>MATERIAL:REJECT</code> (User ko credit nahi milega).", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("5. Chamber 3: Paper aur Tetra Pak (Load Cell Se Wazan)", urdu_h2_style))
    story.append(Paragraph("• <b>Dabba Daalna:</b> Top sensor dabba dekhte hi Paper Iris ko 10° par kholta hai.", bullet_style))
    story.append(Paragraph("• <b>Wazan Ki Pemaish:</b> HX711 Load Cell wazan naapta hai. Kam az kam wazan <b>20 Gram</b> hona lazmi hai.", bullet_style))
    story.append(Paragraph("• <b>Wazan Ka Mustahkam Hona:</b> 3 dafa lagatar wazan barabar aane par 8 readings ka average nikaal kar final wazan tay hota hai.", bullet_style))
    story.append(Paragraph("• <b>Gate Khulna:</b> Iris band hota hai, message jata hai <code>MATERIAL:PAPER;WEIGHT_KG:...</code>, "
                           "aur Bottom Gate <b>100°</b> par khul kar dabbe ko neeche gira deta hai. Wazan 8g se kam hone par gate wapis band ho jata hai.", bullet_style))

    story.append(Spacer(1, 6))

    # Hardware Summary Box
    story.append(Paragraph("6. Hardware Wiring Aur Pin Summary", urdu_h2_style))
    hw_data = [
        [Paragraph("<b>Subsystem</b>", body_style), Paragraph("<b>Sensors & Motors</b>", body_style), Paragraph("<b>Arduino Mega Pins</b>", body_style)],
        [Paragraph("<b>Chamber 1 (Plastic)</b>", body_style), Paragraph("Entrance US, 3x Sizing US, 2x Servos", body_style), Paragraph("Trig/Echo: 9/10, 22/23, 24/41, 42/43 | Servos: 11, 12", code_style)],
        [Paragraph("<b>Chamber 2 (Metal)</b>", body_style), Paragraph("Entrance US, 3x Sizing US, Inductive, 2x Servos", body_style), Paragraph("Trig/Echo: 25/26, 29/30, 31/44, 45/46 | Inductive: 32 | Servos: 27, 28", code_style)],
        [Paragraph("<b>Chamber 3 (Paper)</b>", body_style), Paragraph("Top US, Bottom US, HX711 Scale, 2x Servos", body_style), Paragraph("Trig/Echo: 33/34, 39/40 | HX711: DOUT 37, SCK 38 | Servos: 35, 36", code_style)],
        [Paragraph("<b>Power Rails</b>", body_style), Paragraph("Logic +5V, High-Current Servos, Inductive +12V", body_style), Paragraph("5V Logic (Arduino), +5V 10A PSU (Servos), +12V (Inductive)", code_style)]
    ]
    hw_table = Table(hw_data, colWidths=[38*mm, 62*mm, 74*mm])
    hw_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#dcfce7")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#86efac")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(hw_table)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Successfully Generated: {PDF_OUTPUT_PATH}")

    # Copy to brain artifacts
    import shutil
    shutil.copy2(PDF_OUTPUT_PATH, BRAIN_OUTPUT_PATH)
    print(f"Copied to Brain Artifacts: {BRAIN_OUTPUT_PATH}")

if __name__ == '__main__':
    build_pdf()
