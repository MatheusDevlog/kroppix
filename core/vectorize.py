"""Vetorização (raster/PDF -> SVG) com vtracer, e conversão SVG -> PDF."""
import os

from PIL import Image

from core.formats import ext_of


def _rasterize_pdf_first_page(pdf_path: str, out_png: str, dpi: int = 300) -> None:
    import fitz  # PyMuPDF
    doc = fitz.open(pdf_path)
    doc.load_page(0).get_pixmap(dpi=dpi).save(out_png)
    doc.close()


def _prep(src: str, out_png: str, colors: int) -> None:
    """Achata sobre branco (transparência -> branco) e, se colors>0, reduz p/ N cores."""
    with Image.open(src) as im:
        rgba = im.convert("RGBA")
        white = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        flat = Image.alpha_composite(white, rgba).convert("RGB")
    if colors > 0:
        # MAXCOVERAGE preserva cores raras/extremas (preto/vermelho em arte com muito branco)
        flat = flat.quantize(colors=colors, method=Image.Quantize.MAXCOVERAGE).convert("RGB")
    flat.save(out_png)


def vectorize(input_path: str, out_svg: str, *, colormode: str, colors: int,
              mode: str, corner_threshold: int, filter_speckle: int) -> None:
    """Gera um SVG. colors>0 (modo colorido) reduz pra esse nº de cores; 0 = automático."""
    src = input_path
    temps = []
    if ext_of(input_path) == "pdf":
        png = out_svg + ".src.png"
        _rasterize_pdf_first_page(input_path, png)
        src = png
        temps.append(png)

    use_colors = colors if colormode == "color" else 0
    work = out_svg + ".work.png"
    _prep(src, work, use_colors)
    temps.append(work)

    import vtracer  # import pesado: só ao vetorizar
    color_precision = 8 if use_colors > 0 else 6
    vtracer.convert_image_to_svg_py(
        work, out_svg, colormode=colormode, mode=mode,
        color_precision=color_precision, corner_threshold=corner_threshold, filter_speckle=filter_speckle,
    )

    for f in temps:
        try:
            os.remove(f)
        except OSError:
            pass


def svg_to_pdf(svg_path: str, pdf_path: str) -> None:
    """Converte um SVG em PDF vetorial (svglib + reportlab)."""
    from reportlab.graphics import renderPDF
    from svglib.svglib import svg2rlg
    renderPDF.drawToFile(svg2rlg(svg_path), pdf_path)
