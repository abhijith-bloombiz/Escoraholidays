import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)

for y in [500, 550, 600, 650, 700, 750, 800, 850, 900]:
    row = arr[y]
    print(f"\n--- Y = {y} ---")
    exp_x = {500: 845, 550: 875, 600: 925, 650: 975, 700: 1030, 750: 1095, 800: 1165, 850: 1235, 900: 1300}[y]
    for x in range(exp_x - 20, exp_x + 25, 5):
        print(f"x={x}: RGB={row[x].tolist()}")
