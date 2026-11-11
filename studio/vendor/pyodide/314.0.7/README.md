# Pyodide 314.0.7 minimal browser runtime

Unmodified files from the official [core release](https://github.com/pyodide/pyodide/releases/tag/314.0.7), archive `pyodide-core-314.0.7.tar.bz2` (6,757,104 bytes). Runtime and CPython version are fixed by `pyodide-lock.json` (CPython 3.14.2). `manifest.json` records byte counts and SHA-256 hashes of the five runtime files. It is generated locally from those files, not fetched from a CDN.

Pyodide license: MPL 2.0, reproduced in LICENSE. Corresponding source: https://github.com/pyodide/pyodide/tree/314.0.7. CPython license: LICENSE-CPYTHON, from https://github.com/python/cpython/blob/v3.14.2/LICENSE. Preserve upstream notices when distributing these files. No changes were made to the upstream runtime files.

Only the module loader, Emscripten module, WASM, standard-library ZIP and lockfile are shipped. No optional wheel packages or native executable are included. Do not add these files to the normal site-wide precache: the worker downloads them only on Python execution and caches them under `sd-python-314.0.7`. Cache writes are best effort; offline startup requires all five files and the manifest to have been cached successfully. The worker checks the bytes against this manifest before use.
