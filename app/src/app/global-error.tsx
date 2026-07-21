'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>😥</div>
          <h1 style={{ fontSize: 20 }}>일시적인 오류가 발생했습니다</h1>
          <p style={{ color: '#666', fontSize: 14 }}>불편을 드려 죄송합니다. 잠시 후 다시 시도해주세요.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 8, background: '#111', color: '#fff', borderRadius: 999, padding: '10px 20px', fontWeight: 700, fontSize: 14, border: 0, cursor: 'pointer' }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
