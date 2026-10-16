import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.float32)
w, h = img.size

# Let's inspect where water starts for every x:
# Water in this image:
# - Below y=450 (middle) and y=530 (edges)
# - Outside boat
# Let's inspect boat contour more closely.
# Let's find boat left and right edge for each y from 485 to 943:

boat_left = []
boat_right = []

for y in range(485, h):
    # Search around center x=833
    # Boat is brown/wood. Inside boat: warm brown, wood planks.
    # Water on left: golden sunlight reflection / blue water.
    # Water on right: deep blue/teal water.
    # Outside the boat:
    # Left of boat is water. Let's find the exact boat boundary.
    # On the right of boat (x > 833): boat edge is very distinct: wood vs blue water.
    # Wood on right rim is brightly lit or shadowed wood, water is blue: B > R significantly!
    # In water: B is often > R or close, and G > R or B > G.
    # Inside boat wood: R > B!
    pass

# Let's test this R vs B criterion for boat vs water:
print("Testing boat wood vs water color characteristics:")
for y in [500, 550, 600, 650, 700, 750, 800, 850, 900]:
    row = arr[y]
    # wood has high R, low B: (row[:, 0] - row[:, 2]) is positive inside boat!
    diff = row[:, 0] - row[:, 2] # R - B
    # Let's find where diff > 15 near center (x between 200 and 1500)
    center = 833
    # search left
    x_l = center
    while x_l > 0 and (row[x_l, 0] > row[x_l, 2] - 5 or row[x_l, 0] > 70 and row[x_l, 2] < 70): # wood check
        x_l -= 1
    # search right
    x_r = center
    while x_r < w - 1 and (row[x_r, 0] > row[x_r, 2] - 5 or row[x_r, 0] > 70 and row[x_r, 2] < 70):
        x_r += 1
    print(f"y={y}: boat span x=[{x_l}, {x_r}] width={x_r - x_l}")
