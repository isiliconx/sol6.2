"""A seeded Gray–Scott reaction–diffusion print for the Sol 6.2 Workbench.

Run in an environment with PyTorch, CUDA and Pillow:
    python lab/gpu_print.py lab/diffusion-print.jpg
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import torch
from PIL import Image


def render_gpu_print(path: str) -> dict:
    if not torch.cuda.is_available():
        raise RuntimeError("A CUDA device is required for this edition.")
    h, w, steps = 456, 704, 1700
    device = torch.device("cuda")
    rng = torch.Generator(device=device).manual_seed(6262026)
    torch.cuda.synchronize()
    start = time.perf_counter()
    y, x = torch.meshgrid(
        torch.linspace(-1, 1, h, device=device),
        torch.linspace(-1.55, 1.55, w, device=device), indexing="ij",
    )
    noise = torch.rand((h, w), generator=rng, device=device)
    u, v = torch.ones_like(x), torch.zeros_like(x)
    # Elliptical islands seed a chemical field, not a photographic effect.
    theta = torch.atan2(y * 1.35, x)
    radius = torch.sqrt(x.square() + (y * 1.35).square())
    loop = torch.abs(radius - (0.65 + 0.15 * torch.sin(theta * 3))) < (0.055 + 0.03 * torch.cos(theta * 11))
    orbit = torch.abs(radius - (1.19 + 0.14 * torch.cos(theta * 2))) < (0.031 + 0.022 * torch.sin(theta * 9))
    seed = (loop | orbit) & (noise > 0.34)
    u[seed] = 0.48 + 0.10 * noise[seed]
    v[seed] = 0.24 + 0.10 * noise[seed]
    feed = 0.0355 + 0.0036 * torch.cos(x * 4 + y * 2.3)
    kill = 0.0595 + 0.0019 * torch.sin(y * 2 + theta)
    def lap(a):
        return torch.roll(a,1,0)+torch.roll(a,-1,0)+torch.roll(a,1,1)+torch.roll(a,-1,1)-4*a
    for _ in range(steps):
        vuv = u * v.square()
        u, v = u + 0.16 * lap(u) - vuv + feed * (1-u), v + 0.08 * lap(v) + vuv - (feed + kill) * v
    torch.cuda.synchronize()
    elapsed = time.perf_counter() - start
    t = v.mul(3.1).clamp(0, 1)
    colors=torch.tensor([(27,16,51),(62,39,106),(136,85,171),(236,129,146),(255,199,149),(255,240,202)],device=device,dtype=torch.float32)
    i=(t*5).floor().long().clamp(0,4)
    blend=((t*5)-i).unsqueeze(-1)
    ink=colors[i]*(1-blend)+colors[i+1]*blend
    paper=(noise*4-2).unsqueeze(-1)
    rgb=(ink+paper).clamp(0,255).to(torch.uint8).cpu().contiguous().numpy()
    out=Path(path)
    out.parent.mkdir(parents=True,exist_ok=True)
    Image.fromarray(rgb).save(out,format="JPEG",quality=90,subsampling=0,optimize=True)
    return {
        "device":torch.cuda.get_device_name(device),
        "width":w,"height":h,"iterations":steps,"seed":6262026,
        "seconds":round(elapsed,3),"sha256":hashlib.sha256(out.read_bytes()).hexdigest(),
    }


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("output",nargs="?",default="diffusion-print.jpg")
    print(json.dumps(render_gpu_print(parser.parse_args().output),indent=2))
