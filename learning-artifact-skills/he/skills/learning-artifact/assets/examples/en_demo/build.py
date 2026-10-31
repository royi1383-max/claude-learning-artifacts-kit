import pathlib
here = pathlib.Path(__file__).resolve().parent
fw = here.parent.parent / 'framework'
rd = lambda p: p.read_text(encoding='utf8')
js = '\n'.join([rd(fw / 'lib3.js'), rd(here / 'content_en.js'), rd(fw / 'toc3.js'), rd(here / 'boot_en.js')])
html = rd(fw / 'tpl3.html').replace('__DATA__', '{}').replace('__JS__', js)
(here / 'demo_en.html').write_text(html, encoding='utf8')
print(len(html), 'chars ->', here / 'demo_en.html')
