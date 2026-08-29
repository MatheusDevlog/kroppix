from core.formats import ext_of, is_accepted


def test_aceita_imagens_comuns():
    assert is_accepted("foto.png") is True
    assert is_accepted("arte.JPG") is True  # maiúsculas também valem


def test_rejeita_formato_invalido():
    assert is_accepted("nota.txt") is False


def test_pdf_so_quando_permitido():
    assert is_accepted("doc.pdf", allow_pdf=True) is True
    assert is_accepted("doc.pdf") is False


def test_ext_of_normaliza_para_minusculo():
    assert ext_of("pasta/Arte.PNG") == "png"
