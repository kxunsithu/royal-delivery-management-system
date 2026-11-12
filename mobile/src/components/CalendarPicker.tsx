/**
 * CalendarPicker — zero-dependency inline month calendar
 * Works on iOS, Android, and Web (pure React Native)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface Props {
  visible: boolean;
  value?: string;         // 'YYYY-MM-DD' or ''
  onConfirm: (date: string) => void;
  onCancel: () => void;
  title?: string;
  minDate?: string;       // 'YYYY-MM-DD'
  maxDate?: string;       // 'YYYY-MM-DD'
}

const DAYS_MM = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
const DAYS_SHORT = ['တ', 'တ', 'အ', 'ဗ', 'ကြ', 'သ', 'စ'];
const MONTHS_MM = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarPicker({ visible, value, onConfirm, onCancel, title, minDate, maxDate }: Props) {
  const today = new Date();
  const initDate = parseDate(value) ?? today;

  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth()); // 0-based
  const [selected, setSelected] = useState<Date | null>(parseDate(value));

  const minD = parseDate(minDate);
  const maxD = parseDate(maxDate);

  // Reset when opened with new value
  React.useEffect(() => {
    if (visible) {
      const d = parseDate(value) ?? today;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelected(parseDate(value));
    }
  }, [visible, value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
  }

  function isDisabled(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    return false;
  }

  function isSelected(day: number) {
    if (!selected) return false;
    return selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day;
  }

  function isToday(day: number) {
    return today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day;
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  // Build calendar grid: blanks + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function handleConfirm() {
    if (selected) onConfirm(formatDate(selected));
    else onConfirm(formatDate(today));
  }

  const content = (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Month navigation */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navLabel}>{MONTHS_MM[viewMonth]} {viewYear}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.grid}>
        {DAYS_SHORT.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.dowText, i === 0 && styles.sunText]}>{d}</Text>
          </View>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (!day) return <View key={`blank-${i}`} style={styles.cell} />;
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          const isSun = (firstDow + day - 1) % 7 === 0;
          return (
            <TouchableOpacity
              key={day}
              style={styles.cell}
              onPress={() => !disabled && setSelected(new Date(viewYear, viewMonth, day))}
              disabled={disabled}
            >
              <View style={[
                styles.dayCircle,
                sel && styles.dayCircleSel,
                !sel && tod && styles.dayCircleToday,
              ]}>
                <Text style={[
                  styles.dayText,
                  sel && styles.dayTextSel,
                  !sel && tod && styles.dayTextToday,
                  !sel && !tod && isSun && styles.sunText,
                  disabled && styles.dayTextDisabled,
                ]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected date display */}
      {selected && (
        <View style={styles.selectedRow}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} />
          <Text style={styles.selectedText}>{formatDate(selected)}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>ပိတ်မည်</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
          <Text style={styles.confirmBtnText}>ရွေးချယ်မည်</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    // On web, render as an overlay div instead of Modal
    if (!visible) return null;
    return (
      <View style={styles.webOverlay}>
        <TouchableOpacity style={styles.webBackdrop} onPress={onCancel} />
        {content}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} />
        {content}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webOverlay: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: 320,
    maxWidth: '90%' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dowText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  sunText: { color: '#E53935' },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSel: { backgroundColor: COLORS.primary },
  dayCircleToday: { borderWidth: 1.5, borderColor: COLORS.primary },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayTextSel: { color: '#FFFFFF', fontWeight: '700' },
  dayTextToday: { color: COLORS.primary, fontWeight: '700' },
  dayTextDisabled: { color: COLORS.textLight, opacity: 0.5 },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'NotoSansMyanmar_600SemiBold',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: 'NotoSansMyanmar_700Bold',
  },
});
