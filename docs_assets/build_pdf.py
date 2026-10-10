import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, PageBreak, KeepTogether
)

pdf_path = r"d:\GIT-HUB\RVM-dash\PecoDrop_Touchless_Web_Portal_Specification.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()

# Color Palette
brand_color = colors.HexColor("#064E3B")      # Deep Emerald Green
accent_green = colors.HexColor("#10B981")     # Eco Green
accent_blue = colors.HexColor("#0284C7")      # Cyan Blue
bg_light = colors.HexColor("#F8FAFC")         # Light Background Card
text_dark = colors.HexColor("#0F172A")        # Dark slate text
border_gray = colors.HexColor("#CBD5E1")      # Border color

# Custom Styles
title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=18,
    leading=22,
    textColor=brand_color
)

page_title_style = ParagraphStyle(
    'PageTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    textColor=brand_color,
    spaceAfter=10
)

heading_style = ParagraphStyle(
    'SectionHeading',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=11.5,
    leading=15,
    textColor=brand_color,
    spaceBefore=8,
    spaceAfter=6
)

body_style = ParagraphStyle(
    'BodyDark',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13.5,
    textColor=text_dark
)

annotation_style = ParagraphStyle(
    'AnnotationText',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12.5,
    textColor=colors.HexColor("#334155")
)

story = []

# =========================================================================
# PAGE 1: COVER & EXECUTIVE OVERVIEW
# =========================================================================

header_data = [
    [
        Paragraph("<b>ISP Environmental Solutions</b><br/><font color='#10B981' size='10'>PecoDrop & RVM Touchless Web Portal</font>", title_style),
        Paragraph("<font color='#166534'><b>v2.6 UPDATED UI SPEC</b></font><br/><font color='#64748B' size='8'>DOC-PECO-TOUCHLESS-2026<br/>October 11, 2026</font>", ParagraphStyle('HeaderRight', parent=body_style, alignment=2, fontSize=8.5))
    ]
]
header_table = Table(header_data, colWidths=[330, 190])
header_table.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(header_table)
story.append(HRFlowable(width="100%", thickness=2.5, color=brand_color, spaceAfter=12))

# Overview Box
overview_html = """<b>Touchless Web Portal System Overview</b><br/>
The PecoDrop Touchless Web Portal provides a complete 100% touchless mobile interface for corporate employees and citizens operating Reverse Vending Machines (RVM). Users scan a dynamic QR code displayed on the kiosk, authenticate via Google SSO or Mobile Number, trigger physical door unlocks, monitor live container telemetry in real-time via the newly updated Live Progress card, and settle earned rewards directly into their Eco Wallet."""

overview_table = Table([[Paragraph(overview_html, ParagraphStyle('OverviewText', parent=body_style, textColor=colors.white, fontSize=9, leading=13.5))]], colWidths=[520])
overview_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), brand_color),
    ('TOPPADDING', (0,0), (-1,-1), 10),
    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
]))
story.append(overview_table)
story.append(Spacer(1, 12))

# 3-Screen Sitemap Overview
story.append(Paragraph("📍 Updated Touchless 3-Screen Operational Workflow", heading_style))

screens_overview_data = [
    [
        Paragraph("<b>SCREEN 1: Start Recycling Mode</b><br/><font color='#475569'>• QR Code Scan Landing Page<br/>• Google SSO & Corporate Auto-Detect<br/>• Mobile Phone Number Input<br/>• Kiosk Remote Start Trigger Button</font>", body_style),
        Paragraph("<b>SCREEN 2: Updated Kiosk Started</b><br/><font color='#475569'>• Kiosk Aperture Unlocked Banner<br/>• <b>NEW Live Kiosk Progress Card</b><br/>• Live Split Containers & Points<br/>• Integrated Finish & Claim Button</font>", body_style),
        Paragraph("<b>SCREEN 3: Points Claimed Mode</b><br/><font color='#475569'>• Session Completion Celebration<br/>• Eco Wallet Points Credit (+35 PTS)<br/>• Available Points Balance Sync<br/>• Touchless Voucher & Perk Store</font>", body_style),
    ]
]
screens_overview_table = Table(screens_overview_data, colWidths=[170, 175, 175])
screens_overview_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), bg_light),
    ('GRID', (0,0), (-1,-1), 1, border_gray),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(screens_overview_table)

