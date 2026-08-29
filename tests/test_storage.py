import os

from core import storage


def test_unique_path_evita_sobrescrever(tmp_path):
    d = str(tmp_path)
    p1 = storage._unique_path(d, "arte", ".png")
    assert os.path.basename(p1) == "arte.png"
    open(p1, "w").close()  # cria o arquivo

    p2 = storage._unique_path(d, "arte", ".png")
    assert os.path.basename(p2) == "arte-1.png"
    open(p2, "w").close()

    p3 = storage._unique_path(d, "arte", ".png")
    assert os.path.basename(p3) == "arte-2.png"


def test_save_bytes_vai_pra_downloads(tmp_path, monkeypatch):
    # finge a pasta Downloads pra não escrever na real
    monkeypatch.setattr(storage, "downloads_dir", lambda: str(tmp_path))
    dest = storage.save_bytes(b"<svg></svg>", "logo", ".svg")
    assert os.path.dirname(dest) == str(tmp_path)
    with open(dest, "rb") as f:
        assert f.read() == b"<svg></svg>"
