from PIL import Image

# Save the pristine composite for fallback
composite = Image.open('scratch/simulated_shader_composite.jpg')
composite.save('attached_assets/escora/hero-bg-composite.png', quality=95)
print("Saved fallback composite to attached_assets/escora/hero-bg-composite.png")
