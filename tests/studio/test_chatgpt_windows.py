"""Regressionstests fuer den lokalen Python-Assistenten."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

FILE=Path(__file__).resolve().parents[2]/"studio"/"chatgpt-windows"/"sd_bridge_windows.py"
spec=importlib.util.spec_from_file_location("sd_bridge_windows",FILE)
app=importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

class WindowsBridgeTests(unittest.TestCase):
    def test_extension_permissions(self):
        manifest=app.validate()
        self.assertEqual(manifest["manifest_version"],3)
        self.assertEqual(set(manifest["permissions"]),{"contextMenus","storage"})

    def test_named_code_and_language(self):
        s="Hinweis\n### Datei: index.html\n"+chr(96)*3+"html\n<h1>Hallo</h1>\n"+chr(96)*3+"\n"
        self.assertEqual(app.extract(s),[("index.html","<h1>Hallo</h1>\n")])
        t=chr(96)*3+"python\nprint(1)\n"+chr(96)*3
        self.assertEqual(app.extract(t),[("code-01.py","print(1)\n")])

    def test_reject_unsafe_names(self):
        for name in ["../secret.txt","C:/Windows/win.ini","foo//bar.py","CON.txt","a/b/..","dir/a?.py"]:
            with self.subTest(name=name),self.assertRaises(ValueError):
                app.filename(name)

    def test_explicit_write_no_overwrite(self):
        with TemporaryDirectory() as tmp:
            base=Path(tmp)
            files=[("src/program.py","print(1)\n")]
            self.assertEqual(app.save_files(base,files),1)
            self.assertEqual((base/"src"/"program.py").read_text(),"print(1)\n")
            with self.assertRaises(FileExistsError):
                app.save_files(base,files)
            with self.assertRaises(ValueError):
                app.save_files(base,[("../outside.py","bad")])
            self.assertFalse((base.parent/"outside.py").exists())

    def test_symlink_escape(self):
        with TemporaryDirectory() as tmp:
            base=Path(tmp)/"base"
            other=Path(tmp)/"other"
            base.mkdir()
            other.mkdir()
            try:(base/"link").symlink_to(other,target_is_directory=True)
            except (OSError,NotImplementedError):self.skipTest("no symlink permissions")
            with self.assertRaises(ValueError):
                app.save_files(base,[("link/x.py","bad")])
            self.assertFalse((other/"x.py").exists())

if __name__=="__main__":
    unittest.main()
