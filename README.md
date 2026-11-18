# Sol 6.2 Workbench

**An exhibition you can play.** Fifty runnable experiments across five benches: Science, Creative, Systems, Algorithms, and Games. Each has its own controls, a shareable URL fragment, and a short note about what changes when you play.

The site is vanilla HTML, CSS, and JavaScript, with no install, backend, or build step. Open `index.html` offline, or serve this directory with `python -m http.server 8000`. Sound experiments only play when you start them. The simulations and metrics are teaching models, not forecasts or production claims.

## GPU edition

The field print is a CUDA-rendered Gray–Scott reaction–diffusion field, not a browser screenshot. The notebook ran it on an NVIDIA RTX PRO 6000 Blackwell Server Edition, producing a 704 × 456 image after 1,700 simulation steps. The measured GPU simulation took 0.508 seconds; that isn't a benchmark and does not count JPEG encoding. See [the renderer](lab/gpu_print.py) and [exact output metadata](lab/render-proof.json). The 50 browser demos do not require CUDA.

To reproduce the print on a machine with PyTorch/CUDA and Pillow: `python lab/gpu_print.py lab/diffusion-print.jpg`.

## GitHub Pages

The repository is ready to deploy as a static site from the root of `main`; `.nojekyll` disables unnecessary Jekyll processing. If Pages is not yet set up, a repository admin can select **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
