from PIL import Image, ImageDraw

from core import vectorize

VEC = dict(colormode="binary", colors=0, mode="spline", corner_threshold=60, filter_speckle=4)


def _amostra(path):
    """Cria um PNG simples: quadrado preto sobre fundo branco."""
    img = Image.new("RGB", (64, 64), "white")
    ImageDraw.Draw(img).rectangle([16, 16, 48, 48], fill="black")
    img.save(path)


def test_vetoriza_gera_svg(tmp_path):
    src = tmp_path / "in.png"
    _amostra(src)
    out = tmp_path / "out.svg"

    vectorize.vectorize(str(src), str(out), **VEC)

    assert out.exists()
    assert "<svg" in out.read_text(encoding="utf-8")


def test_svg_vira_pdf(tmp_path):
    src = tmp_path / "in.png"
    _amostra(src)
    svg = tmp_path / "out.svg"
    vectorize.vectorize(str(src), str(svg), **VEC)

    pdf = tmp_path / "out.pdf"
    vectorize.svg_to_pdf(str(svg), str(pdf))

    assert pdf.exists()
    assert pdf.stat().st_size > 0
