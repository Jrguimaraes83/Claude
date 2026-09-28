#!/usr/bin/env python3
"""Junta os PNGs dos slides em folhas de contato (6 por folha) para revisar rápido.

Uso: python3 folhas.py pasta-png
Gera pasta-png/folha1.jpg, folha2.jpg, ... Precisa do Pillow (pip install pillow).
"""
import glob, os, sys
from PIL import Image

pasta = sys.argv[1]
fs = sorted(f for f in glob.glob(os.path.join(pasta, '[0-9]*.png')))
for s in range(0, len(fs), 6):
    folha = Image.new('RGB', (1920, 1620), 'white')
    for k, f in enumerate(fs[s:s + 6]):
        folha.paste(Image.open(f).convert('RGB').resize((960, 540)), ((k % 2) * 960, (k // 2) * 540))
    saida = os.path.join(pasta, f'folha{s // 6 + 1}.jpg')
    folha.save(saida, quality=70)
    print(saida)
