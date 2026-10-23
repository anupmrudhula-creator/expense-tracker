import type { Expense } from '../data/types';
import { groupOf, type Group } from './categories';
import { isoDay, monthKey } from './dates';

export const totalOf = (expenses: Expense[]): number => expenses.reduce((sum, e) => sum + e.amountMinor, 0);

export interface GroupStat {
  group: Group;
  amount: number;
  categories: { name: string; amount: number }[];
}

export function groupStats(expenses: Expense[]): GroupStat[] {
  const byGroup = new Map<Group, GroupStat>();
  for (const e of expenses) {
    const group = groupOf(e.category);
    let stat = byGroup.get(group);
    if (!stat) {
      stat = { group, amount: 0, categories: [] };
      byGroup.set(group, stat);
    }
    stat.amount += e.amountMinor;
    const cat = stat.categories.find((c) => c.name === e.category);
    if (cat) cat.amount += e.amountMinor;
    else stat.categories.push({ name: e.category, amount: e.amountMinor });
  }
  return [...byGroup.values()]
    .map((s) => ({ ...s, categories: s.categories.sort((a, b) => b.amount - a.amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export function topMerchants(expenses: Expense[], limit = 5) {
  const byName = new Map<string, { name: string; amount: number; count: number }>();
  for (const e of expenses) {
    if (!e.merchant) continue; // "Top places" only ranks named merchants
    const name = e.merchant;
    const row = byName.get(name) ?? { name, amount: 0, count: 0 };
    row.amount += e.amountMinor;
    row.count += 1;
    byName.set(name, row);
  }
  return [...byName.values()].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

// Last N calendar months, oldest first. Each month carries its own date range for drill-down.
export function monthlyTrend(expenses: Expense[], months = 6, now = new Date()) {
  const current = monthKey(now);
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = monthKey(d);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      key,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      amount: totalOf(expenses.filter((e) => monthKey(e.date) === key)),
      from: isoDay(d),
      to: isoDay(last),
      current: key === current,
    };
  });
}
