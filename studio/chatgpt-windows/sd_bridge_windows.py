#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SD Code-Studio Windows-Helfer: Erweiterung + manueller Code-Export."""
import argparse,json,os,re,shutil,sys,webbrowser
from pathlib import Path

ROOT=Path(__file__).resolve().parent
FILES=("manifest.json","background.js","studio-bridge.js")
FENCE=re.compile(r"^\x60{3}([^\r\n\x60]*)\r?\n(.*?)^\x60{3}\s*$",re.M|re.S)
HEADER=re.compile(r"^\s{0,3}#{1,6}\s*(?:Datei|File)\s*:\s*(.+?)\s*$",re.I|re.M)
LANG={"python":"py","py":"py","javascript":"js","js":"js","html":"html",
      "css":"css","java":"java","json":"json","typescript":"ts","ts":"ts",
      "tsx":"tsx","jsx":"jsx","sql":"sql","php":"php","go":"go",
      "bash":"sh","sh":"sh","markdown":"md","xml":"xml"}
RESERVED={"CON","PRN","AUX","NUL"}|{"COM%d"%i for i in range(1,10)}|{"LPT%d"%i for i in range(1,10)}

def validate(root=ROOT):
    for name in FILES:
        if not (root/name).is_file():raise ValueError("Datei fehlt: "+name)
    m=json.loads((root/"manifest.json").read_text(encoding="utf-8-sig"))
    hosts={"https://www.thesdhub.com/studio/*","https://thesdhub.com/studio/*"}
    scripts=m.get("content_scripts",[])
    if (m.get("manifest_version")!=3 or m.get("background",{}).get("service_worker")!="background.js"
        or set(m.get("permissions",[]))!={"contextMenus","storage"}
        or set(m.get("host_permissions",[]))!=hosts
        or len(scripts)!=1 or scripts[0].get("js")!=["studio-bridge.js"]
        or set(scripts[0].get("matches",[]))!=hosts):
        raise ValueError("Erweiterung hat unerwartete Berechtigungen")
    return m

def prepare():
    validate()
    root=Path(os.environ.get("LOCALAPPDATA") or str(Path.home()/".sd-code-studio"))
    out=root/"SD-Code-Studio"/"ChatGPT-Bruecke"/"extension"
    out.mkdir(parents=True,exist_ok=True)
    for name in FILES:
        temp=out/(name+".sd-tmp")
        try:
            shutil.copyfile(ROOT/name,temp)
            temp.replace(out/name)
        finally:
            if temp.exists():temp.unlink()
    validate(out)
    return out

def filename(raw):
    name=raw.strip().strip(chr(96)).replace("\\","/")
    if not name or name.startswith("/") or re.match(r"^[A-Za-z]:",name):
        raise ValueError("Absoluter Dateipfad gesperrt")
    parts=name.split("/")
    if len(name)>240 or any(not p or p in (".","..") or p.endswith(("."," "))
        or p.split(".")[0].upper() in RESERVED or len(p)>120
        or any(c in '<>:"|?*' or ord(c)<32 for c in p) for p in parts):
        raise ValueError("Unsicherer Dateiname: "+name)
    return "/".join(parts)

def extract(text):
    if len(text)>2_000_000:raise ValueError("Maximal 2 MB Text")
    result,used=[],set()
    serial=[0]
    def add(name,code):
        if not code.strip():return
        name=filename(name)
        if name.casefold() in used or len(result)>=100:
            raise ValueError("Dateiname doppelt oder ueber 100 Dateien")
        used.add(name.casefold())
        result.append((name,code.rstrip("\r\n")+"\n"))
    def anonymous(segment):
        for m in FENCE.finditer(segment):
            serial[0]+=1
            lang=m.group(1).strip().split(" ")[0].lower()
            add("code-%02d.%s"%(serial[0],LANG.get(lang,"txt")),m.group(2))
    headers=list(HEADER.finditer(text))
    if not headers:
        anonymous(text)
        return result
    anonymous(text[:headers[0].start()])
    for i,h in enumerate(headers):
        end=headers[i+1].start() if i+1<len(headers) else len(text)
        segment=text[h.end():end]
        blocks=list(FENCE.finditer(segment))
        if len(blocks)>1:raise ValueError("Mehrere Codebloecke pro Datei")
        add(h.group(1),blocks[0].group(2) if blocks else segment.strip("\r\n"))
    return result

