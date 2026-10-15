from PIL import Image
import numpy as np

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)
w, h = img.size
print(f"Image size: {w} x {h}")

# Let's inspect rows around y=440 to 520 across various x positions:
sample_xs = [0, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 833, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1665]

print("Scanning shoreline in new image:")
for x in sample_xs:
    # Print y where grass/trees meet water
    # Grass has prominent G, or warm yellow/green
    # Water has ripples/reflection
    for y in range(450, 500, 5):
        pass

# Let's find for each sample x the transition from land to water:
for x in sample_xs:
    print(f"\n--- x={x} ---")
    for y in range(455, 495, 5):
        r, g, b = arr[y, x]
        print(f"y={y}: RGB=({r:3d},{g:3d},{b:3d})")
