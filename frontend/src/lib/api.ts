// Ponte JS -> Python (pywebview injeta window.pywebview.api)
export type Picked = { ok: true; path: string; name: string; preview: string }
export type Rejected = { error: string }
export type PickResult = Picked | Rejected | null

export type ProcResult =
  | { ok: true; preview: string; tempPath: string; stem: string; kind: string }
  | { error: string }

export type SavedResult = { savedName: string; savedPath: string }

export type VectorOpts = {
  colormode: string; colors: number; mode: string; cornerThreshold: number; filterSpeckle: number
}

export type AppConfig = { acceptedLabel: string; models: { id: string; label: string }[] }

type PyApi = {
  ping: () => Promise<string>
  config: () => Promise<AppConfig>
  pick_image: (allowPdf: boolean) => Promise<PickResult>
  remove_background: (path: string, model: string, alphaMatting: boolean) => Promise<ProcResult>
  remove_color: (path: string, rgb: [number, number, number], tolerance: number) => Promise<ProcResult>
  vectorize: (path: string, colormode: string, colors: number, mode: string,
              cornerThreshold: number, filterSpeckle: number) => Promise<ProcResult>
  upscale: (path: string, method: string, scale: number) => Promise<ProcResult>
  save_to_downloads: (tempPath: string, stem: string, fmt: string) => Promise<SavedResult>
  discard: (tempPath: string) => Promise<boolean>
  reveal: (path: string) => Promise<boolean>
}

declare global {
  interface Window {
    pywebview?: { api: PyApi }
  }
}

// Aguarda a ponte ficar disponível (injetada de forma assíncrona)
function ready(timeout = 4000): Promise<boolean> {
  if (window.pywebview?.api) return Promise.resolve(true)
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), timeout)
    window.addEventListener('pywebviewready', () => { clearTimeout(t); resolve(true) }, { once: true })
  })
}

export const api = {
  async ping(): Promise<string> {
    if (!(await ready())) return 'sem ponte (rodando no navegador)'
    return window.pywebview!.api.ping()
  },
  async config(): Promise<AppConfig | null> {
    if (!(await ready())) return null
    return window.pywebview!.api.config()
  },
  async pickImage(allowPdf = false): Promise<PickResult> {
    if (!(await ready())) return null
    return window.pywebview!.api.pick_image(allowPdf)
  },
  async removeBackground(path: string, model: string, alphaMatting: boolean): Promise<ProcResult> {
    if (!(await ready())) return { error: 'sem ponte' }
    return window.pywebview!.api.remove_background(path, model, alphaMatting)
  },
  async removeColor(path: string, rgb: [number, number, number], tolerance: number): Promise<ProcResult> {
    if (!(await ready())) return { error: 'sem ponte' }
    return window.pywebview!.api.remove_color(path, rgb, tolerance)
  },
  async vectorize(path: string, o: VectorOpts): Promise<ProcResult> {
    if (!(await ready())) return { error: 'sem ponte' }
    return window.pywebview!.api.vectorize(path, o.colormode, o.colors, o.mode, o.cornerThreshold, o.filterSpeckle)
  },
  async upscale(path: string, method: string, scale: number): Promise<ProcResult> {
    if (!(await ready())) return { error: 'sem ponte' }
    return window.pywebview!.api.upscale(path, method, scale)
  },
  async saveToDownloads(tempPath: string, stem: string, fmt: string): Promise<SavedResult> {
    return window.pywebview!.api.save_to_downloads(tempPath, stem, fmt)
  },
  async discard(tempPath: string): Promise<void> {
    if (window.pywebview?.api) await window.pywebview.api.discard(tempPath)
  },
  async reveal(path: string): Promise<void> {
    if (await ready()) await window.pywebview!.api.reveal(path)
  },
}
