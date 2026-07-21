export default function Loading() {
  return (
    <main style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 16px 64px' }}>
      <div style={{ height: 28, width: 140, borderRadius: 8, background: '#e8e8e8', marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 12 }}>
            <div style={{ aspectRatio: '4 / 3', borderRadius: 16, background: '#e8e8e8', marginBottom: 10 }} />
            <div style={{ height: 14, width: '70%', borderRadius: 6, background: '#eee', marginBottom: 8 }} />
            <div style={{ height: 18, width: '40%', borderRadius: 6, background: '#eee' }} />
          </div>
        ))}
      </div>
    </main>
  );
}
