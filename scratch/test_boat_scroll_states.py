import numpy as np
from PIL import Image

bg = Image.open('attached_assets/escora/hero-bg.png')
boat = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png')

w, h = bg.size # 1666, 944
bw, bh = boat.size # 2161, 728

# Base scale
scale = (944.0 - 488.0) / (727.0 - 11.0) # 0.63687

# Base paste coordinates for full forward position:
base_x = 833.0 - (1060.0 * scale) # 157.92
base_y = 488.0 - (11.0 * scale)   # 481.00
scaled_w = int(bw * scale)
scaled_h = int(bh * scale)
boat_scaled = boat.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

# State 1: Initial state - half portion of boat showing
# Total boat height is scaled_h = 463px.
# Half of boat is ~220px downwards:
offset_initial = 210
paste_y_initial = int(base_y + offset_initial)

comp_initial = bg.copy()
# Crop boat so it doesn't paste outside or paste directly
comp_initial.paste(boat_scaled, (int(base_x), paste_y_initial), boat_scaled)
comp_initial.save('scratch/boat_state_initial.jpg', quality=95)

# State 2: Mid-glide (quarter down)
offset_mid = 100
paste_y_mid = int(base_y + offset_mid)
comp_mid = bg.copy()
comp_mid.paste(boat_scaled, (int(base_x), paste_y_mid), boat_scaled)
comp_mid.save('scratch/boat_state_mid.jpg', quality=95)

# State 3: Fully forward
comp_full = bg.copy()
comp_full.paste(boat_scaled, (int(base_x), int(base_y)), boat_scaled)
comp_full.save('scratch/boat_state_full.jpg', quality=95)

print("Generated all 3 preview states in scratch/")
