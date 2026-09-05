import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import imageio_ffmpeg

def reshape_urdu(text):
    try:
        return get_display(arabic_reshaper.reshape(text))
    except:
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
    np.random.seed(42)
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

def draw_bottle(draw, cx, cy, scale=1.35, color=(56, 189, 248), cap_color=(255, 255, 255)):
    bw, bh = int(26 * scale), int(68 * scale)
    draw.rounded_rectangle([cx - bw, cy - bh, cx + bw, cy + bh], radius=int(8*scale), fill=color, outline=(255, 255, 255), width=int(2.5*scale))
    nw, nh = int(12 * scale), int(16 * scale)
    draw.rounded_rectangle([cx - nw, cy - bh - nh, cx + nw, cy - bh], radius=int(4*scale), fill=cap_color, outline=(255, 255, 255), width=int(2*scale))
    lw, lh = int(24 * scale), int(26 * scale)
    draw.rectangle([cx - lw, cy - lh//2, cx + lw, cy + lh//2], fill=(240, 253, 250))
    draw.text((cx - int(8*scale), cy - int(10*scale)), "R", fill=(4, 120, 87), font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(14*scale)))

def draw_can(draw, cx, cy, scale=1.35):
    cw, ch = int(22 * scale), int(50 * scale)
    draw.rounded_rectangle([cx - cw, cy - ch, cx + cw, cy + ch], radius=int(6*scale), fill=(239, 68, 68), outline=(226, 232, 240), width=int(2.5*scale))
    draw.ellipse([cx - cw, cy - ch - int(5*scale), cx + cw, cy - ch + int(5*scale)], fill=(203, 213, 225), outline=(255, 255, 255), width=int(2*scale))
    draw.ellipse([cx - cw, cy + ch - int(5*scale), cx + cw, cy + ch + int(5*scale)], fill=(148, 163, 184))

def draw_earth(draw, cx, cy, r=44):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(14, 116, 144), outline=(56, 189, 248), width=3)
    draw.ellipse([cx - r*0.5, cy - r*0.6, cx + r*0.2, cy + r*0.1], fill=(16, 185, 129))
    draw.ellipse([cx - r*0.2, cy + r*0.1, cx + r*0.6, cy + r*0.7], fill=(16, 185, 129))

