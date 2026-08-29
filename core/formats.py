"""Formatos de entrada aceitos e validação."""
import os

# Extensões aceitas (sem ponto). PDF só entra na vetorização.
ACCEPTED_EXTS = {"jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff"}

# Rótulo curto pra UI (sem duplicar tif/tiff nem jpg/jpeg no visual)
ACCEPTED_LABEL = "JPG, PNG, WEBP, JPEG, BMP, TIFF"


def ext_of(path: str) -> str:
    return os.path.splitext(path)[1].lower().lstrip(".")


def is_accepted(path: str, allow_pdf: bool = False) -> bool:
    ext = ext_of(path)
    if allow_pdf and ext == "pdf":
        return True
    return ext in ACCEPTED_EXTS
