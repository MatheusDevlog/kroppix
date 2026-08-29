// Canal de progresso Python -> JS (o backend chama window.__dk.emit)
export type Progress =
  | { phase: 'download'; model: string; percent: number; mbDone: number; mbTotal: number }
  | { phase: 'process'; model: string; percent?: number }
  | { phase: 'done' }

type Listener = (p: Progress) => void
const listeners = new Set<Listener>()

declare global {
  interface Window {
    __dk?: { emit: (p: Progress) => void }
  }
}

if (typeof window !== 'undefined') {
  window.__dk = { emit: (p) => listeners.forEach((l) => l(p)) }
}

export function onProgress(l: Listener): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}
