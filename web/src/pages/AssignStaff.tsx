import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import { userService } from '../services/userService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';
import {
  ArrowLeft,
  UserCheck,
  Search,
  Check,
  X,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const ASSIGNABLE_STATUSES = ['VERIFIED', 'IN_TRANSIT', 'FAILED'];

export default function AssignStaff() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canAssign = user?.role === 'admin' || user?.role === 'accountant';

  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<{ id: number; name: string } | null>(null);

  const { data: staffList } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () => userService.getDeliveryStaff(),
    enabled: canAssign,
  });

  const { data: myParcels, isLoading: parcelsLoading } = useQuery({
    queryKey: ['my-assigned-parcels', user?.id],
    queryFn: () =>
      parcelService.list({
        assigned_by_id: user?.id,
        per_page: 200,
        sort_by: 'updated_at',
        sort_dir: 'desc',
      }),
    enabled: canAssign && Boolean(user?.id),
    select: (data: any) => ({
      ...data,
      data: (data.data || []).filter((p: any) => ASSIGNABLE_STATUSES.includes(p.status)),
    }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ parcelId, staffId }: { parcelId: number; staffId: number }) =>
      parcelService.assign(parcelId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assigned-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      setReassignOpen(false);
      setSelectedParcel(null);
      setAssignTarget(null);
      setStaffSearch('');
    },
  });

  const allParcels = (myParcels as any)?.data ?? [];

  const staffGroups = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        name: string;
        parcels: any[];
        inTransit: number;
        verified: number;
        failed: number;
      }
    >();
    allParcels.forEach((p: any) => {
      const s = p.active_assignment?.staff;
      if (!s) return;
      if (!map.has(s.id)) {
        map.set(s.id, {
          id: s.id,
          name: s.name,
          parcels: [],
          inTransit: 0,
          verified: 0,
          failed: 0,
        });
      }
      const entry = map.get(s.id)!;
      entry.parcels.push(p);
      if (p.status === 'IN_TRANSIT') entry.inTransit++;
      else if (p.status === 'VERIFIED') entry.verified++;
      else if (p.status === 'FAILED') entry.failed++;
    });
    return Array.from(map.values()).sort((a, b) => b.parcels.length - a.parcels.length);
  }, [allParcels]);

  const staffParcels =
    selectedStaffId !== null
      ? allParcels.filter((p: any) => p.active_assignment?.staff?.id === selectedStaffId)
      : [];

  const filteredModalStaff = (staffList ?? []).filter(
    (s: any) => s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  if (!canAssign) {
    return (
      <div className="p-8 text-center text-ink-2 max-w-md mx-auto">
        <div className="text-sm font-bold">ဤစာမျက်နှာကို ကြည့်ရှုခွင့် မရှိပါ</div>
      </div>
    );
  }

  /* Single Staff's Assigned Parcels Detail */
  if (selectedStaffId !== null) {
    return (
      <div className="p-3.5 sm:p-6 space-y-3 max-w-3xl mx-auto pb-28 md:pb-8">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedStaffId(null);
              setSelectedStaffName('');
            }}
            className="p-2 rounded-xl border border-line bg-surface hover:bg-muted active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-black text-ink truncate">
              {selectedStaffName}
            </h1>
            <p className="text-xs text-ink-2">ပါဆယ် {staffParcels.length} ခု တာဝန်ပေးထားသည်</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {staffParcels.map((item: any) => {
            const statusColor = STATUS_COLORS[item.status] || '#6B7280';
            const statusLabel = STATUS_LABELS_MM[item.status] || item.status;
            return (
              <div key={item.id} className="card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    onClick={() => navigate(`/parcels/${item.id}`)}
                    className="text-sm font-bold font-mono text-brand cursor-pointer hover:underline"
                  >
                    {item.tracking_number}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: statusColor, backgroundColor: statusColor + '18' }}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="text-xs text-ink font-semibold">{item.recipient_name}</div>
                <div className="text-xs text-ink-3 truncate">📍 {item.delivery_address}</div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line/60">
                  <button
                    onClick={() => navigate(`/parcels/${item.id}`)}
                    className="py-1.5 px-3 rounded-xl border border-line text-xs font-semibold hover:bg-muted active:scale-95 transition"
                  >
                    အသေးစိတ်
                  </button>
                  <button
                    onClick={() => {
                      setSelectedParcel(item);
                      setStaffSearch('');
                      setAssignTarget(null);
                      setReassignOpen(true);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-brand text-white text-xs font-bold shadow-sm active:scale-95 transition"
                  >
                    ဝန်ထမ်းပြောင်းမည်
                  </button>
                </div>
              </div>
            );
          })}

          {staffParcels.length === 0 && (
            <div className="card p-8 text-center text-ink-3 text-xs">ပါဆယ် မတွေ့ပါ</div>
          )}
        </div>

        {/* Reassign Modal */}
        {reassignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-3xl border border-line w-full max-w-md p-5 space-y-3.5 max-h-[85vh] overflow-y-auto shadow-float">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div>
                  <h3 className="font-bold text-sm text-ink">ဝန်ထမ်း ပြောင်းချိတ်မည်</h3>
                  {selectedParcel && (
                    <p className="text-xs text-brand font-mono">{selectedParcel.tracking_number}</p>
                  )}
                </div>
                <button onClick={() => setReassignOpen(false)} className="p-1 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedParcel?.active_assignment?.staff && (
                <div className="text-xs text-ink-2">
                  လက်ရှိ: <span className="font-bold text-ink">{selectedParcel.active_assignment.staff.name}</span>
                </div>
              )}

              <input
                className="field text-xs"
                placeholder="အမည်ဖြင့် ရှာရန်..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
              />

              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredModalStaff.map((s: any) => {
                  const isCurrent = selectedParcel?.active_assignment?.staff?.id === s.id;
                  const isSelected = assignTarget?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setAssignTarget({ id: s.id, name: s.name })}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition ${
                        isSelected || isCurrent ? 'bg-brand/10' : 'hover:bg-muted'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          isSelected || isCurrent ? 'bg-brand' : 'bg-ink-3'
                        }`}
                      >
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-ink truncate">{s.name}</div>
                        {isCurrent && <div className="text-[10px] text-brand">လက်ရှိ ချိတ်ဆက်ထားသည်</div>}
                      </div>
                      {isSelected ? <Check className="w-4 h-4 text-brand" /> : null}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (selectedParcel && assignTarget) {
                    assignMutation.mutate({
                      parcelId: selectedParcel.id,
                      staffId: assignTarget.id,
                    });
                  }
                }}
                disabled={!assignTarget || assignMutation.isPending}
                className="w-full bg-brand text-white py-3 rounded-2xl font-bold text-xs shadow-sm disabled:opacity-50 active:scale-98 transition"
              >
                {assignMutation.isPending
                  ? 'ချိတ်ဆက်နေဆဲ...'
                  : assignTarget
                  ? `${assignTarget.name} သို့ ပြောင်းမည်`
                  : 'ဝန်ထမ်း ရွေးချယ်ပါ'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Staff List Overview */
  return (
    <div className="p-3.5 sm:p-6 space-y-3.5 max-w-3xl mx-auto pb-28 md:pb-8">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-ink">ချိတ်ဆက်ထားသော ဝန်ထမ်းများ</h1>
        <p className="text-xs text-ink-2">
          {parcelsLoading ? 'ရှာဖွေနေဆဲ...' : `ဝန်ထမ်း ${staffGroups.length} ဦး · ပါဆယ် ${allParcels.length} ခု`}
        </p>
      </div>

      {parcelsLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-24 bg-muted animate-pulse" />
          ))}
        </div>
      ) : staffGroups.length === 0 ? (
        <div className="card p-8 text-center text-ink-3 text-xs">
          ချိတ်ဆက်ထားသော ဝန်ထမ်း မတွေ့ပါ
        </div>
      ) : (
        <div className="space-y-2.5">
          {staffGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedStaffId(g.id);
                setSelectedStaffName(g.name);
              }}
              className="card w-full p-3.5 text-left hover:border-brand/40 active:scale-[0.99] transition flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-bg text-brand flex items-center justify-center font-black text-base flex-shrink-0">
                {g.name[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink truncate">{g.name}</div>
                <div className="flex gap-1.5 mt-1 flex-wrap text-[10px]">
                  {g.inTransit > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                      ဆောင်ရွက်နေ {g.inTransit}
                    </span>
                  )}
                  {g.verified > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold">
                      စစ်ဆေးပြီး {g.verified}
                    </span>
                  )}
                  {g.failed > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold">
                      မအောင်မြင် {g.failed}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <div className="text-lg font-black text-ink">{g.parcels.length}</div>
                <div className="text-[10px] text-ink-3">ပါဆယ်</div>
              </div>

              <ChevronRight className="w-4 h-4 text-ink-3 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
