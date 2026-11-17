'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { activePopups, type PopupItem } from '../lib/mockSettings';

const HIDE_KEY = 'nini-popup-hidden';
const todayKst = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

/** '오늘 하루 보지 않기' 기록 (브라우저마다, 실패해도 팝업은 정상 동작) */
function readHidden(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(HIDE_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}
function writeHidden(map: Record<string, string>) {
  try {
    window.localStorage.setItem(HIDE_KEY, JSON.stringify(map));
  } catch {
    /* 저장 안 돼도 이번 화면에서는 닫힘 */
  }
}

function PopupLink({ popup, className, style, children }: { popup: PopupItem; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  if (!popup.link) return null;
  const external = /^https?:\/\//.test(popup.link);
  return external
    ? <a href={popup.link} target="_blank" rel="noopener noreferrer" className={className} style={style}>{children}</a>
    : <Link href={popup.link} className={className} style={style}>{children}</Link>;
}

export function PopupLayer({ popups }: { popups: PopupItem[] }) {
  const [closed, setClosed] = useState<string[]>([]);
  const [hiddenToday, setHiddenToday] = useState<string[]>([]);

  useEffect(() => {
    const map = readHidden();
    const today = todayKst();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHiddenToday(Object.entries(map).filter(([, day]) => day === today).map(([id]) => id));
  }, []);

  const live = useMemo(() => activePopups(popups).filter((p) => !closed.includes(p.id) && !hiddenToday.includes(p.id)), [popups, closed, hiddenToday]);
  const bars = live.filter((p) => p.style === 'bar');
  const modal = live.find((p) => p.style !== 'bar');

  const close = (id: string) => setClosed((c) => [...c, id]);
  const hideToday = (id: string) => {
    const map = readHidden();
    const today = todayKst();
    // 지난 날짜 기록은 정리
    const next = Object.fromEntries(Object.entries(map).filter(([, day]) => day === today));
    next[id] = today;
    writeHidden(next);
    close(id);
  };

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(modal.id); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  return (
    <>
      {bars.map((p) => (
        <aside key={p.id} aria-label={p.title || '공지'} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#111', color: '#fff', padding: '10px 16px', fontSize: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {p.title && <strong style={{ marginRight: 8 }}>{p.title}</strong>}
            <span style={{ opacity: 0.85 }}>{p.content}</span>
            {p.link && <> <PopupLink popup={p} style={{ color: '#ffd43b', fontWeight: 800, textDecoration: 'underline' }}>{p.linkLabel || '자세히'}</PopupLink></>}
          </div>
          <button type="button" onClick={() => hideToday(p.id)} aria-label={`${p.title || '공지'} 오늘 하루 닫기`}
            style={{ border: 0, background: 'transparent', color: '#fff', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
        </aside>
      ))}

      {modal && (
        <div role="presentation" onClick={() => close(modal.id)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby={`popup-${modal.id}-title`} onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(100%, 380px)', maxHeight: 'calc(100dvh - 32px)', overflow: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'grid' }}>
            {modal.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={modal.image} alt={modal.title || '팝업 이미지'} style={{ width: '100%', display: 'block', borderRadius: '18px 18px 0 0', maxHeight: 420, objectFit: 'cover' }} />
            )}
            <div style={{ padding: '18px 18px 14px', display: 'grid', gap: 8 }}>
              {modal.title && <h2 id={`popup-${modal.id}-title`} style={{ fontSize: 19, margin: 0 }}>{modal.title}</h2>}
              {modal.content && <p style={{ fontSize: 14, color: '#444', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{modal.content}</p>}
              {modal.link && (
                <PopupLink popup={modal} style={{ marginTop: 6, display: 'block', textAlign: 'center', background: '#111', color: '#fff', borderRadius: 12, padding: '12px', fontWeight: 800, fontSize: 15 }}>
                  {modal.linkLabel || '자세히 보기'}
                </PopupLink>
              )}
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid #eee' }}>
              <button type="button" onClick={() => hideToday(modal.id)} style={{ flex: 1, border: 0, background: '#fff', padding: '14px', fontSize: 14, color: '#666', borderRadius: '0 0 0 18px' }}>오늘 하루 보지 않기</button>
              <button type="button" onClick={() => close(modal.id)} style={{ flex: 1, border: 0, borderLeft: '1px solid #eee', background: '#fff', padding: '14px', fontSize: 14, fontWeight: 800, borderRadius: '0 0 18px 0' }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
