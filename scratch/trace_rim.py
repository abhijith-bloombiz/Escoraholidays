from PIL import Image
import numpy as np

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)
w, h = img.size

boat_edges = []
# Boat prow tip
boat_edges.append((488, 833, 833))

for y in range(490, h, 5):
    row = arr[y]
    # Let's find left edge and right edge
    # At y, boat prow is widening.
    # Center is roughly 833 - (y - 488) * 0.55
    center = int(833 - (y - 488) * 0.02)
    
    # Left edge search:
    # Wood on left has warm tone: (R > B + 10) or distinctive boat plank color.
    # Outside the boat on left is water: water has high B, or golden sunlight shimmer where B and G are balanced.
    # But look at the transition: at the boat rim, there is a distinct edge.
    # Let's find x_left where wood begins:
    # We know x_left is between 250 and 833.
    # Let's use the points we verified and find the local gradient peak!
    pass

# Let's test finding the exact rim:
# The rim of the boat has a dark line or sharp highlight
print("Tracing left and right edges:")
pts = []
for y in range(490, h, 10):
    # Search for right edge:
    # Outside is water (B > R by at least 15, or teal/blue)
    # Inside is boat wood (R > B + 10)
    # Right edge is the transition between boat wood and right water:
    r_edge = None
    for x in range(min(w-1, 833 + int((y-488)*1.2)), 833, -1):
        # Water: arr[y, x, 2] > arr[y, x, 0] + 5 (B > R)
        # Boat: arr[y, x-2, 0] > arr[y, x-2, 2] (R > B)
        # Let's check:
        if arr[y, x, 2] > arr[y, x, 0] and arr[y, x-4, 0] > arr[y, x-4, 2] - 5:
            r_edge = x - 2
            break
            
    # Left edge:
    # Wood: R > B + 10
    # Left water: B is higher or G is higher.
    # Let's find the jump in R-B from outside to inside:
    l_edge = None
    diff = row = arr[y, :, 0] - arr[y, :, 2]
    # In water: diff < 20 (even in golden light, diff is < 40 while in wood it's > 50, or wood rim has dark drop)
    # Let's scan from center leftwards to outside:
    # center is around 833
    pass
