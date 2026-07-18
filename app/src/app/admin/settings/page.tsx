'use client';

import { useState } from 'react';
import { AdminSettingsPanel } from '../../components/AdminSettingsPanel';
import { initialSettings, type StoreSettings } from '../../lib/mockSettings';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 18 }}>
      <section style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 14px 30px rgba(17,17,17,0.06)' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>관리자 설정</h1>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 14 }}>홈 배너 문구, 고객센터 정보, 카카오톡 연결값을 관리할 수 있습니다.</p>
        <AdminSettingsPanel value={settings} onChange={setSettings} />
      </section>
    </main>
  );
}
