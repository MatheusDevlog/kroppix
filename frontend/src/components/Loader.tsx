import { useEffect } from 'react'
import { motion } from 'framer-motion'

// Tela de carregamento pequena (não fullscreen), com animação
export default function Loader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={wrap}>
      <motion.div
        style={card}
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          style={ring}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 0.9 }}
        />
        <div style={{ fontWeight: 700, letterSpacing: 0.4 }}>
          Kropp<span style={{ color: 'var(--accent)' }}>ix</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>carregando…</div>
      </motion.div>
    </div>
  )
}

const wrap: React.CSSProperties = {
  height: '100%', display: 'grid', placeItems: 'center',
}
const card: React.CSSProperties = {
  display: 'grid', justifyItems: 'center', gap: 10,
  padding: '28px 40px', background: 'var(--surface)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
}
const ring: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%',
  border: '3px solid var(--surface-2)', borderTopColor: 'var(--accent)',
  marginBottom: 6,
}
