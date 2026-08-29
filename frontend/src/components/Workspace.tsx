import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api, type AppConfig, type Picked, type SavedResult } from '../lib/api'
import { onProgress, type Progress } from '../lib/progress'
import BeforeAfter from './BeforeAfter'
import BackgroundControls from './BackgroundControls'
import VectorizeControls, { type VecValues, VEC_DEFAULTS } from './VectorizeControls'
import UpscaleControls, { type UpValues, UP_DEFAULTS } from './UpscaleControls'
import { primary, ghost, savedBox as savedBoxStyle, hint as hintStyle } from './ui'
import type { Tool } from './HomeButtons'

const titles: Record<Tool, string> = { background: 'Remover Fundo', vectorize: 'Vetorizar', upscale: 'Upscale' }
const shortName: Record<string, string> = {
  'u2net': 'U²-Net', 'isnet-general-use': 'ISNet', 'birefnet-general': 'BiRefNet', 'chroma': 'Cor sólida',
}
const bgLabel = (m: string, a: boolean) => (shortName[m] ?? m) + (a ? ' · suave' : '')
const tracoLabel: Record<string, string> = { spline: 'Arredondado', polygon: 'Reto', pixel: 'Pixelado' }
const newId = () => (crypto.randomUUID?.() ?? String(Date.now() + Math.random()))

type Status = 'idle' | 'working' | 'compare' | 'saved'
type HistItem = { id: string; preview: string; tempPath: string; stem: string; kind: string; label: string; meta: any }

