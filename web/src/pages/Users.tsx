import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { userService, User } from '../services/userService';
import { ROLE_LABELS_MM } from '../constants';
import {
  Users as UsersIcon,
  Search,
  Plus,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
} from 'lucide-react';

export default function Users() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchDebounced, roleFilter, page],
    queryFn: () =>
      userService.list({
        search: searchDebounced || undefined,
        role: roleFilter || undefined,
        page,
        per_page: 20,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      userService.updateStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const users = (data?.data ?? []) as User[];
  const meta = data?.meta;

  const roleFilters = [
    { label: 'အားလုံး', value: '' },
    { label: 'အက်ဒ်မင်', value: 'admin' },
    { label: 'မန်နေဂျာ', value: 'manager' },
    { label: 'စာရင်းကိုင်', value: 'accountant' },
    { label: 'ပို့ဆောင်ရေး', value: 'delivery_staff' },
  ];

  function roleColor(role: string) {
    return role === 'admin'
      ? '#8B5CF6'
      : role === 'manager'
      ? '#3B82F6'
      : role === 'accountant'
      ? '#F59E0B'
      : '#10B981';
  }

  function handleToggleStatus(u: User, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`${u.name} ၏ အကောင့်ကို ${u.is_active ? 'ပိတ်' : 'ဖွင့်'}မည်လား?`)) return;
    statusMutation.mutate({ id: u.id, isActive: !u.is_active });
  }

  return (
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-4xl mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-ink">အသုံးပြုသူများ</h1>
          <p className="text-xs text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ဦး</p>
        </div>

        <button
          onClick={() => navigate('/users/create')}
          className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-sm shadow-brand/25 flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>အသစ်</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          className="field pl-9 pr-9 text-xs"
          placeholder="ဝန်ထမ်းအမည် သို့ ဖုန်းနံပါတ် ရှာဖွေမည်..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {roleFilters.map((f) => {
          const isActive = roleFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => {
                setRoleFilter(f.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-surface text-ink-2 border-line hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-20 bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((u) => {
            const rc = roleColor(u.role);
            return (
              <div
                key={u.id}
                onClick={() => navigate(`/users/${u.id}`)}
                className="card p-3.5 flex items-center justify-between cursor-pointer hover:border-brand/40 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {u.profile_image_url ? (
                    <img
                      src={u.profile_image_url}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-line flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
                      style={{ backgroundColor: rc }}
                    >
                      {u.name[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink truncate">{u.name}</div>
                    <div className="text-xs text-ink-2 font-mono truncate">
                      {u.phone || u.email}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rc }} />
                      <span className="text-[11px] font-semibold" style={{ color: rc }}>
                        {ROLE_LABELS_MM[u.role] || u.role}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleToggleStatus(u, e)}
                  disabled={statusMutation.isPending}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition active:scale-95 flex-shrink-0 ${
                    u.is_active
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25'
                  }`}
                >
                  {u.is_active ? 'ဖွင့်ထား' : 'ပိတ်ထား'}
                </button>
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-xs">အသုံးပြုသူ မတွေ့ပါ</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-line bg-surface disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-ink px-3 py-1.5 rounded-xl bg-surface border border-line">
            {page} / {meta.last_page}
          </span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            className="p-2 rounded-xl border border-line bg-surface disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
