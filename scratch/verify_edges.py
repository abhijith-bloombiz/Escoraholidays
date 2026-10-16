from PIL import Image
import numpy as np

img = Image.open('attached_assets/escora/hero-bg.png')
mask = Image.open('attached_assets/escora/hero-water-mask.png')
arr_img = np.array(img)
arr_mask = np.array(mask)

# Check at y = 500, 600, 700, 800, 900:
# Where mask drops from 255 to 0 on left and right sides of boat:
for y in [490, 500, 550, 600, 650, 700, 750, 800, 850, 900, 940]:
    row = arr_mask[y]
    # In center (x=833): mask should be 0 (boat)
    # On left: find where row[x] crosses 128
    left_cross = None
    for x in range(100, 833):
        if row[x] < 128 and row[x-1] >= 128:
            left_cross = x
            break
    right_cross = None
    for x in range(833, 1600):
        if row[x] >= 128 and row[x-1] < 128:
            right_cross = x
            break
            
    # Check actual image pixels at those boundary coordinates:
    rgb_l = arr_img[y, left_cross] if left_cross else None
    rgb_r = arr_img[y, right_cross] if right_cross else None
    print(f"y={y}: Boat L edge={left_cross} (RGB={rgb_l}), Boat R edge={right_cross} (RGB={rgb_r})")
