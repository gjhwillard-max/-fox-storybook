# Where the forest dreams

An offline, original-pixel 2.5D storybook experiment. No AI generation, CDN, tracking,
remote dependencies, WebGL, external service or build step. CSS and small vanilla JS
are sufficient; Three.js would add no useful fidelity here.

## Start here

Open `dist/index.html` in a desktop browser, or open `standalone.html` (everything
embedded in one file). Both work offline. For a localhost preview, run:

    python -m http.server 8000 --directory dist

Then visit http://localhost:8000. `dist/proof.html` is the first static parallax
proof, preserved separately with no ambient animation.

## Controls

- Still: exact original image; no particles or transforms. Default on every load.
- Depth: pointer or keyboard parallax only. Focus artwork and use arrow keys;
  Escape restores Still. Leaving the image recentres it.
- Alive: depth plus gentle breathing, occasional ear twitch, fireflies and dust.
- Movement: adjusts parallax amplitude; particles can be independently hidden.
- Device tilt: opt-in; first sensor reading calibrates the resting pose.
  Disable/re-enable to recalibrate. Requires a supported secure context (HTTPS
  or localhost); ordinary HTTP over a phone's LAN and some file viewers block
  orientation sensors. No hosting is required for desktop pointer interaction.
- Reduced motion: opens Still; changing the OS preference to reduce returns to
  Still. Users may explicitly choose another mode. Hidden tabs pause CSS animation.

## Preservation / segmentation plan and implementation

1. Retain the original JPEG unchanged, including its full framing and signature.
2. Trace conservative binary masks at the native 1320 x 1422 resolution. Include
   a small original-pixel collar to keep delicate pencil marks. These are manual
   polygon cutouts, not semantic/vector redraws or automatic model segmentation.
3. Separate forest backplate, great mushroom, foreground mushroom, fox and near
   ear. Other trees, plants and mushrooms stay fixed in the forest layer.
4. Copy original RGB bytes into each visible cutout. Extend nearest available
   background texture only beneath removed shapes. For the ear, extend fox
   texture beneath the ear, rather than forest texture. Hidden extensions are
   deterministic nearest-neighbour fills, not invented full illustrations.
5. Recombine the five PNGs at identity and require a zero pixel error against
   the decoded original. Result is recorded in preservation-check.json.
6. First implement proof.html; only after that passes, add optional motion.
7. Keep travel tiny: maximum 3 source pixels at full movement, less by default.
   Breathing uses a 0.2% horizontal / 0.5% vertical scale of the fox cutout;
   the ear rotates at most 0.7 degrees once each 17-second cycle.

## What 'exact' means

At identity, the layered composite matches all RGB pixels of the decoded JPEG.
Still mode also displays the untouched JPEG directly, avoiding any browser
layer-resampling seams. Browser display scaling, colour management and screen
characteristics can affect display pixels; the source artwork is not recoloured.
Motion necessarily resamples the cutouts and slightly changes their positions
and proportions. Select Still for the exact original view.

## Deliberate limits

This is a restrained proof with optional animation, not a fully painted 3D scene.
Manual masks carry tiny strips of neighbouring texture. Hidden fills are suitable
only for this small motion range; large camera travel would expose stretching.
No full hidden fox anatomy or mushroom shapes have been invented. More ambitious
motion would require finer manual mattes and artist-painted hidden areas.
The single ear has a small original-texture collar rather than a redrawn contour.
Physical-device tilt has not been tested on an actual phone.

## Source and assets

- dist/index.html, style.css, app.js: editable website source.
- dist/assets/: original JPEG, transparent PNG cutouts, backplate, grayscale masks.
- contours.json: editable hand-traced polygon coordinates.
- segment.py: reproducible asset extraction and zero-difference verification.
  Requires Pillow, NumPy, SciPy. Run from any directory with `python segment.py`.
  It reads and writes dist/assets/; rerun pack.py to refresh standalone output.
- pack.py: makes standalone.html with embedded assets using Python standard library.
- preservation-check.json: native-resolution pixel comparison.

## Verification performed

- Static proof rendered in a browser before implementing ambient animation.
- Five-layer recomposition: 0 changed pixels, max channel error 0.
- JavaScript syntax check, browser load and mode control checks.
- Source contains no external requests or runtime package dependencies.

Artwork remains the supplied original; ownership is unchanged.
