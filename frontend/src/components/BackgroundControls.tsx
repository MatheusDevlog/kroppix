import { lbl, select, check } from './ui'

type Opt = { id: string; label: string }

// Campos de configuração do Remover Fundo (IA ou conta-gotas)
export default function BackgroundControls(p: {
  options: Opt[]; model: string; onModel: (v: string) => void; working: boolean
  isChroma: boolean; pickColor: [number, number, number] | null
  tolerance: number; onTolerance: (v: number) => void
  alpha: boolean; onAlpha: (v: boolean) => void
}) {
  return (
    <>
      <label style={lbl}>Modelo
        <select style={select} value={p.model} disabled={p.working} onChange={(e) => p.onModel(e.target.value)}>
          {p.options.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>

      {p.isChroma ? (
        <>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
            Clique no <strong style={{ color: 'var(--text)' }}>fundo da imagem</strong> para pegar a cor a remover.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)',
                           background: p.pickColor ? `rgb(${p.pickColor.join(',')})` : 'transparent' }} />
            {p.pickColor ? `rgb(${p.pickColor.join(', ')})` : 'nenhuma cor escolhida'}
          </div>
          <label style={lbl}>Tolerância: {p.tolerance}
            <input type="range" min={0} max={100} value={p.tolerance} disabled={p.working}
                   onChange={(e) => p.onTolerance(Number(e.target.value))} />
          </label>
        </>
      ) : (
        <label style={check}>
          <input type="checkbox" checked={p.alpha} disabled={p.working} onChange={(e) => p.onAlpha(e.target.checked)} />
          Bordas suaves (cabelo/pelo)
        </label>
      )}
    </>
  )
}
