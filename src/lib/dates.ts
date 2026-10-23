export const DAY_MS = 86400000;

// YYYY-MM-DD for a date, in local time.
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// YYYY-MM for a date, in local time.
export function monthKey(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Indian financial year (April to March), e.g. "2026-27".
export function fiscalYear(d: Date): string {
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function fiscalYearOf(iso: string): string {
  return fiscalYear(new Date(iso));
}

export function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
