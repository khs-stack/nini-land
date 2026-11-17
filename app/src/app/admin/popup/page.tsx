'use client';

import { FormEvent, useState } from 'react';
import { useMockStore, type Popup } from '../../lib/mockStore';
import { activePopups } from '../../lib/mockSettings';
import { uploadImage } from '../../components/ProductEditor';
import { supabase } from '../../lib/supabase';

const today = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + 9 * 3600_000 + n * 86400_000).toISOString().slice(0, 10);

const input = { border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15, width: '100%', minWidth: 0 } as const;
const label = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444', minWidth: 0 } as const;
const smallBtn = { border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', background: '#fff', fontSize: 13, fontWeight: 700 } as const;

type Draft = Omit<Popup, 'id'>;
const emptyDraft = (): Draft => ({ title: '', content: '', image: '', link: '', linkLabel: '', style: 'modal', startDate: today(), endDate: plusDays(7), visible: true });

export default function AdminPopupPage() {
  const { isAdmin, popups, addPopup, updatePopup, deletePopup, movePopup } = useMockStore();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isAdmin) return null;
  const liveIds = new Set(activePopups(popups).map((p) => p.id));

  const flash = (r: { error?: string }, okText: string) => setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: okText });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() && !draft.image) { setMsg({ ok: false, text: '제목이나 이미지 중 하나는 넣어주세요.' }); return; }
    if (draft.endDate < draft.startDate) { setMsg({ ok: false, text: '종료일이 시작일보다 빠릅니다.' }); return; }
    const clean: Draft = { ...draft, title: draft.title.trim(), content: draft.content.trim(), link: draft.link?.trim(), linkLabel: draft.linkLabel?.trim() };
    setBusy(true);
    const r = editingId ? await updatePopup(editingId, clean) : await addPopup(clean);
    setBusy(false);
    flash(r, editingId ? '수정했습니다. 손님 화면에 바로 반영됩니다.' : '등록했습니다. 손님 화면에 바로 반영됩니다.');
    if (!r.error) { setDraft(emptyDraft()); setEditingId(null); }
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    if (!supabase) { setMsg({ ok: false, text: '저장소에 연결되지 않았습니다.' }); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg({ ok: false, text: '이미지는 5MB 이하로 올려주세요.' }); return; }
    setBusy(true);
    try {
      const url = await uploadImage(file, 'popups');
      setDraft((d) => ({ ...d, image: url }));
      setMsg(null);
    } catch (e) {
      setMsg({ ok: false, text: `이미지 업로드 실패: ${(e as Error).message}` });
    }
    setBusy(false);
  };

  const startEdit = (p: Popup) => {
    setEditingId(p.id);
    setDraft({ title: p.title, content: p.content, image: p.image ?? '', link: p.link ?? '', linkLabel: p.linkLabel ?? '', style: p.style ?? 'modal', startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10), visible: p.visible });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <header>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>팝업 관리</h1>
        <p style={{ fontSize: 13, color: '#777' }}>홈 화면에 뜨는 팝업창·띠 공지. 손님은 &lsquo;오늘 하루 보지 않기&rsquo;로 닫을 수 있어요.</p>
      </header>

      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 }}>
        <h2 style={{ fontSize: 16 }}>{editingId ? '팝업 수정' : '새 팝업'}</h2>
        <div role="radiogroup" aria-label="모양" style={{ display: 'flex', gap: 8 }}>
          {([['modal', '팝업창 (가운데)'], ['bar', '띠 공지 (맨 위)']] as const).map(([k, t]) => (
            <label key={k} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer',
              border: draft.style === k ? '2px solid #111' : '1px solid #ddd', background: draft.style === k ? '#111' : '#fff', color: draft.style === k ? '#fff' : '#111' }}>
              <input type="radio" name="popup-style" checked={draft.style === k} onChange={() => setDraft({ ...draft, style: k })} style={{ display: 'none' }} />
              {t}
            </label>
          ))}
        </div>
        <label style={label}>제목
          <input id="popup-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="예: 오픈 기념 무료배송" style={input} maxLength={60} />
        </label>
        <label style={label}>내용
          <textarea id="popup-content" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="짧게 1~3줄" style={{ ...input, minHeight: 80 }} maxLength={500} />
        </label>
        {draft.style === 'modal' && (
          <div style={label}>
            이미지 (선택)
            {draft.image ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.image} alt="팝업 이미지 미리보기" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid #eee' }} />
                <button type="button" style={smallBtn} onClick={() => setDraft({ ...draft, image: '' })}>이미지 빼기</button>
              </div>
            ) : (
              <input id="popup-image" type="file" accept="image/*" onChange={(e) => void onImage(e.target.files?.[0])} disabled={busy} />
            )}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <label style={label}>누르면 갈 주소 (선택)
            <input id="popup-link" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="/category/유아옷 또는 https://..." style={input} />
          </label>
          <label style={label}>버튼 글자 (선택)
            <input id="popup-link-label" value={draft.linkLabel} onChange={(e) => setDraft({ ...draft, linkLabel: e.target.value })} placeholder="자세히 보기" style={input} maxLength={20} />
          </label>
          <label style={label}>시작일
            <input id="popup-start" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} style={input} />
          </label>
          <label style={label}>종료일
            <input id="popup-end" type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} style={input} />
          </label>
        </div>
        {msg && <p role="status" style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: msg.ok ? '#eef8f2' : '#fff0f0', color: msg.ok ? '#2f6f4f' : '#c93442' }}>{msg.text}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={{ flex: 1, border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: '#fff', fontWeight: 800, fontSize: 15 }}>
            {busy ? '저장 중…' : editingId ? '수정 저장' : '팝업 등록'}
          </button>
          {editingId && <button type="button" style={{ ...smallBtn, padding: '12px 14px' }} onClick={() => { setEditingId(null); setDraft(emptyDraft()); }}>취소</button>}
        </div>
      </form>

      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ fontSize: 16 }}>등록된 팝업 ({popups.length}) <small style={{ fontWeight: 400, color: '#888' }}>— 위에 있는 것부터 먼저 뜸</small></h2>
        {popups.length === 0 && <p style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center', color: '#888' }}>아직 팝업이 없습니다.</p>}
        {popups.map((p, i) => (
          <article key={p.id} style={{ background: '#fff', borderRadius: 16, padding: 14, display: 'grid', gap: 8, border: liveIds.has(p.id) ? '2px solid #2f6f4f' : '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <b>{p.title || '(제목 없음)'}</b>
              <span style={{ fontSize: 12, color: '#666' }}>{p.style === 'bar' ? '띠 공지' : '팝업창'}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: liveIds.has(p.id) ? '#2f6f4f' : '#999' }}>{liveIds.has(p.id) ? '지금 보이는 중' : p.visible ? '기간 밖' : '숨김'}</span>
              <label style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
                <input type="checkbox" checked={p.visible} onChange={async (e) => flash(await updatePopup(p.id, { visible: e.target.checked }), e.target.checked ? '보이게 했습니다.' : '숨겼습니다.')} /> 보이기
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image && <img src={p.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
              <p style={{ fontSize: 13, color: '#555', whiteSpace: 'pre-line', margin: 0 }}>{p.content}</p>
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{p.startDate.slice(0, 10)} ~ {p.endDate.slice(0, 10)}{p.link ? ` · ${p.link}` : ''}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" style={smallBtn} disabled={i === 0} onClick={async () => flash(await movePopup(p.id, -1), '순서를 바꿨습니다.')} aria-label="위로">▲</button>
              <button type="button" style={smallBtn} disabled={i === popups.length - 1} onClick={async () => flash(await movePopup(p.id, 1), '순서를 바꿨습니다.')} aria-label="아래로">▼</button>
              <button type="button" style={smallBtn} onClick={() => startEdit(p)}>수정</button>
              <button type="button" style={{ ...smallBtn, color: '#c93442' }} onClick={async () => { if (window.confirm('이 팝업을 삭제할까요?')) flash(await deletePopup(p.id), '삭제했습니다.'); }}>삭제</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
