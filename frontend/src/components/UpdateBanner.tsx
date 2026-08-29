import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, type UpdateInfo } from '../lib/api'

const DISMISS_KEY = 'kroppix_update_dismissed'

// Aviso discreto de nova versão (canto superior direito)
export default function UpdateBanner() {
  const [info, setInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    let vivo = true
    api.checkUpdate().then((r) => {
      if (!vivo || !r.tem) return
      let dispensada = ''
      try { dispensada = localStorage.getItem(DISMISS_KEY) || '' } catch { /* ignore */ }
      if (r.versao !== dispensada) setInfo(r)
    })
    return () => { vivo = false }
  }, [])

  function dispensar() {
    try { if (info?.versao) localStorage.setItem(DISMISS_KEY, info.versao) } catch { /* ignore */ }
    setInfo(null)
  }

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          style={box}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          <div style={{ display: 'grid', gap: 2 }}>
            <span style={{ fontWeight: 700 }}>Nova versão {info.versao}</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Já disponível para download</span>
          </div>
          <button style={btn} onClick={() => info.url && api.openExternal(info.url)}>Atualizar</button>
          <button style={close} onClick={dispensar} aria-label="Dispensar">✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const box: React.CSSProperties = {
  position: 'fixed', top: 14, right: 14, zIndex: 50,
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '10px 14px', background: 'var(--surface)',
  border: '1px solid var(--accent)', borderRadius: 12, boxShadow: 'var(--shadow)',
}
const btn: React.CSSProperties = {
  padding: '6px 12px', fontWeight: 700, color: '#0d1117',
  background: 'var(--accent)', border: 'none', borderRadius: 8,
}
const close: React.CSSProperties = {
  color: 'var(--muted)', background: 'transparent', border: 'none', fontSize: 14, padding: 4,
}
