import os
import math
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import imageio_ffmpeg

def reshape_urdu(text):
    try:
        return get_display(arabic_reshaper.reshape(text))
    except Exception:
        return text

def draw_star(draw, cx, cy, size=14, fill=(251, 191, 36)):
    pts = [
        (cx, cy - size), (cx + size * 0.3, cy - size * 0.3),
        (cx + size, cy), (cx + size * 0.3, cy + size * 0.3),
        (cx, cy + size), (cx - size * 0.3, cy + size * 0.3),
        (cx - size, cy), (cx - size * 0.3, cy - size * 0.3)
    ]
    draw.polygon(pts, fill=fill)

def draw_checkmark(draw, cx, cy, size=18, color=(255, 255, 255), width=3):
    p1 = (cx - size * 0.42, cy)
    p2 = (cx - size * 0.1, cy + size * 0.38)
    p3 = (cx + size * 0.48, cy - size * 0.38)
    draw.line([p1, p2], fill=color, width=width)
    draw.line([p2, p3], fill=color, width=width)

def draw_status_dot(draw, cx, cy, r=6, color=(34, 197, 94)):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

def draw_leaf(draw, cx, cy, size=18, color=(52, 211, 153)):
    pts = [
        (cx - size*0.5, cy + size*0.5),
        (cx - size*0.1, cy - size*0.1),
        (cx + size*0.6, cy - size*0.6),
        (cx + size*0.5, cy + size*0.1),
        (cx - size*0.1, cy + size*0.6)
    ]
    draw.polygon(pts, fill=color)
    draw.line([(cx - size*0.4, cy + size*0.4), (cx + size*0.4, cy - size*0.4)], fill=(16, 185, 129), width=2)

def draw_tree(draw, cx, cy, size=18, color=(34, 197, 94)):
    tw, th = int(size*0.2), int(size*0.6)
    draw.rectangle([cx - tw, cy + int(size*0.4), cx + tw, cy + int(size*0.4) + th], fill=(180, 83, 9))
    pts1 = [(cx, cy - size), (cx - size*0.75, cy), (cx + size*0.75, cy)]
    draw.polygon(pts1, fill=color)
    pts2 = [(cx, cy - int(size*0.4)), (cx - int(size*0.95), cy + int(size*0.45)), (cx + int(size*0.95), cy + int(size*0.45))]
    draw.polygon(pts2, fill=(16, 185, 129))

def draw_water_drop(draw, cx, cy, size=18, color=(56, 189, 248)):
    r = size * 0.45
    draw.ellipse([cx - r, cy - r*0.3, cx + r, cy + r*1.2], fill=color)
    pts = [(cx - r*0.9, cy), (cx, cy - size*0.8), (cx + r*0.9, cy)]
    draw.polygon(pts, fill=color)

def draw_qr_code(draw, x, y, size=130):
    draw.rounded_rectangle([x, y, x + size, y + size], radius=12, fill=(255, 255, 255))
    corners = [(x + 12, y + 12), (x + size - 44, y + 12), (x + 12, y + size - 44)]
    for cx, cy in corners:
        draw.rectangle([cx, cy, cx + 32, cy + 32], fill=(15, 23, 42))
        draw.rectangle([cx + 6, cy + 6, cx + 26, cy + 26], fill=(255, 255, 255))
        draw.rectangle([cx + 10, cy + 10, cx + 22, cy + 22], fill=(15, 23, 42))
    np.random.seed(88)
    grid_sz = 8
    for r in range(grid_sz):
        for c in range(grid_sz):
            if (r < 3 and c < 3) or (r < 3 and c > 4) or (r > 4 and c < 3):
                continue
            if np.random.rand() > 0.45:
                mx = x + 16 + c * 12
                my = y + 16 + r * 12
                draw.rectangle([mx, my, mx + 8, my + 8], fill=(15, 23, 42))

def draw_coin(draw, cx, cy, r=22):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 158, 11), outline=(251, 191, 36), width=3)
    draw.ellipse([cx - r*0.7, cy - r*0.7, cx + r*0.7, cy + r*0.7], outline=(251, 191, 36), width=1)
    draw_star(draw, cx, cy, size=int(r*0.4), fill=(255, 255, 255))

def draw_bottle(draw, cx, cy, scale=1.3, color=(56, 189, 248), cap_color=(255, 255, 255)):
    bw, bh = int(24 * scale), int(64 * scale)
    draw.rounded_rectangle([cx - bw, cy - bh, cx + bw, cy + bh], radius=int(8*scale), fill=color, outline=(255, 255, 255), width=int(2.2*scale))
    nw, nh = int(11 * scale), int(15 * scale)
    draw.rounded_rectangle([cx - nw, cy - bh - nh, cx + nw, cy - bh], radius=int(4*scale), fill=cap_color, outline=(255, 255, 255), width=int(2*scale))
    lw, lh = int(22 * scale), int(24 * scale)
    draw.rectangle([cx - lw, cy - lh//2, cx + lw, cy + lh//2], fill=(240, 253, 250))
    try:
        font_b = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(12*scale))
        draw.text((cx - int(7*scale), cy - int(9*scale)), "P", fill=(14, 116, 144), font=font_b)
    except Exception:
        pass

def draw_can(draw, cx, cy, scale=1.3):
    cw, ch = int(20 * scale), int(48 * scale)
    draw.rounded_rectangle([cx - cw, cy - ch, cx + cw, cy + ch], radius=int(6*scale), fill=(239, 68, 68), outline=(226, 232, 240), width=int(2.2*scale))
    draw.ellipse([cx - cw, cy - ch - int(5*scale), cx + cw, cy - ch + int(5*scale)], fill=(203, 213, 225), outline=(255, 255, 255), width=int(2*scale))
    draw.ellipse([cx - cw, cy + ch - int(5*scale), cx + cw, cy + ch + int(5*scale)], fill=(148, 163, 184))
    try:
        font_c = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(12*scale))
        draw.text((cx - int(7*scale), cy - int(9*scale)), "M", fill=(255, 255, 255), font=font_c)
    except Exception:
        pass

