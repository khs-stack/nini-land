'use client';

import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';

const emptyForm = { label: '집', recipient: '', phone: '', address: '', isDefault: false };

export default function AddressesPage() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useMockStore();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.recipient.trim() || !form.address.trim()) return;
    if (editingId) {
      updateAddress(editingId, form);
    } else {
      addAddress(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (id: string) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;
    setForm({ label: target.label, recipient: target.recipient, phone: target.phone, address: target.address, isDefault: target.isDefault });
    setEditingId(id);
    setShowForm(true);
  };

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <h1 style={{ fontSize: 22 }}>배송지 관리</h1>

      <div style={{ display: 'grid', gap: 10 }}>
        {addresses.map((addr) => (
          <div key={addr.id} style={{ background: '#fff', borderRadius: 14, padding: 14, border: addr.isDefault ? '2px solid #111' : '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>
                {addr.label} {addr.isDefault && <span style={{ fontSize: 11, background: '#111', color: '#fff', padding: '2px 8px', borderRadius: 999, marginLeft: 6 }}>기본배송지</span>}
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#555', marginTop: 6 }}>{addr.recipient} · {addr.phone}</div>
            <div style={{ fontSize: 14, color: '#555', marginTop: 2 }}>{addr.address}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {!addr.isDefault && <button type="button" onClick={() => setDefaultAddress(addr.id)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 12, background: '#fff' }}>기본으로 설정</button>}
              <button type="button" onClick={() => startEdit(addr.id)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 12, background: '#fff' }}>수정</button>
              <button type="button" onClick={() => deleteAddress(addr.id)} style={{ border: 0, borderRadius: 8, padding: '6px 10px', fontSize: 12, background: '#e5484d', color: '#fff' }}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button type="button" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} style={{ border: '1px dashed #ccc', borderRadius: 14, padding: 14, background: '#fff', color: '#666', fontWeight: 700 }}>
          + 새 배송지 추가
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 14, padding: 16, display: 'grid', gap: 10 }}>
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="배송지 이름 (예: 집, 회사)" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }} />
          <input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="수령인" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }} />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="연락처" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }} />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="주소" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            기본 배송지로 설정
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, border: 0, borderRadius: 10, padding: '12px', background: '#111', color: 'white', fontWeight: 700 }}>저장</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '12px 16px', background: '#fff' }}>취소</button>
          </div>
        </form>
      )}
    </main>
  );
}
