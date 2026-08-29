"""Checagem de nova versão via GitHub Releases."""
import json
import urllib.request
import webbrowser

import version

API_RELEASE = "https://api.github.com/repos/MatheusDevlog/kroppix/releases/latest"


def _parts(text: str) -> tuple:
    """'v1.2.0' ou '1.2' -> (1, 2, 0). Partes faltando viram 0."""
    nums = text.lstrip("vV").split(".")
    out = []
    for i in range(3):
        try:
            out.append(int(nums[i]))
        except (IndexError, ValueError):
            out.append(0)
    return tuple(out)


def _is_newer(remote: str, local: str) -> bool:
    return _parts(remote) > _parts(local)


def check(timeout: int = 6) -> dict:
    """Consulta a última release. Falha silenciosa se offline/erro."""
    try:
        req = urllib.request.Request(
            API_RELEASE,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "Kroppix"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        tag = data.get("tag_name", "")
        if tag and _is_newer(tag, version.__version__):
            return {"tem": True, "versao": tag.lstrip("vV"), "url": data.get("html_url", "")}
        return {"tem": False}
    except Exception:
        return {"tem": False}


def open_release(url: str) -> None:
    """Abre a página da release no navegador padrão."""
    if url:
        webbrowser.open(url)
