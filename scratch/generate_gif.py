import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
mask = Image.open('attached_assets/escora/hero-water-mask.png')

# Downscale to 833x472 for fast GIF generation
small_w, small_h = 833, 472
img_small = img.resize((small_w, small_h), Image.Resampling.LANCZOS)
mask_small = mask.resize((small_w, small_h), Image.Resampling.LANCZOS)

arr_img = np.array(img_small, dtype=np.float32)
arr_mask = np.array(mask_small, dtype=np.float32) / 255.0

y_grid, x_grid = np.mgrid[0:small_h, 0:small_w]
uv_x = x_grid / float(small_w)
uv_y = y_grid / float(small_h)

depth = np.clip((uv_y - 0.46) / 0.54, 0.0, 1.0)

frames = []
num_frames = 18
for i in range(num_frames):
    t = (i / float(num_frames)) * (2.0 * np.pi)
    
    # Harmonic swells:
    w1 = np.sin(uv_x * 20.0 + t + np.sin(uv_y * 10.0))
    w2 = np.sin(uv_x * 38.0 - t * 1.5 + np.cos(uv_y * 18.0)) * 0.4
    w3 = np.cos(uv_x * 55.0 + uv_y * 28.0 + t * 2.0) * 0.2
    
    total_wave = (w1 + w2 + w3)
    
    dx = np.cos(uv_x * 25.0 + t * 1.2) * 0.0035 * arr_mask * (0.2 + 0.8 * depth)
    dy = total_wave * 0.0055 * arr_mask * (0.15 + 0.85 * depth)
    
    src_x = np.clip(x_grid + dx * small_w, 0, small_w - 1).astype(np.int32)
    src_y = np.clip(y_grid + dy * small_h, 0, small_h - 1).astype(np.int32)
    
    # Add subtle specular shimmer where normal tilt aligns with sun
    slope = np.cos(uv_x * 20.0 + t) * (w1 + w2)
    specular = np.clip(slope * 12.0 * arr_mask * (1.0 - uv_x * 0.5), 0.0, 25.0)
    
    displaced = arr_img[src_y, src_x].copy()
    displaced[:, :, 0] = np.clip(displaced[:, :, 0] + specular * 1.2, 0, 255)
    displaced[:, :, 1] = np.clip(displaced[:, :, 1] + specular * 1.0, 0, 255)
    displaced[:, :, 2] = np.clip(displaced[:, :, 2] + specular * 0.6, 0, 255)
    
    frames.append(Image.fromarray(displaced.astype(np.uint8)))

frames[0].save(
    'scratch/water_animation.gif',
    save_all=True,
    append_images=frames[1:],
    duration=90,
    loop=0
)
print("Saved water animation preview to scratch/water_animation.gif")
