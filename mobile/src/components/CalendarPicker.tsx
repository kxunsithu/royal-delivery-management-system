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
import { COLORS, FONTS } from '../constants';

interface Props {
  visible: boolean;
  value?: string;         // 'YYYY-MM-DD' or ''
  onConfirm: (date: string) => void;
  onCancel: () => void;
  title?: string;
  minDate?: string;       // 'YYYY-MM-DD'
  maxDate?: string;       // 'YYYY-MM-DD'
}

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
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>{MONTHS_MM[viewMonth]} {viewYear}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth} activeOpacity={0.7}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.grid}>
        {DAYS_SHORT.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dowText}>{d}</Text>
          </View>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (!day) return <View key={`blank-${i}`} style={styles.cell} />;
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <TouchableOpacity
              key={day}
              style={styles.cell}
              onPress={() => !disabled && setSelected(new Date(viewYear, viewMonth, day))}
              disabled={disabled}
              activeOpacity={0.7}
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
          <Text style={styles.selectedText}>{formatDate(selected)}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>ပိတ်မည်</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: { minHeight: 80, minWidth: 120,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    padding: 16,
    width: 320,
    maxWidth: '90%' as any,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
    zIndex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
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
  },
  dowText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSel: { backgroundColor: COLORS.primary },
  dayCircleToday: { borderWidth: 1.5, borderColor: COLORS.primary },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  dayTextSel: { color: COLORS.white, fontWeight: '700', fontFamily: FONTS.bold },
  dayTextToday: { color: COLORS.primary, fontWeight: '700', fontFamily: FONTS.bold },
  dayTextDisabled: { color: COLORS.textLight, opacity: 0.4 },
  selectedRow: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
});