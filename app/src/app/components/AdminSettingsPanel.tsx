'use client';

import { useState } from 'react';
import { initialSettings, type StoreSettings } from '../lib/mockSettings';

interface Props {
  value: StoreSettings;
  onChange: (value: StoreSettings) => void;
}

export function AdminSettingsPanel({ value, onChange }: Props) {
  const [draft, setDraft] = useState<StoreSettings>(value);

  const update = (field: keyof StoreSettings, nextValue: string) => {
    const updated = { ...draft, [field]: nextValue };
    setDraft(updated);
    onChange(updated);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>배너 제목</label>
        <input value={draft.heroTitle} onChange={(event) => update('heroTitle', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>배너 설명</label>
        <textarea value={draft.heroDescription} onChange={(event) => update('heroDescription', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 80, fontSize: 15 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>추천 문구</label>
        <input value={draft.heroBadge} onChange={(event) => update('heroBadge', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>고객센터 전화</label>
        <input value={draft.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>고객센터 이메일</label>
        <input value={draft.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>카카오톡 아이디</label>
        <input value={draft.kakaoId} onChange={(event) => update('kakaoId', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 15, fontWeight: 700 }}>오픈채팅 링크</label>
        <input value={draft.openChatUrl} onChange={(event) => update('openChatUrl', event.target.value)} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
      </div>
      <button type="button" onClick={() => setDraft(initialSettings)} style={{ border: 0, background: '#111', color: '#fff', padding: '10px 12px', borderRadius: 12, fontSize: 15 }}>초기값으로 복원</button>
    </div>
  );
}
