export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString();
}

export function toMMDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + (6 * 60 + 30) * 60000);
  return d.toISOString().slice(0, 10);
}

export function formatPeriodLabel(period: string, groupBy: 'day' | 'month'): string {
  const MM_MONTHS = [
    'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
    'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
  ];
  const MM_DAYS = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
  if (groupBy === 'month') {
    const [y, m] = period.split('-');
    return `${MM_MONTHS[Number(m) - 1]} ${y}`;
  }
  const d = new Date(period + 'T00:00:00');
  return `${d.getDate()} ${MM_MONTHS[d.getMonth()]} ${d.getFullYear()}၊ ${MM_DAYS[d.getDay()]}`;
}