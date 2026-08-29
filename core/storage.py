"""Salvar resultados na pasta Downloads + arquivos temporários + revelar no Explorer."""
import os
import shutil
import subprocess
import tempfile

try:
    import winreg
except ImportError:  # não-Windows
    winreg = None

_DOWNLOADS_GUID = "{374DE290-123F-4565-9164-39C4925E467B}"
_TEMP_DIR = os.path.join(tempfile.gettempdir(), "designkit")


def downloads_dir() -> str:
    """Pasta Downloads do usuário (via registro; fallback ~/Downloads)."""
    if winreg is not None:
        try:
            sub = r"Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, sub) as key:
                value, _ = winreg.QueryValueEx(key, _DOWNLOADS_GUID)
            value = os.path.expandvars(value)
            if os.path.isdir(value):
                return value
        except OSError:
            pass
    fallback = os.path.join(os.path.expanduser("~"), "Downloads")
    os.makedirs(fallback, exist_ok=True)
    return fallback


def _unique_path(directory: str, stem: str, ext: str) -> str:
    """Evita sobrescrever: nome, nome-1, nome-2..."""
    path = os.path.join(directory, f"{stem}{ext}")
    i = 1
    while os.path.exists(path):
        path = os.path.join(directory, f"{stem}-{i}{ext}")
        i += 1
    return path


def save_image(image, stem: str, ext: str = ".png") -> str:
    """Salva um PIL.Image em Downloads e devolve o caminho final."""
    path = _unique_path(downloads_dir(), stem, ext)
    image.save(path)
    return path


def save_bytes(data: bytes, stem: str, ext: str) -> str:
    """Salva bytes (ex.: SVG) em Downloads e devolve o caminho final."""
    path = _unique_path(downloads_dir(), stem, ext)
    with open(path, "wb") as f:
        f.write(data)
    return path


def save_temp_image(image, stem: str, ext: str = ".png") -> str:
    """Salva um PIL.Image numa área temporária (prévia antes de decidir salvar)."""
    os.makedirs(_TEMP_DIR, exist_ok=True)
    path = _unique_path(_TEMP_DIR, stem, ext)
    image.save(path)
    return path


def temp_path(stem: str, ext: str) -> str:
    """Caminho temporário único (pra libs que escrevem direto no disco, ex.: vtracer)."""
    os.makedirs(_TEMP_DIR, exist_ok=True)
    return _unique_path(_TEMP_DIR, stem, ext)


def download_path(stem: str, ext: str) -> str:
    """Caminho de destino único em Downloads (sem escrever)."""
    return _unique_path(downloads_dir(), stem, ext)


def move_to_downloads(temp_path: str, stem: str, ext: str = ".png") -> str:
    """Move um arquivo temporário pra Downloads (nome único)."""
    dest = _unique_path(downloads_dir(), stem, ext)
    shutil.move(temp_path, dest)
    return dest


def copy_to_downloads(temp_path: str, stem: str, ext: str = ".png") -> str:
    """Copia um temporário pra Downloads (mantém o temp p/ o histórico)."""
    dest = _unique_path(downloads_dir(), stem, ext)
    shutil.copy2(temp_path, dest)
    return dest


def discard(temp_path: str) -> None:
    """Remove um arquivo temporário descartado pelo usuário."""
    try:
        os.remove(temp_path)
    except OSError:
        pass


def reveal(path: str) -> None:
    """Abre o Explorer com o arquivo selecionado."""
    if os.path.exists(path):
        subprocess.Popen(["explorer", "/select,", os.path.normpath(path)])
