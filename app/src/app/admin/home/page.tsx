'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { HOME_KEYS, HOME_SECTION_NAMES, initialSettings, normalizeHomeSections, type HomeSection, type QuickLink, type StoreSettings } from '../../lib/mockSettings';

type HomeDraft = Pick<StoreSettings, (typeof HOME_KEYS)[number]>;

const input = { border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15, width: '100%', minWidth: 0 } as const;
const label = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444', minWidth: 0 } as const;
const card = { background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 } as const;
const smallBtn = { border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', background: '#fff', fontSize: 13, fontWeight: 700 } as const;
const PRODUCT_SECTIONS = new Set(['preorder', 'regular', 'wholesale']);

function pickHome(s: StoreSettings): HomeDraft {
  return {
    heroTitle: s.heroTitle, heroDescription: s.heroDescription, heroBadge: s.heroBadge,
    homeSections: normalizeHomeSections(s.homeSections),
    introEyebrow: s.introEyebrow ?? '', introBenefits: s.introBenefits ?? [], introButtonLabel: s.introButtonLabel ?? '',
    quickLinks: s.quickLinks ?? [], emptyText: s.emptyText ?? '',
  };
}

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function AdminHomePage() {
  const { settings, updateSettings, isAdmin, catalogLoaded } = useMockStore();
  const [d, setD] = useState<HomeDraft>(() => pickHome(settings));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    // DB에서 설정을 처음 받아오면 칸에 채운다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (catalogLoaded) setD(pickHome(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogLoaded]);

  if (!isAdmin) return null;

  const set = (next: Partial<HomeDraft>) => { setD((cur) => ({ ...cur, ...next })); setDirty(true); setMsg(null); };
  const setSection = (i: number, patch: Partial<HomeSection>) => set({ homeSections: d.homeSections.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const setLink = (i: number, patch: Partial<QuickLink>) => set({ quickLinks: d.quickLinks.map((q, k) => (k === i ? { ...q, ...patch } : q)) });

  const save = async () => {
    setSaving(true);
    const clean: HomeDraft = {
      ...d,
      introBenefits: d.introBenefits.map((b) => b.trim()).filter(Boolean),
      quickLinks: d.quickLinks.filter((q) => q.label.trim()).map((q) => ({ ...q, label: q.label.trim(), sub: q.sub.trim(), icon: q.icon.trim().slice(0, 6), href: q.href.trim() || '/search' })),
    };
    const r = await updateSettings(clean);
    setSaving(false);
    if (!r.error) { setD(clean); setDirty(false); }
    setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: '저장했습니다. 홈 화면에 바로 반영됩니다.' });
  };

  const reset = () => {
    if (!window.confirm('홈 화면 문구·배치를 처음 상태로 되돌릴까요? (저장을 눌러야 적용)')) return;
    set(pickHome(initialSettings));
  };

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 140px', display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>홈 화면 꾸미기</h1>
          <p style={{ fontSize: 13, color: '#777' }}>문구를 바꾸고, ▲▼로 순서를 바꾸고, 안 쓰는 구역은 끄세요. 팝업은 <Link href="/admin/popup" style={{ textDecoration: 'underline' }}>팝업 관리</Link>에서.</p>
        </div>
        <Link href="/" target="_blank" style={smallBtn}>홈 화면 열기 ↗</Link>
      </header>

      <section style={card}>
        <h2 style={{ fontSize: 16 }}>① 구역 순서 · 보이기</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {d.homeSections.map((s, i) => (
            <div key={s.key} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12, display: 'grid', gap: 8, opacity: s.visible ? 1 : 0.55 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 22, textAlign: 'center', fontWeight: 800, color: '#999' }}>{i + 1}</span>
                <b style={{ flex: 1 }}>{HOME_SECTION_NAMES[s.key]}</b>
                <button type="button" style={smallBtn} disabled={i === 0} onClick={() => set({ homeSections: move(d.homeSections, i, -1) })} aria-label={`${HOME_SECTION_NAMES[s.key]} 위로`}>▲</button>
                <button type="button" style={smallBtn} disabled={i === d.homeSections.length - 1} onClick={() => set({ homeSections: move(d.homeSections, i, 1) })} aria-label={`${HOME_SECTION_NAMES[s.key]} 아래로`}>▼</button>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
                  <input type="checkbox" checked={s.visible} onChange={(e) => setSection(i, { visible: e.target.checked })} /> 보이기
                </label>
              </div>
              {PRODUCT_SECTIONS.has(s.key) && s.visible && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                  <label style={label}>제목
                    <input value={s.title ?? ''} onChange={(e) => setSection(i, { title: e.target.value })} style={input} maxLength={30} />
                  </label>
                  <label style={label}>작은 설명
                    <input value={s.subtitle ?? ''} onChange={(e) => setSection(i, { subtitle: e.target.value })} style={input} maxLength={50} />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#888' }}>상품 구역은 해당 상품이 있을 때만 보입니다. 큰 배너는 상품이 없으면 아래 ② 문구로 한 장 보여줍니다.</p>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16 }}>② 배너 · 브랜드 소개 문구</h2>
        <label style={label}>작은 머리글 (배너)
          <input id="h-badge" value={d.heroBadge} onChange={(e) => set({ heroBadge: e.target.value })} style={input} maxLength={30} />
        </label>
        <label style={label}>큰 제목
          <input id="h-title" value={d.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} style={input} maxLength={40} />
        </label>
        <label style={label}>설명
          <textarea id="h-desc" value={d.heroDescription} onChange={(e) => set({ heroDescription: e.target.value })} style={{ ...input, minHeight: 70 }} maxLength={200} />
        </label>
        <label style={label}>브랜드 소개 머리글
          <input id="h-eyebrow" value={d.introEyebrow} onChange={(e) => set({ introEyebrow: e.target.value })} style={input} maxLength={30} />
        </label>
        <label style={label}>장점 (한 줄에 하나씩)
          <textarea id="h-benefits" value={d.introBenefits.join('\n')} onChange={(e) => set({ introBenefits: e.target.value.split('\n') })} style={{ ...input, minHeight: 80 }} />
        </label>
        <label style={label}>버튼 글자 (비우면 버튼 숨김)
          <input id="h-button" value={d.introButtonLabel} onChange={(e) => set({ introButtonLabel: e.target.value })} style={input} maxLength={20} />
        </label>
        <label style={label}>상품이 없을 때 문구
          <input id="h-empty" value={d.emptyText} onChange={(e) => set({ emptyText: e.target.value })} style={input} maxLength={60} />
        </label>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16 }}>③ 바로가기 버튼</h2>
        {d.quickLinks.map((q, i) => (
          <div key={i} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12, display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
              <label style={label}>아이콘 글자
                <input value={q.icon} onChange={(e) => setLink(i, { icon: e.target.value })} style={input} maxLength={6} placeholder="KIDS" />
              </label>
              <label style={label}>이름
                <input value={q.label} onChange={(e) => setLink(i, { label: e.target.value })} style={input} maxLength={12} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              <label style={label}>작은 설명
                <input value={q.sub} onChange={(e) => setLink(i, { sub: e.target.value })} style={input} maxLength={20} />
              </label>
              <label style={label}>누르면 갈 주소
                <input value={q.href} onChange={(e) => setLink(i, { href: e.target.value })} style={input} placeholder="/category/유아옷" />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" style={smallBtn} disabled={i === 0} onClick={() => set({ quickLinks: move(d.quickLinks, i, -1) })} aria-label="위로">▲</button>
              <button type="button" style={smallBtn} disabled={i === d.quickLinks.length - 1} onClick={() => set({ quickLinks: move(d.quickLinks, i, 1) })} aria-label="아래로">▼</button>
              <button type="button" style={{ ...smallBtn, color: '#c93442', marginLeft: 'auto' }} onClick={() => set({ quickLinks: d.quickLinks.filter((_, k) => k !== i) })}>빼기</button>
            </div>
          </div>
        ))}
        {d.quickLinks.length < 6 && (
          <button type="button" style={{ ...smallBtn, padding: 12 }} onClick={() => set({ quickLinks: [...d.quickLinks, { icon: 'NEW', label: '', sub: '', href: '/search' }] })}>+ 버튼 추가</button>
        )}
        <p style={{ fontSize: 12, color: '#888' }}>주소 예: 분류 <code>/category/유아옷</code> · 한정 예약 <code>/groupbuy</code> · 전체 <code>/search</code></p>
      </section>

      <div style={{ position: 'sticky', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)', display: 'grid', gap: 8 }}>
        {msg && <p role="status" style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: msg.ok ? '#eef8f2' : '#fff0f0', color: msg.ok ? '#2f6f4f' : '#c93442' }}>{msg.text}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={reset} style={{ ...smallBtn, padding: '14px' }}>처음 상태로</button>
          <button type="button" onClick={() => void save()} disabled={saving || !dirty}
            style={{ flex: 1, border: 0, borderRadius: 14, padding: '14px', background: dirty ? '#111' : '#999', color: '#fff', fontWeight: 800, fontSize: 16 }}>
            {saving ? '저장 중…' : dirty ? '저장하기' : '저장됨'}
          </button>
        </div>
      </div>
    </main>
  );
}
