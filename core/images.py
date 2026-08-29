"""Helpers de imagem compartilhados."""
import base64
import io

from PIL import Image


def _pdf_first_page(path: str) -> Image.Image:
    import fitz  # PyMuPDF
    doc = fitz.open(path)
    pix = doc.load_page(0).get_pixmap(dpi=150)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()
    return img


def _encode(im: Image.Image, max_side: int) -> str:
    im = im.convert("RGBA")
    im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def thumbnail_data_url(path: str, max_side: int = 640) -> str:
    """Preview (data URL PNG) a partir de um caminho (aceita PDF)."""
    if path.lower().endswith(".pdf"):
        return _encode(_pdf_first_page(path), max_side)
    with Image.open(path) as im:
        return _encode(im, max_side)


def data_url_from_image(image: Image.Image, max_side: int = 640) -> str:
    """Preview (data URL PNG) a partir de um PIL.Image em memória."""
    return _encode(image.copy(), max_side)


def svg_data_url(svg_path: str) -> str:
    """Preview (data URL) de um arquivo SVG."""
    with open(svg_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"
