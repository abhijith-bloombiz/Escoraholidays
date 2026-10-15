import numpy as np

# Points
pts_left = [
    (488, 833), (500, 820), (550, 795), (600, 740), (650, 675),
    (700, 615), (750, 555), (800, 490), (850, 425), (900, 355), (943, 293)
]
pts_right = [
    (488, 833), (500, 845), (550, 870), (600, 920), (650, 985),
    (700, 1045), (750, 1108), (800, 1172), (850, 1236), (900, 1302), (943, 1356)
]

y_l = [p[0] for p in pts_left]
x_l = [p[1] for p in pts_left]
y_r = [p[0] for p in pts_right]
x_r = [p[1] for p in pts_right]

poly_l = np.polyfit(y_l, x_l, deg=3)
poly_r = np.polyfit(y_r, x_r, deg=3)

print("Left poly coefficients:", poly_l)
print("Right poly coefficients:", poly_r)

# Check max error
err_l = [abs(np.polyval(poly_l, y) - x) for y, x in pts_left]
err_r = [abs(np.polyval(poly_r, y) - x) for y, x in pts_right]
print("Max error left:", max(err_l))
print("Max error right:", max(err_r))
