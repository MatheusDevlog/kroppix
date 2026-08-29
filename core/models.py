"""Download de modelos do rembg com progresso real (streaming)."""
import os

import requests
from rembg.sessions import sessions_class

# URLs oficiais (releases do rembg). Baixamos nós mesmos pra ter barra de progresso.
MODEL_URLS = {
    "u2net": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx",
    "isnet-general-use": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
    "birefnet-general": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx",
}

_BY_NAME = {c.name(): c for c in sessions_class}


def model_path(name: str) -> str:
    """Caminho onde o rembg espera encontrar o modelo."""
    return os.path.join(_BY_NAME[name].model_dir(), f"{name}.onnx")


def is_cached(name: str) -> bool:
    return os.path.exists(model_path(name))


def ensure_model(name: str, on_progress=None) -> str:
    """Garante o modelo em disco; baixa com progresso se faltar."""
    if is_cached(name):
        return model_path(name)

    url = MODEL_URLS[name]
    dest = model_path(name)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    tmp = dest + ".part"

    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("Content-Length", 0))
        done = 0
        last_pct = -1
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                if not chunk:
                    continue
                f.write(chunk)
                done += len(chunk)
                if on_progress and total:
                    pct = int(done * 100 / total)
                    if pct != last_pct:  # emite só quando muda 1% (evita flood)
                        last_pct = pct
                        on_progress({
                            "phase": "download", "model": name, "percent": pct,
                            "mbDone": round(done / 1e6, 1), "mbTotal": round(total / 1e6, 1),
                        })
    os.replace(tmp, dest)
    return dest
