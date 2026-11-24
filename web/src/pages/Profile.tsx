import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { ROLE_LABELS_MM } from '../constants';
import {
  ArrowLeft,
  Camera,
  X,
  Phone,
  Mail,
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  Pencil,
  Check,
  Trash2,
} from 'lucide-react';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { mode, toggleTheme } = useTheme();
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
    if (!editName.trim()) {
      window.alert('နာမည် ထည့်ပေးပါ');
      return;
    }
    if (editPassword && editPassword !== editPasswordConfirm) {
      window.alert('စကားဝှက် နှစ်ခု မတူညီပါ');
      return;
    }
    if (editPassword && editPassword.length < 8) {
      window.alert('စကားဝှက် အနည်းဆုံး 8 လုံး ဖြစ်ရမည်');
      return;
    }
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

  const roleLabelMM =
    user.role === 'admin'
      ? 'Admin (CEO)'
      : user.role === 'manager'
      ? 'Manager'
      : user.role === 'accountant'
      ? 'Accountant'
      : 'Delivery Staff';

  const roleColorClass =
    user.role === 'admin'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
      : user.role === 'manager'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
      : user.role === 'accountant'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';

  const initial = user.name ? user.name[0]?.toUpperCase() : 'R';

  return (
    <div className="p-3.5 sm:p-6 space-y-4 max-w-xl mx-auto pb-28 md:pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base sm:text-lg font-black text-ink">ပရိုဖိုင်</h1>
        </div>

        <button
          onClick={openEdit}
          className="px-3.5 py-1.5 rounded-xl border border-line bg-surface text-ink text-xs font-bold hover:bg-muted active:scale-95 transition flex items-center gap-1.5"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>ပြင်ဆင်ရန်</span>
        </button>
      </div>

      {/* User Avatar Card */}
      <div className="card p-6 flex flex-col items-center text-center space-y-3 bg-gradient-to-b from-surface to-muted/30">
        <div className="relative">
          {uploadingImage ? (
            <div className="w-24 h-24 rounded-3xl bg-muted animate-pulse flex items-center justify-center">
              ...
            </div>
          ) : user.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt=""
              className="w-24 h-24 rounded-3xl object-cover border-2 border-line shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-brand text-white text-3xl font-black flex items-center justify-center shadow-sm">
              {initial}
            </div>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-brand text-white rounded-xl w-8 h-8 flex items-center justify-center shadow-md active:scale-95 transition"
            title="ဓာတ်ပုံ ပြောင်းရန်"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div>
          <div className="text-lg font-black text-ink">{user.name}</div>
          <div className="text-xs text-ink-2 font-mono mt-0.5">{user.phone || user.email}</div>
        </div>

        <div className="flex gap-2 items-center">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${roleColorClass}`}>
            {roleLabelMM}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              user.is_active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
            }`}
          >
            {user.is_active ? 'အသက်ဝင်' : 'ပိတ်ထား'}
          </span>
        </div>

        {user.profile_image_url && (
          <button
            onClick={doDeleteImage}
            className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ဓာတ်ပုံ ဖျက်ရန်</span>
          </button>
        )}
      </div>

      {/* Account Info Details */}
      <div className="card p-4 space-y-2">
        <div className="section-label">အကောင့် အချက်အလက်</div>
        <Row label="နာမည်" value={user.name} />
        <Row label="ဖုန်းနံပါတ်" value={user.phone || '—'} />
        <Row label="အီးမေးလ်" value={user.email || '—'} />
        <Row label="အခန်းကဏ္ဍ" value={roleLabelMM} />
      </div>

      {/* App Info & Theme */}
      <div className="card p-4 space-y-2">
        <div className="section-label">အပလီကေးရှင်း</div>
        <Row label="ပရိုဂျက်" value="Royal Myawaddy" />
        <Row label="ဗားရှင်း" value="v1.0.0" />
        <div
          onClick={toggleTheme}
          className="flex justify-between items-center py-2 border-t border-line/60 cursor-pointer"
        >
          <span className="text-xs text-ink-2 font-medium">အပြင်အဆင်</span>
          <span className="text-xs font-bold text-brand flex items-center gap-1.5">
            {mode === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={openEdit}
          className="w-full card p-3.5 text-center font-bold text-xs text-ink hover:bg-muted active:scale-[0.99] transition"
        >
          ပရိုဖိုင် ပြင်ဆင်ရန်
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 py-3 rounded-2xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>အကောင့်မှ ထွက်မည်</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {editVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl border border-line w-full max-w-md p-5 space-y-3.5 max-h-[90vh] overflow-y-auto shadow-float">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-bold text-sm text-ink">ပရိုဖိုင် ပြင်ဆင်ရန်</h3>
              <button
                onClick={() => setEditVisible(false)}
                className="p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="label">နာမည် *</label>
              <input
                className="field"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div>
              <label className="label">ဖုန်းနံပါတ်</label>
              <input
                className="field"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                type="tel"
              />
            </div>

            <div>
              <label className="label">အီးမေးလ်</label>
              <input
                className="field"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                type="email"
              />
            </div>

            <div className="border-t border-line/60 pt-3 space-y-2">
              <div className="text-xs font-bold text-ink-2">စကားဝှက် ပြောင်းလဲခြင်း</div>
              <div className="flex gap-2">
                <input
                  className="field flex-1"
                  type={showPass ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="စကားဝှက်အသစ် (အနည်းဆုံး 8 လုံး)"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="px-3 border border-line rounded-xl text-xs font-semibold hover:bg-muted"
                >
                  {showPass ? 'ဖျောက်' : 'ပြ'}
                </button>
              </div>

              <input
                className="field"
                type={showPass ? 'text' : 'password'}
                value={editPasswordConfirm}
                onChange={(e) => setEditPasswordConfirm(e.target.value)}
                placeholder="စကားဝှက်ကို ထပ်ရိုက်ပါ"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full bg-brand text-white py-3 rounded-2xl font-bold text-xs shadow-sm disabled:opacity-60 active:scale-98 transition"
            >
              {updateMutation.isPending ? 'သိမ်းဆည်းနေဆဲ...' : 'သိမ်းမည်'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-line/50 last:border-0 gap-2 text-xs">
      <span className="text-ink-2 font-medium">{label}</span>
      <span className="text-ink text-right font-semibold">{value}</span>
    </div>
  );
}
