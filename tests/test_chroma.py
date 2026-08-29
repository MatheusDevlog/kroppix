import numpy as np
from PIL import Image

from core import chroma


def test_remove_color_deixa_a_cor_transparente(tmp_path):
    img = Image.new("RGB", (4, 4), (0, 255, 0))  # verde chapado
    img.putpixel((0, 0), (255, 0, 0))            # um pixel vermelho
    src = tmp_path / "in.png"
    img.save(src)

    out = chroma.remove_color(str(src), (0, 255, 0), tolerance=20)
    arr = np.asarray(out)

    assert out.mode == "RGBA"
    assert arr[1, 1, 3] == 0     # verde -> transparente (alpha 0)
    assert arr[0, 0, 3] == 255   # vermelho -> continua opaco
