import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>🧸</div>
      <h1 style={{ fontSize: 20 }}>페이지를 찾을 수 없습니다</h1>
      <p style={{ color: '#666', fontSize: 14 }}>요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있어요.</p>
      <Link href="/" style={{ marginTop: 8, background: '#111', color: '#fff', borderRadius: 999, padding: '10px 20px', fontWeight: 700, fontSize: 14 }}>
        홈으로 돌아가기
      </Link>
    </main>
  );
}
