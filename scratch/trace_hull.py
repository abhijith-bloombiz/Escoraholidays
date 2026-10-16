import numpy as np
from PIL import Image

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)
w, h = img.size

# Let's inspect the boat edges at y = 490, 500, 520, 550, 600, 650, 700, 750, 800, 850, 900, 940
# For each y, let's find:
# left edge of boat (where water meets boat hull)
# right edge of boat (where boat hull meets water)
coords = []
for y in range(488, h, 20):
    # Search right from 833 for the outer right edge of the boat hull
    # The boat hull on the right has bright illuminated wood (high R, high G, low B),
    # and then immediately outside is the lake water (high B, or greenish blue water).
    # Specifically, look at the transition where color changes from boat to water.
    
    # Let's print out the slice from x=800 to 1400 for selected y
    pass

# Let's print slices to see exact transitions:
for test_y in [500, 550, 600, 700, 800, 900]:
    row = arr[test_y]
    print(f"\n=== Y = {test_y} ===")
    # Print where (R - B) changes sharply
    # Wood: R - B is large positive (+30 to +200)
    # Water: R - B is negative or close to 0 (-100 to +10)
    diff = row[:, 0] - row[:, 2] # R - B
    # Let's find right edge: scanning from center rightwards until diff drops below threshold
    # Or scanning from far right (water) inwards until diff jumps up!
    # In water on right (x=1600): diff is negative!
    for x in range(1600, 833, -1):
        if diff[x] > 20 and diff[x-5] > 20:
            print(f"Right boat edge at y={test_y}: x ~ {x}, RGB={row[x].tolist()}, water outside RGB={row[x+5].tolist()}")
            break
            
    # Left boat edge: scanning from far left (water) inwards:
    # On the left water, morning sun gives golden reflection (R can be high, but G is also high, water has horizontal ripples).
    # But boat wood on left is darker or distinct. Let's inspect:
    for x in range(50, 833, 1):
        # boat hull on left:
        pass
