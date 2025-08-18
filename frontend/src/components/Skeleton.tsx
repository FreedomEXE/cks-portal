export default function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy>
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <div key={i} style={{ height: 14, background: '#e5e7eb', borderRadius: 4, margin: '10px 0', animation: 'pulse 1.2s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );
}