story.append(Spacer(1, 14))

# Technical Highlights Card
story.append(Paragraph("⚙️ Key Architectural Highlights", heading_style))
tech_box_html = """
• <b>Zero Physical Contact</b>: Scanning dynamic QR code opens smartphone portal, bypassing kiosk touchscreen and physical keypad.<br/>
• <b>Updated Live Telemetry Card</b>: Displays split real-time <code>CONTAINERS</code> and <code>EARNED +PTS</code> with embedded <code>FINISH & CLAIM</code> button.<br/>
• <b>Single Source of Truth</b>: Real-time telemetry, session state, and wallet balances write exclusively to <b>PostgreSQL (rvmpg)</b>.<br/>
• <b>Browser Hygiene & Safety</b>: <code>window.history.replaceState</code> purges <code>startToken</code> query parameters upon session finish, preventing stale tab re-locks.<br/>
• <b>Dual Desktop Compatibility</b>: Native hardware integration with both <b>PecoDropDesktopApp</b> (Enterprise Corporate) and <b>RVMDesktopApp</b> (Public).
"""
tech_table = Table([[Paragraph(tech_box_html, body_style)]], colWidths=[520])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
    ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
]))
story.append(tech_table)

story.append(Spacer(1, 18))
story.append(HRFlowable(width="100%", thickness=1, color=border_gray, spaceAfter=8))
story.append(Paragraph("Page 1 of 5 • ISP Environmental Solutions • Touchless Web Portal Specification", ParagraphStyle('FooterText', parent=body_style, fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)))


# =========================================================================
# PAGE 2: SCREEN 1 - START RECYCLING MODE
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("📱 SCREEN 1: Start Recycling & Touchless QR Authentication Mode", page_title_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=accent_green, spaceAfter=12))

img1_path = r"d:\GIT-HUB\RVM-dash\docs_assets\start_recycling_screenshot.jpg"

if os.path.exists(img1_path):
    img1 = Image(img1_path, width=2.65*inch, height=5.6*inch)
    
    anno1_text = """
    <b>Screen 1 Component & Authentication Breakdown:</b><br/><br/>
    <b>1. Kiosk Identification Header:</b><br/>
    Displays machine badge <code>REVERSE VENDING MACHINE • PECO-LHR-01</code> confirming active QR handshake target.<br/><br/>
    
    <b>2. Action Title & Urdu Subtitle:</b><br/>
    Displays <b>Start Recycling</b> (مشین شروع کریں اور انعامات حاصل کریں) inviting immediate touchless activation.<br/><br/>
    
    <b>3. System Status Badge:</b><br/>
    Prominently displays <b>READY - TOUCHLESS QR ACTIVATION</b> indicating kiosk is idle and ready to initiate session.<br/><br/>
    
    <b>4. Corporate Google SSO Authentication:</b><br/>
    1-Tap <b>Continue with Google / گوگل اکاؤنٹ</b> button. Corporate email domains (<code>@engro.com</code>, <code>@bankalfalah.com</code>) automatically map user to enterprise perks and departments.<br/><br/>
    
    <b>5. Mobile Phone Number Option:</b><br/>
    Alternative direct phone entry field (e.g. <code>03214424625</code>) for quick guest or non-SSO authentication.<br/><br/>
    
    <b>6. Hardware Start Trigger Button:</b><br/>
    Prominent <b>START KIOSK NOW • مشین شروع کریں</b> green button sends immediate handshake command to unlock hardware apertures.
    """
    
    screen1_data = [
        [img1, Paragraph(anno1_text, annotation_style)]
    ]
    screen1_table = Table(screen1_data, colWidths=[205, 310])
    screen1_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('GRID', (0,0), (-1,-1), 1, border_gray),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(screen1_table)

