import numpy as np
from PIL import Image, ImageFilter

img = Image.open('attached_assets/escora/hero-bg.png')
w, h = img.size
arr = np.array(img)

# Shoreline guide points across x (x, shore_y):
# Mapped to the lake shoreline across the landscape:
shore_points = [
    (0, 474),
    (50, 472),
    (100, 470),
    (150, 468),
    (200, 466),
    (300, 464),
    (400, 461),
    (500, 458),
    (600, 456),
    (700, 454),
    (800, 452),
    (833, 452),
    (900, 453),
    (1000, 455),
    (1100, 458),
    (1200, 461),
    (1300, 465),
    (1400, 470),
    (1500, 476),
    (1600, 482),
    (1666, 488)
]

shore_x = [p[0] for p in shore_points]
shore_y = [p[1] for p in shore_points]

# Interpolate shoreline y for every column x:
x_indices = np.arange(w)
all_shore_y = np.interp(x_indices, shore_x, shore_y)

# Construct 2D mask:
# 0 = static sky, mountains, hills, trees
# 255 = water (the entire lake surface below the shoreline)
mask = np.zeros((h, w), dtype=np.uint8)

for y in range(h):
    for x in range(w):
        if y >= all_shore_y[x]:
            mask[y, x] = 255

# Apply 2.5px Gaussian blur for smooth, anti-aliased feathering at the shoreline
mask_img = Image.fromarray(mask, mode='L')
feathered_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=2.5))

# Save mask PNG to attached_assets/escora/hero-water-mask.png
output_mask_path = 'attached_assets/escora/hero-water-mask.png'
feathered_mask.save(output_mask_path)
print(f"Saved new water mask to {output_mask_path}")

# Generate preview overlay (tint water cyan/blue to visually verify)
mask_arr = np.array(feathered_mask, dtype=np.float32) / 255.0
overlay = arr.copy().astype(np.float32)
overlay[:, :, 0] = overlay[:, :, 0] * (1.0 - mask_arr * 0.35)
overlay[:, :, 1] = overlay[:, :, 1] * (1.0 + mask_arr * 0.15)
overlay[:, :, 2] = overlay[:, :, 2] * (1.0 + mask_arr * 0.45)
overlay = np.clip(overlay, 0, 255).astype(np.uint8)

preview_img = Image.fromarray(overlay)
preview_img.save('scratch/new_water_mask_preview.jpg', quality=92)
print("Saved preview to scratch/new_water_mask_preview.jpg")
