import numpy as np
from PIL import Image
import math

img = Image.open('attached_assets/escora/hero-bg.png')
mask = Image.open('attached_assets/escora/hero-water-mask.png')

arr_img = np.array(img, dtype=np.float32)
arr_mask = np.array(mask, dtype=np.float32) / 255.0
h, w = arr_mask.shape

# Let's simulate a wave displacement frame at t = 1.0:
t = 1.5
y_grid, x_grid = np.mgrid[0:h, 0:w]
uv_x = x_grid / float(w)
uv_y = y_grid / float(h)

# Depth factor from shore to bottom
depth = np.clip((uv_y - 0.46) / 0.54, 0.0, 1.0)

# Wave harmonics
w1 = np.sin(uv_x * 24.0 + t * 1.8 + np.sin(uv_y * 12.0))
w2 = np.sin(uv_x * 45.0 - t * 2.3 + np.cos(uv_y * 20.0)) * 0.5
w3 = np.cos(uv_x * 70.0 + uv_y * 35.0 + t * 3.2) * 0.25
total_wave = (w1 + w2 + w3)

dx = np.cos(uv_x * 30.0 + t * 1.5) * 0.003 * arr_mask * (0.3 + 0.7 * depth)
dy = total_wave * 0.005 * arr_mask * (0.2 + 0.8 * depth)

# Sample with displacement
src_x = np.clip(x_grid + dx * w, 0, w - 1).astype(np.int32)
src_y = np.clip(y_grid + dy * h, 0, h - 1).astype(np.int32)

displaced = arr_img[src_y, src_x].astype(np.uint8)

# Save displaced frame to scratch
out_img = Image.fromarray(displaced)
out_img.save('scratch/wave_frame_preview.jpg', quality=95)
print("Saved wave frame preview to scratch/wave_frame_preview.jpg")
