#!/usr/bin/env python3
"""Assemble cards/effects/engine/ui into a single self-contained HTML file."""
import re, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/ptcg_job1.html'

def read(n):
    return open(os.path.join(HERE, n), encoding='utf-8').read()

def strip_exports(src):
    return re.sub(r'^\s*if \(typeof module.*$', '', src, flags=re.M)

js = '\n'.join(strip_exports(read(f)) for f in ['cards.js', 'effects.js', 'art.js', 'deckgen.js', 'ai.js', 'engine.js', 'ui.js'])
css = read('style.css')

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Base Set playtest — rules engine (Job 1)</title>
<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<script>
{js}
</script>
</body>
</html>
"""

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print(f'wrote {OUT}  ({len(html):,} bytes)')
