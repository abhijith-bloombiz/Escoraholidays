import sys
import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
w, h = img.size

# Let's inspect some rows to see where the shore is and where the boat is
# Center x is around w // 2 = 833
arr = np.array(img)

# Let's inspect column 833 (vertical line down the middle)
# Colors along column 833:
print("Sampling down center line (x=833):")
for y in range(400, 520, 5):
    rgb = arr[y, 833]
    print(f"y={y}: RGB={rgb}")

# Let's inspect row 500 across x:
print("\nSampling across row 500:")
for x in range(700, 960, 20):
    rgb = arr[500, x]
    print(f"x={x}: RGB={rgb}")

# Let's inspect row 700 across x:
print("\nSampling across row 700:")
for x in range(200, 1500, 100):
    rgb = arr[700, x]
    print(f"x={x}: RGB={rgb}")

# Let's inspect row 900 across x:
print("\nSampling across row 900:")
for x in range(100, 1600, 100):
    rgb = arr[900, x]
    print(f"x={x}: RGB={rgb}")
