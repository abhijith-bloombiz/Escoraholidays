import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

bg = Image.open('attached_assets/escora/hero-bg.png')
w, h = bg.size # 1666, 944

# Let's inspect the exact font metrics in Image 1:
# In Image 1:
# Letters: K E R A L A
# Total width: 552
# Letter 1 (K): 27..92 -> center ~ 59.5 (10.8% of w)
# Letter 2 (E): 119..172 -> center ~ 145.5 (26.4% of w)
# Letter 3 (R): 198..260 -> center ~ 229 (41.5% of w)
# Letter 4 (A): 287..354 -> center ~ 320.5 (58.1% of w)
# Letter 5 (L): 382..431 -> center ~ 406.5 (73.6% of w)
# Letter 6 (A): 455..521 -> center ~ 488 (88.4% of w)

# Scale these to 1666 width:
centers_x = [
    int(59.5 / 552 * 1666),
    int(145.5 / 552 * 1666),
    int(229.0 / 552 * 1666),
    int(320.5 / 552 * 1666),
    int(406.5 / 552 * 1666),
    int(488.0 / 552 * 1666)
]

print("Target letter centers in 1666px:", centers_x)
# Letter height in Image 1 is 72 / 176 * 944 = ~386px
# Baseline in Image 1 is 88 / 176 * 944 = ~472px

# Let's test font:
font_size = 360
try:
    font = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", font_size)
except:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", font_size)

letters = ["K", "E", "R", "A", "L", "A"]

# Create high-res text layer
text_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(text_img)

baseline_y = 472

for i, l in enumerate(letters):
    bbox = font.getbbox(l)
    lw = bbox[2] - bbox[0]
    lh = bbox[3] - bbox[1]
    lx = centers_x[i] - lw // 2 - bbox[0]
    ly = baseline_y - bbox[3] # sit on baseline
    draw.text((lx, ly), l, font=font, fill=(255, 255, 255, 255))

# Create reflection:
# Flipped vertically below baseline_y:
crop_rect = (0, baseline_y - font_size, w, baseline_y)
cropped_text = text_img.crop(crop_rect)
flipped_text = cropped_text.transpose(Image.Transpose.FLIP_TOP_BOTTOM)

refl_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
refl_layer.paste(flipped_text, (0, baseline_y))

# Add horizontal ripple distortion to the reflection texture for realistic water look
refl_arr = np.array(refl_layer, dtype=np.float32)
y_grid, x_grid = np.mgrid[0:h, 0:w]

# Fade out gradient from baseline_y (0.8 opacity) down to baseline_y + 240 (0.0 opacity)
fade = np.clip((baseline_y + 240 - y_grid) / 240.0, 0.0, 1.0)
fade = np.where(y_grid >= baseline_y, fade * 0.72, 0.0)

# Apply gentle ripple wave distortion to reflection coordinates
wave_distort = np.sin(y_grid * 0.15) * 8.0 * (y_grid - baseline_y) / 240.0
wave_distort = np.where(y_grid >= baseline_y, wave_distort, 0.0)
sampled_x = np.clip(x_grid + wave_distort, 0, w - 1).astype(np.int32)
sampled_y = y_grid.astype(np.int32)

refl_distorted = refl_arr[sampled_y, sampled_x]
refl_distorted[:, :, 3] = refl_distorted[:, :, 3] * fade

refl_final = Image.fromarray(refl_distorted.astype(np.uint8))

# Composite onto bg:
composite = bg.copy()
composite.paste(refl_final, (0, 0), refl_final)
composite.paste(text_img, (0, 0), text_img)

# Paste boat on top:
boat = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png')
scale = (944.0 - 488.0) / (727.0 - 11.0)
scaled_w = int(boat.width * scale)
scaled_h = int(boat.height * scale)
boat_scaled = boat.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
paste_x = int(833.0 - (1060.0 * scale))
paste_y = int(488.0 - (11.0 * scale))

composite.paste(boat_scaled, (paste_x, paste_y), boat_scaled)
composite.save('scratch/kerala_exact_match.jpg', quality=95)
print("Saved scratch/kerala_exact_match.jpg")
