import React, { useState, useMemo } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parcelService } from '../services/parcelService';
import { userService } from '../services/userService';
import { STATUS_LABELS_MM, STATUS_COLORS } from '../constants';

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

  const { data: myParcels, isLoading: parcelsLoading, refetch: refetchParcels, isFetching } = useQuery({
    queryKey: ['my-assigned-parcels', user?.id],
    queryFn: () => parcelService.list({ assigned_by_id: user?.id, per_page: 200, sort_by: 'updated_at', sort_dir: 'desc' }),
    enabled: canAssign && !!user?.id,
    select: (data: any) => ({ ...data, data: (data.data || []).filter((p: any) => ASSIGNABLE_STATUSES.includes(p.status)) }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ parcelId, staffId }: { parcelId: number; staffId: number }) => parcelService.assign(parcelId, staffId),
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
    const map = new Map<number, { id: number; name: string; parcels: any[]; inTransit: number; verified: number; failed: number }>();
    allParcels.forEach((p: any) => {
      const s = p.active_assignment?.staff;
      if (!s) return;
      if (!map.has(s.id)) map.set(s.id, { id: s.id, name: s.name, parcels: [], inTransit: 0, verified: 0, failed: 0 });
      const entry = map.get(s.id)!;
      entry.parcels.push(p);
      if (p.status === 'IN_TRANSIT') entry.inTransit++;
      else if (p.status === 'VERIFIED') entry.verified++;
      else if (p.status === 'FAILED') entry.failed++;
    });
    return Array.from(map.values()).sort((a, b) => b.parcels.length - a.parcels.length);
  }, [allParcels]);

  const staffParcels = selectedStaffId !== null ? allParcels.filter((p: any) => p.active_assignment?.staff?.id === selectedStaffId) : [];

  const filteredModalStaff = (staffList ?? []).filter((s: any) => s.is_active && s.name.toLowerCase().includes(staffSearch.toLowerCase()));

  if (!canAssign) {
    return <div className="p-6 text-center text-ink-2">ဤစာမျက်နှာကို ကြည့်ရှုခွင့် မရှိပါ</div>;
  }

  if (selectedStaffId !== null) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => { setSelectedStaffId(null); setSelectedStaffName(''); }} className="px-3 py-1.5 rounded border border-line text-sm">← နောက်</button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-ink">{selectedStaffName}</h1>
            <p className="text-xs text-ink-2">ပါဆယ် {staffParcels.length} ခု</p>
          </div>
        </div>
        <div className="space-y-2">
          {staffParcels.map((item: any) => {
            const statusColor = STATUS_COLORS[item.status] || '#6B7280';
            const statusLabel = STATUS_LABELS_MM[item.status] || item.status;
            return (
              <div key={item.id} className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand cursor-pointer" onClick={() => navigate(`/parcels/${item.id}`)}>{item.tracking_number}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + '18' }}>{statusLabel}</span>
                </div>
                <div className="text-sm text-ink truncate">{item.recipient_name}</div>
                <div className="text-xs text-ink-3 truncate">📍 {item.delivery_address}</div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => navigate(`/parcels/${item.id}`)} className="flex-1 border border-line py-1.5 rounded text-xs font-semibold">အသေးစိတ်</button>
                  <button onClick={() => { setSelectedParcel(item); setStaffSearch(''); setAssignTarget(null); setReassignOpen(true); }} className="flex-1 bg-brand text-white py-1.5 rounded text-xs font-semibold">ဝန်ထမ်းပြောင်းမည်</button>
                </div>
              </div>
            );
          })}
          {staffParcels.length === 0 && <div className="text-center py-10 text-ink-3">ပါဆယ် မတွေ့ပါ</div>}
        </div>

        {/* Reassign modal */}
        {reassignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-surface rounded border border-line w-full max-w-md p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-ink">ဝန်ထမ်း ပြောင်းချိတ်မည်</h3>
                  {selectedParcel && <p className="text-xs text-ink-2">{selectedParcel.tracking_number} · {selectedParcel.recipient_name}</p>}
                </div>
                <button onClick={() => setReassignOpen(false)}><XMarkIcon className="w-5 h-5" /></button>
              </div>
              {selectedParcel?.active_assignment?.staff && (
                <div className="text-xs text-ink-2">လက်ရှိ: {selectedParcel.active_assignment.staff.name}</div>
              )}
              <input className="field" placeholder="အမည်ဖြင့် ရှာရန်..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredModalStaff.map((s: any) => {
                  const isCurrent = selectedParcel?.active_assignment?.staff?.id === s.id;
                  const isSelected = assignTarget?.id === s.id;
                  return (
                    <button key={s.id} onClick={() => setAssignTarget({ id: s.id, name: s.name })} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted ${isCurrent || isSelected ? 'bg-brand/10' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${isSelected || isCurrent ? 'bg-brand' : 'bg-ink-3'}`}>{s.name[0].toUpperCase()}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink">{s.name}</div>
                        {isCurrent && <div className="text-xs text-brand">လက်ရှိ ချိတ်ဆက်ထားသည်</div>}
                      </div>
                      {isSelected ? <CheckIcon className="w-5 h-5 text-brand" /> : isCurrent ? <span className="text-brand">○</span> : <span className="text-ink-3">○</span>}
                    </button>
                  );
                })}
                {filteredModalStaff.length === 0 && <div className="text-center py-4 text-ink-3 text-sm">ဝန်ထမ်း မတွေ့ပါ</div>}
              </div>
              <button
                onClick={() => { if (selectedParcel && assignTarget) assignMutation.mutate({ parcelId: selectedParcel.id, staffId: assignTarget.id }); }}
                disabled={!assignTarget || assignMutation.isPending}
                className="w-full bg-brand text-white py-2 rounded font-bold disabled:opacity-50"
              >
                {assignMutation.isPending ? '...' : assignTarget ? `${assignTarget.name} သို့ ပြောင်းမည်` : 'ဝန်ထမ်းရွေးချယ်ပါ'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-ink">ချိတ်ဆက်ထားသောဝန်ထမ်း</h1>
          <p className="text-sm text-ink-2">{parcelsLoading ? '...' : `ဝန်ထမ်း ${staffGroups.length} ဦး · ပါဆယ် ${allParcels.length} ခု`}</p>
        </div>
      </div>

      {parcelsLoading ? (
        <div className="text-center py-10 text-ink-2">Loading...</div>
      ) : staffGroups.length === 0 ? (
        <div className="text-center py-10 text-ink-3">ချိတ်ဆက်ထားသော ဝန်ထမ်း မတွေ့ပါ</div>
      ) : (
        <div className="space-y-2">
          {staffGroups.map((g) => (
            <button key={g.id} onClick={() => { setSelectedStaffId(g.id); setSelectedStaffName(g.name); }} className="card w-full p-3 text-left hover:bg-muted flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-bg text-brand flex items-center justify-center font-bold">{g.name[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="font-bold text-ink">{g.name}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {g.inTransit > 0 && <span className="text-xs px-2 py-0.5 rounded bg-warn-bg text-warn">ဆောင်ရွက်နေ {g.inTransit}</span>}
                  {g.verified > 0 && <span className="text-xs px-2 py-0.5 rounded bg-info-bg text-info">စစ်ဆေးပြီး {g.verified}</span>}
                  {g.failed > 0 && <span className="text-xs px-2 py-0.5 rounded bg-bad-bg text-bad">မအောင်မြင် {g.failed}</span>}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-ink">{g.parcels.length}</div>
                <div className="text-xs text-ink-3">ပါဆယ်</div>
              </div>
              <span className="text-ink-3">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}