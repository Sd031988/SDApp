"""SD Mixamo -> GLB (Blender-Helfer für die SD Engine)

Fügt eine Mixamo-Figur und ihre Animationen zu EINER .glb-Datei zusammen, die die SD Engine direkt versteht.

So geht's:
  1. Auf mixamo.com eine Figur wählen und als FBX herunterladen ("With Skin").
  2. Animationen (z. B. "Rifle Idle", "Rifle Walk", "Rifle Run", "Death") als FBX herunterladen ("Without Skin").
  3. Alle FBX-Dateien in EINEN Ordner legen.
  4. Ausführen (Blender 4.2 oder neuer):
       blender --background --python sd_mixamo_zu_glb.py -- "C:\\Pfad\\zum\\Ordner" "C:\\Pfad\\soldat.glb"
     Unter Windows liegt blender.exe meist in "C:\\Program Files\\Blender Foundation\\Blender 4.x\\".
  5. Die fertige soldat.glb in der SD Werkstatt unter "📦 Meine Modelle" importieren.

Die Animationen werden nach den Dateinamen benannt (Idle, Walk, Run, Death …).
Die SD Engine ordnet sie automatisch zu: Stehen (idle), Gehen (walk), Rennen (run), Sterben (death/die).
"""
import os
import sys

import bpy


def argumente():
    if "--" in sys.argv:
        rest = sys.argv[sys.argv.index("--") + 1:]
    else:
        rest = sys.argv[1:]
    if len(rest) < 2:
        print("Aufruf: blender --background --python sd_mixamo_zu_glb.py -- <ordner-mit-fbx> <ausgabe.glb>")
        sys.exit(1)
    return rest[0], rest[1]


def leeren():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def importieren(pfad):
    vorher = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=pfad, automatic_bone_orientation=False, ignore_leaf_bones=True)
    return [o for o in bpy.data.objects if o not in vorher]


def aktion_von(armatur):
    ad = armatur.animation_data
    return ad.action if ad and ad.action else None


def main():
    ordner, ziel = argumente()
    dateien = sorted(f for f in os.listdir(ordner) if f.lower().endswith(".fbx"))
    if not dateien:
        print("Keine .fbx-Dateien in", ordner)
        sys.exit(1)
    leeren()
    haupt = None
    aktionen = []
    # zuerst die Datei mit Modell (Mesh) suchen
    for f in dateien:
        neu = importieren(os.path.join(ordner, f))
        armaturen = [o for o in neu if o.type == "ARMATURE"]
        hat_mesh = any(o.type == "MESH" for o in neu)
        name = os.path.splitext(f)[0]
        if haupt is None and hat_mesh and armaturen:
            haupt = armaturen[0]
            a = aktion_von(haupt)
            if a:
                a.name = name
                a.use_fake_user = True
                aktionen.append(a)
            print("Figur:", f)
            continue
        for arm in armaturen:
            a = aktion_von(arm)
            if a:
                a.name = name
                a.use_fake_user = True
                aktionen.append(a)
                print("Animation:", name)
        # Hilfs-Armaturen (Animationen ohne Modell) wieder entfernen
        for o in neu:
            if haupt is None or o is not haupt:
                if not (haupt is None and o.type == "MESH"):
                    bpy.data.objects.remove(o, do_unlink=True)
    if haupt is None:
        print("Keine Figur mit Modell gefunden – mindestens eine FBX muss 'With Skin' sein.")
        sys.exit(1)
    # alle Aktionen als NLA-Spuren an die Figur hängen
    if not haupt.animation_data:
        haupt.animation_data_create()
    haupt.animation_data.action = None
    for a in aktionen:
        spur = haupt.animation_data.nla_tracks.new()
        spur.name = a.name
        streifen = spur.strips.new(a.name, int(a.frame_range[0]), a)
        streifen.name = a.name
        if hasattr(a, "slots") and len(a.slots) and hasattr(streifen, "action_slot"):
            streifen.action_slot = a.slots[0]
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_animations=True,
                              export_animation_mode="NLA_TRACKS", export_skins=True, export_yup=True)
    print("Fertig:", ziel, "mit", len(aktionen), "Animationen:", ", ".join(a.name for a in aktionen))


if __name__ == "__main__":
    main()
