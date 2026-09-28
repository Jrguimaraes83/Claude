#!/usr/bin/env python3
"""Monta a apresentação final em um único arquivo HTML.

Junta o esqueleto (assets/base.html) com os slides escritos para a pregação
e embute todas as imagens como data URI, para que o HTML funcione sozinho.

Uso:
  python3 build.py --slides slides.html --titulo "Em Memória de Mim" \
      --pregador "Pr. Diogo Rojas" --out em-memoria-de-mim.html \
      [--img-dir pasta/com/imagens ...]

Nos slides, escreva {{nome}} onde entra uma imagem. O script procura
nome.png / nome.jpg / nome.jpeg / nome.webp nas pastas passadas em --img-dir
e depois em assets/img e assets/img/exemplo da skill.
"""
import argparse, base64, pathlib, re, sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
TIPOS = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}


def achar(nome, pastas):
    for pasta in pastas:
        for ext in TIPOS:
            f = pasta / f'{nome}{ext}'
            if f.exists():
                return f
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slides', required=True, help='arquivo com as <section class="slide"> em ordem')
    ap.add_argument('--titulo', required=True)
    ap.add_argument('--pregador', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--img-dir', action='append', default=[])
    a = ap.parse_args()

    pastas = [pathlib.Path(p) for p in a.img_dir] + [SKILL / 'assets/img', SKILL / 'assets/img/exemplo']
    base = (SKILL / 'assets/base.html').read_text(encoding='utf-8')
    slides = pathlib.Path(a.slides).read_text(encoding='utf-8')
    html = (base.replace('{{SLIDES}}', slides)
                .replace('{{TITULO}}', a.titulo)
                .replace('{{PREGADOR}}', a.pregador))

    faltando = []
    def trocar(m):
        f = achar(m.group(1), pastas)
        if not f:
            faltando.append(m.group(1))
            return m.group(0)
        return f'data:{TIPOS[f.suffix.lower()]};base64,' + base64.b64encode(f.read_bytes()).decode()
    html = re.sub(r'\{\{([A-Za-z0-9_-]+)\}\}', trocar, html)

    if faltando:
        sys.exit('Imagens não encontradas: ' + ', '.join(sorted(set(faltando))))
    pathlib.Path(a.out).write_text(html, encoding='utf-8')
    n = html.count('class="slide')
    print(f'{a.out}: {n} slides, {len(html) // 1024} KB')


if __name__ == '__main__':
    main()
