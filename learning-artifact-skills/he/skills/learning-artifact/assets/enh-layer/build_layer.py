"""Append the enhancement layer to an existing artifact page.

usage: python build_layer.py <saved_artifact.html> <config.js> <exec_summary.js> <out.html>

- <saved_artifact.html>: the page as saved by the Artifact tool (the harness skeleton line and the trailing </body></html> are stripped)
- <config.js>: defines window.ENH = {key, sections, G, need, tldr, lecn, groups}  (see cfg_template.js)
- <exec_summary.js>: defines window.ENH.exec = `<div class="exec">...</div>`  (optional, pass an empty file to skip)
"""
import sys, pathlib
here = pathlib.Path(__file__).resolve().parent
rd = lambda p: pathlib.Path(p).read_text(encoding="utf8")
src, cfg, ex, out = sys.argv[1:5]
t = rd(src)
lines = t.split("\n")
if lines[0].startswith("<!doctype html>"):
    t = "\n".join(lines[1:])
t = t.rstrip()
if t.endswith("</body></html>"):
    t = t[: -len("</body></html>")]
layer = "<style>\n" + rd(here / "enh.css") + "\n.wrap [id]{scroll-margin-top:4.2rem}\n</style>\n<script>\n" + rd(cfg) + "\n" + rd(ex) + "\n" + rd(here / "enh.js") + "\n</script>\n"
pathlib.Path(out).write_text(t + "\n" + layer, encoding="utf8")
print("written", out)