def create_base_canvas(width, height):
    img = Image.new('RGB', (width, height), (3, 36, 28))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        r = int(3 + (9 - 3) * ratio)
        g = int(36 + (54 - 36) * ratio)
        b = int(28 + (42 - 28) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    card_box = [18, 18, width - 18, height - 18]
    draw.rounded_rectangle(card_box, radius=24, outline=(22, 105, 82), width=3, fill=(5, 45, 35))
    return img, draw

def render_instructional_video():
    width, height = 1280, 720
    fps = 24

    font_header_en = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
    font_header_ur = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 26)
    
    font_main_en = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 32)
    font_main_ur = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 32)
    
    font_stage_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22)
    font_stage_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
    font_badge_bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
    font_tip = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
    font_sm_ur = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 15)
    font_badge_ur = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 16)

    steps = [
        ("1", "Press 0 to Start", "شروع کرنے کیلئے 0 دبائیں", "Tip: Touch the glowing circle on screen or press '0' on keypad to begin session"),
        ("2", "Insert Bottle/Can/UBC/Cup", "بوتل، کین یا کپ ڈالیں", "Tip: Ensure container is empty. Insert one container at a time."),
        ("3", "Detect", "خودکار اسکین اور شناخت", "Tip: Optical IR and ultrasonic sensors verify dimensions in milliseconds."),
        ("4", "Press Enter", "آگے بڑھنے کیلئے Enter دبائیں", "Tip: Anti-cheat drop must be verified before rewards are credited."),
        ("5", "Enter Mobile Number / Scan QR Code", "نمبر یا QR اسکین کریں", "Tip: Your 11-digit mobile number links your rewards across all RVM machines."),
        ("6", "Press Enter and Get Points", "پوائنٹس حاصل کریں", "Tip: Redeem your points for mobile balance, discount vouchers and gifts."),
        ("7", "Save", "اپنے ماحول کو سرسبز بنائیں", "Tip: Every single container recycled helps create a cleaner, greener Pakistan.")
    ]

    base_img, _ = create_base_canvas(width, height)

    out_dir1 = r"d:\GIT-HUB\RVM-dash\RVMDesktopApp\Ads\Instructions"
    out_dir2 = r"d:\GIT-HUB\RVM-dash\RVMDesktopApp\bin\Debug\net8.0-windows\Ads\Instructions"
    out_dir3 = r"d:\GIT-HUB\RVM-dash\docs\rvm_desktop_app_docs"
    
    for d in [out_dir1, out_dir2, out_dir3]:
        os.makedirs(d, exist_ok=True)
        
    final_output = os.path.join(out_dir1, "Instructinal.mp4")

    writer = imageio_ffmpeg.write_frames(
        final_output,
        (width, height),
        fps=fps,
        codec="libx264",
        pix_fmt_in="rgb24",
        macro_block_size=1,
        ffmpeg_log_level="error",
        output_params=["-pix_fmt", "yuv420p", "-crf", "18", "-preset", "fast"]
    )
    writer.send(None)

    print(f"[START] Rendering refined, large-format video (1280x720 @ {fps}fps)...")

    frames_per_step = 120
    intro_frames = 72
    outro_frames = 72
    total_frames = intro_frames + (7 * frames_per_step) + outro_frames

    for frame_idx in range(total_frames):
        frame = base_img.copy()
        draw = ImageDraw.Draw(frame)

        # Header with exact spacing
        h_en = "HOW TO USE RVM  • "
        h_ur = reshape_urdu("طریقہ کار")
        bbox_en = draw.textbbox((0, 0), h_en, font=font_header_en)
        bbox_ur = draw.textbbox((0, 0), h_ur, font=font_header_ur)
        w_total = (bbox_en[2] - bbox_en[0]) + (bbox_ur[2] - bbox_ur[0]) + 16
        hx = (width - w_total) // 2
        hy = 38

        star_pulse = int(12 + 3 * math.sin(frame_idx * 0.15))
        draw_star(draw, hx - 35, hy + 17, size=star_pulse, fill=(251, 191, 36))
        draw_star(draw, hx + w_total + 35, hy + 17, size=star_pulse, fill=(251, 191, 36))
        draw.text((hx, hy), h_en, font=font_header_en, fill=(251, 191, 36))
        draw.text((hx + (bbox_en[2] - bbox_en[0]) + 16, hy - 2), h_ur, font=font_header_ur, fill=(251, 191, 36))

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

        # RENDER PHASE CONTENT
        if current_phase == 0:
            # INTRO OVERVIEW
            draw.text((width//2 - 250, 95), "REVERSE VENDING MACHINE • USER GUIDE", font=font_stage_title, fill=(56, 189, 248))
            draw.text((width//2 - 160, 130), reshape_urdu("7 آسان مراحل میں ری سائیکلنگ کریں"), font=font_main_ur, fill=(251, 191, 36))

            # 7 Steps Quick Roadmap Grid
            grid_y = 185
            col_w = 580
            for s_idx, (num, en_t, ur_t, _) in enumerate(steps):
                col = 0 if s_idx < 4 else 1
                row = s_idx if col == 0 else s_idx - 4
                gx = 50 if col == 0 else width - 50 - col_w
                gy = grid_y + row * 82
                draw.rounded_rectangle([gx, gy, gx + col_w, gy + 72], radius=12, fill=(10, 55, 43), outline=(22, 101, 78), width=1)
                
                # Badge
                draw.ellipse([gx + 12, gy + 14, gx + 54, gy + 56], fill=(251, 191, 36))
                draw.text((gx + 26, gy + 22), num, font=font_badge_bold, fill=(6, 45, 35))
                
                draw.text((gx + 68, gy + 14), f"{num}. {en_t}", font=font_stage_sub, fill=(255, 255, 255))
                draw.text((gx + 68, gy + 38), reshape_urdu(ur_t), font=font_badge_ur, fill=(167, 243, 208))

            draw.rounded_rectangle([width//2 - 220, height - 70, width//2 + 220, height - 30], radius=10, fill=(10, 50, 40), outline=(16, 185, 129), width=2)
            draw.text((width//2 - 150, height - 56), "GETTING READY TO START", font=font_badge_bold, fill=(167, 243, 208))

        elif 1 <= current_phase <= 7:
            step_idx = current_phase - 1
            s_num, s_en, s_ur, s_tip = steps[step_idx]

            # Step Progress Bar at top
            step_bar_y = 88
            draw.text((45, step_bar_y), f"STEP {current_phase} OF 7", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15), fill=(56, 189, 248))

            # 7 Progress segments
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
            title_box_y = 118
            draw.rounded_rectangle([45, title_box_y, width - 45, title_box_y + 112], radius=16, fill=(10, 60, 48), outline=(251, 191, 36), width=3)

            # Step Badge
            draw.ellipse([65, title_box_y + 20, 137, title_box_y + 92], fill=(251, 191, 36))
            draw.text((88, title_box_y + 28), s_num, font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 44), fill=(6, 45, 35))

            # Large English & Urdu Title
            draw.text((158, title_box_y + 16), s_en, font=font_main_en, fill=(255, 255, 255))
            draw.text((158, title_box_y + 60), reshape_urdu(s_ur), font=font_main_ur, fill=(251, 191, 36))

            # Stage Container
            stage_y = 248
            stage_h = 405
            draw.rounded_rectangle([45, stage_y, width - 45, stage_y + stage_h], radius=20, fill=(3, 26, 20), outline=(22, 105, 82), width=2)
            st_cx = width // 2

            # STAGE VISUALS PER STEP
            if current_phase == 1:
                # Step 1: Press 0 to Start
                k_cy = stage_y + 165
                key_press = 5 if (sub_frame % 30 < 15) else 0

                p_r = int(sub_frame % 30) * 4
                draw.ellipse([st_cx - 95 - p_r, k_cy - 95 - p_r, st_cx + 95 + p_r, k_cy + 95 + p_r], outline=(251, 191, 36), width=1)

                draw.rounded_rectangle([st_cx - 90, k_cy - 90 + key_press, st_cx + 90, k_cy + 90 + key_press], radius=24, fill=(14, 92, 72), outline=(251, 191, 36), width=4)
                draw.text((st_cx - 24, k_cy - 55 + key_press), "0", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 80), fill=(255, 255, 255))

                is_calib = sub_frame < 50
                st_text = "CALIBRATING ULTRASONIC CHAMBER..." if is_calib else "STATUS: MACHINE READY • APERTURE UNLOCKED"
                st_col = (245, 158, 11) if is_calib else (34, 197, 94)
                
                draw.rounded_rectangle([st_cx - 250, stage_y + stage_h - 75, st_cx + 250, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=st_col, width=2)
                draw_status_dot(draw, st_cx - 220, stage_y + stage_h - 50, r=6, color=st_col)
                draw.text((st_cx - 200, stage_y + stage_h - 60), st_text, font=font_badge_bold, fill=st_col)

            elif current_phase == 2:
                # Step 2: Insert Container
                ap_y = stage_y + 170
                draw.ellipse([st_cx - 120, ap_y - 120, st_cx + 120, ap_y + 120], fill=(2, 20, 15), outline=(16, 185, 129), width=5)
                draw.ellipse([st_cx - 95, ap_y - 95, st_cx + 95, ap_y + 95], fill=(1, 14, 11), outline=(52, 211, 153), width=2)

                anim_ratio = (sub_frame % 40) / 40.0
                slide_x = int(-110 + anim_ratio * 110)
                draw_bottle(draw, st_cx + slide_x, ap_y - 10, scale=1.4)
                draw_can(draw, st_cx + slide_x - 90, ap_y + 15, scale=1.2)

                draw.polygon([
                    (st_cx + 22, ap_y + 80),
                    (st_cx - 22, ap_y + 80),
                    (st_cx, ap_y + 105)
                ], fill=(251, 191, 36))

                draw.rounded_rectangle([st_cx - 280, stage_y + stage_h - 75, st_cx + 280, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw_status_dot(draw, st_cx - 250, stage_y + stage_h - 50, r=6, color=(16, 185, 129))
                draw.text((st_cx - 230, stage_y + stage_h - 60), "APERTURE UNLOCKED • INSERT CONTAINER 1 BY 1", font=font_badge_bold, fill=(167, 243, 208))

            elif current_phase == 3:
                # Step 3: Detect
                ch_x, ch_y = st_cx - 240, stage_y + 40
                draw.rounded_rectangle([ch_x, ch_y, ch_x + 160, ch_y + 240], radius=12, fill=(1, 20, 15), outline=(148, 163, 184), width=3)
                draw_bottle(draw, ch_x + 80, ch_y + 130, scale=1.45)

                laser_y = ch_y + int((sub_frame * 5) % 225) + 8
                draw.line([(ch_x + 6, laser_y), (ch_x + 154, laser_y)], fill=(244, 63, 94), width=4)

                info_x = ch_x + 195
                sensor_rows = [
                    ("Optical IR (D2, D7, D8):", "3 BEAMS ACTIVE", (34, 197, 94)),
                    ("Inductive Sensor (D5):", "NON-METALLIC (PLASTIC)", (56, 189, 248)),
                    ("Ultrasonic Distance:", "HEIGHT = 21.5 CM", (251, 191, 36)),
                    ("Chamber Integrity:", "PASSED [OK]", (34, 197, 94))
                ]
                for r_idx, (r_lbl, r_val, r_col) in enumerate(sensor_rows):
                    ry = ch_y + r_idx * 46 + 15
                    draw_status_dot(draw, info_x, ry + 10, r=5, color=r_col)
                    draw.text((info_x + 16, ry), r_lbl, font=font_stage_sub, fill=(203, 213, 225))
                    draw.text((info_x + 16, ry + 20), r_val, font=font_badge_bold, fill=r_col)

                draw.rounded_rectangle([st_cx - 280, stage_y + stage_h - 75, st_cx + 280, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=(56, 189, 248), width=2)
                draw.text((st_cx - 240, stage_y + stage_h - 60), "CLASSIFIED: MEDIUM PLASTIC BOTTLE • +10 POINTS", font=font_badge_bold, fill=(56, 189, 248))

            elif current_phase == 4:
                # Step 4: Press Enter
                draw.rounded_rectangle([st_cx - 260, stage_y + 35, st_cx + 260, stage_y + 115], radius=14, fill=(10, 55, 45), outline=(16, 185, 129), width=3)
                draw_status_dot(draw, st_cx - 225, stage_y + 60, r=6, color=(16, 185, 129))
                draw.text((st_cx - 200, stage_y + 50), "SERVO DROP GATE (PIN D9): 180° OPEN", font=font_badge_bold, fill=(52, 211, 153))
                draw_status_dot(draw, st_cx - 225, stage_y + 88, r=6, color=(251, 191, 36))
                draw.text((st_cx - 200, stage_y + 78), "PHYSICAL CONFIRMATION: BOTTLE:CLEARED [OK]", font=font_badge_bold, fill=(251, 191, 36))

                e_press = 5 if (sub_frame % 30 < 15) else 0
                e_y = stage_y + 150
                draw.rounded_rectangle([st_cx - 130, e_y + e_press, st_cx + 130, e_y + 90 + e_press], radius=18, fill=(14, 92, 72), outline=(251, 191, 36), width=4)
                draw.text((st_cx - 75, e_y + 22 + e_press), "Enter  ↵", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36), fill=(255, 255, 255))

                draw.rounded_rectangle([st_cx - 280, stage_y + stage_h - 75, st_cx + 280, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=(251, 191, 36), width=2)
                draw.text((st_cx - 250, stage_y + stage_h - 60), "DROP CONFIRMED • PRESS ENTER TO PROCEED TO WALLET", font=font_badge_bold, fill=(251, 191, 36))

            elif current_phase == 5:
                # Step 5: Mobile Number / QR Code
                qr_x = st_cx - 220
                draw_qr_code(draw, qr_x, stage_y + 40, size=150)
                draw.text((qr_x + 28, stage_y + 205), "Citizen App QR", font=font_badge_bold, fill=(167, 243, 208))

                # Phone Keypad
                ph_x = st_cx + 15
                draw.rounded_rectangle([ph_x, stage_y + 35, ph_x + 240, stage_y + 220], radius=16, fill=(10, 50, 40), outline=(56, 189, 248), width=3)
                draw.rectangle([ph_x + 15, stage_y + 50, ph_x + 225, stage_y + 90], fill=(2, 22, 17), outline=(56, 189, 248), width=2)
                draw.text((ph_x + 28, stage_y + 58), "03001234567", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22), fill=(251, 191, 36))
                
                draw.text((ph_x + 45, stage_y + 115), "[ 1 ]  [ 2 ]  [ 3 ]", font=font_stage_sub, fill=(148, 163, 184))
                draw.text((ph_x + 45, stage_y + 145), "[ 4 ]  [ 5 ]  [ 6 ]", font=font_stage_sub, fill=(148, 163, 184))
                draw.text((ph_x + 45, stage_y + 175), "[ 7 ]  [ 8 ]  [ 9 ]", font=font_stage_sub, fill=(148, 163, 184))

                draw.rounded_rectangle([st_cx - 280, stage_y + stage_h - 75, st_cx + 280, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw.text((st_cx - 240, stage_y + stage_h - 60), "11-DIGIT PAKISTANI MOBILE FORMAT: 03xxxxxxxxx [OK]", font=font_badge_bold, fill=(167, 243, 208))

            elif current_phase == 6:
                # Step 6: Get Points
                c_scale = int(6 * math.sin(sub_frame * 0.2))
                draw.rounded_rectangle([st_cx - 220 - c_scale, stage_y + 40 - c_scale, st_cx + 220 + c_scale, stage_y + 210 + c_scale], radius=20, fill=(14, 92, 72), outline=(251, 191, 36), width=4)
                
                draw.text((st_cx - 100, stage_y + 65), "SUCCESS!", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 32), fill=(251, 191, 36))
                draw.text((st_cx - 165, stage_y + 115), "+20 REWARD POINTS", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30), fill=(255, 255, 255))
                draw.text((st_cx - 110, stage_y + 160), "CREDITED TO WALLET", font=font_stage_sub, fill=(167, 243, 208))

                draw_coin(draw, st_cx - 255, stage_y + 120, r=22)
                draw_coin(draw, st_cx + 255, stage_y + 120, r=22)

                draw.rounded_rectangle([st_cx - 280, stage_y + stage_h - 75, st_cx + 280, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw.text((st_cx - 235, stage_y + stage_h - 60), "LOCAL SQL RVMDB & CLOUD SERVER SYNCHRONIZED [OK]", font=font_badge_bold, fill=(52, 211, 153))

            elif current_phase == 7:
                # Step 7: Save
                draw_earth(draw, st_cx - 180, stage_y + 120, r=55)

                m_x = st_cx - 80
                draw.rounded_rectangle([m_x, stage_y + 40, m_x + 320, stage_y + 105], radius=12, fill=(10, 55, 45), outline=(16, 185, 129), width=2)
                draw_leaf(draw, m_x + 24, stage_y + 72, size=18, color=(52, 211, 153))
                draw.text((m_x + 48, stage_y + 55), "CO2 PREVENTED:", font=font_stage_sub, fill=(203, 213, 225))
                draw.text((m_x + 48, stage_y + 75), "0.30 kg", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22), fill=(52, 211, 153))

                draw.rounded_rectangle([m_x, stage_y + 120, m_x + 320, stage_y + 185], radius=12, fill=(10, 55, 45), outline=(56, 189, 248), width=2)
                draw_water_drop(draw, m_x + 24, stage_y + 152, size=18, color=(56, 189, 248))
                draw.text((m_x + 48, stage_y + 135), "WATER CONSERVED:", font=font_stage_sub, fill=(203, 213, 225))
                draw.text((m_x + 48, stage_y + 155), "1.50 Liters", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22), fill=(56, 189, 248))

                draw.rounded_rectangle([st_cx - 280, stage_y + stage_h - 75, st_cx + 280, stage_y + stage_h - 25], radius=12, fill=(10, 52, 42), outline=(16, 185, 129), width=2)
                draw.text((st_cx - 230, stage_y + stage_h - 60), "GREEN CITIZEN • CLEAN PAKISTAN INITIATIVE", font=font_badge_bold, fill=(167, 243, 208))

            # Bottom Tip
            draw.text((st_cx - 290, height - 42), s_tip, font=font_tip, fill=(148, 163, 184))

        elif current_phase == 8:
            # OUTRO SUMMARY
            draw.text((width//2 - 170, 95), "READY TO RECYCLE!", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30), fill=(52, 211, 153))
            draw.text((width//2 - 180, 135), reshape_urdu("تمام 7 مراحل مکمل! ریسائیکلنگ شروع کریں"), font=font_main_ur, fill=(251, 191, 36))

            sum_y = 190
            draw.rounded_rectangle([width//2 - 270, sum_y, width//2 + 270, sum_y + 380], radius=20, fill=(10, 55, 43), outline=(251, 191, 36), width=3)
            
            draw_checkmark(draw, width//2, sum_y + 50, size=32, color=(251, 191, 36), width=5)
            draw.text((width//2 - 130, sum_y + 95), "7 STEPS VERIFIED", font=ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30), fill=(255, 255, 255))
            
            summary_items = [
                ("1. Press 0 to Start", "0 دبائیں"),
                ("2. Insert Bottle/Can", "بوتل یا کین ڈالیں"),
                ("3. Detect & Scan", "خودکار شناخت"),
                ("4. Press Enter", "آگے بڑھیں"),
                ("5. Mobile/QR Code", "نمبر درج کریں"),
                ("6. Get Points & Save", "پوائنٹس حاصل کریں")
            ]
            for idx, (en_s, ur_s) in enumerate(summary_items):
                item_y = sum_y + 150 + idx * 34
                draw.text((width//2 - 230, item_y), en_s, font=font_stage_sub, fill=(255, 255, 255))
                ur_reshaped = reshape_urdu(ur_s)
                draw.text((width//2 + 80, item_y - 2), ur_reshaped, font=font_sm_ur, fill=(251, 191, 36))

            draw.rounded_rectangle([width//2 - 260, height - 70, width//2 + 260, height - 30], radius=10, fill=(10, 50, 40), outline=(16, 185, 129), width=2)
            draw.text((width//2 - 210, height - 56), "TOUCH SCREEN TO BEGIN", font=font_badge_bold, fill=(167, 243, 208))
            draw.text((width//2 + 50, height - 58), reshape_urdu("شروع کرنے کیلئے چھوئیں"), font=font_badge_ur, fill=(251, 191, 36))

        writer.send(frame.tobytes())

        if frame_idx % 120 == 0:
            pct = int((frame_idx / total_frames) * 100)
            print(f"  [PROGRESS] Encoded {frame_idx}/{total_frames} frames ({pct}%)...")

    writer.close()
    print(f"[COMPLETE] Refined instructional video saved to: {final_output}")

    import shutil
    shutil.copy2(final_output, os.path.join(out_dir2, "Instructinal.mp4"))
    shutil.copy2(final_output, os.path.join(out_dir3, "Instructinal_Video.mp4"))
    shutil.copy2(final_output, os.path.join(out_dir1, "ad_1787936050451_Instructinal.mp4"))
    shutil.copy2(final_output, os.path.join(out_dir2, "ad_1787936050451_Instructinal.mp4"))
    print("[DEPLOYED] Successfully synced across all active instruction directories.")

if __name__ == '__main__':
    render_instructional_video()
