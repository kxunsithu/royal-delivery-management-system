import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  function validate() {
    const newErrors: { phone?: string; password?: string } = {};
    if (!phone.trim()) newErrors.phone = 'ဖုန်းနံပါတ် ထည့်ပါ';
    if (!password.trim()) newErrors.password = 'စကားဝှက် ထည့်ပါ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(phone.trim(), password);
      navigate('/');
    } catch (error: any) {
      const responseErrors = error?.response?.data?.errors;
      const firstError = responseErrors ? Object.values(responseErrors).flat()[0] : null;
      const msg =
        firstError ||
        error?.response?.data?.message ||
        (error?.message?.includes('Network Error')
          ? 'ဆာဗာသို့ ချိတ်ဆက်၍မရပါ (Network Error)'
          : 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ');
      window.alert(String(msg));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Royal Myawaddy</h1>
          <p className="text-sm text-white/80">Delivery Management System</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white/10 rounded p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">အကောင့်ဝင်ရောက်ရန်</h2>
          <div>
            <label className="block text-sm text-white mb-1">ဖုန်းနံပါတ်</label>
            <input
              className="w-full h-12 rounded border border-white/30 bg-white/90 px-3 text-ink"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; }); }}
              placeholder="09xxxxxxxxx"
            />
            {errors.phone && <p className="text-red-200 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm text-white mb-1">စကားဝှက်</label>
            <div className="flex items-center rounded border border-white/30 bg-white/90">
              <input
                type={showPassword ? 'text' : 'password'}
                className="flex-1 h-12 px-3 text-ink bg-transparent outline-none"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => { const n = { ...prev }; delete n.password; return n; }); }}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="px-3 text-ink-3">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-red-200 text-xs mt-1">{errors.password}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded bg-white text-brand font-bold"
          >
            {isLoading ? '...' : 'ဝင်ရောက်မည်'}
          </button>
        </form>
        <p className="text-center text-white/80 text-xs mt-6">© 2026 Royal Myawaddy</p>
      </div>
    </div>
  );
}