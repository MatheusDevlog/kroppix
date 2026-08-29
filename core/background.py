"""Remover fundo com rembg (roda local via onnxruntime)."""
from functools import lru_cache

from PIL import Image
from rembg import new_session, remove

from core import models

# Modelos oferecidos na UI
MODELS = {
    "u2net": "U²-Net (geral, rápido)",
    "isnet-general-use": "ISNet (geral, mais preciso)",
    "birefnet-general": "BiRefNet (máxima qualidade)",
}


@lru_cache(maxsize=4)
def _session(model_name: str):
    return new_session(model_name)


def remove_background(input_path: str, model_name: str = "u2net", alpha_matting: bool = False, on_progress=None) -> Image.Image:
    """Recorta o fundo e devolve um PIL.Image RGBA em resolução total."""
    models.ensure_model(model_name, on_progress)  # baixa com progresso se faltar
    if on_progress:
        on_progress({"phase": "process", "model": model_name})
    with Image.open(input_path) as im:
        source = im.convert("RGBA")
    return remove(source, session=_session(model_name), alpha_matting=alpha_matting)