story.append(Spacer(1, 16))
story.append(HRFlowable(width="100%", thickness=1, color=border_gray, spaceAfter=8))
story.append(Paragraph("Page 2 of 5 • Screen 1 Breakdown • ISP Environmental Solutions", ParagraphStyle('FooterText', parent=body_style, fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)))


# =========================================================================
# PAGE 3: SCREEN 2 - UPDATED KIOSK STARTED ACTIVE MODE
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("🚀 SCREEN 2: Updated Kiosk Started & Live Session Progress Mode", page_title_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=accent_green, spaceAfter=12))

img2_path = r"d:\GIT-HUB\RVM-dash\docs_assets\kiosk_started_screenshot.jpg"

if os.path.exists(img2_path):
    img2 = Image(img2_path, width=2.65*inch, height=5.6*inch)
    
    anno2_text = """
    <b>Screen 2 Component & Live Telemetry Breakdown (Updated UI):</b><br/><br/>
    <b>1. Authenticated Greeting & Machine Banner:</b><br/>
    Displays <b>Kiosk Started!</b> with green recycling logo and personalized greeting: <i>Welcome Aqeel Ur Rehman! Kiosk PECO-LHR-01 is now starting.</i><br/><br/>
    
    <b>2. Unlocked Hardware Status Banner:</b><br/>
    Prominently displays <b>ACTIVE - INSERT CONTAINERS NOW</b> green card confirming physical aperture doors (⭕ Plastic, 🔺 Can, 🟦 Paper) are open.<br/><br/>
    
    <b>3. NEW Live Kiosk Session Progress Widget:</b><br/>
    Features dark emerald card with <code>● LIVE KIOSK SESSION PROGRESS</code> header, streaming live container intake metrics updated every 1.5 seconds:<br/>
    • <b>CONTAINERS</b>: Live count of deposited items (<code>0 🍾</code>)<br/>
    • <b>EARNED</b>: Real-time points calculation (<code>+0 PTS ⭐</code>)<br/><br/>
    
    <b>4. Integrated Remote Session Finish Button:</b><br/>
    Embedded directly inside the Live Progress Card: <b>FINISH & CLAIM POINTS • سیشن مکمل کریں</b> button for 1-tap remote session settlement.<br/><br/>
    
    <b>5. Touchless Rewards Catalog Teaser:</b><br/>
    Displays current user reward balance (<code>0 pts</code>) and quick access to corporate perks (Cafeteria Vouchers, Mobile Airtime, Retail Vouchers, ESG Certificates).
    """
    
    screen2_data = [
        [img2, Paragraph(anno2_text, annotation_style)]
    ]
    screen2_table = Table(screen2_data, colWidths=[205, 310])
    screen2_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('GRID', (0,0), (-1,-1), 1, border_gray),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(screen2_table)

story.append(Spacer(1, 16))
story.append(HRFlowable(width="100%", thickness=1, color=border_gray, spaceAfter=8))
story.append(Paragraph("Page 3 of 5 • Screen 2 Breakdown • ISP Environmental Solutions", ParagraphStyle('FooterText', parent=body_style, fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)))


# =========================================================================
# PAGE 4: SCREEN 3 - POINTS CLAIMED MODE
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("🎉 SCREEN 3: Points Claimed & Eco Wallet Settlement Mode", page_title_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=accent_green, spaceAfter=12))

img3_path = r"d:\GIT-HUB\RVM-dash\docs_assets\points_claimed_screenshot.jpg"

