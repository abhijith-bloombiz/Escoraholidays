import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img)
w, h = img.size

for x in [0, 50, 100, 200, 1400, 1500, 1600, 1665]:
    print(f"\n--- x={x} ---")
    for y in range(460, 540, 10):
        r, g, b = arr[y, x]
        print(f"y={y}: R={r:3d} G={g:3d} B={b:3d}")