def draw_paper_stack(draw, cx, cy, scale=1.3):
    pw, ph = int(26 * scale), int(36 * scale)
    draw.rounded_rectangle([cx - pw + 5, cy - ph - 5, cx + pw + 5, cy + ph - 5], radius=int(4*scale), fill=(217, 249, 157), outline=(163, 230, 53), width=2)
    draw.rounded_rectangle([cx - pw + 2, cy - ph - 2, cx + pw + 2, cy + ph - 2], radius=int(4*scale), fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    draw.rounded_rectangle([cx - pw, cy - ph, cx + pw, cy + ph], radius=int(4*scale), fill=(255, 255, 255), outline=(148, 163, 184), width=int(2*scale))
    for i in range(4):
        ly = cy - int(18*scale) + i * int(10*scale)
        lw = int(18*scale) if i != 3 else int(11*scale)
        draw.line([(cx - lw, ly), (cx + lw, ly)], fill=(203, 213, 225), width=int(2*scale))
    try:
        font_p = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(8*scale))
        draw.text((cx - int(12*scale), cy + int(12*scale)), "DOCS", fill=(217, 119, 6), font=font_p)
    except Exception:
        pass

def draw_earth(draw, cx, cy, r=44):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(14, 116, 144), outline=(56, 189, 248), width=3)
    draw.ellipse([cx - r*0.5, cy - r*0.6, cx + r*0.2, cy + r*0.1], fill=(16, 185, 129))
    draw.ellipse([cx - r*0.2, cy + r*0.1, cx + r*0.6, cy + r*0.7], fill=(16, 185, 129))