if os.path.exists(img3_path):
    img3 = Image(img3_path, width=2.65*inch, height=5.6*inch)
    
    anno3_text = """
    <b>Screen 3 Component & Settlement Breakdown:</b><br/><br/>
    <b>1. Session Celebration Header:</b><br/>
    Displays celebration icon and confirmation message: <i>Points Claimed! Session completed successfully!</i><br/><br/>
    
    <b>2. Earned Points Credit Banner:</b><br/>
    Prominently displays earned session reward: <b>+35 PTS - ADDED TO YOUR ECO WALLET</b> credited atomically in PostgreSQL database.<br/><br/>
    
    <b>3. Total Eco Wallet Balance Badge:</b><br/>
    Updates and displays user total accumulated points balance in real-time (<b>6,091 pts available</b>).<br/><br/>
    
    <b>4. Browser History Cleaning (replaceState):</b><br/>
    Executes <code>window.history.replaceState</code> to automatically strip <code>startToken</code> query parameter from browser address bar, preventing stale tab re-locks.<br/><br/>
    
    <b>5. Touchless Reward Redemption Store:</b><br/>
    Allows instant point redemptions for <b>Cafeteria Voucher</b> (50 pts), <b>Mobile Airtime</b> (100 pts), <b>Shopping Discount</b> (200 pts), and <b>Plant a Tree</b> ESG certificate (150 pts).
    """
    
    screen3_data = [
        [img3, Paragraph(anno3_text, annotation_style)]
    ]
    screen3_table = Table(screen3_data, colWidths=[205, 310])
    screen3_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('GRID', (0,0), (-1,-1), 1, border_gray),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(screen3_table)

story.append(Spacer(1, 16))
story.append(HRFlowable(width="100%", thickness=1, color=border_gray, spaceAfter=8))
story.append(Paragraph("Page 4 of 5 • Screen 3 Breakdown • ISP Environmental Solutions", ParagraphStyle('FooterText', parent=body_style, fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)))


# =========================================================================
# PAGE 5: TECHNICAL SUMMARY & ARCHITECTURE HIGHLIGHTS
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("⚡ System Capabilities & Technical Architecture", page_title_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=accent_green, spaceAfter=14))

tech_html = """
<b>1. Dual Desktop Engine Compatibility:</b><br/>
The Touchless Web Portal communicates seamlessly with both <b>PecoDropDesktopApp</b> (Enterprise Campus Kiosks with dual landscape displays & paper weight load cell) and <b>RVMDesktopApp</b> (General Public Machines). Both desktop apps poll the central handshake endpoint and execute atomic wallet settlements.<br/><br/>

<b>2. Single Source of Truth — PostgreSQL (rvmpg):</b><br/>
All session transactions, user point balances, voucher redemptions, machine statistics, and organizational departments write exclusively to PostgreSQL. Legacy MongoDB (`rvmapp`) is strictly read-only for historical sync.<br/><br/>

<b>3. Automatic Corporate SSO Domain Verification:</b><br/>
Email domains matching registered corporate organizations (e.g. <code>@engro.com</code>, <code>@bankalfalah.com</code>, <code>@ucp.edu.pk</code>) are automatically provisioned as <b>ENTERPRISE</b> users, linking department metrics and cafeteria perk discounts.<br/><br/>

<b>4. Browser History Cleaning (`replaceState`):</b><br/>
Upon session completion, the web portal automatically executes <code>window.history.replaceState</code> to clean query string tokens. Closing, refreshing, or re-opening the browser tab lands cleanly on the <b>Start Recycling</b> screen without locking into stale completed states.<br/><br/>

<b>5. Touchless Reward Redemption Store:</b><br/>
Users can spend earned points instantly for Cafeteria Meal Vouchers, Mobile Airtime Cards (EasyPaisa / JazzCash), Retail Discounts, or ESG Tree Certificates directly from the smartphone portal.
"""

summary_table = Table([[Paragraph(tech_html, body_style)]], colWidths=[520])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), bg_light),
    ('GRID', (0,0), (-1,-1), 1, border_gray),
    ('TOPPADDING', (0,0), (-1,-1), 14),
    ('BOTTOMPADDING', (0,0), (-1,-1), 14),
    ('LEFTPADDING', (0,0), (-1,-1), 14),
    ('RIGHTPADDING', (0,0), (-1,-1), 14),
]))
story.append(summary_table)

story.append(Spacer(1, 30))
story.append(HRFlowable(width="100%", thickness=1, color=border_gray, spaceAfter=8))
story.append(Paragraph("Page 5 of 5 • Technical Summary • © 2026 ISP Environmental Solutions", ParagraphStyle('FooterText', parent=body_style, fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)))

doc.build(story)
print("Updated screen-by-screen PDF generated successfully at:", pdf_path)
