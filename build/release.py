"""Automação de release do Kroppix.

Uso:
    .venv\\Scripts\\python.exe build\\release.py <X.Y.Z> [--no-release]

Passos: grava a versão -> build do frontend -> PyInstaller -> Inno Setup ->
publica a release no GitHub (gh) com o instalador anexado.
'--no-release' gera só o instalador local, sem publicar.
"""
import os
import re
import shutil
import subprocess
import sys

BUILD = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BUILD)
FRONTEND = os.path.join(ROOT, "frontend")
ARQ_VERSION = os.path.join(ROOT, "version.py")
ARQ_ISS = os.path.join(BUILD, "kroppix.iss")
INSTALADOR = os.path.join(ROOT, "dist_installer", "Kroppix-Setup.exe")

CAMINHOS_ISCC = [
    os.path.expanduser(r"~\AppData\Local\Programs\Inno Setup 6\ISCC.exe"),
    r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    r"C:\Program Files\Inno Setup 6\ISCC.exe",
]


def abortar(msg):
    print(f"\n[ERRO] {msg}")
    sys.exit(1)


def achar_iscc():
    for caminho in CAMINHOS_ISCC:
        if os.path.exists(caminho):
            return caminho
    do_path = shutil.which("ISCC")
    if do_path:
        return do_path
    abortar("ISCC.exe (Inno Setup) não encontrado. Instale o Inno Setup 6.")


def gravar_versao(versao):
    with open(ARQ_VERSION, "w", encoding="utf-8") as f:
        f.write(f'__version__ = "{versao}"\n')

    with open(ARQ_ISS, encoding="utf-8") as f:
        conteudo = f.read()
    conteudo = re.sub(r'#define MyAppVersion ".*"', f'#define MyAppVersion "{versao}"', conteudo, count=1)
    with open(ARQ_ISS, "w", encoding="utf-8") as f:
        f.write(conteudo)
    print(f"[1/5] Versão {versao} gravada em version.py e kroppix.iss.")


def rodar(comando, descricao, cwd=ROOT, shell=False):
    print(f"\n>>> {descricao}")
    if subprocess.run(comando, cwd=cwd, shell=shell).returncode != 0:
        abortar(f"Falhou: {descricao}")


def main():
    argv = sys.argv[1:]
    publicar = "--no-release" not in argv
    posicionais = [a for a in argv if not a.startswith("--")]
    if len(posicionais) != 1 or not re.fullmatch(r"\d+\.\d+\.\d+", posicionais[0]):
        abortar("Uso: python build/release.py <versão X.Y.Z> [--no-release]")

    versao = posicionais[0]
    print(f"=== Release do Kroppix {versao} ===")

    gravar_versao(versao)

    rodar("npm run build", "[2/5] Build do frontend (Vite)", cwd=FRONTEND, shell=True)

    rodar(
        [sys.executable, "-m", "PyInstaller", os.path.join(BUILD, "kroppix.spec"),
         "--noconfirm", "--distpath", os.path.join(ROOT, "dist"),
         "--workpath", os.path.join(BUILD, "pyi-work")],
        "[3/5] Gerando o executável (PyInstaller)",
    )

    rodar([achar_iscc(), ARQ_ISS], "[4/5] Compilando o instalador (Inno Setup)")
    if not os.path.exists(INSTALADOR):
        abortar(f"Instalador não encontrado em {INSTALADOR}")

    if not publicar:
        print(f"\n[OK] Instalador gerado: {INSTALADOR}")
        print("     (--no-release: pulei a publicação no GitHub)")
        return

    rodar(
        ["gh", "release", "create", f"v{versao}", INSTALADOR,
         "--title", f"Kroppix {versao}", "--generate-notes"],
        "[5/5] Publicando a release no GitHub (gh)",
        shell=True,
    )
    print(f"\n[OK] Kroppix {versao} publicado!")
    print(f"     Release: https://github.com/MatheusDevlog/kroppix/releases/tag/v{versao}")


if __name__ == "__main__":
    main()
