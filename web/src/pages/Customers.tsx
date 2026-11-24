import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { parcelService, Customer } from '../services/parcelService';

type CustomerType = 'recipient' | 'sender';

export default function Customers() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [type, setType] = useState<CustomerType>('recipient');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customers', type, searchDebounced, page],
    queryFn: () => parcelService.customers({ type, search: searchDebounced || undefined, page, per_page: 20 }),
  });

  const customers = (data?.data ?? []) as Customer[];
  const meta = data?.meta;

  return (
    <div className="p-4 md:p-6 space-y-3">
      <h1 className="text-xl font-bold text-ink">ဖောက်သည်များ</h1>
      <p className="text-sm text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ဦး</p>

      <div className="flex rounded border border-line overflow-hidden w-fit">
        <button onClick={() => { setType('recipient'); setPage(1); }} className={`px-4 py-2 text-sm font-semibold ${type === 'recipient' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>လက်ခံသူ</button>
        <button onClick={() => { setType('sender'); setPage(1); }} className={`px-4 py-2 text-sm font-semibold ${type === 'sender' ? 'bg-brand text-white' : 'bg-surface text-ink-2'}`}>ပို့သူ</button>
      </div>

      <input className="field" placeholder="နာမည် သို့ ဖုန်းနံပါတ် ရှာဖွေမည်..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : (
        <div className="space-y-2">
          {customers.map((c, i) => (
            <button
              key={i}
              onClick={() =>
                navigate(`/customers/${encodeURIComponent(c.phone)}?type=${type}&name=${encodeURIComponent(c.name)}`)
              }
              className="card w-full p-3 text-left hover:bg-muted"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">{c.name}</div>
                  <div className="text-sm text-ink-2">{c.phone}</div>
                </div>
                <div className="text-xs bg-brand-bg text-brand px-2 py-1 rounded font-bold">{c.parcel_count} ခု</div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-xs text-ink-3">
                <span>လက်ခံ {c.received_count ?? 0}</span>
                <span>စစ်ဆေး {c.verified_count ?? 0}</span>
                <span>ဆောင်ရွက် {c.in_transit_count ?? 0}</span>
                <span>ပို့ပြီး {c.delivered_count ?? 0}</span>
                <span>မအောင် {c.failed_count ?? 0}</span>
                <span>ပျက် {c.damaged_count ?? 0}</span>
              </div>
              {c.last_parcel_at && (
                <div className="text-xs text-ink-3 mt-1">နောက်ဆုံး: {new Date(c.last_parcel_at).toLocaleDateString()}</div>
              )}
            </button>
          ))}
          {customers.length === 0 && <div className="text-center py-10 text-ink-3">ဖောက်သည် မတွေ့ပါ</div>}
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