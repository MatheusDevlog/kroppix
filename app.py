"""Kroppix — app desktop (casca pywebview)."""
import json
import os
import sys

import webview

try:
    import pyi_splash  # só existe no exe empacotado com splash
except Exception:
    pyi_splash = None

import version
from core import background, chroma, storage, updates
from core import upscale as upscaler
from core import vectorize as vectorizer
from core.formats import ACCEPTED_LABEL, is_accepted
from core.images import data_url_from_image, svg_data_url, thumbnail_data_url

# Empacotado (PyInstaller): os dados ficam em sys._MEIPASS (_internal/)
BASE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
DIALOG_TYPES = ("Imagens (*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.tif;*.tiff)", "Todos os arquivos (*.*)")
DIALOG_TYPES_PDF = ("Imagens e PDF (*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.tif;*.tiff;*.pdf)", "Todos os arquivos (*.*)")
INVALID_MSG = f"Formato inválido — use {ACCEPTED_LABEL}"


def _emit(payload: dict) -> None:
    """Empurra progresso pro frontend (window.__dk.emit)."""
    if webview.windows:
        try:
            webview.windows[0].evaluate_js(f"window.__dk && window.__dk.emit({json.dumps(payload)})")
        except Exception:
            pass


def _close_splash() -> None:
    """Fecha o splash nativo quando a janela já apareceu."""
    if pyi_splash is not None:
        try:
            pyi_splash.close()
        except Exception:
            pass


class Api:
    """Métodos expostos ao frontend via window.pywebview.api."""

    def ping(self) -> str:
        return "pong — Python 3.12 conectado"

    def config(self) -> dict:
        return {
            "acceptedLabel": ACCEPTED_LABEL,
            "models": [{"id": k, "label": v} for k, v in background.MODELS.items()],
        }

    def app_version(self) -> str:
        return version.__version__

    def check_update(self) -> dict:
        """Diz se há versão nova no GitHub (falha silenciosa se offline)."""
        return updates.check()

    def open_external(self, url: str) -> bool:
        """Abre a página da release no navegador."""
        updates.open_release(url)
        return True

    def pick_image(self, allow_pdf: bool = False):
        """Diálogo nativo -> valida formato -> caminho + preview."""
        types = DIALOG_TYPES_PDF if allow_pdf else DIALOG_TYPES
        window = webview.active_window()
        result = window.create_file_dialog(webview.OPEN_DIALOG, file_types=types)
        if not result:
            return None
        path = result[0]
        if not is_accepted(path, allow_pdf=allow_pdf):
            return {"error": INVALID_MSG + (", PDF" if allow_pdf else "")}
        return {
            "ok": True,
            "path": path,
            "name": os.path.basename(path),
            "preview": thumbnail_data_url(path),
        }

    def remove_background(self, path: str, model: str, alpha_matting: bool):
        """Recorta o fundo, salva num temporário e devolve a prévia (não salva ainda)."""
        if not is_accepted(path):
            return {"error": INVALID_MSG}
        try:
            image = background.remove_background(path, model, alpha_matting, on_progress=_emit)
        except Exception as err:  # ex.: sem internet no 1º download do modelo
            return {"error": f"Não consegui processar: {err}"}
        stem = os.path.splitext(os.path.basename(path))[0] + "-sem-fundo"
        temp = storage.save_temp_image(image, stem, ".png")
        return {"ok": True, "preview": data_url_from_image(image), "tempPath": temp, "stem": stem, "kind": "png"}

    def remove_color(self, path: str, rgb, tolerance: int):
        """Chroma key: remove por semelhança de cor (modo conta-gotas)."""
        if not is_accepted(path):
            return {"error": INVALID_MSG}
        try:
            image = chroma.remove_color(path, rgb, tolerance)
        except Exception as err:
            return {"error": f"Não consegui processar: {err}"}
        stem = os.path.splitext(os.path.basename(path))[0] + "-sem-fundo"
        temp = storage.save_temp_image(image, stem, ".png")
        return {"ok": True, "preview": data_url_from_image(image), "tempPath": temp, "stem": stem, "kind": "png"}

    def vectorize(self, path: str, colormode: str, colors: int, mode: str,
                  corner_threshold: int, filter_speckle: int):
        """Vetoriza (raster/PDF -> SVG), salva num temporário e devolve a prévia."""
        if not is_accepted(path, allow_pdf=True):
            return {"error": INVALID_MSG + ", PDF"}
        stem = os.path.splitext(os.path.basename(path))[0] + "-vetor"
        out = storage.temp_path(stem, ".svg")
        try:
            vectorizer.vectorize(path, out, colormode=colormode, colors=colors,
                                 mode=mode, corner_threshold=corner_threshold, filter_speckle=filter_speckle)
        except Exception as err:
            return {"error": f"Não consegui vetorizar: {err}"}
        return {"ok": True, "preview": svg_data_url(out), "tempPath": out, "stem": stem, "kind": "svg"}

    def upscale(self, path: str, method: str, scale: int):
        """Amplia (Lanczos clássico ou Real-ESRGAN IA), salva num temporário e devolve a prévia."""
        if not is_accepted(path):
            return {"error": INVALID_MSG}
        stem = os.path.splitext(os.path.basename(path))[0] + f"-{scale}x"
        out = storage.temp_path(stem, ".png")
        try:
            if method == "ia":
                upscaler.realesrgan(path, out, scale, on_progress=_emit)
            else:
                upscaler.lanczos(path, out, scale)
        except Exception as err:
            return {"error": f"Não consegui ampliar: {err}"}
        return {"ok": True, "preview": thumbnail_data_url(out), "tempPath": out, "stem": stem, "kind": "png"}

    def save_to_downloads(self, temp_path: str, stem: str, fmt: str = "png"):
        """Salva a prévia em Downloads no formato pedido (png/svg copia; pdf converte do svg)."""
        if fmt == "pdf":
            dest = storage.download_path(stem, ".pdf")
            vectorizer.svg_to_pdf(temp_path, dest)
        else:
            dest = storage.copy_to_downloads(temp_path, stem, "." + fmt)
        return {"savedName": os.path.basename(dest), "savedPath": dest}

    def discard(self, temp_path: str) -> bool:
        storage.discard(temp_path)
        return True

    def reveal(self, path: str) -> bool:
        storage.reveal(path)
        return True


def resolve_url() -> str:
    """Dev: servidor Vite. Produção: build estático."""
    if os.environ.get("APP_DEV"):
        return "http://localhost:5173"
    return os.path.join(BASE_DIR, "frontend", "dist", "index.html")


def main() -> None:
    window = webview.create_window(
        "Kroppix",
        url=resolve_url(),
        js_api=Api(),
        width=1120,
        height=760,
        min_size=(940, 640),
        background_color="#0d1117",
    )
    window.events.shown += _close_splash
    webview.start()


if __name__ == "__main__":
    main()
