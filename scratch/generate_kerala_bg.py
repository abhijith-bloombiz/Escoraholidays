from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Load original Image 1 to compare
img1 = Image.open('C:/Users/candy/.gemini/antigravity-ide/brain/ca35f1de-2c64-4eee-a262-825390a36226/.user_uploaded/media_1792046286623.png')
print("Image 1 loaded successfully:", img1.size)

# Let's inspect the font details:
# Letters in Image 1:
# Let's check letter width and stroke thickness:
# In Image 1, vertical stroke of 'K' is about 12px out of 72px letter height (~16.7% stroke ratio).
# In Arial Black, stroke is ~22% (too thick).
# In Segoe UI Bold / Arial Bold, stroke is ~16% (perfect match!).

bg = Image.open('attached_assets/escora/hero-bg.png')
w, h = bg.size # 1666, 944

# Let's test Segoe UI Bold at font_size ~ 370:
font = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 370)

# Target letter centers in 1666px:
# [179, 439, 691, 967, 1226, 1472]
centers_x = [179, 439, 691, 967, 1226, 1472]
letters = ["K", "E", "R", "A", "L", "A"]
baseline_y = 470

text_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(text_img)

for i, l in enumerate(letters):
    bbox = font.getbbox(l)
    lw = bbox[2] - bbox[0]
    lx = centers_x[i] - lw // 2 - bbox[0]
    ly = baseline_y - bbox[3]
    draw.text((lx, ly), l, font=font, fill=(255, 255, 255, 255))

# Reflection:
crop_rect = (0, baseline_y - 380, w, baseline_y)
cropped_text = text_img.crop(crop_rect)
flipped_text = cropped_text.transpose(Image.Transpose.FLIP_TOP_BOTTOM)

refl_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
refl_layer.paste(flipped_text, (0, baseline_y))

refl_arr = np.array(refl_layer, dtype=np.float32)
y_grid, x_grid = np.mgrid[0:h, 0:w]

# Soft fade over 260px down
fade = np.clip((baseline_y + 260 - y_grid) / 260.0, 0.0, 1.0)
# Exponential fade curve matching natural water reflection:
fade = np.where(y_grid >= baseline_y, (fade ** 1.3) * 0.78, 0.0)

# Gentle water ripple wave perturbation in the reflection texture
wave_distort = np.sin((y_grid - baseline_y) * 0.12) * 6.5 * np.clip((y_grid - baseline_y) / 260.0, 0.0, 1.0)
sampled_x = np.clip(x_grid + wave_distort, 0, w - 1).astype(np.int32)
sampled_y = y_grid.astype(np.int32)

refl_distorted = refl_arr[sampled_y, sampled_x]
refl_distorted[:, :, 3] = refl_distorted[:, :, 3] * fade
refl_final = Image.fromarray(refl_distorted.astype(np.uint8))

# Composite onto background:
bg_with_kerala = bg.copy()
bg_with_kerala.paste(refl_final, (0, 0), refl_final)
bg_with_kerala.paste(text_img, (0, 0), text_img)

# Save as new hero-bg-kerala.png:
bg_with_kerala.save('attached_assets/escora/hero-bg-kerala.png', quality=95)
print("Saved attached_assets/escora/hero-bg-kerala.png")

# Also composite half-boat and full-boat for previews and instant fallback:
boat = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png')
scale = (944.0 - 488.0) / (727.0 - 11.0)
scaled_w = int(boat.width * scale)
scaled_h = int(boat.height * scale)
boat_scaled = boat.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
paste_x = int(833.0 - (1060.0 * scale))
base_paste_y = int(488.0 - (11.0 * scale))

# Fallback half-boat composite (docked initial state):
half_comp = bg_with_kerala.copy()
half_comp.paste(boat_scaled, (paste_x, base_paste_y + 210), boat_scaled)
half_comp.save('attached_assets/escora/hero-bg-kerala-half.png', quality=95)
print("Saved attached_assets/escora/hero-bg-kerala-half.png")

# Full forward boat preview:
full_comp = bg_with_kerala.copy()
full_comp.paste(boat_scaled, (paste_x, base_paste_y), boat_scaled)
full_comp.save('scratch/kerala_full_preview.jpg', quality=95)
print("Saved scratch/kerala_full_preview.jpg")
