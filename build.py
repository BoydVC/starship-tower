#!/usr/bin/env python3
"""Inline web/ into one self-contained offline file: dist/starship-tower.html."""
import os
R = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(R, p), encoding="utf-8").read()
html = rd("web/index.html").replace("/*__CSS__*/", rd("web/app.css")).replace("/*__APP__*/", rd("web/app.js").replace("</script", "<\\/script"))
os.makedirs(os.path.join(R, "dist"), exist_ok=True)
out = os.path.join(R, "dist/starship-tower.html")
open(out, "w", encoding="utf-8").write(html)
print("built dist/starship-tower.html", len(html.encode()), "bytes")
