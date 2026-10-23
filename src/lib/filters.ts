import type { Expense, PayMode, PersonId } from '../data/types';
import { groupOf, type Group } from './categories';
import { DAY_MS } from './dates';
import { parseMoney } from './money';

export type Period = 'month' | '30d' | '3m' | 'fy' | 'all' | 'custom';

export const PERIOD_LABEL: Record<Period, string> = {
  month: 'This month',
  '30d': 'Last 30 days',
  '3m': 'Last 3 months',
  fy: 'This FY',
  all: 'All time',
  custom: 'Custom',
};

export interface Filters {
  period: Period;
  from: string; // YYYY-MM-DD, used when period is 'custom'
  to: string; // YYYY-MM-DD, used when period is 'custom'
  group: Group | null;
  category: string | null;
  cards: string[]; // source ids, or 'cash'
  paidBy: PersonId | null;
  enteredBy: PersonId | null;
  mode: PayMode | null;
  minRupees: string;
  maxRupees: string;
  query: string;
}

export const EMPTY_FILTERS: Filters = {
  period: 'all',
  from: '',
  to: '',
  group: null,
  category: null,
  cards: [],
  paidBy: null,
  enteredBy: null,
  mode: null,
  minRupees: '',
  maxRupees: '',
  query: '',
};

// 'YYYY-MM-DD' as local midnight.
function parseLocalDay(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Half-open range [start, end) in epoch ms.
export function periodBounds(f: Pick<Filters, 'period' | 'from' | 'to'>, now = new Date()): { start: number; end: number } {
  switch (f.period) {
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end: Infinity };
    case '30d':
      return { start: startOfDay(now) - 29 * DAY_MS, end: Infinity };
    case '3m':
      return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime(), end: Infinity };
    case 'fy': {
      const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return { start: new Date(startYear, 3, 1).getTime(), end: Infinity };
    }
    case 'custom':
      return {
        start: f.from ? parseLocalDay(f.from) : -Infinity,
        end: f.to ? parseLocalDay(f.to) + DAY_MS : Infinity,
      };
    default:
      return { start: -Infinity, end: Infinity };
  }
}

export function applyFilters(expenses: Expense[], f: Filters, now = new Date()): Expense[] {
  const { start, end } = periodBounds(f, now);
  const min = parseMoney(f.minRupees);
  const max = parseMoney(f.maxRupees);
  const q = f.query.trim().toLowerCase();

  return expenses.filter((e) => {
    const t = Date.parse(e.date);
    if (t < start || t >= end) return false;
    if (f.group && groupOf(e.category) !== f.group) return false;
    if (f.category && e.category !== f.category) return false;
    if (f.cards.length && !f.cards.includes(e.sourceId ?? 'cash')) return false;
    if (f.paidBy && e.paidBy !== f.paidBy) return false;
    if (f.enteredBy && e.enteredBy !== f.enteredBy) return false;
    if (f.mode && e.mode !== f.mode) return false;
    if (min > 0 && e.amountMinor < min) return false;
    if (max > 0 && e.amountMinor > max) return false;
    if (q && !`${e.merchant} ${e.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

// Counts filters other than the search box, for the "Filters (n)" label.
export function activeFilterCount(f: Filters): number {
  return [
    f.period !== 'all',
    f.group !== null,
    f.category !== null,
    f.cards.length > 0,
    f.paidBy !== null,
    f.enteredBy !== null,
    f.mode !== null,
    f.minRupees !== '' || f.maxRupees !== '',
  ].filter(Boolean).length;
}
