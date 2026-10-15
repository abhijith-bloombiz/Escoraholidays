import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

bg = Image.open('attached_assets/escora/hero-bg.png')
w, h = bg.size # 1666 x 944

# Create transparent layer for text + reflection
text_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(text_layer)

# Font selection:
font_path = "C:/Windows/Fonts/ariblk.ttf" # Arial Black
try:
    font = ImageFont.truetype(font_path, 330)
except:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 330)

text = "K E R A L A"

# We want the letters spaced out widely across the width, just like Image 1:
# In Image 1, "K" is on far left, "A" is on far right, spanning ~1550px.
# Let's draw individual letters with wide spacing:
letters = ["K", "E", "R", "A", "L", "A"]

# Let's find font size so letters span nicely across width:
font_size = 320
font = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", font_size)

# Calculate positions:
# Waterline is at y ~ 455-465
baseline_y = 460 # bottoms of upright letters sit right at baseline_y

# Measure letters:
letter_widths = []
letter_heights = []
for l in letters:
    bbox = font.getbbox(l)
    letter_widths.append(bbox[2] - bbox[0])
    letter_heights.append(bbox[3] - bbox[1])

total_letter_w = sum(letter_widths)
avail_w = 1540
spacing = (avail_w - total_letter_w) / (len(letters) - 1)

start_x = (w - avail_w) // 2

# Draw upright letters:
cur_x = start_x
letter_coords = []
for i, l in enumerate(letters):
    bbox = font.getbbox(l)
    lw = bbox[2] - bbox[0]
    lh = bbox[3] - bbox[1]
    # Align bottom of letter to baseline_y
    draw_y = baseline_y - bbox[3]
    draw_x = cur_x - bbox[0]
    letter_coords.append((l, draw_x, draw_y, lw, lh))
    draw.text((draw_x, draw_y), l, font=font, fill=(255, 255, 255, 255))
    cur_x += lw + spacing

# Create the water reflection:
# The reflection is the upright text flipped vertically below baseline_y:
reflection_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
# Crop text area above baseline:
crop_box = (0, baseline_y - 340, w, baseline_y + 10)
upright_cropped = text_layer.crop(crop_box)
flipped_reflection = upright_cropped.transpose(Image.Transpose.FLIP_TOP_BOTTOM)

# Paste flipped reflection right below baseline_y:
reflection_layer.paste(flipped_reflection, (0, baseline_y))

# Apply gradient fade to reflection (opaque near baseline, fading out over 200px down):
refl_arr = np.array(reflection_layer, dtype=np.float32)
alpha = refl_arr[:, :, 3]

y_indices = np.arange(h)
# Fade factor: 0 above baseline, 0.7 at baseline, fading to 0 at baseline + 220
fade = np.clip((baseline_y + 220 - y_indices) / 220.0, 0.0, 1.0)
fade = np.where(y_indices >= baseline_y, fade * 0.75, 0.0)

refl_arr[:, :, 3] = alpha * fade[:, None]
reflection_faded = Image.fromarray(refl_arr.astype(np.uint8))

# Composite onto bg:
comp = bg.copy()
# Paste reflection:
comp.paste(reflection_faded, (0, 0), reflection_faded)
# Paste upright text:
comp.paste(text_layer, (0, 0), text_layer)

# Paste boat on top to verify:
boat = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png')
scale = (944.0 - 488.0) / (727.0 - 11.0)
scaled_w = int(boat.width * scale)
scaled_h = int(boat.height * scale)
boat_scaled = boat.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
paste_x = int(833.0 - (1060.0 * scale))
paste_y = int(488.0 - (11.0 * scale))
comp.paste(boat_scaled, (paste_x, paste_y), boat_scaled)

comp.save('scratch/kerala_text_preview.jpg', quality=95)
print("Saved scratch/kerala_text_preview.jpg")
