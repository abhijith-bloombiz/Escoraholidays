from PIL import Image

# Save the half-boat composite as the instant fallback
img = Image.open('scratch/boat_state_initial.jpg')
img.save('attached_assets/escora/hero-bg-composite-half.png', quality=95)
print("Saved attached_assets/escora/hero-bg-composite-half.png")
