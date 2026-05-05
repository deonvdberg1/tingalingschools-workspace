"""Download and test the model using diffusers directly"""
import os, sys, time
os.environ['HF_TOKEN'] = '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'

from diffusers import StableDiffusionPipeline
import torch

model = "stabilityai/sd-turbo"
print(f"Downloading {model} via diffusers...")
sys.stdout.flush()
start = time.time()

pipe = StableDiffusionPipeline.from_pretrained(
    model,
    safety_checker=None,
    requires_safety_checker=False,
    torch_dtype=torch.float16,
    use_safetensors=True,
)

print(f"Downloaded in {time.time()-start:.1f}s")
print(f"Moving to MPS...")
pipe = pipe.to("mps")
print("Ready on MPS!")

# Quick test
print("Testing generation...")
image = pipe(
    prompt="test image, colorful classroom",
    num_inference_steps=2,
    guidance_scale=0.0,
    width=256,
    height=256,
).images[0]
image.save("/Users/deonvandenberg/.openclaw/workspace/test_image.png")
print("✅ Image generated successfully!")
