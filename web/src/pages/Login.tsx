import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Lock, Phone, Truck, ShieldCheck } from 'lucide-react';

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
    if (!phone.trim()) newErrors.phone = 'ဖုန်းနံပါတ် ထည့်သွင်းပါ';
    if (!password.trim()) newErrors.password = 'စကားဝှက် ထည့်သွင်းပါ';
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
    <div className="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-br from-brand-dark via-brand to-orange-500 text-white p-5 sm:p-8">
      <div />

      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center mx-auto shadow-lg border border-white/30">
            <Truck className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Royal Myawaddy</h1>
            <p className="text-xs text-white/80 font-medium">Delivery Management System</p>
          </div>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleLogin}
          className="bg-surface text-ink rounded-3xl p-6 sm:p-7 space-y-4 shadow-float border border-line/50"
        >
          <div className="text-center pb-1">
            <h2 className="text-lg font-black text-ink">အကောင့်ဝင်ရောက်ရန်</h2>
            <p className="text-xs text-ink-3">သင့်ဖုန်းနံပါတ်နှင့် စကားဝှက် ရိုက်ထည့်ပါ</p>
          </div>

          <div>
            <label className="label">ဖုန်းနံပါတ်</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                className="field pl-9 font-mono"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n.phone;
                    return n;
                  });
                }}
                placeholder="09xxxxxxxxx"
                type="tel"
                autoComplete="username"
              />
            </div>
            {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="label">စကားဝှက်</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="field pl-9 pr-10"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n.password;
                    return n;
                  });
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-dark text-white font-black text-sm shadow-md shadow-brand/25 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60"
          >
            {isLoading ? <span>ဝင်ရောက်နေဆဲ...</span> : <span>ဝင်ရောက်မည်</span>}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-white/70 py-2">
        © 2026 Royal Myawaddy Delivery
      </div>
    </div>
  );
}
