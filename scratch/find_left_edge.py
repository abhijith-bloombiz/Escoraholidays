import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)

for y in [490, 500, 520, 550, 600, 650, 700, 750, 800, 850, 900, 940]:
    row = arr[y]
    # Center of boat is roughly 833 - (y - 488) * something? Or center is slightly tilted?
    # Let's inspect x from 100 to 833
    # Look at row[x] around where boat gunwale is
    print(f"\n--- Y = {y} ---")
    for x in range(200, 850, 20):
        # print when we get close
        pass
    # Boat left rim has a dark line or sharp edge:
    # Let's print pixels from x=150 to 833 every 10px or so
