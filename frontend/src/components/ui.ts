// Estilos compartilhados entre os painéis de controle
export const lbl: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, color: 'var(--muted)' }
export const select: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px',
}
export const check: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }
export const primary: React.CSSProperties = {
  background: 'var(--accent)', color: '#1a1400', fontWeight: 700, border: 'none', borderRadius: 10, padding: '11px 18px',
}
export const ghost: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 14px',
}
export const savedBox: React.CSSProperties = {
  display: 'grid', gap: 8, padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10,
}
export const hint: React.CSSProperties = { marginTop: 'auto', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }
