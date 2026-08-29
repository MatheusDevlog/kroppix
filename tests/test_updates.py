import json

from core import updates


# --- Parte 1: comparação de versões (lógica pura) ---
def test_versao_maior_e_detectada():
    assert updates._is_newer("1.0.1", "1.0.0") is True
    assert updates._is_newer("2.0.0", "1.9.9") is True


def test_versao_igual_ou_menor_nao_conta():
    assert updates._is_newer("1.0.0", "1.0.0") is False
    assert updates._is_newer("1.0.0", "1.2.0") is False


def test_tag_com_v_e_partes_faltando():
    assert updates._parts("v1.2.3") == (1, 2, 3)
    assert updates._parts("1.2") == (1, 2, 0)


# --- Parte 2: check() com uma "internet fingida" (mock) ---
class _FakeResp:
    """Finge a resposta do GitHub (funciona com 'with' e tem .read())."""

    def __init__(self, payload):
        self._payload = payload

    def read(self):
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False


def test_check_avisa_quando_ha_versao_nova(monkeypatch):
    fake = {"tag_name": "v9.9.9", "html_url": "https://github.com/x/releases/tag/v9.9.9"}
    monkeypatch.setattr(updates.urllib.request, "urlopen", lambda *a, **k: _FakeResp(fake))
    r = updates.check()
    assert r["tem"] is True
    assert r["versao"] == "9.9.9"


def test_check_e_silencioso_quando_offline(monkeypatch):
    def explode(*a, **k):
        raise OSError("sem rede")
    monkeypatch.setattr(updates.urllib.request, "urlopen", explode)
    assert updates.check() == {"tem": False}
