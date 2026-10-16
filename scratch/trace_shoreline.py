from PIL import Image
import numpy as np

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)
w, h = img.size

# Let's inspect the shoreline y for x from 0 to w:
# At x=0:
# Where does the grass bank hit the water?
# Let's find for several columns where the water reflection starts:
print("Scanning shoreline:")
shore_y = []
for x in range(0, w, 20):
    # Scan from y=430 down to 550
    # Before the shoreline, we have green hills / grass / trees / shoreline reflection
    # Grass has R, G, B with G prominent or grass colors
    # The water surface has reflections, ripples, and is noticeably different
    pass

# Let's print out slices for x in [0, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1665]
sample_x = [0, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1665]
for x in sample_x:
    # let's find y where water starts
    # Water on the left (x < 600) has golden sunlight / river water
    # Water on the right (x > 1000) has blue lake water
    # Near center (600..1000) is distant lake horizon behind the boat
    # Let's print colors from y=450 to 520
    print(f"\n--- x={x} ---")
    for y in range(450, 520, 10):
        print(f"y={y}: {arr[y, x].tolist()}")
