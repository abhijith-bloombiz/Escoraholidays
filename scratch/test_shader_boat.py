import numpy as np
from PIL import Image

bg = Image.open('attached_assets/escora/hero-bg.png')
boat = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png')

w, h = bg.size # 1666, 944
bw, bh = boat.size # 2161, 728

# Let's verify the exact boat placement:
# In the original hero-bg, tip of boat was at (833, 488).
# In boat cutout: tip of boat is at x=1060, y=11.
# Target tip position in bg: x = 833, y = 488.
# Target bottom of boat: reaches y = 944.
# Target height in bg: 944 - 488 + 11 * scale = 456 + ~7 = ~463px.
scale = (944.0 - 488.0) / (727.0 - 11.0) # 456.0 / 716.0 = 0.63687

scaled_w = bw * scale # 2161 * 0.63687 = 1376.28
scaled_h = bh * scale # 728 * 0.63687 = 463.64

paste_x = 833.0 - (1060.0 * scale) # 833.0 - 675.08 = 157.92
paste_y = 488.0 - (11.0 * scale)   # 488.0 - 7.00 = 481.00

u_min = paste_x / float(w)
u_max = (paste_x + scaled_w) / float(w)
v_min = paste_y / float(h)
v_max = (paste_y + scaled_h) / float(h)

print(f"Boat UV bounds:")
print(f"u_min = {u_min:.7f}")
print(f"u_max = {u_max:.7f}")
print(f"v_min = {v_min:.7f}")
print(f"v_max = {v_max:.7f}")

# Let's test shader UV mapping simulation:
boat_arr = np.array(boat, dtype=np.float32) / 255.0
bg_arr = np.array(bg, dtype=np.float32) / 255.0

y_grid, x_grid = np.mgrid[0:h, 0:w]
uv_x = x_grid / float(w)
uv_y = y_grid / float(h)

in_boat = (uv_x >= u_min) & (uv_x <= u_max) & (uv_y >= v_min) & (uv_y <= v_max)
boat_u = np.clip((uv_x - u_min) / (u_max - u_min), 0.0, 1.0)
boat_v = np.clip((uv_y - v_min) / (v_max - v_min), 0.0, 1.0)

boat_px_x = np.clip(boat_u * (bw - 1), 0, bw - 1).astype(np.int32)
boat_px_y = np.clip(boat_v * (bh - 1), 0, bh - 1).astype(np.int32)

sampled_boat = boat_arr[boat_px_y, boat_px_x]
boat_alpha = sampled_boat[:, :, 3:] * in_boat[:, :, None]

composite = bg_arr * (1.0 - boat_alpha) + sampled_boat[:, :, :3] * boat_alpha
out_img = Image.fromarray((composite * 255).astype(np.uint8))
out_img.save('scratch/simulated_shader_composite.jpg', quality=95)
print("Saved scratch/simulated_shader_composite.jpg")
