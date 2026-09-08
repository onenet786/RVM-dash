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
    except Exception:
        return text

def create_reject_video():
    width, height = 1280, 720
    fps = 30
    duration_sec = 3.5
    total_frames = int(fps * duration_sec)

    out_paths = [
        os.path.abspath("RVMDesktopApp/Assets/ItemRejected.mp4"),
        os.path.abspath("RVMDesktopApp/bin/Debug/net8.0-windows/Assets/ItemRejected.mp4")
    ]

    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)

    temp_out = os.path.abspath("scratch/temp_reject.mp4")
    writer = imageio_ffmpeg.write_frames(
        temp_out,
        (width, height),
        fps=fps,
        codec="libx264",
        pix_fmt_in="rgb24",
        quality=8
    )
    writer.send(None)

    font_huge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 62)
    font_large = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 26)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)

    urdu_title = reshape_urdu("آئٹم مسترد کر دیا گیا")
    urdu_action = reshape_urdu("برائے مہربانی اپنا آئٹم واپس نکال لیں")

    for i in range(total_frames):
        t = i / fps
        pulse = 0.5 + 0.5 * math.sin(t * 8.0)
        scale_cross = 1.0 + 0.08 * math.sin(t * 10.0)

        # Background gradient: deep dark red
        bg_r = int(26 + 18 * pulse)
        bg_g = int(6 + 4 * pulse)
        bg_b = int(8 + 5 * pulse)
        
        frame = Image.new("RGB", (width, height), (bg_r, bg_g, bg_b))
        draw = ImageDraw.Draw(frame)

        # Warning hazard stripes at top and bottom
        stripe_w = 40
        offset = int((t * 60) % (stripe_w * 2))
        for sx in range(-stripe_w * 2, width + stripe_w * 2, stripe_w * 2):
            pts_top = [(sx + offset, 0), (sx + offset + stripe_w, 0), (sx + offset, 24), (sx + offset - stripe_w, 24)]
            draw.polygon(pts_top, fill=(239, 68, 68, 180))
            pts_bot = [(sx - offset, height - 24), (sx - offset + stripe_w, height - 24), (sx - offset, height), (sx - offset - stripe_w, height)]
            draw.polygon(pts_bot, fill=(239, 68, 68, 180))

        # Central Card Container
        card_w, card_h = 1060, 560
        cx, cy = width // 2, height // 2
        card_box = [cx - card_w // 2, cy - card_h // 2, cx + card_w // 2, cy + card_h // 2]
        
        # Border with neon red pulsing glow
        glow_alpha = int(180 + 75 * pulse)
        draw.rounded_rectangle(card_box, radius=24, fill=(15, 3, 4), outline=(239, 68, 68), width=4)

        # Glowing Reject Symbol (Circle with Cross)
        sym_r = int(64 * scale_cross)
        sym_cy = cy - 140
        draw.ellipse([cx - sym_r, sym_cy - sym_r, cx + sym_r, sym_cy + sym_r], fill=(220, 38, 38), outline=(254, 202, 202), width=5)
        
        # Draw white 'X' inside circle
        x_sz = int(32 * scale_cross)
        draw.line([cx - x_sz, sym_cy - x_sz, cx + x_sz, sym_cy + x_sz], fill=(255, 255, 255), width=8)
        draw.line([cx - x_sz, sym_cy + x_sz, cx + x_sz, sym_cy - x_sz], fill=(255, 255, 255), width=8)

        # Title: ITEM REJECTED
        draw.text((cx - 240, cy - 45), "ITEM REJECTED", font=font_huge, fill=(248, 113, 113))
        draw.text((cx - 160, cy + 30), urdu_title, font=font_large, fill=(254, 202, 202))

        # Action: PLEASE REMOVE ITEM FROM CHAMBER
        sub_box = [cx - 440, cy + 95, cx + 440, cy + 175]
        draw.rounded_rectangle(sub_box, radius=14, fill=(45, 10, 12), outline=(239, 68, 68), width=2)
        draw.text((cx - 380, cy + 105), "PLEASE REMOVE ITEM FROM DEPOSIT CHAMBER", font=font_large, fill=(255, 255, 255))
        draw.text((cx - 210, cy + 142), urdu_action, font=font_badge, fill=(252, 165, 165))

        # Bottom Tip: Acceptable items reminder
        draw.text((cx - 350, cy + 205), "ACCEPTED ITEMS: Empty Plastic Bottles • Aluminium Cans • Beverage UBCs", font=font_sub, fill=(203, 213, 225))

        writer.send(np.array(frame))

    writer.close()

    import shutil
    for p in out_paths:
        shutil.copy2(temp_out, p)
        print(f"[COPIED] {p}")

    print("[SUCCESS] ItemRejected.mp4 created!")

if __name__ == '__main__':
    create_reject_video()
