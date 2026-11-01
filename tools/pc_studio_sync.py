#!/usr/bin/env python3
"""Refresh known embedded SD Code-Studio files inside a decrypted native PC ZIP.

Preserves all other agent files; refuses unknown ZIP structures and never overwrites
the input ZIP. The encrypted PC archive requires separate authorized decryption.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import zipfile

REQUIRED = ("index.html", "studio.js", "ki-werkstatt-core.js", "ki-werkstatt-ui.js")
SUFFIXES = {".html", ".js", ".css", ".json", ".webmanifest", ".svg"}
MAX_SIZE = 8 * 1024 * 1024

class SyncError(Exception):
    pass

def valid_path(name):
    p = PurePosixPath(name)
    if not name or "\\" in name or name.startswith("/") or ".." in p.parts or ":" in p.parts[0] or "\x00" in name:
        raise SyncError("Unsafe archive path: " + name)

def sync_zip(input_zip, output_zip, source_studio):
    src, dest, folder = map(Path, (input_zip, output_zip, source_studio))
    if src.resolve() == dest.resolve():
        raise SyncError("Input and output must be different; never overwrite the original PC package")
    if not folder.is_dir() or not src.is_file():
        raise SyncError("Missing source Studio folder or original decrypted PC ZIP")
    source = {}
    for p in folder.iterdir():
        if p.is_file() and p.suffix.lower() in SUFFIXES and not p.name.startswith("."):
            data = p.read_bytes()
            if len(data) > MAX_SIZE:
                raise SyncError("Oversized Studio asset: " + p.name)
            source[p.name] = data
    for p in REQUIRED:
        if not source.get(p):
            raise SyncError("Missing required Studio file: " + p)
    with zipfile.ZipFile(src) as old:
        items = old.infolist()
        names = [i.filename for i in items]
        for name in names:
            valid_path(name)
        if len(names) != len(set(names)):
            raise SyncError("Duplicate ZIP paths cannot be updated safely")
        prefixes = [name[:-len("index.html")] for name in names if name.endswith("studio/index.html")]
        if len(prefixes) != 1:
            raise SyncError("No unique studio/index.html inside PC ZIP. Verify original PC source layout first.")
        prefix = prefixes[0]
        patch = {prefix + key: value for key, value in source.items()}
        changed = [name for name, content in patch.items() if name not in names or old.read(name) != content]
        if not changed:
            raise SyncError("No changes to embedded Studio; package not generated")
        dest.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(dest, "w") as new:
            for info in items:
                data = patch.pop(info.filename, None)
                if data is None:
                    data = b"" if info.is_dir() else old.read(info.filename)
                new.writestr(info, data)
            for name, data in patch.items():
                new.writestr(name, data, compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(dest) as result:
        for name, data in source.items():
            if result.read(prefix + name) != data:
                dest.unlink(missing_ok=True)
                raise SyncError("ZIP verification failed for " + name)
    return {"embedded_studio": prefix, "files_updated": len(changed),
            "files_unchanged": len(source) - len(changed),
            "zip_sha256": hashlib.sha256(dest.read_bytes()).hexdigest()}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", required=True, help="Original decrypted PC ZIP")
    parser.add_argument("--out", required=True, help="New PC ZIP, different path")
    parser.add_argument("--studio", default=str(Path(__file__).resolve().parents[1] / "studio"))
    args = parser.parse_args()
    try:
        print(json.dumps(sync_zip(args.zip, args.out, args.studio), indent=2))
    except (SyncError, OSError, zipfile.BadZipFile) as error:
        print("PC-Studio synchronization stopped safely: " + str(error), file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
