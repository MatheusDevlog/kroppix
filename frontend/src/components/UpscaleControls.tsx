import { lbl, select } from './ui'

export type UpValues = { method: string; scale: number }

// Padrão recomendado: Clássico 2x (abre já funcionando, sem download)
export const UP_DEFAULTS: UpValues = { method: 'lanczos', scale: 2 }

// Campos de configuração do Upscale
export default function UpscaleControls(p: {
  v: UpValues; onChange: (patch: Partial<UpValues>) => void; working: boolean
}) {
  const { v } = p
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
        Já vem na <strong style={{ color: 'var(--text)' }}>configuração recomendada</strong> — mexa só se quiser.
      </div>

      <label style={lbl}>Método <span style={def}>(padrão Clássico)</span>
        <select style={select} value={v.method} disabled={p.working} onChange={(e) => p.onChange({ method: e.target.value })}>
          <option value="lanczos">Clássico (rápido)</option>
          <option value="ia">IA — Real-ESRGAN (qualidade)</option>
        </select>
      </label>

      {v.method === 'ia' && (
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
          A IA usa sua GPU. Na 1ª vez baixa ~45 MB (uma vez só); depois roda offline.
        </div>
      )}

      <label style={lbl}>Escala <span style={def}>(padrão 2x)</span>
        <select style={select} value={v.scale} disabled={p.working} onChange={(e) => p.onChange({ scale: Number(e.target.value) })}>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </label>
    </>
  )
}

const def: React.CSSProperties = { color: 'var(--accent-dim)', fontWeight: 400 }
