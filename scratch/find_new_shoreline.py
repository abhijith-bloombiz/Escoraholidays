from PIL import Image
import numpy as np

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.float32)
w, h = img.size

# Let's inspect the shoreline y across x from 0 to w:
# At each x, let's find the shoreline y:
# Water has ripple characteristics (horizontal gradients) or water colors (blue or golden reflections)
# Land (grass/bank) has green hues or dark shoreline soil

# Let's check manual keypoints by sampling at every 50px:
# Let's inspect rows around the boundary for each x:
shore_y = []
for x in range(0, w, 50):
    # Scan from 450 to 650:
    # Find the transition from land to water:
    best_y = 470
    for y in range(450, 650):
        # In land: green grass (g > b + 15 and g > 50) or yellow grass (r > 100, g > 100, b < 60)
        # or dark tree foliage (g > b, r < 80, g < 90)
        r, g, b = arr[y, x]
        is_land = ((g > b + 15 and g > 40) or
                   (r > 100 and g > 90 and b < 50) or
                   (r < 80 and g < 90 and b < 50 and g > b) or
                   (g > 60 and b < 50))
        if is_land:
            best_y = y
    shore_y.append((x, best_y))
    print(f"x={x:4d}: shoreline_y = {best_y}")
