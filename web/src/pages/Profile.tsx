import React, { useState, useRef } from 'react';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(user!.id, data),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditVisible(false);
      window.alert('ပရိုဖိုင် ပြင်ဆင်မှု သိမ်းဆည်းပြီးပါပြီ');
    },
    onError: (err: any) => window.alert(err?.response?.data?.message || 'ပြင်ဆင်မှု မအောင်မြင်ပါ'),
  });

  function openEdit() {
    setEditName(user?.name ?? '');
    setEditPhone(user?.phone ?? '');
    setEditEmail(user?.email ?? '');
    setEditPassword('');
    setEditPasswordConfirm('');
    setEditVisible(true);
  }

  function handleSave() {
    if (!editName.trim()) { window.alert('နာမည် ထည့်ပေးပါ'); return; }
    if (editPassword && editPassword !== editPasswordConfirm) { window.alert('စကားဝှက် နှစ်ခု မတူညီပါ'); return; }
    if (editPassword && editPassword.length < 8) { window.alert('စကားဝှက် အနည်းဆုံး 8 လုံး ဖြစ်ရမည်'); return; }
    const payload: any = { name: editName.trim() };
    if (editPhone.trim()) payload.phone = editPhone.trim();
    if (editEmail.trim()) payload.email = editEmail.trim();
    if (editPassword) payload.password = editPassword;
    updateMutation.mutate(payload);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingImage(true);
    try {
      await userService.uploadProfileImage(user.id, file);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      window.alert(err?.response?.data?.message || 'ဓာတ်ပုံ တင်ရန် မအောင်မြင်ပါ');
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function doDeleteImage() {
    if (!user) return;
    if (!window.confirm('ပရိုဖိုင် ဓာတ်ပုံကို ဖျက်မည်လား?')) return;
    setUploadingImage(true);
    try {
      await userService.deleteProfileImage(user.id);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      window.alert(err?.response?.data?.message || 'ဖျက်ရန် မအောင်မြင်ပါ');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleLogout() {
    if (!window.confirm('အကောင့်မှ ထွက်မည်လား?')) return;
    await logout();
    navigate('/login');
  }

  if (!user) return null;

  const roleLabel = (user.role && (['admin','manager','accountant','delivery_staff'].includes(user.role) ? user.role : user.role)) ;
  const roleColor = user.role === 'admin' ? '#8B5CF6' : user.role === 'manager' ? '#2563EB' : user.role === 'accountant' ? '#F59E0B' : '#16A34A';
  const roleLabelMM = user.role === 'admin' ? 'Admin (CEO)' : user.role === 'manager' ? 'Manager' : user.role === 'accountant' ? 'Accountant' : 'Delivery Staff';

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">ပရိုဖိုင်</h1>
        <button onClick={openEdit} className="px-3 py-1.5 rounded border border-line text-sm">ပြင်ဆင်ရန်</button>
      </div>

      <div className="card p-6 flex flex-col items-center text-center space-y-3">
        <div className="relative">
          {uploadingImage ? (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">...</div>
          ) : user.profile_image_url ? (
            <img src={user.profile_image_url} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: roleColor }}>{user.name[0]?.toUpperCase()}</div>
          )}
          <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 bg-brand text-white rounded-full w-8 h-8 flex items-center justify-center text-xs"><CameraIcon className="w-4 h-4" /></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="text-lg font-bold text-ink">{user.name}</div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ color: roleColor, backgroundColor: roleColor + '18' }}>{roleLabelMM}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${user.is_active ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad'}`}>{user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}</span>
        </div>
        <p className="text-xs text-ink-3">ဓာတ်ပုံ ပြောင်းရန် နှိပ်ပါ</p>
        {user.profile_image_url && (
          <button onClick={doDeleteImage} className="text-xs text-bad">ဓာတ်ပုံ ဖျက်ရန်</button>
        )}
      </div>

      <div className="card p-3 space-y-1">
        <h3 className="section-label">အကောင့် အချက်အလက်</h3>
        <Row label="နာမည်" value={user.name} />
        <Row label="ဖုန်းနံပါတ်" value={user.phone || '—'} />
        <Row label="အီးမေးလ်" value={user.email || '—'} />
        <Row label="အခန်းကဏ္ဍ" value={roleLabelMM} valueColor={roleColor} />
      </div>

      <div className="card p-3 space-y-1">
        <h3 className="section-label">အပလီကေးရှင်း</h3>
        <Row label="ပရိုဂျက်" value="Royal Myawaddy" />
        <Row label="ဗားရှင်း" value="v1.0.0" />
        <Row label="ဘာသာစကား" value="မြန်မာဘာသာ" />
        <button onClick={toggleTheme} className="w-full text-left">
          <Row label="အပြင်အဆင်" value={mode === 'dark' ? 'Dark Mode' : 'Light Mode'} />
        </button>
      </div>

      <div className="space-y-2">
        <button onClick={openEdit} className="w-full card p-3 text-center font-semibold text-ink">ပရိုဖိုင် ပြင်ဆင်ရန်</button>
        <button onClick={handleLogout} className="w-full bg-bad-bg text-bad py-3 rounded font-bold">အကောင့်မှ ထွက်ရန်</button>
      </div>

      {editVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-surface rounded border border-line w-full max-w-md p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink">ပရိုဖိုင် ပြင်ဆင်ရန်</h3>
              <button onClick={() => setEditVisible(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="label">နာမည် *</label>
              <input className="field" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="label">ဖုန်းနံပါတ်</label>
              <input className="field" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} type="tel" />
            </div>
            <div>
              <label className="label">အီးမေးလ်</label>
              <input className="field" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
            </div>
            <div className="border-t border-line pt-2">
              <div className="text-xs text-ink-2 mb-2">စကားဝှက် ပြောင်းလဲခြင်း</div>
              <div className="flex gap-2 mb-2">
                <input className="field flex-1" type={showPass ? 'text' : 'password'} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="အနည်းဆုံး 8 လုံး" />
                <button onClick={() => setShowPass((v) => !v)} className="px-3 border border-line rounded text-sm">{showPass ? 'ဖျောက်' : 'ပြ'}</button>
              </div>
              <input className="field" type={showPass ? 'text' : 'password'} value={editPasswordConfirm} onChange={(e) => setEditPasswordConfirm(e.target.value)} placeholder="စကားဝှက်ကို ထပ်ရိုက်ပါ" />
            </div>
            <button onClick={handleSave} disabled={updateMutation.isPending} className="w-full bg-brand text-white py-2 rounded font-bold disabled:opacity-60">
              {updateMutation.isPending ? '...' : 'သိမ်းမည်'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-line last:border-0 gap-2">
      <span className="text-xs text-ink-2 font-semibold">{label}</span>
      <span className="text-sm text-ink text-right" style={valueColor ? { color: valueColor, fontWeight: 700 } : {}}>{value}</span>
    </div>
  );
}