from PIL import Image
import numpy as np

img = Image.open('attached_assets/escora/hero-bg.png')
arr = np.array(img, dtype=np.int32)

# For each y in guide_points, let's find the exact point where water meets boat
test_ys = [488, 495, 500, 510, 520, 535, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 925, 943]

print("Fine-tuning boat rim points:")
refined_points = []
for y in test_ys:
    row = arr[y]
    # Center is 833
    # Search right edge:
    # Wood has high R, low B: diff = R - B
    diff = row[:, 0] - row[:, 2]
    # Moving left from 1400 towards 833:
    # in water, diff is negative. When we hit boat rim, diff becomes positive or jumps!
    r_edge = 833
    for x in range(min(1500, 833 + int((y-488)*1.3) + 30), 833, -1):
        # Rim of boat on right is either bright wood or rim line:
        # Check if this pixel or next pixel inwards is wood:
        if row[x, 0] > row[x, 2] + 5 or (row[x, 0] > 60 and row[x, 2] < 70 and row[x, 1] > row[x, 2]):
            r_edge = x
            break
            
    # Search left edge:
    # In water on left:
    # Moving right from 200 towards 833:
    # Wood starts when diff jumps or wood color starts:
    l_edge = 833
    for x in range(max(0, 833 - int((y-488)*1.3) - 30), 833):
        # Wood on left rim:
        if row[x, 0] > row[x, 2] + 15 and row[x+2, 0] > row[x+2, 2] + 15:
            l_edge = x
            break
            
    refined_points.append((y, l_edge, r_edge))
    print(f"y={y:3d}: Left={l_edge:4d} (RGB={row[l_edge].tolist()}), Right={r_edge:4d} (RGB={row[r_edge].tolist()})")
