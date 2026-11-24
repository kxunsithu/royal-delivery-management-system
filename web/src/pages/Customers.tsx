import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { parcelService, Customer } from '../services/parcelService';
import {
  Building2,
  Search,
  Phone,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

type CustomerType = 'recipient' | 'sender';

export default function Customers() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [type, setType] = useState<CustomerType>('recipient');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', type, searchDebounced, page],
    queryFn: () =>
      parcelService.customers({
        type,
        search: searchDebounced || undefined,
        page,
        per_page: 20,
      }),
  });

  const customers = (data?.data ?? []) as Customer[];
  const meta = data?.meta;

  return (
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-4xl mx-auto pb-28 md:pb-8">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-ink">ဖောက်သည်များ</h1>
        <p className="text-xs text-ink-2">စုစုပေါင်း {meta?.total ?? 0} ဦး</p>
      </div>

      {/* Recipient / Sender Segmented Control */}
      <div className="grid grid-cols-2 rounded-2xl border border-line bg-muted/40 p-1">
        <button
          onClick={() => {
            setType('recipient');
            setPage(1);
          }}
          className={`py-2 rounded-xl text-xs font-bold transition ${
            type === 'recipient'
              ? 'bg-surface text-brand shadow-sm'
              : 'text-ink-2 hover:text-ink'
          }`}
        >
          လက်ခံသူများ (Recipients)
        </button>
        <button
          onClick={() => {
            setType('sender');
            setPage(1);
          }}
          className={`py-2 rounded-xl text-xs font-bold transition ${
            type === 'sender'
              ? 'bg-surface text-brand shadow-sm'
              : 'text-ink-2 hover:text-ink'
          }`}
        >
          ပေးပို့သူများ (Senders)
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          className="field pl-9 pr-9 text-xs"
          placeholder="ဖောက်သည် အမည် သို့မဟုတ် ဖုန်းနံပါတ် ရှာဖွေမည်..."
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

      {/* Customers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-28 bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {customers.map((c, i) => (
            <div
              key={i}
              onClick={() =>
                navigate(
                  `/customers/${encodeURIComponent(c.phone)}?type=${type}&name=${encodeURIComponent(
                    c.name
                  )}`
                )
              }
              className="card p-3.5 space-y-2 cursor-pointer hover:border-brand/40 active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-ink">{c.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <a
                      href={`tel:${c.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-mono text-brand font-semibold hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                </div>
                <div className="text-xs bg-brand-bg text-brand px-2.5 py-1 rounded-full font-bold">
                  {c.parcel_count} ခု
                </div>
              </div>

              {/* Status summary badges */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-1.5 border-t border-line/60 text-[10px] text-ink-3 text-center">
                <span className="p-1 rounded bg-muted/50">လက်ခံ {c.received_count ?? 0}</span>
                <span className="p-1 rounded bg-muted/50">စစ်ဆေး {c.verified_count ?? 0}</span>
                <span className="p-1 rounded bg-muted/50">ဆောင်ရွက် {c.in_transit_count ?? 0}</span>
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
                  ပို့ပြီး {c.delivered_count ?? 0}
                </span>
                <span className="p-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold">
                  မအောင် {c.failed_count ?? 0}
                </span>
                <span className="p-1 rounded bg-muted/50">ပျက် {c.damaged_count ?? 0}</span>
              </div>
            </div>
          ))}

          {customers.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-xs">ဖောက်သည် မတွေ့ပါ</div>
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
