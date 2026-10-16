import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img)
w, h = img.size

# Let's inspect along different columns x from 0 to w:
# In each column, let's find the shoreline y
print("Shoreline detection:")
for x in range(0, w, 100):
    # From y=420 to y=500
    # Green grass has high green, water has blue/gray
    # Let's print colors around y=440..490
    print(f"\n--- x={x} ---")
    for y in range(440, 485, 5):
        r, g, b = arr[y, x]
        print(f"y={y}: R={r:3d} G={g:3d} B={b:3d}")
