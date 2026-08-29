import { useRef, useState } from 'react'

// Comparador antes/depois com linha arrastável.
// As duas imagens ocupam a MESMA caixa com object-fit: contain -> alinham exatamente.
export default function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function moveTo(clientX: number) {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    const p = ((clientX - box.left) / box.width) * 100
    setPos(Math.max(0, Math.min(100, p)))
  }

  return (
    <div
      ref={ref}
      style={container}
      onPointerDown={(e) => { dragging.current = true; moveTo(e.clientX) }}
      onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX) }}
      onPointerUp={() => { dragging.current = false }}
      onPointerLeave={() => { dragging.current = false }}
    >
      <img src={after} alt="depois" style={layer} draggable={false} />
      <img src={before} alt="antes" style={{ ...layer, clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />

      <span style={{ ...tag, left: 10 }}>Antes</span>
      <span style={{ ...tag, right: 10 }}>Depois</span>

      <div style={{ ...divider, left: `${pos}%` }}>
        <div style={handle}>⇆</div>
      </div>
    </div>
  )
}

const checker =
  'linear-gradient(45deg,#20262d 25%,transparent 25%),linear-gradient(-45deg,#20262d 25%,transparent 25%),' +
  'linear-gradient(45deg,transparent 75%,#20262d 75%),linear-gradient(-45deg,transparent 75%,#20262d 75%)'

const container: React.CSSProperties = {
  position: 'relative', width: '100%', height: '100%', userSelect: 'none',
  touchAction: 'none', cursor: 'ew-resize', borderRadius: 10, overflow: 'hidden',
  backgroundColor: '#161b22', backgroundImage: checker, backgroundSize: '18px 18px',
  backgroundPosition: '0 0,0 9px,9px -9px,-9px 0',
}
const layer: React.CSSProperties = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
}
const tag: React.CSSProperties = {
  position: 'absolute', top: 10, fontSize: 11, color: 'var(--text)',
  background: 'rgba(13,17,23,0.7)', padding: '3px 8px', borderRadius: 20, pointerEvents: 'none',
}
const divider: React.CSSProperties = {
  position: 'absolute', top: 0, bottom: 0, width: 2, background: 'var(--accent)', transform: 'translateX(-1px)',
}
const handle: React.CSSProperties = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
  width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#1a1400',
  display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow)',
}
