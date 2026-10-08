#!/usr/bin/env python3
"""
Télécharge les polices Google utilisées par l'application (style de base + identités) pour les servir depuis
l'application elle-même : plus aucune requête vers Google à l'affichage (RGPD, voir docs/LICENCES.md).

    python3 scripts/fetch_fonts.py

Lit les familles dans style de base (BASE_FONTS) et dans branding/*.json ("theme.googleFonts"), télécharge les
fichiers woff2 (sous-ensembles latin et latin-ext) dans fonts/ et écrit fonts/fonts.css. À relancer après
l'ajout d'une identité qui utilise une nouvelle police. Polices sous licence SIL Open Font License.
"""
import glob
import json
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'fonts')
BASE_FONTS = None   # style de base : police du système, rien à télécharger (Montserrat vient du thème GTLC)
SUBSETS = ('latin', 'latin-ext')
# Navigateur récent : Google renvoie alors du woff2 avec les sous-ensembles commentés (/* latin */)
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req) as r:
        return r.read()


def specs():
    out = [BASE_FONTS] if BASE_FONTS else []
    for path in sorted(glob.glob(os.path.join(ROOT, 'branding', '*.json'))):
        with open(path, encoding='utf-8') as f:
            fonts = json.load(f).get('theme', {}).get('googleFonts')
        if fonts:
            out.append(fonts)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    css_out, seen = [], set()
    for spec in specs():
        css = fetch(f'https://fonts.googleapis.com/css2?{spec}&display=swap').decode()
        for subset, block in re.findall(r'/\* ([\w-]+) \*/\s*(@font-face \{.*?\})', css, flags=re.S):
            if subset not in SUBSETS:
                continue
            family = re.search(r"font-family: '([^']+)'", block).group(1)
            weight = re.search(r'font-weight: ([\d ]+);', block).group(1)
            style = re.search(r'font-style: (\w+);', block).group(1)
            key = (family, weight, style, subset)
            if key in seen:
                continue
            seen.add(key)
            url = re.search(r'url\((https://[^)]+\.woff2)\)', block).group(1)
            name = f"{family.lower().replace(' ', '-')}-{subset}-{os.path.basename(url)}"
            path = os.path.join(OUT, name)
            if not os.path.exists(path):
                with open(path, 'wb') as f:
                    f.write(fetch(url))
            css_out.append(f'/* {family} {weight} {subset} */\n' + block.replace(url, name))
    with open(os.path.join(OUT, 'fonts.css'), 'w', encoding='utf-8') as f:
        f.write('/* Généré par scripts/fetch_fonts.py : polices Google servies par l\'application (SIL OFL) */\n\n')
        f.write('\n\n'.join(css_out) + '\n')
    files = [n for n in os.listdir(OUT) if n.endswith('.woff2')]
    size = sum(os.path.getsize(os.path.join(OUT, n)) for n in files)
    print(f'{len(css_out)} @font-face, {len(files)} fichiers woff2 ({size // 1024} Ko) → fonts/fonts.css')


if __name__ == '__main__':
    main()
