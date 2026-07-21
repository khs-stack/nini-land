export default function Loading() {
  return (
    <main style={{ minHeight: '100vh', background: '#f7f7f7', padding: '24px 16px 64px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ height: 20, width: 80, borderRadius: 8, background: '#e8e8e8' }} />
        <div style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
          <div style={{ height: 260, borderRadius: 16, background: '#e8e8e8', marginBottom: 16 }} />
          <div style={{ height: 24, width: '60%', borderRadius: 8, background: '#e8e8e8', marginBottom: 10 }} />
          <div style={{ height: 16, width: '90%', borderRadius: 8, background: '#eee' }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
          <div style={{ height: 60, borderRadius: 12, background: '#e8e8e8' }} />
        </div>
      </div>
    </main>
  );
}
