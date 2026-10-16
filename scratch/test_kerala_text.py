from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# Load hero-bg.png (1666 x 944)
bg = Image.open('attached_assets/escora/hero-bg.png')
w, h = bg.size

print("Testing KERALA typography placement on hero-bg...")