def create_base_canvas(width, height):
    img = Image.new('RGB', (width, height), (4, 28, 24))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        r = int(4 + (10 - 4) * ratio)
        g = int(28 + (46 - 28) * ratio)
        b = int(24 + (40 - 24) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    card_box = [18, 18, width - 18, height - 18]
    draw.rounded_rectangle(card_box, radius=24, outline=(20, 110, 90), width=3, fill=(6, 40, 32))
    return img, draw

def draw_pecodrop_kiosk_diagram(draw, kx, ky, kw=520, kh=340, pulse=0, active_slot=None):
    """Accurately draws the physical PecoDrop kiosk as seen in the machine photo:
       - Deep slate cabinet with dual landscape screens on top
       - Barcode / QR Scanner & Pinpad on the left desk
       - ⭕ Circle (Magenta Glow) for Plastic Bottle
       - 🔺 Triangle (Green Glow) for Aluminum Can
       - 🟦 Square (Cyan Glow) for Document Paper
    """
    font_mini = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 11)
    font_tiny = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 9)
    font_bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)

    # Shadow
    draw.rounded_rectangle([kx - 8, ky + kh - 12, kx + kw + 8, ky + kh + 16], radius=20, fill=(2, 16, 12))

    # Cabinet Body (Deep Slate #111827)
    cab_y = ky + 105
    draw.rounded_rectangle([kx, cab_y, kx + kw, ky + kh], radius=16, fill=(17, 24, 39), outline=(55, 65, 81), width=3)
    
    # Dual Head Display Enclosure (Top)
    draw.rounded_rectangle([kx + 16, ky, kx + kw - 16, cab_y + 12], radius=10, fill=(31, 41, 55), outline=(75, 85, 99), width=2)
    
    # Display 1 (Left: Video & Instructions)
    s_w = (kw - 64) // 2
    s_h = 76
    draw.rounded_rectangle([kx + 26, ky + 12, kx + 26 + s_w, ky + 12 + s_h], radius=6, fill=(4, 30, 24), outline=(16, 185, 129), width=2)
    draw.text((kx + 35, ky + 18), "▶ INSTRUCTION DISPLAY", fill=(251, 191, 36), font=font_mini)
    draw.text((kx + 35, ky + 36), "HOW TO USE PECO DROP", fill=(255, 255, 255), font=font_tiny)
    draw.rounded_rectangle([kx + 35, ky + 56, kx + 26 + s_w - 14, ky + 66], radius=3, fill=(16, 185, 129))

    # Display 2 (Right: Interactive Kiosk & Leaderboard)
    s2_x = kx + 38 + s_w
    draw.rounded_rectangle([s2_x, ky + 12, s2_x + s_w, ky + 12 + s_h], radius=6, fill=(15, 23, 42), outline=(56, 189, 248), width=2)
    draw.text((s2_x + 10, ky + 18), "🏆 LIVE LEADERBOARD", fill=(56, 189, 248), font=font_mini)
    draw.text((s2_x + 10, ky + 36), "PLASTIC • CANS • PAPER", fill=(203, 213, 225), font=font_tiny)
    draw.rounded_rectangle([s2_x + 10, ky + 56, s2_x + s_w - 14, ky + 66], radius=3, fill=(245, 158, 11))

    # Countertop Desk Deck
    deck_y = cab_y + 8
    deck_h = 74
    draw.rectangle([kx + 5, deck_y, kx + kw - 5, deck_y + deck_h], fill=(31, 41, 55))
    draw.line([(kx + 5, deck_y + deck_h), (kx + kw - 5, deck_y + deck_h)], fill=(75, 85, 99), width=2)

    # 1. Optical Scanner & Keypad (Far Left Console)
    kp_x = kx + 18
    kp_y = deck_y + 8
    draw.rounded_rectangle([kp_x, kp_y, kp_x + 46, kp_y + 58], radius=6, fill=(15, 23, 42), outline=(100, 116, 139), width=2)
    # Optical Scanner Window
    draw.rectangle([kp_x + 6, kp_y + 6, kp_x + 40, kp_y + 24], fill=(2, 6, 23), outline=(51, 65, 85), width=1)
    laser_y = int(kp_y + 9 + 4 * math.sin(pulse * 0.3))
    draw.line([(kp_x + 8, laser_y), (kp_x + 38, laser_y)], fill=(239, 68, 68), width=2)
    # Keypad Grid
    for r in range(3):
        for c in range(3):
            draw.rectangle([kp_x + 8 + c*11, kp_y + 28 + r*9, kp_x + 14 + c*11, kp_y + 34 + r*9], fill=(148, 163, 184))

    # Glow Pulse Offset
    glow_p = int(3 + 2.5 * math.sin(pulse * 0.25))

    # 2. Aperture 1: Circle ⭕ (Neon Magenta/Pink) -> PLASTIC
    c_cx = kx + 130
    c_cy = deck_y + 37
    c_r = 28
    is_c_active = (active_slot == 'circle')
    c_glow_col = (251, 113, 133) if is_c_active else (236, 72, 153)
    draw.ellipse([c_cx - c_r - 5 - glow_p, c_cy - int((c_r+5+glow_p)*0.65), c_cx + c_r + 5 + glow_p, c_cy + int((c_r+5+glow_p)*0.65)], outline=c_glow_col, width=2)
    draw.ellipse([c_cx - c_r - 2, c_cy - int((c_r+2)*0.65), c_cx + c_r + 2, c_cy + int((c_r+2)*0.65)], fill=(236, 72, 153))
    draw.ellipse([c_cx - c_r + 8, c_cy - int((c_r-8)*0.65), c_cx + c_r - 8, c_cy + int((c_r-8)*0.65)], fill=(8, 12, 22))

    # 3. Aperture 2: Triangle 🔺 (Neon Green/Emerald) -> METAL CANS
    t_cx = kx + 250
    t_cy = deck_y + 37
    t_s = 34
    is_t_active = (active_slot == 'triangle')
    t_glow_col = (134, 239, 172) if is_t_active else (74, 222, 128)
    pts_glow = [
        (t_cx, t_cy - t_s - glow_p),
        (t_cx - t_s - 6 - glow_p, t_cy + int(t_s*0.7) + glow_p),
        (t_cx + t_s + 6 + glow_p, t_cy + int(t_s*0.7) + glow_p)
    ]
    draw.polygon(pts_glow, outline=t_glow_col, fill=(20, 83, 45))
    pts_tri = [
        (t_cx, t_cy - t_s),
        (t_cx - t_s - 4, t_cy + int(t_s*0.65)),
        (t_cx + t_s + 4, t_cy + int(t_s*0.65))
    ]
    draw.polygon(pts_tri, fill=(34, 197, 94))
    pts_tri_inner = [
        (t_cx, t_cy - t_s + 11),
        (t_cx - t_s + 11, t_cy + int(t_s*0.5)),
        (t_cx + t_s - 11, t_cy + int(t_s*0.5))
    ]
    draw.polygon(pts_tri_inner, fill=(8, 12, 22))

    # 4. Aperture 3: Square 🟦 (Neon Cyan/Sky Blue) -> PAPER
    s_cx = kx + 380
    s_cy = deck_y + 37
    sq_w, sq_h = 32, 22
    is_s_active = (active_slot == 'square')
    s_glow_col = (165, 243, 252) if is_s_active else (103, 232, 249)
    draw.rounded_rectangle([s_cx - sq_w - 5 - glow_p, s_cy - sq_h - 5 - glow_p, s_cx + sq_w + 5 + glow_p, s_cy + sq_h + 5 + glow_p], radius=8, outline=s_glow_col, fill=(8, 51, 68))
    draw.rounded_rectangle([s_cx - sq_w, s_cy - sq_h, s_cx + sq_w, s_cy + sq_h], radius=6, fill=(6, 182, 212))
    draw.rounded_rectangle([s_cx - sq_w + 7, s_cy - sq_h + 6, s_cx + sq_w - 7, s_cy + sq_h - 6], radius=4, fill=(8, 12, 22))

    # Kiosk Front Decal
    draw.rounded_rectangle([kx + 65, cab_y + 105, kx + kw - 65, cab_y + 200], radius=10, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
    draw.text((kx + 160, cab_y + 120), "PECO DROP", fill=(52, 211, 153), font=font_bold)
    draw.text((kx + 105, cab_y + 155), "ENTERPRISE MULTI-RECYCLING SYSTEM", fill=(148, 163, 184), font=font_tiny)
    draw.text((kx + 90, cab_y + 175), "⭕ PLASTIC   •   🔺 CANS   •   🟦 PAPER", fill=(251, 191, 36), font=font_mini)

def render_pecodrop_instructional_video():
    width, height = 1280, 720
    fps = 24

    # Fonts: True Nastaliq Urdu Font for Urdu text
    nastaliq_font_path = r"d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\Fonts\Jameel Noori Nastaleeq.ttf"
    if not os.path.exists(nastaliq_font_path):
        nastaliq_font_path = r"d:\GIT-HUB\RVM-dash\RVMDesktopApp\Fonts\Jameel Noori Nastaleeq.ttf"

    font_header_en = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
    font_header_ur = ImageFont.truetype(nastaliq_font_path, 34)
    
    font_main_en = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30)
    font_main_ur = ImageFont.truetype(nastaliq_font_path, 38)
    
    font_stage_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22)
    font_stage_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
    font_badge_bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
    font_tip = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
    font_sm_ur = ImageFont.truetype(nastaliq_font_path, 22)
    font_badge_ur = ImageFont.truetype(nastaliq_font_path, 24)

    # 7 Corporate Enterprise Steps with True Nastaliq Urdu Translation
    steps = [
        ("1", "Press 0 to Start / Touch Screen", "شروع کرنے کیلئے اسکرین کو چھوئیں یا 0 دبائیں", "Tip: Touch the glowing kiosk screen or press '0' to activate all 3 intake compartments."),
        ("2", "Insert Bottle, Can or Paper (⭕ 🔺 🟦)", "مخصوص شکل والے خانے میں بوتل، کین یا کاغذ ڈالیں", "Tip: Match items to glowing slots: ⭕ Plastic Bottles, 🔺 Cans, 🟦 Paper Documents."),
        ("3", "Multi-Sensor & Digital Scale Scan", "خودکار اسکین اور ڈیجیٹل وزنی پیمائش", "Tip: Optical IR beams verify bottles; Inductive sensor checks metal; HX711 scale weighs paper."),
        ("4", "Press Enter / Cleared", "ڈراپ تصدیق کیلئے Enter دبائیں", "Tip: Dual motorized iris and drop gate securely ingest materials into segregated bins."),
        ("5", "Scan QR Code or Enter Mobile", "موبائل ایپ کا کیو آر کوڈ اسکینر پر دکھائیں", "Tip: Present your SmartRecycling Mobile App QR to the console scanner for 1-second instant login."),
        ("6", "Earn Eco-Points & Corporate Perks", "کارپوریٹ پوائنٹس اور انعامات حاصل کریں", "Tip: Earn enterprise points for cafeteria discounts, campus vouchers, and department ranking."),
        ("7", "Save Earth & ESG Impact", "ماحول دوست ادارہ اور سرسبز پاکستان", "Tip: Real-time corporate carbon reduction, trees preserved from recycled paper, and water conserved.")
    ]

    base_img, _ = create_base_canvas(width, height)

    out_dirs = [
        r"d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\Ads\Instructions",
        r"d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\bin\Debug\net8.0-windows\Ads\Instructions",
        r"d:\GIT-HUB\RVM-dash\docs\rvm_desktop_app_docs"
    ]
    for d in out_dirs:
        os.makedirs(d, exist_ok=True)

    primary_output = os.path.join(out_dirs[0], "Instructinal.mp4")

    writer = imageio_ffmpeg.write_frames(
        primary_output,
        (width, height),
        fps=fps,
        codec="libx264",
        pix_fmt_in="rgb24",
        macro_block_size=1,
        ffmpeg_log_level="error",
        output_params=["-pix_fmt", "yuv420p", "-crf", "18", "-preset", "fast"]
    )
    writer.send(None)

    print(f"[START] Rendering Physical PecoDrop Instructional Video ({width}x{height} @ {fps}fps)...")
    print(f"  -> Using True Nastaliq Font: {nastaliq_font_path}")

    frames_per_step = 120
    intro_frames = 80
    outro_frames = 80
    total_frames = intro_frames + (7 * frames_per_step) + outro_frames

    for frame_idx in range(total_frames):
        frame = base_img.copy()
        draw = ImageDraw.Draw(frame)

        # Header Title with PecoDrop Branding & Nastaliq Urdu
        h_en = "HOW TO USE PECO DROP • "
        h_ur = reshape_urdu("طریقہ کار")
        bbox_en = draw.textbbox((0, 0), h_en, font=font_header_en)
        bbox_ur = draw.textbbox((0, 0), h_ur, font=font_header_ur)
        w_total = (bbox_en[2] - bbox_en[0]) + (bbox_ur[2] - bbox_ur[0]) + 18
        hx = (width - w_total) // 2
        hy = 34

        star_pulse = int(12 + 3 * math.sin(frame_idx * 0.15))
        draw_star(draw, hx - 36, hy + 17, size=star_pulse, fill=(251, 191, 36))
        draw_star(draw, hx + w_total + 36, hy + 17, size=star_pulse, fill=(251, 191, 36))
        draw.text((hx, hy), h_en, font=font_header_en, fill=(251, 191, 36))
        draw.text((hx + (bbox_en[2] - bbox_en[0]) + 18, hy - 8), h_ur, font=font_header_ur, fill=(251, 191, 36))

        # Determine phase
        if frame_idx < intro_frames:
            current_phase = 0 # Intro
            sub_frame = frame_idx
        elif frame_idx < intro_frames + (7 * frames_per_step):
            elapsed = frame_idx - intro_frames
            current_phase = 1 + (elapsed // frames_per_step)
            sub_frame = elapsed % frames_per_step
        else:
            current_phase = 8 # Outro
            sub_frame = frame_idx - (intro_frames + 7 * frames_per_step)

        # PHASE RENDERING
        if current_phase == 0:
            # INTRO: Showcase Physical PecoDrop Kiosk
            draw.text((width//2 - 280, 88), "PECO DROP • MULTI-MATERIAL ENTERPRISE RVM", font=font_stage_title, fill=(56, 189, 248))
            draw.text((width//2 - 210, 118), reshape_urdu("بوتل، کین اور کاغذ کے 7 آسان مراحل"), font=font_main_ur, fill=(251, 191, 36))

            # Draw the Physical PecoDrop Kiosk with Dual Screens and Glowing Apertures
            draw_pecodrop_kiosk_diagram(draw, width//2 - 260, 190, kw=520, kh=370, pulse=sub_frame)

            draw.rounded_rectangle([width//2 - 280, height - 70, width//2 + 280, height - 30], radius=10, fill=(10, 50, 40), outline=(16, 185, 129), width=2)
            draw.text((width//2 - 220, height - 56), "3 SHAPE COMPARTMENTS: ⭕ PLASTIC • 🔺 CANS • 🟦 PAPER", font=font_badge_bold, fill=(167, 243, 208))

        elif 1 <= current_phase <= 7:
            step_idx = current_phase - 1
            s_num, s_en, s_ur, s_tip = steps[step_idx]

            # Step Progress Bar at top
            step_bar_y = 86
            draw.text((45, step_bar_y), f"STEP {current_phase} OF 7", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15), fill=(56, 189, 248))

            seg_w = 148
            seg_gap = 10
            seg_start_x = 160
            for s in range(7):
                if s < step_idx:
                    seg_col = (16, 185, 129)
                elif s == step_idx:
                    seg_col = (251, 191, 36)
                else:
                    seg_col = (18, 85, 68)
                draw.rounded_rectangle([seg_start_x + s*(seg_w+seg_gap), step_bar_y + 4, seg_start_x + s*(seg_w+seg_gap) + seg_w, step_bar_y + 16], radius=6, fill=seg_col)

            # Prominent Step Title Box
            title_box_y = 114
            draw.rounded_rectangle([45, title_box_y, width - 45, title_box_y + 115], radius=16, fill=(10, 58, 48), outline=(251, 191, 36), width=3)

            # Step Badge
            draw.ellipse([65, title_box_y + 22, 137, title_box_y + 94], fill=(251, 191, 36))
            draw.text((88, title_box_y + 30), s_num, font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 44), fill=(6, 45, 35))

            # English & True Nastaliq Urdu Title
            draw.text((158, title_box_y + 14), s_en, font=font_main_en, fill=(255, 255, 255))
            draw.text((158, title_box_y + 54), reshape_urdu(s_ur), font=font_main_ur, fill=(251, 191, 36))

            # Stage Container
            stage_y = 246
            stage_h = 410
            draw.rounded_rectangle([45, stage_y, width - 45, stage_y + stage_h], radius=20, fill=(3, 25, 20), outline=(22, 105, 82), width=2)
            st_cx = width // 2

            # STAGE VISUALS
            if current_phase == 1:
                # Step 1: Press 0 to Start / Touch Screen (Kiosk Diagram with pulsating shape lights)
                k_cy = stage_y + 165
                key_press = 5 if (sub_frame % 30 < 15) else 0

                draw_pecodrop_kiosk_diagram(draw, 75, stage_y + 25, kw=460, kh=310, pulse=sub_frame)

                # Right side: Touch / Keypad prompt
                rt_x = width - 460
                p_r = int(sub_frame % 30) * 4
                draw.ellipse([rt_x + 100 - p_r, k_cy - 70 - p_r, rt_x + 100 + p_r, k_cy - 70 + p_r], outline=(251, 191, 36), width=1)
                draw.rounded_rectangle([rt_x + 30, k_cy - 80 + key_press, rt_x + 170, k_cy + 60 + key_press], radius=20, fill=(14, 92, 72), outline=(251, 191, 36), width=4)
                draw.text((rt_x + 75, k_cy - 60 + key_press), "0", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 74), fill=(255, 255, 255))

                draw.text((rt_x - 10, k_cy + 85), "TOUCH SCREEN OR PRESS 0", font=font_badge_bold, fill=(255, 255, 255))
                draw.text((rt_x + 5, k_cy + 110), reshape_urdu("شروع کرنے کیلئے 0 دبائیں"), font=font_badge_ur, fill=(251, 191, 36))

                draw.rounded_rectangle([st_cx - 310, stage_y + stage_h - 65, st_cx + 310, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(34, 197, 94), width=2)
                draw_status_dot(draw, st_cx - 280, stage_y + stage_h - 43, r=6, color=(34, 197, 94))
                draw.text((st_cx - 255, stage_y + stage_h - 52), "3 SHAPE COMPARTMENTS ACTIVE: ⭕ PLASTIC • 🔺 CANS • 🟦 PAPER", font=font_badge_bold, fill=(167, 243, 208))

            elif current_phase == 2:
                # Step 2: Insert into Matching Shape Apertures
                cycle_item = (sub_frame // 40) % 3 # 0=Circle, 1=Triangle, 2=Square
                active_str = 'circle' if cycle_item == 0 else ('triangle' if cycle_item == 1 else 'square')

                # Mini Kiosk diagram on Left
                draw_pecodrop_kiosk_diagram(draw, 65, stage_y + 25, kw=420, kh=300, pulse=sub_frame, active_slot=active_str)

                # Right side: 3 Shape Cards highlighting active item entering
                card_x = width - 520
                anim_slide = int(math.sin(sub_frame * 0.15) * 8)

                shapes = [
                    ("⭕ PLASTIC BOTTLE", (236, 72, 153), "Pink Circle Intake Slot", "plastic"),
                    ("🔺 METAL CAN", (34, 197, 94), "Green Triangle Intake Slot", "can"),
                    ("🟦 PAPER DOCUMENTS", (6, 182, 212), "Cyan Square Intake Slot", "paper")
                ]
                for idx, (sh_title, sh_col, sh_desc, sh_type) in enumerate(shapes):
                    sy = stage_y + 25 + idx * 95
                    is_active = (idx == cycle_item)
                    bg_col = (14, 75, 60) if is_active else (6, 36, 28)
                    bd_width = 3 if is_active else 1

                    draw.rounded_rectangle([card_x, sy, card_x + 440, sy + 85], radius=14, fill=bg_col, outline=sh_col, width=bd_width)
                    draw.text((card_x + 85, sy + 15), sh_title, font=font_badge_bold, fill=sh_col)
                    draw.text((card_x + 85, sy + 45), sh_desc, font=font_stage_sub, fill=(203, 213, 225))

                    if sh_type == "plastic":
                        draw_bottle(draw, card_x + 45, sy + 42 + (anim_slide if is_active else 0), scale=0.85)
                    elif sh_type == "can":
                        draw_can(draw, card_x + 45, sy + 42 + (anim_slide if is_active else 0), scale=0.85)
                    else:
                        draw_paper_stack(draw, card_x + 45, sy + 42 + (anim_slide if is_active else 0), scale=0.85)

                draw.rounded_rectangle([st_cx - 310, stage_y + stage_h - 65, st_cx + 310, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw_status_dot(draw, st_cx - 280, stage_y + stage_h - 43, r=6, color=(16, 185, 129))
                draw.text((st_cx - 250, stage_y + stage_h - 52), "MATCH RECYCLABLE TO ITS ILLUMINATED SHAPE APERTURE", font=font_badge_bold, fill=(167, 243, 208))

            elif current_phase == 3:
                # Step 3: Multi-Sensor & Scale Scan
                ch_x, ch_y = st_cx - 320, stage_y + 35
                draw.rounded_rectangle([ch_x, ch_y, ch_x + 220, ch_y + 250], radius=14, fill=(2, 22, 17), outline=(148, 163, 184), width=3)
                
                if (sub_frame // 30) % 2 == 0:
                    draw_bottle(draw, ch_x + 110, ch_y + 135, scale=1.4)
                else:
                    draw_paper_stack(draw, ch_x + 110, ch_y + 135, scale=1.4)

                laser_y = ch_y + int((sub_frame * 5) % 230) + 10
                draw.line([(ch_x + 8, laser_y), (ch_x + 212, laser_y)], fill=(244, 63, 94), width=4)

                info_x = ch_x + 255
                sensor_rows = [
                    ("Optical IR Beams (D2, D7, D8):", "INTAKE VERIFIED [3/3 ACTIVE]", (34, 197, 94)),
                    ("Inductive Metal Sensor (D5):", "CAN MATERIAL CLASSIFIED [OK]", (56, 189, 248)),
                    ("HX711 Digital Load Cell Scale:", "PAPER WEIGHT: 145.50 GRAMS [OK]", (245, 158, 11)),
                    ("Chamber Clearance Sensor:", "3 SLOTS UNLOCKED & CLEAR", (34, 197, 94))
                ]
                for r_idx, (r_lbl, r_val, r_col) in enumerate(sensor_rows):
                    ry = ch_y + r_idx * 58 + 10
                    draw_status_dot(draw, info_x, ry + 12, r=6, color=r_col)
                    draw.text((info_x + 18, ry), r_lbl, font=font_stage_sub, fill=(203, 213, 225))
                    draw.text((info_x + 18, ry + 24), r_val, font=font_badge_bold, fill=r_col)

                draw.rounded_rectangle([st_cx - 290, stage_y + stage_h - 65, st_cx + 290, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(56, 189, 248), width=2)
                draw.text((st_cx - 260, stage_y + stage_h - 52), "CLASSIFICATION COMPLETE • PAPER & CONTAINERS MEASURED", font=font_badge_bold, fill=(56, 189, 248))

            elif current_phase == 4:
                # Step 4: Press Enter
                draw.rounded_rectangle([st_cx - 280, stage_y + 35, st_cx + 280, stage_y + 115], radius=14, fill=(10, 55, 45), outline=(16, 185, 129), width=3)
                draw_status_dot(draw, st_cx - 245, stage_y + 60, r=6, color=(16, 185, 129))
                draw.text((st_cx - 220, stage_y + 50), "SERVO IRIS & DROP TRAPDOOR: 180° OPEN", font=font_badge_bold, fill=(52, 211, 153))
                draw_status_dot(draw, st_cx - 245, stage_y + 88, r=6, color=(251, 191, 36))
                draw.text((st_cx - 220, stage_y + 78), "PHYSICAL INGESTION CONFIRMED: RECYCLABLES SECURED", font=font_badge_bold, fill=(251, 191, 36))

                e_press = 5 if (sub_frame % 30 < 15) else 0
                e_y = stage_y + 145
                draw.rounded_rectangle([st_cx - 130, e_y + e_press, st_cx + 130, e_y + 90 + e_press], radius=18, fill=(14, 92, 72), outline=(251, 191, 36), width=4)
                draw.text((st_cx - 75, e_y + 22 + e_press), "Enter  ↵", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36), fill=(255, 255, 255))

                draw.rounded_rectangle([st_cx - 290, stage_y + stage_h - 65, st_cx + 290, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(251, 191, 36), width=2)
                draw.text((st_cx - 260, stage_y + stage_h - 52), "DROP CONFIRMED • PRESS ENTER TO CLAIM CORPORATE POINTS", font=font_badge_bold, fill=(251, 191, 36))

            elif current_phase == 5:
                # Step 5: Highlight QR CODE FUNCTIONALITY (Mobile App Scanner on Kiosk Console)
                # Left side: Physical Scanner Console with Phone Scanning QR
                sc_box_x = st_cx - 360
                sc_box_y = stage_y + 20
                draw.rounded_rectangle([sc_box_x, sc_box_y, sc_box_x + 320, sc_box_y + 280], radius=16, fill=(10, 50, 42), outline=(56, 189, 248), width=3)
                draw.text((sc_box_x + 25, sc_box_y + 15), "1. OPTICAL SCANNER (ON KIOSK)", font=font_badge_bold, fill=(56, 189, 248))

                # Smartphone held in hand with QR on screen
                ph_x = sc_box_x + 60
                ph_y = sc_box_y + 55
                draw.rounded_rectangle([ph_x, ph_y, ph_x + 190, ph_y + 185], radius=14, fill=(15, 23, 42), outline=(148, 163, 184), width=3)
                draw.rounded_rectangle([ph_x + 10, ph_y + 12, ph_x + 180, ph_y + 172], radius=8, fill=(255, 255, 255))
                
                # Small QR inside phone
                draw_qr_code(draw, ph_x + 35, ph_y + 25, size=110)
                draw.text((ph_x + 28, ph_y + 145), "SmartRecycling App", font=font_stage_sub, fill=(15, 23, 42))

                # Green / Red Scanning Laser line passing over phone
                scan_laser_y = int(ph_y + 35 + ((sub_frame * 4) % 110))
                draw.line([(ph_x + 25, scan_laser_y), (ph_x + 165, scan_laser_y)], fill=(34, 197, 94), width=3)

                # Right side: Alternative Keypad & Instant Authentication card
                rt_box_x = st_cx + 10
                draw.rounded_rectangle([rt_box_x, sc_box_y, rt_box_x + 350, sc_box_y + 280], radius=16, fill=(8, 45, 36), outline=(251, 191, 36), width=2)
                draw.text((rt_box_x + 20, sc_box_y + 15), "2. FAST CORPORATE LOGIN", font=font_badge_bold, fill=(251, 191, 36))

                # Scan result badge
                draw.rounded_rectangle([rt_box_x + 15, sc_box_y + 55, rt_box_x + 335, sc_box_y + 125], radius=12, fill=(14, 92, 72), outline=(34, 197, 94), width=2)
                draw_checkmark(draw, rt_box_x + 45, sc_box_y + 90, size=24, color=(34, 197, 94), width=4)
                draw.text((rt_box_x + 80, sc_box_y + 68), "QR SCAN VERIFIED!", font=font_badge_bold, fill=(255, 255, 255))
                draw.text((rt_box_x + 80, sc_box_y + 95), "Employee: 0300-1234567 [ACTIVE]", font=font_stage_sub, fill=(167, 243, 208))

                # Keypad fallback
                draw.text((rt_box_x + 20, sc_box_y + 150), "Or enter mobile number on keypad:", font=font_stage_sub, fill=(203, 213, 225))
                draw.rounded_rectangle([rt_box_x + 20, sc_box_y + 180, rt_box_x + 330, sc_box_y + 225], radius=8, fill=(2, 22, 17), outline=(56, 189, 248), width=2)
                draw.text((rt_box_x + 35, sc_box_y + 190), "03001234567  ↵", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22), fill=(251, 191, 36))

                draw.text((rt_box_x + 30, sc_box_y + 235), reshape_urdu("کیو آر کوڈ دکھائیں یا نمبر درج کریں"), font=font_badge_ur, fill=(251, 191, 36))

                draw.rounded_rectangle([st_cx - 310, stage_y + stage_h - 65, st_cx + 310, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw.text((st_cx - 280, stage_y + stage_h - 52), "BUILT-IN QR SCANNER: SCAN SMARTRECYCLING APP FOR 1-TAP LOGIN", font=font_badge_bold, fill=(167, 243, 208))

            elif current_phase == 6:
                # Step 6: Earn Corporate Eco-Points & Perks
                c_scale = int(6 * math.sin(sub_frame * 0.2))
                draw.rounded_rectangle([st_cx - 240 - c_scale, stage_y + 35 - c_scale, st_cx + 240 + c_scale, stage_y + 215 + c_scale], radius=20, fill=(14, 92, 72), outline=(251, 191, 36), width=4)
                
                draw.text((st_cx - 100, stage_y + 60), "SUCCESS!", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 32), fill=(251, 191, 36))
                draw.text((st_cx - 195, stage_y + 110), "+35 CORPORATE ECO-POINTS", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26), fill=(255, 255, 255))
                draw.text((st_cx - 150, stage_y + 155), "CREDITED TO EMPLOYEE WALLET", font=font_stage_sub, fill=(167, 243, 208))

                draw_coin(draw, st_cx - 280, stage_y + 120, r=22)
                draw_coin(draw, st_cx + 280, stage_y + 120, r=22)

                draw.rounded_rectangle([st_cx - 290, stage_y + stage_h - 65, st_cx + 290, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw.text((st_cx - 260, stage_y + stage_h - 52), "CAFETERIA PERKS & CSR CARBON POINTS CREDITED INSTANTLY", font=font_badge_bold, fill=(52, 211, 153))

            elif current_phase == 7:
                # Step 7: Save Earth & ESG Reporting
                draw_earth(draw, st_cx - 200, stage_y + 120, r=55)

                m_x = st_cx - 90
                # Metric 1: CO2
                draw.rounded_rectangle([m_x, stage_y + 30, m_x + 350, stage_y + 88], radius=12, fill=(10, 55, 45), outline=(16, 185, 129), width=2)
                draw_leaf(draw, m_x + 24, stage_y + 58, size=18, color=(52, 211, 153))
                draw.text((m_x + 48, stage_y + 42), "CO2 PREVENTED:", font=font_stage_sub, fill=(203, 213, 225))
                draw.text((m_x + 48, stage_y + 60), "0.55 kg Offset", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20), fill=(52, 211, 153))

                # Metric 2: Trees Saved from Paper
                draw.rounded_rectangle([m_x, stage_y + 96, m_x + 350, stage_y + 154], radius=12, fill=(10, 55, 45), outline=(245, 158, 11), width=2)
                draw_tree(draw, m_x + 24, stage_y + 122, size=16, color=(245, 158, 11))
                draw.text((m_x + 48, stage_y + 108), "TREES CONSERVED (PAPER):", font=font_stage_sub, fill=(203, 213, 225))
                draw.text((m_x + 48, stage_y + 126), "0.02 Trees Protected", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20), fill=(245, 158, 11))

                # Metric 3: Water
                draw.rounded_rectangle([m_x, stage_y + 162, m_x + 350, stage_y + 220], radius=12, fill=(10, 55, 45), outline=(56, 189, 248), width=2)
                draw_water_drop(draw, m_x + 24, stage_y + 190, size=18, color=(56, 189, 248))
                draw.text((m_x + 48, stage_y + 174), "WATER SAVED:", font=font_stage_sub, fill=(203, 213, 225))
                draw.text((m_x + 48, stage_y + 192), "2.20 Liters Preserved", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20), fill=(56, 189, 248))

                draw.rounded_rectangle([st_cx - 290, stage_y + stage_h - 65, st_cx + 290, stage_y + stage_h - 20], radius=10, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw.text((st_cx - 255, stage_y + stage_h - 52), "CORPORATE ESG & CSR INITIATIVE • GREEN CAMPUS CERTIFIED", font=font_badge_bold, fill=(167, 243, 208))

            # Bottom Tip
            draw.text((st_cx - 290, height - 38), s_tip, font=font_tip, fill=(148, 163, 184))

        elif current_phase == 8:
            # OUTRO SUMMARY: Show Physical Kiosk and All Verified Steps
            draw.text((width//2 - 210, 88), "PECO DROP READY TO RECYCLE!", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 28), fill=(52, 211, 153))
            draw.text((width//2 - 250, 118), reshape_urdu("پیکو ڈراپ کے تمام 7 مراحل مکمل! ری سائیکل کریں"), font=font_main_ur, fill=(251, 191, 36))

            # Left side: Physical Kiosk
            draw_pecodrop_kiosk_diagram(draw, 70, 185, kw=460, kh=340, pulse=sub_frame)

            # Right side: Verified Checklist
            sum_x = width - 580
            sum_y = 185
            draw.rounded_rectangle([sum_x, sum_y, sum_x + 520, sum_y + 340], radius=16, fill=(10, 55, 43), outline=(251, 191, 36), width=3)
            
            draw_checkmark(draw, sum_x + 45, sum_y + 40, size=24, color=(251, 191, 36), width=4)
            draw.text((sum_x + 75, sum_y + 25), "7 ENTERPRISE STEPS VERIFIED", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22), fill=(255, 255, 255))
            
            summary_items = [
                ("1. Press 0 / Touch Screen", "شروع کریں"),
                ("2. ⭕ Bottle • 🔺 Can • 🟦 Paper", "مخصوص خانے میں ڈالیں"),
                ("3. Optical IR & Digital Scale", "خودکار اسکین و وزن"),
                ("4. Press Enter to Ingest", "ڈراپ تصدیق"),
                ("5. Scan Mobile QR on Console", "کیو آر کوڈ اسکین"),
                ("6. Earn Eco-Points & Perks", "کارپوریٹ پوائنٹس")
            ]
            for idx, (en_s, ur_s) in enumerate(summary_items):
                item_y = sum_y + 75 + idx * 38
                draw.text((sum_x + 25, item_y), en_s, font=font_stage_sub, fill=(255, 255, 255))
                ur_reshaped = reshape_urdu(ur_s)
                draw.text((sum_x + 360, item_y - 10), ur_reshaped, font=font_sm_ur, fill=(251, 191, 36))

            draw.rounded_rectangle([width//2 - 260, height - 60, width//2 + 260, height - 25], radius=10, fill=(10, 50, 40), outline=(16, 185, 129), width=2)
            draw.text((width//2 - 210, height - 52), "TOUCH SCREEN TO BEGIN", font=font_badge_bold, fill=(167, 243, 208))
            draw.text((width//2 + 50, height - 60), reshape_urdu("شروع کرنے کیلئے چھوئیں"), font=font_badge_ur, fill=(251, 191, 36))

        writer.send(frame.tobytes())

        if frame_idx % 120 == 0:
            pct = int((frame_idx / total_frames) * 100)
            print(f"  [PROGRESS] Encoded {frame_idx}/{total_frames} frames ({pct}%)...")

    writer.close()
    print(f"[COMPLETE] PecoDrop instructional video rendered to: {primary_output}")

    # Synchronize across all destination folders
    dest_files = [
        os.path.join(out_dirs[0], "ad_1787936050451_Instructinal.mp4"),
        os.path.join(out_dirs[1], "Instructinal.mp4"),
        os.path.join(out_dirs[1], "ad_1787936050451_Instructinal.mp4"),
        os.path.join(out_dirs[2], "PecoDrop_Instructional_Video.mp4")
    ]
    for df in dest_files:
        shutil.copy2(primary_output, df)
        print(f"  -> Synced to: {df}")

    print("[SUCCESS] Physical PecoDrop instructional video successfully generated and deployed!")

if __name__ == '__main__':
    render_pecodrop_instructional_video()
