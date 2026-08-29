import { motion } from 'framer-motion'

export type Tool = 'background' | 'vectorize' | 'upscale'

const tools: { id: Tool; icon: string; label: string; desc: string }[] = [
  { id: 'background', icon: '✂️', label: 'Remover Fundo', desc: 'Tira o fundo em resolução total' },
  { id: 'vectorize', icon: '△', label: 'Vetorizar', desc: 'PNG / JPG / PDF → SVG' },
  { id: 'upscale', icon: '⤢', label: 'Upscale', desc: 'Amplia 2x / 4x' },
]

// Tela inicial: título + 3 botões
export default function HomeButtons({ onPick }: { onPick: (t: Tool) => void }) {
  return (
    <div style={wrap}>
      <motion.h1 style={title}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        Kroppix
      </motion.h1>
      <motion.div style={underline}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.25, duration: 0.55, ease: 'easeOut' }} />
      <p style={subtitle}>Escolha uma ferramenta</p>

      <div style={grid}>
        {tools.map((t, i) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.08, duration: 0.35 }}>
            <button className="home-card" style={btn} onClick={() => onPick(t.id)}>
              <span style={icon}>{t.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{t.label}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.desc}</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const wrap: React.CSSProperties = {
  height: '100%', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 6, textAlign: 'center', padding: 24,
}
const title: React.CSSProperties = { margin: 0, fontSize: 34, letterSpacing: 0.3, color: 'var(--text)' }
const underline: React.CSSProperties = { width: 76, height: 4, borderRadius: 2, background: 'var(--accent)', marginTop: 10 }
const subtitle: React.CSSProperties = { margin: '12px 0 22px', color: 'var(--muted)' }
const grid: React.CSSProperties = { display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }
const btn: React.CSSProperties = {
  display: 'grid', justifyItems: 'center', alignContent: 'center', gap: 8, width: 210, height: 156, padding: '18px',
  background: 'var(--surface)', color: 'var(--text)',
  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
}
const icon: React.CSSProperties = { fontSize: 30, lineHeight: 1, height: 34, display: 'grid', placeItems: 'center' }
