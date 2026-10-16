from PIL import Image
import numpy as np

bg = Image.open('attached_assets/escora/hero-bg.png') # 1666 x 944
boat = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png') # 2161 x 728

# In bg (1666 x 944):
# Boat tip was at y=488, x=833.
# Height from tip to bottom was 944 - 488 = 456px.
# In boat image:
# Tip is at y=11, bottom is at y=727. Height is 717px.
# So scale factor = 456 / 717 = 0.63598
# If scaled by this factor:
# boat width becomes: 2161 * 0.63598 = 1374.3 px
# boat height becomes: 728 * 0.63598 = 463 px
# Let's test this scale:
scale = 456.0 / 716.0
new_w = int(boat.width * scale)
new_h = int(boat.height * scale)
boat_scaled = boat.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Center horizontally at x = 833:
paste_x = int(833 - (1060 * scale))
paste_y = int(488 - (11 * scale))

print(f"Scaled boat: {new_w} x {new_h}, paste at ({paste_x}, {paste_y})")

comp = bg.copy()
comp.paste(boat_scaled, (paste_x, paste_y), boat_scaled)
comp.save('scratch/boat_overlay_test.jpg', quality=95)
print("Saved scratch/boat_overlay_test.jpg")
