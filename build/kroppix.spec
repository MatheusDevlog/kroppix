# PyInstaller spec do Kroppix
import os
from PyInstaller.utils.hooks import collect_all

ROOT = os.path.dirname(SPECPATH)  # o spec fica em build/, então ROOT é a raiz do projeto

datas = [(os.path.join(ROOT, "frontend", "dist"), "frontend/dist")]
binaries = []
hiddenimports = []

# Libs pesadas/dinâmicas que o PyInstaller não detecta sozinho
for pkg in ["rembg", "onnxruntime", "vtracer", "fitz", "pymupdf", "svglib",
            "reportlab", "skimage", "numba", "llvmlite", "scipy", "pymatting", "PIL"]:
    try:
        d, b, h = collect_all(pkg)
        datas += d; binaries += b; hiddenimports += h
    except Exception:
        pass

a = Analysis(
    [os.path.join(ROOT, "app.py")],
    pathex=[ROOT],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

# Splash nativo: aparece instantaneamente ao abrir, antes de o Python carregar
splash = Splash(
    os.path.join(ROOT, "build", "kroppix_splash.png"),
    binaries=a.binaries,
    datas=a.datas,
    always_on_top=True,
)

exe = EXE(
    pyz, a.scripts, splash, splash.binaries, [],
    exclude_binaries=True,
    name="Kroppix",
    console=False,
    icon=os.path.join(ROOT, "build", "kroppix.ico"),
)
coll = COLLECT(exe, a.binaries, a.datas, name="Kroppix")
