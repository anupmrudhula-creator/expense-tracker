import { PiggyBank, Sparkles } from 'lucide-react';
import { useStore } from '../data/store';
import type { Expense } from '../data/types';
import { groupStats, totalOf } from '../lib/analysis';
import { GROUP_COLOR } from '../lib/categories';
import { fiscalYear, fiscalYearOf } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { CATEGORY_ICON } from '../ui/meta';
import { Donut } from '../ui/Donut';
import { Tile } from '../ui/Tile';

interface AnalyseProps {
  expenses: Expense[]; // the payments currently selected on the Payments tab
}

// Breakdown of the given payments by group and category.
export function Analyse({ expenses }: AnalyseProps) {
  const { data } = useStore();

  const total = totalOf(expenses);
  const groups = groupStats(expenses);
  const top = groups[0];

  const fy = fiscalYear(new Date());
  const savedFy = data.deposits
    .filter((d) => fiscalYearOf(d.date) === fy)
    .reduce((sum, d) => sum + d.amountMinor, 0);

  const categories = groups
    .flatMap((g) => g.categories.map((c) => ({ ...c, group: g.group })))
    .sort((a, b) => b.amount - a.amount);

  if (total === 0) {
    return <p className="muted empty">No payments to analyse with these filters.</p>;
  }

  return (
    <>
      <section className="card totals">
        <div className="total-col">
          <span className="muted small">Spent</span>
          <span className="strong total-out">{formatMoney(total)}</span>
        </div>
        <div className="divider" />
        <div className="total-col">
          <span className="muted small">Saved this FY</span>
          <span className="strong total-in">{formatMoney(savedFy)}</span>
        </div>
      </section>

      <div className="card-head">
        <h3>Analytics</h3>
        <span className="muted small">{groups.length} groups</span>
      </div>
      <div className="hscroll">
        {groups.map((g) => {
          const pct = Math.round((g.amount / total) * 100);
          const color = GROUP_COLOR[g.group];
          return (
            <div key={g.group} className="group-card" style={{ background: `${color}1f` }}>
              <Donut segments={[{ color, value: pct }, { color: 'transparent', value: 100 - pct }]} size={72} stroke={8}>
                <span className="small strong">{pct}%</span>
              </Donut>
              <span className="strong">{g.group}</span>
              <span className="small strong">{formatMoney(g.amount)}</span>
            </div>
          );
        })}
      </div>

      {top && (
        <div className="insight">
          <Sparkles size={18} />
          <span>
            {top.group} is {Math.round((top.amount / total) * 100)}% of this spending.
          </span>
        </div>
      )}

      <div className="card">
        <h3>Categories</h3>
        <div className="list-stack">
          {categories.map((c) => {
            const pct = (c.amount / total) * 100;
            const color = GROUP_COLOR[c.group];
            const Icon = CATEGORY_ICON[c.name] ?? CATEGORY_ICON.Other;
            return (
              <div key={c.name} className="cat-row">
                <div className="cat-head">
                  <Tile icon={Icon} color={color} size="sm" />
                  <div className="cat-meta">
                    <span className="strong">{c.name}</span>
                    <span className="muted small">{pct.toFixed(1)}% of total</span>
                  </div>
                  <span className="strong">{formatMoney(c.amount)}</span>
                </div>
                <div className="progress">
                  <div style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.deposits.length === 0 && (
        <p className="muted small center">
          <PiggyBank size={14} /> Add savings deposits to see them here.
        </p>
      )}
    </>
  );
}