// Shell compartilhado: seleção, processamento (progresso), prévia antes/depois, histórico e salvar
export default function Workspace({ tool, onBack }: { tool: Tool; onBack: () => void }) {
  const [cfg, setCfg] = useState<AppConfig | null>(null)
  const [img, setImg] = useState<Picked | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [history, setHistory] = useState<HistItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedResult | null>(null)

  // Params — Remover Fundo
  const [model, setModel] = useState('u2net')
  const [alpha, setAlpha] = useState(false)
  const [pickColor, setPickColor] = useState<[number, number, number] | null>(null)
  const [tolerance, setTolerance] = useState(30)
  // Params — Vetorizar
  const [vec, setVec] = useState<VecValues>(VEC_DEFAULTS)
  const [saveFormat, setSaveFormat] = useState('svg')
  // Params — Upscale
  const [up, setUp] = useState<UpValues>(UP_DEFAULTS)

  useEffect(() => { api.config().then(setCfg) }, [])
  useEffect(() => onProgress(setProgress), [])
  useEffect(() => {
    if (status === 'working' && progress?.phase === 'process') {
      setElapsed(0)
      const id = setInterval(() => setElapsed((s) => s + 1), 1000)
      return () => clearInterval(id)
    }
  }, [status, progress?.phase])

  const working = status === 'working'
  const active = history.find((h) => h.id === activeId) ?? null
  const isChroma = tool === 'background' && model === 'chroma'
  const modelOptions = [...(cfg?.models ?? []), { id: 'chroma', label: 'Cor sólida (conta-gotas)' }]

  async function choose() {
    const r = await api.pickImage(tool === 'vectorize')
    if (!r) return
    if ('error' in r) { setError(r.error); return }
    history.forEach((h) => api.discard(h.tempPath))
    setHistory([]); setActiveId(null); setSaved(null)
    setImg(r); setError(null); setStatus('idle')
  }

  async function process() {
    if (!img) return
    if (isChroma && !pickColor) return
    setStatus('working'); setError(null); setProgress(null); setSaved(null)

    let r, label: string, meta: any
    if (tool === 'vectorize') {
      r = await api.vectorize(img.path, {
        colormode: vec.colormode, colors: vec.colors, mode: vec.mode,
        cornerThreshold: vec.smooth, filterSpeckle: vec.detail,
      })
      label = (vec.colormode === 'color' ? 'Colorido' : 'P&B') + ' · ' + tracoLabel[vec.mode]
      meta = { ...vec }
    } else if (tool === 'upscale') {
      r = await api.upscale(img.path, up.method, up.scale)
      label = (up.method === 'ia' ? 'IA' : 'Clássico') + ' ' + up.scale + 'x'
      meta = { ...up }
    } else if (isChroma) {
      r = await api.removeColor(img.path, pickColor!, tolerance)
      label = 'Cor sólida'; meta = { model, alpha, pickColor, tolerance }
    } else {
      r = await api.removeBackground(img.path, model, alpha)
      label = bgLabel(model, alpha); meta = { model, alpha }
    }

    if ('error' in r) { setError(r.error); setStatus('idle'); return }
    const item: HistItem = { id: newId(), preview: r.preview, tempPath: r.tempPath, stem: r.stem, kind: r.kind, label, meta }
    const next = [item, ...history]
    next.slice(3).forEach((e) => api.discard(e.tempPath))
    setHistory(next.slice(0, 3)); setActiveId(item.id); setStatus('compare')
  }

  function selectHist(h: HistItem) {
    setActiveId(h.id); setSaved(null); setStatus('compare')
    if (tool === 'vectorize') setVec(h.meta)                       // restaura config (sem invalidar)
    else if (tool === 'upscale') setUp(h.meta)
    else { setModel(h.meta.model); setAlpha(h.meta.alpha); if (h.meta.pickColor) { setPickColor(h.meta.pickColor); setTolerance(h.meta.tolerance) } }
  }

  async function save() {
    if (!active) return
    const fmt = tool === 'vectorize' ? saveFormat : 'png'
    setSaved(await api.saveToDownloads(active.tempPath, active.stem, fmt)); setStatus('saved')
  }

  // Mudar config volta a oferecer o botão de processar (histórico preservado)
  function reset() {
    setActiveId(null); setSaved(null)
    if (status === 'compare' || status === 'saved') setStatus('idle')
  }
  function changeModel(v: string) { setModel(v); reset() }
  function changeAlpha(v: boolean) { setAlpha(v); reset() }
  function changeTolerance(v: number) { setTolerance(v); reset() }
  function changeVec(patch: Partial<VecValues>) { setVec((s) => ({ ...s, ...patch })); reset() }
  function changeUp(patch: Partial<UpValues>) { setUp((s) => ({ ...s, ...patch })); reset() }

  // Conta-gotas: pega a cor do pixel clicado na imagem original
  function pickAt(e: React.MouseEvent<HTMLImageElement>) {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / rect.width * el.naturalWidth)
    const y = Math.floor((e.clientY - rect.top) / rect.height * el.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = el.naturalWidth; canvas.height = el.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(el, 0, 0)
    const d = ctx.getImageData(x, y, 1, 1).data
    setPickColor([d[0], d[1], d[2]]); reset()
  }

  const modelLabel = (id: string) => cfg?.models.find((m) => m.id === id)?.label ?? id
  const picking = isChroma && status === 'idle' && !!img
  const canProcess = (isChroma ? !!pickColor : !!img) && !working
  const processLabel = tool === 'vectorize' ? 'Vetorizar' : tool === 'upscale' ? 'Ampliar' : isChroma ? 'Remover cor' : 'Remover fundo'

  return (
    <div style={wrap}>
      <motion.div style={panel}
        initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}>
        <header style={head}>
          <button style={back} onClick={onBack}>← Voltar</button>
          <strong>{titles[tool]}</strong>
          <span />
        </header>

        <div style={body}>
          <div style={leftCol}>
            <div style={preview}>
              {status === 'compare' && active ? (
                <BeforeAfter before={img!.preview} after={active.preview} />
              ) : (status === 'saved' && active) || img ? (
                <img src={(status === 'saved' && active ? active.preview : img?.preview) as string}
                     alt="preview" onClick={picking ? pickAt : undefined}
                     style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, cursor: picking ? 'crosshair' : 'default' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)', cursor: 'pointer' }} onClick={choose}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>＋</div>
                  <div>Clique para selecionar {tool === 'vectorize' ? 'imagem ou PDF' : 'uma imagem'}</div>
                </div>
              )}

              {working && (
                <div style={overlay}>
                  {progress?.phase === 'download' ? (
                    <>
                      <div style={{ fontWeight: 600 }}>Baixando {modelLabel(progress.model)}</div>
                      <div style={track}><div style={{ ...fill, width: `${progress.percent}%` }} /></div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{progress.percent}% ({progress.mbDone}/{progress.mbTotal} MB)</div>
                    </>
                  ) : progress?.phase === 'process' && progress.percent != null ? (
                    <>
                      <div style={{ fontWeight: 600 }}>Processando…</div>
                      <div style={track}><div style={{ ...fill, width: `${progress.percent}%` }} /></div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{progress.percent}% · {elapsed}s</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600 }}>Processando…</div>
                      <div style={track}>
                        <motion.div style={indeterminate}
                          animate={{ x: ['-40%', '140%'] }} transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }} />
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{progress?.phase === 'process' ? `${elapsed}s` : 'preparando…'}</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div style={strip}>
                <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>Histórico:</span>
                {history.map((h) => (
                  <button key={h.id} onClick={() => selectHist(h)}
                          style={{ ...thumb, borderColor: h.id === activeId ? 'var(--accent)' : 'var(--border)' }}>
                    <img src={h.preview} alt="" style={thumbImg} />
                    <span style={thumbLbl}>{h.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside style={controls}>
            {/* Área rolável de configuração */}
            <div style={configScroll}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Formatos aceitos:<br />
                <strong style={{ color: 'var(--text)' }}>{cfg?.acceptedLabel ?? '—'}{tool === 'vectorize' ? ', PDF' : ''}</strong>
              </div>

              <button style={ghost} onClick={choose} disabled={working}>
                {img ? 'Trocar imagem' : 'Selecionar imagem'}
              </button>

              {tool === 'background' ? (
                <BackgroundControls options={modelOptions} model={model} onModel={changeModel} working={working}
                  isChroma={isChroma} pickColor={pickColor} tolerance={tolerance} onTolerance={changeTolerance}
                  alpha={alpha} onAlpha={changeAlpha} />
              ) : tool === 'vectorize' ? (
                <VectorizeControls v={vec} onChange={changeVec} working={working}
                  saveFormat={saveFormat} onSaveFormat={setSaveFormat} />
              ) : (
                <UpscaleControls v={up} onChange={changeUp} working={working} />
              )}

              <div style={hintStyle}>
                Rode de novo mudando a config — as <strong>3 últimas</strong> versões ficam no histórico.
              </div>
            </div>

            {/* Ação fixa (sempre visível, independente do tamanho da janela) */}
            <div style={actionBar}>
              {status === 'compare' ? (
                <button style={primary} onClick={save}>Salvar em Downloads</button>
              ) : status === 'saved' && saved ? (
                <div style={savedBoxStyle}>
                  <div style={{ color: '#3fb950', fontWeight: 600, fontSize: 13 }}>✓ Arquivo salvo em Downloads</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>{saved.savedName}</div>
                  <button style={ghost} onClick={() => api.reveal(saved.savedPath)}>Abrir pasta</button>
                </div>
              ) : (
                <button style={{ ...primary, opacity: canProcess ? 1 : 0.5 }} onClick={process} disabled={!canProcess}>
                  {processLabel}
                </button>
              )}
            </div>
          </aside>
        </div>

        {error && <div style={errBar}>⚠ {error}</div>}
      </motion.div>
    </div>
  )
}

const wrap: React.CSSProperties = { height: '100%', display: 'grid', placeItems: 'center', padding: 16, boxSizing: 'border-box' }
const panel: React.CSSProperties = {
  width: 'min(1080px, 100%)', height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 12,
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
  padding: 16, boxSizing: 'border-box', minHeight: 0,
}
const head: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const back: React.CSSProperties = { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }
const body: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14, minHeight: 0 }
const leftCol: React.CSSProperties = { display: 'grid', gridTemplateRows: '1fr auto', gap: 10, minHeight: 0 }
const checker =
  'linear-gradient(45deg,#20262d 25%,transparent 25%),linear-gradient(-45deg,#20262d 25%,transparent 25%),' +
  'linear-gradient(45deg,transparent 75%,#20262d 75%),linear-gradient(-45deg,transparent 75%,#20262d 75%)'
const preview: React.CSSProperties = {
  position: 'relative', display: 'grid', placeItems: 'center', borderRadius: 12, overflow: 'hidden', padding: 12, minHeight: 0,
  border: '1.5px dashed var(--border)', backgroundColor: '#161b22',
  backgroundImage: checker, backgroundSize: '18px 18px', backgroundPosition: '0 0,0 9px,9px -9px,-9px 0',
}
const strip: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', paddingBottom: 2 }
const thumb: React.CSSProperties = {
  display: 'grid', gap: 4, padding: 4, borderRadius: 8, background: 'var(--surface-2)', border: '2px solid var(--border)', cursor: 'pointer',
}
const thumbImg: React.CSSProperties = {
  width: 72, height: 48, objectFit: 'contain', borderRadius: 4,
  backgroundColor: '#161b22', backgroundImage: checker, backgroundSize: '10px 10px', backgroundPosition: '0 0,0 5px,5px -5px,-5px 0',
}
const thumbLbl: React.CSSProperties = { fontSize: 10, color: 'var(--muted)', textAlign: 'center' }
const controls: React.CSSProperties = { display: 'grid', gridTemplateRows: '1fr auto', gap: 10, minWidth: 0, minHeight: 0 }
const configScroll: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 11, minHeight: 0, overflowY: 'auto', paddingRight: 6,
}
const actionBar: React.CSSProperties = { display: 'grid', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }
const overlay: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', gap: 12, padding: 24,
  background: 'rgba(13,17,23,0.82)', textAlign: 'center',
}
const track: React.CSSProperties = {
  width: 280, maxWidth: '60vw', height: 8, borderRadius: 20, background: 'var(--surface-2)', overflow: 'hidden', position: 'relative',
}
const fill: React.CSSProperties = { height: '100%', background: 'var(--accent)', borderRadius: 20, transition: 'width 0.2s' }
const indeterminate: React.CSSProperties = { position: 'absolute', top: 0, height: '100%', width: '35%', background: 'var(--accent)', borderRadius: 20 }
const errBar: React.CSSProperties = {
  background: 'rgba(248,81,73,0.12)', color: '#ff7b72', border: '1px solid rgba(248,81,73,0.4)', borderRadius: 8, padding: '8px 12px', fontSize: 13,
}
