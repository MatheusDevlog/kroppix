import { lbl, select } from './ui'

export type VecValues = { colormode: string; colors: number; mode: string; smooth: number; detail: number }

// Padrões recomendados (os que dão o melhor resultado geral). colors 0 = automático.
export const VEC_DEFAULTS: VecValues = { colormode: 'color', colors: 0, mode: 'spline', smooth: 60, detail: 4 }

// Ilustração dos cantos: quadrado que arredonda conforme a suavidade (0..100)
function SmoothPreview({ v }: { v: number }) {
  return (
    <div style={miniRow}>
      <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: `${(v / 100) * 50}%` }} />
      <span style={miniTxt}>cantos vivos → arredondados</span>
    </div>
  )
}

// Ilustração do ruído: pontinhos pequenos somem conforme aumenta a remoção (0..16)
function DetailPreview({ v }: { v: number }) {
  const dots = [3, 4, 5, 6, 8, 10, 12]
  const removed = Math.round((v / 16) * dots.length)
  return (
    <div style={miniRow}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 90 }}>
        {dots.map((d, i) => (
          <span key={i} style={{ width: d, height: d, borderRadius: '50%', background: 'var(--accent)', opacity: i < removed ? 0.12 : 1 }} />
        ))}
      </div>
      <span style={miniTxt}>remove manchas pequenas</span>
    </div>
  )
}

// Campos de configuração do Vetorizar (vtracer)
export default function VectorizeControls(p: {
  v: VecValues; onChange: (patch: Partial<VecValues>) => void; working: boolean
  saveFormat: string; onSaveFormat: (v: string) => void
}) {
  const { v } = p
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
        Já vem na <strong style={{ color: 'var(--text)' }}>configuração recomendada</strong> — mexa só se quiser.
      </div>

      <label style={lbl}>Cor
        <select style={select} value={v.colormode} disabled={p.working} onChange={(e) => p.onChange({ colormode: e.target.value })}>
          <option value="color">Colorido</option>
          <option value="binary">Preto &amp; Branco</option>
        </select>
      </label>

      {v.colormode === 'color' && (
        <label style={lbl}>Nº de cores: {v.colors === 0 ? 'Automático' : v.colors} <span style={def}>(padrão Auto)</span>
          <input type="range" min={0} max={12} value={v.colors} disabled={p.working}
                 onChange={(e) => p.onChange({ colors: Number(e.target.value) })} />
        </label>
      )}

      <label style={lbl}>Traço
        <select style={select} value={v.mode} disabled={p.working} onChange={(e) => p.onChange({ mode: e.target.value })}>
          <option value="spline">Arredondado</option>
          <option value="polygon">Reto (serrilhado)</option>
          <option value="pixel">Pixelado</option>
        </select>
      </label>

      <label style={lbl}>Suavidade das curvas: {v.smooth} <span style={def}>(padrão {VEC_DEFAULTS.smooth})</span>
        <input type="range" min={0} max={100} value={v.smooth} disabled={p.working}
               onChange={(e) => p.onChange({ smooth: Number(e.target.value) })} />
        <SmoothPreview v={v.smooth} />
      </label>

      <label style={lbl}>Remover ruído: {v.detail} <span style={def}>(padrão {VEC_DEFAULTS.detail})</span>
        <input type="range" min={0} max={16} value={v.detail} disabled={p.working}
               onChange={(e) => p.onChange({ detail: Number(e.target.value) })} />
        <DetailPreview v={v.detail} />
      </label>

      <label style={lbl}>Formato de saída
        <select style={select} value={p.saveFormat} disabled={p.working} onChange={(e) => p.onSaveFormat(e.target.value)}>
          <option value="svg">SVG</option>
          <option value="pdf">PDF</option>
        </select>
      </label>
    </>
  )
}

const miniRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }
const miniTxt: React.CSSProperties = { fontSize: 10, color: 'var(--muted)' }
const def: React.CSSProperties = { color: 'var(--accent-dim)', fontWeight: 400 }
