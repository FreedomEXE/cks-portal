Place loader assets here for the global loading overlay.

Default file names:
- loader.gif            (base)
- loader@2x.gif         (retina 2x)
- loader@3x.gif         (retina 3x)

Optional environment overrides in apps/frontend/.env:
- VITE_LOADER_IMAGE=/loader.gif
- VITE_LOADER_IMAGE_2X=/loader@2x.gif
- VITE_LOADER_IMAGE_3X=/loader@3x.gif
- VITE_LOADER_SIZE=128               # px
- VITE_LOADER_FORCE_VECTOR=false     # set to true to use vector spinner

Any path you set should be relative to the Vite public root, e.g. /brand/logo.gif.
