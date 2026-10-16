import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img)
w, h = img.size

# Let's inspect rows around the shoreline across the image
# Let's print for key x values:
# where is the boundary?
results = []
for x in range(0, w, 50):
    # find highest y where pixel is definitely shore/grass/trees
    # and lowest y where pixel is definitely water
    for y in range(430, 560):
        r, g, b = arr[y, x]
        # In grass: green is dominant, or yellow-green sunlight
        # Let's check water: in morning light, water has ripples.
        pass

# Let's do a visual slice or edge detection using numpy gradient
gray = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]
# Boat detection:
# Boat prow tip:
print("Searching for boat tip:")
for y in range(480, 500):
    for x in range(825, 842):
        r, g, b = arr[y, x]
        if r > 50 and b < 50 and r > b + 15:
            print(f"Boat tip pixel at y={y}, x={x}: RGB=({r},{g},{b})")
            break
