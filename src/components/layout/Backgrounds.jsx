// src/components/layout/Backgrounds.jsx
// Fondos decorativos: rejilla y línea de escaneo.

export const FondoRejilla = () => (
  <div style={{
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: `linear-gradient(var(--green)07 1px, transparent 1px),
                      linear-gradient(90deg, var(--green)07 1px, transparent 1px)`,
    backgroundSize: '38px 38px',
  }} />
);

export const LineaEscaneo = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', left: 0, right: 0, height: 2,
      background: 'linear-gradient(transparent, var(--green)22, transparent)',
      animation: 'escanear 12s linear infinite',
    }} />
  </div>
);
