# Kroppix

![CI](https://github.com/MatheusDevlog/kroppix/actions/workflows/ci.yml/badge.svg)

Ferramenta de design local e gratuita (desktop) que reúne três utilidades comuns do
dia a dia, sem depender de sites que entregam resultado reduzido ou com marca d'água:

- **Remover Fundo** — recorte por IA ou por cor (conta-gotas).
- **Vetorizar** — imagem/PDF para SVG ou PDF vetorial.
- **Upscale** — ampliar 2x/4x (clássico ou IA).

Tudo roda 100% na máquina, salva em resolução total direto na pasta **Downloads**, com
prévia antes/depois, histórico das 3 últimas versões e configuração padrão recomendada.

Stack: **Python** (backend de processamento) + **pywebview** (janela nativa) +
**React + Vite + TypeScript** (interface). Empacotado com PyInstaller e Inno Setup.

---

## Rodar a partir do zero

Pré-requisitos: **Python 3.12**, **Node.js** e (opcional, só pra gerar o instalador)
**Inno Setup 6**.

```bash
git clone https://github.com/<seu-usuario>/kroppix.git
cd kroppix

# 1) Ambiente Python
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2) Build da interface
cd frontend
npm install
npm run build
cd ..

# 3) Rodar
.venv\Scripts\python.exe app.py
```

Os modelos de IA não vêm no repositório: são baixados na primeira vez que cada
recurso é usado (precisa de internet só nessa primeira vez).

---

## Guia de uso

Fluxo comum às três ferramentas:

1. Clique na ferramenta na tela inicial.
2. Selecionar imagem. Formatos aceitos: JPG, PNG, WEBP, JPEG, BMP, TIFF (e PDF só no
   Vetorizar). Formato inválido gera aviso.
3. Ajuste as opções (já vêm no padrão recomendado).
4. Processe e veja a prévia antes/depois (arraste a linha do meio).
5. Mudou uma opção? O botão de processar volta, e cada tentativa entra no histórico
   (as 3 miniaturas abaixo do preview — clique para recarregar).
6. Salvar em Downloads — aparece "salvo" e o botão Abrir pasta.

**Remover Fundo** — IA (U²-Net rápido, ISNet mais preciso, BiRefNet máxima qualidade)
com bordas suaves opcionais (alpha matting), ou cor sólida via conta-gotas para fundo
chapado. Saída PNG com transparência.

**Vetorizar** — colorido ou P&B; número de cores automático ou fixo; traço arredondado,
reto ou pixelado; suavidade de curvas e remoção de ruído. Aceita PDF (1ª página). Saída
SVG ou PDF vetorial.

**Upscale** — Lanczos (rápido, padrão) ou Real-ESRGAN (IA, melhor qualidade), 2x ou 4x.
A IA usa a GPU via Vulkan; baixa ~45 MB na primeira vez. Saída PNG.

---

## Onde ficam os arquivos

| Coisa | Lugar |
|---|---|
| Resultados salvos | `Downloads` |
| Modelos do rembg | `~/.rembg/models` (baixados na 1ª vez) |
| Real-ESRGAN | `~/.designkit/realesrgan` (baixado na 1ª vez) |
| Temporários das prévias | `%TEMP%/designkit` |

---

## Arquitetura

Janela nativa via pywebview carregando a UI React; o backend Python responde a chamadas
`window.pywebview.api.<metodo>()`. Para não trafegar imagem grande, os arquivos são
lidos/gravados por diálogos nativos e só um thumbnail de prévia cruza a ponte.

```
app.py            # entry point: cria a janela e expoe a classe Api ao JS
core/
  images.py       # previews (thumbnail/base64), preview de PDF
  formats.py      # extensoes aceitas + validacao
  storage.py      # pasta Downloads, temporarios, salvar/mover
  models.py       # download dos modelos do rembg com progresso
  background.py   # remover fundo com rembg (IA)
  chroma.py       # remover fundo por cor (chroma key, numpy)
  vectorize.py    # vetorizar (vtracer) + PDF + SVG->PDF
  upscale.py      # Lanczos + Real-ESRGAN
frontend/         # React + Vite + TypeScript + framer-motion
  src/App.tsx           # troca de telas
  src/components/       # Loader, HomeButtons, Workspace, controles por ferramenta
  src/lib/             # api.ts (ponte) e progress.ts (canal de progresso)
```

Progresso em tempo real: o Python empurra eventos para a UI via
`window.evaluate_js("window.__dk.emit(...)")` (ver `core/models.py`, `app.py`,
`frontend/src/lib/progress.ts`).

---

## Recompilar e redistribuir

```bash
# 1) Build do frontend
cd frontend && npm run build && cd ..

# 2) Empacotar o app (.exe em pasta)
.venv\Scripts\pyinstaller.exe build\kroppix.spec --noconfirm --distpath dist --workpath build\pyi-work

# 3) Gerar o instalador (arquivo unico para distribuir)
"<caminho do Inno Setup>\ISCC.exe" build\kroppix.iss
```

Resultado: `dist_installer\Kroppix-Setup.exe`. O instalador usa AppId fixo, mesma pasta
de instalação e atalhos de mesmo nome, então reinstalar faz upgrade por cima (sem
duplicar). Com `CloseApplications=yes`, se o app estiver aberto ele é fechado antes.

---

## Limitações conhecidas

- Primeiro arranque do .exe demora um pouco carregando as libs de IA antes da janela
  aparecer (melhoria futura: splash nativo ou lazy import das libs pesadas).
- O .exe não é assinado, então o Windows pode mostrar "editor desconhecido" na primeira
  execução (Mais informações → Executar assim mesmo).

---

## Testes e qualidade

- **`pytest`** — testes de unidade e integração da lógica (formatos, checagem de versão,
  gravação de arquivos, vetorização e chroma key). A parte de IA (rembg) é validada
  manualmente por exigir download de modelo.
- **`ruff`** — lint e ordenação de imports.
- **GitHub Actions** — a cada push/PR roda `ruff` + `pytest` (ver o badge acima).

```bash
pip install -r requirements-dev.txt
ruff check .
pytest -q
```

## Licença

[MIT](LICENSE).
