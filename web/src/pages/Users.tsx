import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { userService, User } from '../services/userService';
import { ROLE_LABELS_MM } from '../constants';

export default function Users() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['users', searchDebounced, roleFilter, page],
    queryFn: () => userService.list({ search: searchDebounced || undefined, role: roleFilter || undefined, page, per_page: 20 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => userService.updateStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const users = (data?.data ?? []) as User[];
  const meta = data?.meta;

  const roleFilters = [
    { label: 'အားလုံး', value: '' },
    { label: 'အက်ဒ်မင်', value: 'admin' },
    { label: 'မန်နေဂျာ', value: 'manager' },
    { label: 'စာရင်းကိုင်', value: 'accountant' },
    { label: 'ပို့ဆောင်', value: 'delivery_staff' },
  ];

  function roleColor(role: string) {
    return role === 'admin' ? '#8B5CF6' : role === 'manager' ? '#3B82F6' : role === 'accountant' ? '#F59E0B' : '#10B981';
  }

  function handleToggleStatus(u: User) {
    if (!window.confirm(`${u.name} ၏ အကောင့်ကို ${u.is_active ? 'ပိတ်' : 'ဖွင့်'}မည်လား?`)) return;
    statusMutation.mutate({ id: u.id, isActive: !u.is_active });
  }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">အသုံးပြုသူများ</h1>
          <p className="text-sm text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ဦး</p>
        </div>
        <button onClick={() => navigate('/users/create')} className="px-3 py-2 rounded bg-brand text-white font-bold">+ အသစ်</button>
      </div>

      <input className="field" placeholder="ဝန်ထမ်း ရှာဖွေမည်..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {roleFilters.map((f) => (
          <button key={f.value} onClick={() => { setRoleFilter(f.value); setPage(1); }} className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap border ${roleFilter === f.value ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const rc = roleColor(u.role);
            return (
              <button key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="card w-full p-3 text-left hover:bg-muted">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {u.profile_image_url ? (
                      <img src={u.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: rc }}>{u.name[0]?.toUpperCase()}</div>
                    )}
                    <div>
                      <div className="font-bold text-ink">{u.name}</div>
                      <div className="text-xs text-ink-2">{u.phone || u.email}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rc }} />
                        <span className="text-xs" style={{ color: rc }}>{ROLE_LABELS_MM[u.role] || u.role}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
                    className={`text-xs px-2 py-1 rounded font-semibold ${u.is_active ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad'}`}
                  >
                    {u.is_active ? 'ဖွင့်' : 'ပိတ်'}
                  </button>
                </div>
              </button>
            );
          })}
          {users.length === 0 && <div className="text-center py-10 text-ink-3">အသုံးပြုသူ မတွေ့ပါ</div>}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border border-line disabled:opacity-40">နှုတ်</button>
          <span className="text-sm">{page} / {meta.last_page}</span>
          <button disabled={page >= meta.last_page} onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} className="px-3 py-1.5 rounded border border-line disabled:opacity-40">နောက်</button>
        </div>
      )}
    </div>
  );
}