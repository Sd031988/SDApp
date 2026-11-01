import sys
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile
sys.path.insert(0,str(Path(__file__).resolve().parents[2] / "tools"))
from pc_studio_sync import sync_zip, SyncError

FILES = ("index.html","studio.js","ki-werkstatt-core.js","ki-werkstatt-ui.js")

class Tests(unittest.TestCase):
    def setup_project(self,tmp):
        p=Path(tmp); folder=p/"studio"; folder.mkdir()
        for name in FILES:
            (folder/name).write_text("current " + name)
        return p,folder

    def test_replaces_studio_only_and_preserves_agent_and_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            p,folder=self.setup_project(tmp); original=p/"pc.zip"; newer=p/"updated.zip"
            with ZipFile(original,"w") as f:
                f.writestr("app/studio/index.html","old html")
                f.writestr("app/studio/studio.js","old js")
                f.writestr("app/main.py","agent unchanged")
                f.writestr("app/data/chats.json","chats unchanged")
            info=sync_zip(original,newer,folder)
            self.assertEqual(info["files_updated"],len(FILES))
            with ZipFile(newer) as f:
                self.assertEqual(f.read("app/studio/studio.js"),b"current studio.js")
                self.assertEqual(f.read("app/main.py"),b"agent unchanged")
                self.assertEqual(f.read("app/data/chats.json"),b"chats unchanged")
            with ZipFile(original) as f:
                self.assertEqual(f.read("app/studio/studio.js"),b"old js")

    def test_unknown_layout_stops_without_writing(self):
        with tempfile.TemporaryDirectory() as tmp:
            p,folder=self.setup_project(tmp); original=p/"pc.zip"; newer=p/"updated.zip"
            with ZipFile(original,"w") as f: f.writestr("agent/desktop.js","original")
            with self.assertRaisesRegex(SyncError,"No unique"):
                sync_zip(original,newer,folder)
            self.assertFalse(newer.exists())

    def test_no_changes_not_published(self):
        with tempfile.TemporaryDirectory() as tmp:
            p,folder=self.setup_project(tmp); original=p/"pc.zip"; newer=p/"updated.zip"
            with ZipFile(original,"w") as f:
                for name in FILES:
                    f.writestr("studio/"+name,"current "+name)
            with self.assertRaisesRegex(SyncError,"No changes"):
                sync_zip(original,newer,folder)
            self.assertFalse(newer.exists())

    def test_never_overwrites_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            p,folder=self.setup_project(tmp)
            with self.assertRaisesRegex(SyncError,"different"):
                sync_zip(p/"same.zip",p/"same.zip",folder)

if __name__=="__main__":
    unittest.main()