def save_files(folder,files,overwrite=False):
    base=folder.resolve()
    if not base.is_dir():raise ValueError("Zielordner fehlt")
    planned=[]
    for name,body in files:
        dest=(base/filename(name)).resolve()
        try:dest.relative_to(base)
        except ValueError:raise ValueError("Pfad verlaesst den Zielordner")
        if dest.exists() and (dest.is_dir() or not overwrite):
            raise FileExistsError(str(dest))
        planned.append((dest,body))
    for dest,body in planned:
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text(body,encoding="utf-8")
    return len(planned)

def gui():
    import tkinter as tk
    from tkinter import ttk,filedialog,messagebox
    app=tk.Tk()
    app.title("SD Code-Studio - ChatGPT-Bruecke / Windows")
    app.geometry("800x600")
    tabs=ttk.Notebook(app)
    tabs.pack(fill="both",expand=True,padx=16,pady=16)
    one=ttk.Frame(tabs,padding=16)
    tabs.add(one,text="1  Erweiterung einrichten")
    ttk.Label(one,text="ChatGPT und SD Code-Studio verbinden",font=("Segoe UI",16,"bold")).pack(anchor="w")
    ttk.Label(one,justify="left",text=
        "1. Erweiterung vorbereiten anklicken.\n"
        "2. edge://extensions oder chrome://extensions im Browser oeffnen.\n"
        "3. Entwicklermodus aktivieren, 'Entpackte Erweiterung laden' waehlen.\n"
        "4. Den angezeigten Erweiterungsordner auswaehlen.\n"
        "5. ChatGPT-Text markieren, Rechtsklick und ans Studio senden.\n\n"
        "Die studio-bridge.js Datei darf NICHT doppelt angeklickt werden!",
        wraplength=740).pack(anchor="w",pady=18)
    status=tk.StringVar(value="Nicht eingerichtet")
    ttk.Label(one,textvariable=status,wraplength=740).pack(anchor="w",pady=10)
    def setup():
        try:
            location=prepare()
            status.set(str(location))
            messagebox.showinfo("Bereit","Im Browser diesen Ordner waehlen:\n"+str(location))
        except Exception as e:messagebox.showerror("Fehler",str(e))
    ttk.Button(one,text="Erweiterung vorbereiten",command=setup).pack(anchor="w",pady=8)
    ttk.Button(one,text="Studio oeffnen",command=lambda:webbrowser.open("https://www.thesdhub.com/studio/")).pack(anchor="w",pady=8)
    two=ttk.Frame(tabs,padding=16)
    tabs.add(two,text="2  Code-Export (optional)")
    ttk.Label(two,text="Kopierten KI-Text pruefen und nur Code-Dateien speichern.").pack(anchor="w")
    editor=tk.Text(two,height=19,wrap="none",font=("Consolas",10))
    editor.pack(fill="both",expand=True,pady=8)
    result=tk.StringVar(value="Noch keine Dateien erkannt")
    ttk.Label(two,textvariable=result,wraplength=740).pack(anchor="w",pady=6)
    def paste():
        try:
            editor.delete("1.0","end")
            editor.insert("1.0",app.clipboard_get())
        except Exception as e:messagebox.showerror("Zwischenablage",str(e))
    def export():
        try:
            files=extract(editor.get("1.0","end-1c"))
            result.set(", ".join(n for n,_ in files[:12]) if files else "Keine Code-Dateien erkannt")
            if not files:return
            chosen=filedialog.askdirectory(title="Code-Zielordner auswaehlen")
            if not chosen:return
            folder=Path(chosen)
            existing=[n for n,_ in files if (folder/n).exists()]
            if existing and not messagebox.askyesno("Ueberschreiben?","\n".join(existing[:10])):return
            if not messagebox.askyesno("Dateien speichern?",
                "%d Dateien nach %s speichern? Kein Code wird ausgefuehrt."%(len(files),chosen)):return
            count=save_files(folder,files,overwrite=bool(existing))
            messagebox.showinfo("Gespeichert","%d Dateien gespeichert. Code vor Ausfuehrung pruefen."%count)
        except Exception as e:messagebox.showerror("Code-Export",str(e))
    ttk.Button(two,text="Zwischenablage einfuegen",command=paste).pack(side="left",padx=5)
    ttk.Button(two,text="Pruefen und speichern",command=export).pack(side="left",padx=5)
    app.mainloop()

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--diagnose",action="store_true")
    p.add_argument("--install",action="store_true")
    a=p.parse_args()
    if sys.version_info<(3,9):p.error("Python 3.9 oder neuer erforderlich")
    if a.diagnose:print("OK: Erweiterung",validate().get("version"),", Python",sys.version.split()[0])
    elif a.install:print("Erweiterung bereit:",prepare())
    else:gui()

if __name__=="__main__":
    main()
