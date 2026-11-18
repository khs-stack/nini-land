'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { supabase } from '../../lib/supabase';

const input = { border: '1px solid #ddd', borderRadius: 12, padding: '12px', fontSize: 16, width: '100%', minWidth: 0 } as const;
const label = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444' } as const;
const card = { background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 } as const;
const button = { border: 0, borderRadius: 12, padding: '13px', background: '#111', color: '#fff', fontWeight: 800, fontSize: 15 } as const;

type Msg = { ok: boolean; text: string } | null;
function Note({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <p role="status" style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: msg.ok ? '#eef8f2' : '#fff0f0', color: msg.ok ? '#2f6f4f' : '#c93442' }}>{msg.text}</p>;
}

/** 현재 비밀번호가 맞는지 확인 (같은 계정으로 다시 로그인해 봄) */
async function checkPassword(email: string, password: string) {
  if (!supabase) return false;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export default function AdminAccountPage() {
  const { isAdmin } = useMockStore();
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailMsg, setEmailMsg] = useState<Msg>(null);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  if (!isAdmin) return null;
  if (!supabase) return <main style={{ padding: 24 }}>저장소에 연결된 뒤 쓸 수 있습니다.</main>;

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    const next = newEmail.trim().toLowerCase();
    if (!next || next === email) { setEmailMsg({ ok: false, text: '새 이메일을 넣어주세요.' }); return; }
    setBusy(true);
    if (!(await checkPassword(email, emailPw))) { setBusy(false); setEmailMsg({ ok: false, text: '지금 비밀번호가 맞지 않습니다.' }); return; }
    const { data, error } = await supabase!.rpc('admin_change_my_email', { p_email: next });
    if (!error) await supabase!.auth.signInWithPassword({ email: next, password: emailPw }); // 새 아이디로 로그인 상태 유지
    setBusy(false);
    if (error) { setEmailMsg({ ok: false, text: error.message }); return; }
    setEmail(String(data ?? next));
    setNewEmail('');
    setEmailPw('');
    setEmailMsg({ ok: true, text: `아이디를 ${String(data ?? next)}(으)로 바꿨습니다. 다음부터 이 이메일로 로그인하세요.` });
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 8) { setPwMsg({ ok: false, text: '새 비밀번호는 8자 이상으로 해주세요.' }); return; }
    if (!/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) { setPwMsg({ ok: false, text: '영문과 숫자를 섞어주세요.' }); return; }
    if (newPw !== newPw2) { setPwMsg({ ok: false, text: '새 비밀번호 두 칸이 다릅니다.' }); return; }
    setBusy(true);
    if (!(await checkPassword(email, curPw))) { setBusy(false); setPwMsg({ ok: false, text: '지금 비밀번호가 맞지 않습니다.' }); return; }
    const { error } = await supabase!.auth.updateUser({ password: newPw });
    setBusy(false);
    if (error) { setPwMsg({ ok: false, text: error.message.includes('different') ? '지금과 다른 비밀번호를 넣어주세요.' : error.message }); return; }
    setCurPw(''); setNewPw(''); setNewPw2('');
    setPwMsg({ ok: true, text: '비밀번호를 바꿨습니다. 다음 로그인부터 새 비밀번호를 쓰세요.' });
  };

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <header>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>내 계정</h1>
        <p style={{ fontSize: 13, color: '#777' }}>관리자 로그인 아이디(이메일)와 비밀번호를 바꿉니다.</p>
      </header>

      <section style={card}>
        <div style={{ fontSize: 14 }}>지금 아이디: <b>{email || '불러오는 중…'}</b></div>
      </section>

      <form onSubmit={changePassword} style={card}>
        <h2 style={{ fontSize: 16 }}>비밀번호 바꾸기</h2>
        <label style={label}>지금 비밀번호
          <input id="acc-cur-pw" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} style={input} autoComplete="current-password" required />
        </label>
        <label style={label}>새 비밀번호 (8자 이상, 영문+숫자)
          <input id="acc-new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={input} autoComplete="new-password" required />
        </label>
        <label style={label}>새 비밀번호 한 번 더
          <input id="acc-new-pw2" type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} style={input} autoComplete="new-password" required />
        </label>
        <Note msg={pwMsg} />
        <button type="submit" disabled={busy} style={button}>{busy ? '확인 중…' : '비밀번호 바꾸기'}</button>
      </form>

      <form onSubmit={changeEmail} style={card}>
        <h2 style={{ fontSize: 16 }}>아이디(이메일) 바꾸기</h2>
        <label style={label}>새 이메일
          <input id="acc-new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={input} autoComplete="username" required />
        </label>
        <label style={label}>지금 비밀번호 (본인 확인)
          <input id="acc-email-pw" type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} style={input} autoComplete="current-password" required />
        </label>
        <Note msg={emailMsg} />
        <button type="submit" disabled={busy} style={button}>{busy ? '확인 중…' : '아이디 바꾸기'}</button>
      </form>
    </main>
  );
}
