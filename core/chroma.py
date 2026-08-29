"""Remoção de fundo por cor (chroma key) — sem IA, ideal p/ fundo sólido."""
import numpy as np
from PIL import Image

_FEATHER = 22.0  # largura da borda suave (em distância de cor)


def remove_color(input_path: str, rgb, tolerance: int) -> Image.Image:
    """Deixa transparente tudo que for parecido com a cor escolhida.

    tolerance: 0..100 (quanto maior, mais tons próximos são removidos).
    """
    with Image.open(input_path) as im:
        arr = np.asarray(im.convert("RGBA")).astype(np.float32)

    r, g, b = rgb
    dist = np.sqrt((arr[..., 0] - r) ** 2 + (arr[..., 1] - g) ** 2 + (arr[..., 2] - b) ** 2)

    thr = (tolerance / 100.0) * 255.0
    # rampa: dentro do limite -> 0 (transparente); além do limite+feather -> 1 (opaco)
    ramp = np.clip((dist - thr) / _FEATHER, 0.0, 1.0)
    arr[..., 3] = arr[..., 3] * ramp

    return Image.fromarray(arr.astype("uint8"), "RGBA")
