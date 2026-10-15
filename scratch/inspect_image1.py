from PIL import Image
import numpy as np

img = Image.open('C:/Users/candy/.gemini/antigravity-ide/brain/ca35f1de-2c64-4eee-a262-825390a36226/.user_uploaded/media_1792046286623.png')
w, h = img.size
arr = np.array(img)

# Find white letter pixels (R>240, G>240, B>240) in upper half (y < 80)
white_mask = (arr[:80, :, 0] > 240) & (arr[:80, :, 1] > 240) & (arr[:80, :, 2] > 240)
# Sum vertically to find letter spans
col_counts = white_mask.sum(axis=0)

in_letter = False
letter_spans = []
start = 0
for x in range(w):
    if col_counts[x] > 5 and not in_letter:
        in_letter = True
        start = x
    elif col_counts[x] <= 5 and in_letter:
        in_letter = False
        letter_spans.append((start, x))
if in_letter:
    letter_spans.append((start, w))

print("Found", len(letter_spans), "letters in Image 1:")
for i, span in enumerate(letter_spans):
    print(f"Letter {i+1}: x from {span[0]} to {span[1]} (width {span[1] - span[0]})")
