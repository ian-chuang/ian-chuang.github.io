#!/usr/bin/env python3
"""Local preview without Jekyll: renders index.html with _data into /tmp-style folder and serves it.

  python3 -m venv .venv && .venv/bin/pip install python-liquid pyyaml markdown
  .venv/bin/python tools/preview.py        # http://localhost:4000

GitHub Pages builds the real site with Jekyll; this only mimics it for quick viewing.
"""
import http.server, os, re, shutil, socketserver, sys, tempfile, datetime
from pathlib import Path
import yaml, markdown
from liquid import Environment

root = Path(__file__).resolve().parent.parent
out = Path(tempfile.mkdtemp(prefix="site-preview-"))

def load(name):
    return yaml.safe_load((root / "_data" / f"{name}.yml").read_text())

env = Environment()
env.add_filter("relative_url", lambda s: str(s) if str(s).startswith("/") else "/" + str(s))
env.add_filter("markdownify", lambda s: markdown.markdown(str(s)))
env.add_filter("escape", lambda s: str(s).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;"))

cfg = yaml.safe_load((root / "_config.yml").read_text())
cfg["data"] = {"site": load("site"), "publications": load("publications"), "projects": load("projects")}
src = re.sub(r"\A---.*?---\n", "", (root / "index.html").read_text(), flags=re.S)
(out / "index.html").write_text(env.from_string(src).render(site=cfg))
shutil.copytree(root / "assets", out / "assets")

os.chdir(out)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
print(f"Serving {out} at http://localhost:{port}")
socketserver.TCPServer.allow_reuse_address = True
socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler).serve_forever()
