import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)

for y in [500, 550, 600, 650, 700, 750, 800, 850, 900]:
    row = arr[y]
    print(f"\n--- Y = {y} ---")
    # print x, R, G, B around expected left edge
    # at y=500, expected left edge ~ 815
    # at y=600, expected left edge ~ 740
    # at y=700, expected left edge ~ 645
    # at y=800, expected left edge ~ 530
    # at y=900, expected left edge ~ 390
    exp_x = {500: 820, 550: 780, 600: 740, 650: 690, 700: 640, 750: 580, 800: 520, 850: 450, 900: 380}[y]
    for x in range(exp_x - 30, exp_x + 30, 5):
        print(f"x={x}: RGB={row[x].tolist()}")
