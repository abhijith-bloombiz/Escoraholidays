import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img)
w, h = img.size

# Let's inspect where water starts for every x in 50px increments
# Let's print out the shoreline y for each x
print("Shoreline exploration:")
for x in range(0, w, 50):
    # Search from y=440 to 700
    # Let's find the last pixel that belongs to grass/trees/land
    land_y = 440
    for y in range(440, 700):
        r, g, b = arr[y, x]
        # Land characteristics:
        # 1. Forest green / grass: (g > b + 8 and g > 45) or (g > 60 and b < 50)
        # 2. Sunlit golden grass: (r > 120 and g > 110 and b < 60)
        # 3. Dark forest/mud/shadow along bank: (r < 65 and g < 65 and b < 45 and abs(int(r)-int(g)) < 25)
        # 4. Olive shoreline: (g >= r - 10 and g > b + 10)
        is_land = ((g > b + 12 and g > 40) or 
                   (r > 115 and g > 105 and b < 55) or
                   (r < 75 and g < 75 and b < 50 and g >= b) or
                   (g > b + 5 and r > b + 15 and b < 80))
        if is_land:
            land_y = y
    print(f"x={x:4d}: land_y={land_y}")
