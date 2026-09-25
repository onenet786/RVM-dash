import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

MASTER_IMAGE_PATH = r"C:\Users\BIN ISHAQ\.gemini\antigravity-ide\brain\fea8eb02-a399-4b10-a315-e4fd368836bc\app_icon_flat_1790326178830.jpg"
RES_DIR = r"d:\GIT-HUB\RVM-dash\mobile_app\android\app\src\main\res"
PLAYSTORE_DIR = r"d:\GIT-HUB\RVM-dash\mobile_app\release-playstore"
ASSETS_DIR = r"d:\GIT-HUB\RVM-dash\mobile_app\assets\images"

# Android icon specifications:
# Density: (legacy_icon_size, adaptive_layer_size)
DENSITIES = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

def create_circular_mask(size):
    mask = Image.new("L", (size * 4, size * 4), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size * 4, size * 4), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)

def main():
    print("Loading master image...")
    src_img = Image.open(MASTER_IMAGE_PATH).convert("RGBA")
    w, h = src_img.size

    # 1. Extract foreground symbol with clean alpha
    arr = np.array(src_img, dtype=np.float32)
    bg = np.array([1, 24, 14], dtype=np.float32)
    diff = np.sqrt(np.sum((arr[:, :, :3] - bg)**2, axis=2))
    
    alpha = np.clip((diff - 14) / 45.0, 0.0, 1.0)
    arr[:, :, 3] = alpha * 255.0
    symbol_transparent = Image.fromarray(arr.astype(np.uint8), mode="RGBA")

    # Crop to symbol bbox with a small padding
    bbox = symbol_transparent.getbbox()
    symbol_cropped = symbol_transparent.crop(bbox)

    # 2. Extract monochrome silhouette for Material You themed icons
    mono_arr = np.zeros((symbol_cropped.height, symbol_cropped.width, 4), dtype=np.uint8)
    crop_arr = np.array(symbol_cropped)
    # Brightness to white alpha
    brightness = np.clip(crop_arr[:, :, :3].mean(axis=2) * 1.3, 0, 255).astype(np.uint8)
    mono_arr[:, :, 0] = 255
    mono_arr[:, :, 1] = 255
    mono_arr[:, :, 2] = 255
    mono_arr[:, :, 3] = np.minimum(brightness, crop_arr[:, :, 3])
    mono_cropped = Image.fromarray(mono_arr, mode="RGBA")

    # 3. Create high-res adaptive background base
    # Deep obsidian green #061811 with radial ambient glow in center
    bg_canvas_size = 1024
    bg_base = Image.new("RGBA", (bg_canvas_size, bg_canvas_size), (6, 24, 17, 255))
    glow_draw = ImageDraw.Draw(bg_base)
    # Layered ambient glows
    glow_draw.ellipse(
        (bg_canvas_size * 0.15, bg_canvas_size * 0.15, bg_canvas_size * 0.85, bg_canvas_size * 0.85),
        fill=(16, 185, 129, 35)
    )
    glow_draw.ellipse(
        (bg_canvas_size * 0.28, bg_canvas_size * 0.28, bg_canvas_size * 0.72, bg_canvas_size * 0.72),
        fill=(52, 211, 153, 50)
    )
    bg_base = bg_base.filter(ImageFilter.GaussianBlur(radius=50))

    # 4. Generate all densities
    for folder, (legacy_size, adaptive_size) in DENSITIES.items():
        out_dir = os.path.join(RES_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)

        # A. Adaptive Background (adaptive_size x adaptive_size)
        adaptive_bg = bg_base.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS)
        adaptive_bg.save(os.path.join(out_dir, "ic_launcher_background.png"), "PNG")

        # B. Adaptive Foreground (symbol placed inside safe zone: ~68% of adaptive_size)
        adaptive_fg = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
        target_symbol_size = int(adaptive_size * 0.68)
        scaled_symbol = symbol_cropped.resize(
            (target_symbol_size, target_symbol_size), Image.Resampling.LANCZOS
        )
        offset_x = (adaptive_size - target_symbol_size) // 2
        offset_y = (adaptive_size - target_symbol_size) // 2
        adaptive_fg.paste(scaled_symbol, (offset_x, offset_y), scaled_symbol)
        adaptive_fg.save(os.path.join(out_dir, "ic_launcher_foreground.png"), "PNG")

        # C. Adaptive Monochrome (for Android 13+ themed icons)
        adaptive_mono = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
        scaled_mono = mono_cropped.resize(
            (target_symbol_size, target_symbol_size), Image.Resampling.LANCZOS
        )
        adaptive_mono.paste(scaled_mono, (offset_x, offset_y), scaled_mono)
        adaptive_mono.save(os.path.join(out_dir, "ic_launcher_monochrome.png"), "PNG")

        # D. Legacy ic_launcher.png (legacy_size x legacy_size, composed)
        legacy_icon = src_img.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS)
        legacy_icon.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")

        # E. Legacy Round ic_launcher_round.png
        round_mask = create_circular_mask(legacy_size)
        round_icon = Image.new("RGBA", (legacy_size, legacy_size), (0, 0, 0, 0))
        round_icon.paste(legacy_icon, (0, 0), round_mask)
        round_icon.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")

        print(f"Generated icons for {folder}: legacy {legacy_size}px, adaptive {adaptive_size}px")

    # 5. Play Store 512x512 Master Icon
    play_icon = src_img.resize((512, 512), Image.Resampling.LANCZOS)
    play_path = os.path.join(PLAYSTORE_DIR, "play_store_512.png")
    play_icon.save(play_path, "PNG")
    print(f"Play Store 512x512 icon saved to: {play_path}")

    # 6. Save a copy in mobile_app/assets/images
    assets_icon_path = os.path.join(ASSETS_DIR, "app_icon_latest.png")
    play_icon.save(assets_icon_path, "PNG")
    print(f"App icon asset saved to: {assets_icon_path}")

    print("\nAll app icons successfully generated!")

if __name__ == "__main__":
    main()
