import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
mask = Image.open('attached_assets/escora/hero-water-mask.png')

small_w, small_h = 833, 472
img_small = img.resize((small_w, small_h), Image.Resampling.LANCZOS)
mask_small = mask.resize((small_w, small_h), Image.Resampling.LANCZOS)

arr_img = np.array(img_small, dtype=np.float32)
arr_mask = np.array(mask_small, dtype=np.float32) / 255.0

y_grid, x_grid = np.mgrid[0:small_h, 0:small_w]
uv_x = x_grid / float(small_w)
uv_y = y_grid / float(small_h)

depth = np.clip((uv_y - 0.46) / 0.54, 0.0, 1.0)
depth_scale = 0.25 + 0.75 * depth

frames = []
num_frames = 18
for i in range(num_frames):
    t = (i / float(num_frames)) * (2.0 * np.pi)
    
    w1 = np.sin(uv_x * 16.0 + t * 1.35 + np.sin(uv_y * 8.0))
    w2 = np.sin(uv_x * 28.0 - t * 1.65 + np.cos(uv_y * 14.0)) * 0.45
    w3 = np.cos(uv_x * 52.0 + uv_y * 26.0 + t * 2.3) * 0.22
    w4 = np.sin(uv_x * 76.0 - uv_y * 38.0 + t * 3.1) * 0.12
    
    total_wave = w1 + w2 + w3 + w4
    
    dx = np.cos(uv_x * 20.0 + t * 1.1 + w1 * 0.4) * 0.0032 * depth_scale * arr_mask
    dy = total_wave * 0.0052 * depth_scale * arr_mask
    
    src_x = np.clip(x_grid + dx * small_w, 0, small_w - 1).astype(np.int32)
    src_y = np.clip(y_grid + dy * small_h, 0, small_h - 1).astype(np.int32)
    
    slope = (w1 + w2) * 0.5
    sun_warmth = np.clip((0.75 - uv_x) / 0.65, 0.0, 1.0)
    shimmer = np.clip(slope * 0.65, 0.0, 1.0) * sun_warmth * arr_mask * depth_scale
    
    displaced = arr_img[src_y, src_x].copy()
    displaced[:, :, 0] = np.clip(displaced[:, :, 0] + shimmer * 35.0 * 0.95, 0, 255)
    displaced[:, :, 1] = np.clip(displaced[:, :, 1] + shimmer * 35.0 * 0.85, 0, 255)
    displaced[:, :, 2] = np.clip(displaced[:, :, 2] + shimmer * 35.0 * 0.60, 0, 255)
    
    frames.append(Image.fromarray(displaced.astype(np.uint8)))

frames[0].save(
    'scratch/new_water_animation.gif',
    save_all=True,
    append_images=frames[1:],
    duration=90,
    loop=0
)
print("Saved new water animation preview to scratch/new_water_animation.gif")
