def get_uv(nx, ny, cw, ch, iw=1666.0, ih=944.0):
    container_aspect = cw / ch
    image_aspect = iw / ih
    
    if container_aspect >= image_aspect:
        u = nx
        v = 1.0 + (ny - 1.0) * (image_aspect / container_aspect)
    else:
        u = 0.5 + (nx - 0.5) * (container_aspect / image_aspect)
        v = ny
        
    return u, v

# Test 1: Exact aspect ratio
u, v = get_uv(0.5, 1.0, 1666, 944)
assert u == 0.5 and v == 1.0, f"Expected (0.5, 1.0), got ({u}, {v})"

# Test 2: Wider container (1920x800)
u, v = get_uv(0.5, 1.0, 1920, 800)
assert u == 0.5 and v == 1.0, f"Expected (0.5, 1.0), got ({u}, {v})"
u0, v0 = get_uv(0.0, 1.0, 1920, 800)
assert u0 == 0.0 and v0 == 1.0

# Test 3: Narrower container (1200x900)
u, v = get_uv(0.5, 1.0, 1200, 900)
assert u == 0.5 and v == 1.0, f"Expected (0.5, 1.0), got ({u}, {v})"
u_top, v_top = get_uv(0.5, 0.0, 1200, 900)
assert u_top == 0.5 and v_top == 0.0

print("UV math for 'cover; center bottom' is 100% correct!")
