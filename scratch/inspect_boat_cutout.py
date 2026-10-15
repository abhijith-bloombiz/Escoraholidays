from PIL import Image
import numpy as np

boat_img = Image.open('attached_assets/escora/Rustic Wooden Canoe Interior Bow.png')
print("Boat size:", boat_img.size) # 2161 x 728
arr = np.array(boat_img)
alpha = arr[:, :, 3]

# Bounding box of non-transparent pixels:
non_zero_y, non_zero_x = np.nonzero(alpha > 10)
min_y, max_y = non_zero_y.min(), non_zero_y.max()
min_x, max_x = non_zero_x.min(), non_zero_x.max()
print(f"Non-transparent bbox: x in [{min_x}, {max_x}] (width: {max_x - min_x + 1}), y in [{min_y}, {max_y}] (height: {max_y - min_y + 1})")

# In the original image hero-bg (1666 x 944):
# Boat prow tip was at x=833, y=488.
# Bottom of image was y=944.
# Height of boat in original was 944 - 488 = 456 px.
# At bottom row (y=944), boat width was roughly 1357 - 286 = 1071 px.

# In boat_img (2161 x 728):
# Let's check tip position and bottom width:
tip_x = (min_x + max_x) // 2
print(f"Boat tip in cutout: y={min_y}, x ~ {tip_x}")
# At max_y:
bottom_alpha = alpha[max_y]
bottom_xs = np.nonzero(bottom_alpha > 10)[0]
print(f"Bottom span in cutout: x from {bottom_xs.min()} to {bottom_xs.max()}, width={bottom_xs.max() - bottom_xs.min() + 1}")
