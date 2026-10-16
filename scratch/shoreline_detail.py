import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img)
w, h = img.size

# Let's inspect the shoreline y-coordinate across x from 0 to w:
# In the original image:
# x=0 to 1665:
# Let's find for each x in [0, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1665]
# where the water actually starts.
# Water has ripple texture or clear water color.
# Let's write a small script that samples along each column from y=430 to 550:
sample_xs = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 833, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1665]
for x in sample_xs:
    # let's find y where green shoreline grass turns into water
    # Grass has: (G > R) and (G > B) and (G > 60), or yellow sunlight grass (R > 120, G > 120, B < 40)
    # Water has: (B > 100) or water ripple reflections
    for y in range(430, 540):
        r, g, b = arr[y, x]
        # check if this pixel is grass:
        is_grass = (g > b + 15 and g > 50) or (r > 100 and g > 100 and b < 50)
        # check if pixel below is water:
        r2, g2, b2 = arr[min(y+4, h-1), x]
        is_water_candidate = (b2 > 100 or (b2 > 70 and abs(int(r2) - int(b2)) < 30))
        # let's find the transition
    print(f"col x={x}")
