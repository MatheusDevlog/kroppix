"""Ampliar imagem: Lanczos (clássico) e Real-ESRGAN ncnn-vulkan (IA, sem PyTorch)."""
import io
import os
import re
import subprocess
import zipfile

import requests
from PIL import Image

ESRGAN_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
ESRGAN_DIR = os.path.join(os.path.expanduser("~"), ".designkit", "realesrgan")
ESRGAN_EXE = os.path.join(ESRGAN_DIR, "realesrgan-ncnn-vulkan.exe")
_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def lanczos(input_path: str, out_path: str, scale: int) -> None:
    """Ampliação clássica (rápida) via Pillow/Lanczos."""
    with Image.open(input_path) as im:
        im = im.convert("RGBA")
        im.resize((im.width * scale, im.height * scale), Image.LANCZOS).save(out_path)


def _ensure_esrgan(on_progress=None) -> None:
    """Baixa e extrai o Real-ESRGAN na 1ª vez (com progresso)."""
    if os.path.exists(ESRGAN_EXE):
        return
    os.makedirs(ESRGAN_DIR, exist_ok=True)
    with requests.get(ESRGAN_URL, stream=True, timeout=180) as r:
        r.raise_for_status()
        total = int(r.headers.get("Content-Length", 0))
        done = 0
        last = -1
        buf = io.BytesIO()
        for chunk in r.iter_content(chunk_size=1 << 20):
            buf.write(chunk)
            done += len(chunk)
            if on_progress and total:
                pct = int(done * 100 / total)
                if pct != last:
                    last = pct
                    on_progress({"phase": "download", "model": "Real-ESRGAN", "percent": pct,
                                 "mbDone": round(done / 1e6, 1), "mbTotal": round(total / 1e6, 1)})
        zipfile.ZipFile(buf).extractall(ESRGAN_DIR)


def realesrgan(input_path: str, out_path: str, scale: int, on_progress=None) -> None:
    """Ampliação por IA. Roda nativo 4x (modelo de fotos) e reduz se for 2x."""
    _ensure_esrgan(on_progress)
    if on_progress:
        on_progress({"phase": "process", "model": "Real-ESRGAN", "percent": 0})

    tmp4 = out_path + ".x4.png"
    proc = subprocess.Popen(
        [ESRGAN_EXE, "-i", input_path, "-o", tmp4, "-n", "realesrgan-x4plus", "-f", "png"],
        cwd=ESRGAN_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, creationflags=_NO_WINDOW,
    )
    for line in proc.stderr:  # o binário imprime "NN,NN%" -> vira progresso real
        m = re.search(r"(\d+)[.,]\d+%", line)
        if m and on_progress:
            on_progress({"phase": "process", "model": "Real-ESRGAN", "percent": int(m.group(1))})
    proc.wait()
    if proc.returncode != 0 or not os.path.exists(tmp4):
        raise RuntimeError("Real-ESRGAN falhou (verifique a GPU/Vulkan).")

    if scale == 4:
        os.replace(tmp4, out_path)
    else:
        with Image.open(input_path) as orig:
            tw, th = orig.width * scale, orig.height * scale
        with Image.open(tmp4) as im:
            im.convert("RGBA").resize((tw, th), Image.LANCZOS).save(out_path)
        os.remove(tmp4)
