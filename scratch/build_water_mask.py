import numpy as np
from PIL import Image, ImageFilter

img = Image.open('attached_assets/escora/hero-bg.png')
w, h = img.size
arr = np.array(img)

# Left and right boat edge guide points (y, x_left, x_right):
# Traced with pixel precision:
guide_points = [
    (488, 833, 833),
    (495, 826, 840),
    (500, 820, 846),
    (510, 810, 854),
    (520, 802, 860),
    (535, 792, 868),
    (550, 782, 876),
    (575, 764, 898),
    (600, 742, 922),
    (625, 712, 952),
    (650, 678, 985),
    (675, 646, 1016),
    (700, 614, 1045),
    (725, 582, 1076),
    (750, 550, 1108),
    (775, 518, 1140),
    (800, 485, 1172),
    (825, 452, 1204),
    (850, 418, 1236),
    (875, 382, 1269),
    (900, 347, 1302),
    (925, 312, 1334),
    (944, 286, 1362)
]

guide_y = [p[0] for p in guide_points]
guide_xl = [p[1] for p in guide_points]
guide_xr = [p[2] for p in guide_points]

# Shoreline guide points across x (x, shore_y):
# From left (0) to right (w):
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

# Interpolate for every column and every row:
x_indices = np.arange(w)
all_shore_y = np.interp(x_indices, shore_x, shore_y)

y_indices = np.arange(h)
all_boat_xl = np.interp(y_indices, guide_y, guide_xl)
all_boat_xr = np.interp(y_indices, guide_y, guide_xr)

# Construct 2D mask:
mask = np.zeros((h, w), dtype=np.uint8)

for y in range(h):
    for x in range(w):
        # 1. Above shoreline: 0 (sky, hills, mountains)
        if y < all_shore_y[x]:
            continue
        # 2. Inside boat: 0
        if y >= 488:
            if all_boat_xl[y] <= x <= all_boat_xr[y]:
                continue
        # 3. Otherwise: water
        mask[y, x] = 255

# Apply gentle 2px Gaussian blur for natural, seamless feathering at boundaries
mask_img = Image.fromarray(mask, mode='L')
feathered_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=2.0))

# Save mask PNG to attached_assets/escora/hero-water-mask.png
output_mask_path = 'attached_assets/escora/hero-water-mask.png'
feathered_mask.save(output_mask_path)
print(f"Saved mask to {output_mask_path}")

# Also create an overlay visualization to inspect:
mask_arr = np.array(feathered_mask, dtype=np.float32) / 255.0
overlay = arr.copy().astype(np.float32)
# Tint water with cyan/teal to visualize:
overlay[:, :, 0] = overlay[:, :, 0] * (1.0 - mask_arr * 0.4)
overlay[:, :, 1] = overlay[:, :, 1] * (1.0 + mask_arr * 0.2)
overlay[:, :, 2] = overlay[:, :, 2] * (1.0 + mask_arr * 0.5)
overlay = np.clip(overlay, 0, 255).astype(np.uint8)

overlay_img = Image.fromarray(overlay)
overlay_img.save('scratch/water_mask_preview.jpg', quality=90)
print("Saved preview to scratch/water_mask_preview.jpg")
