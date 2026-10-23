import { ArrowDownRight, ArrowRight, ArrowUpRight, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { Tab } from '../components/BottomNav';
import { useStore } from '../data/store';
import { totalOf } from '../lib/analysis';
import { GROUP_COLOR, groupOf } from '../lib/categories';
import { dayLabel, fiscalYear, fiscalYearOf, monthKey } from '../lib/dates';
import type { Filters } from '../lib/filters';
import { describeSource } from '../lib/labels';
import { formatMoney } from '../lib/money';
import { CATEGORY_ICON } from '../ui/meta';
import { Donut } from '../ui/Donut';
import { Tile } from '../ui/Tile';

interface HomeProps {
  onAdd: () => void;
  onDrill: (filters: Partial<Filters>) => void;
  onNavigate: (tab: Tab) => void;
}

// One colour per category, in order of spend. Repeats only past eight categories.
const PALETTE = ['#6c4cf5', '#22c55e', '#f97316', '#ec4899', '#0ea5e9', '#eab308', '#14b8a6', '#94a3b8'];
const RECENT_LIMIT = 5;

export function Home({ onAdd, onDrill, onNavigate }: HomeProps) {
  const { data } = useStore();
  const { user, logout } = useAuth();

  const now = new Date();
  const month = monthKey(now);
  const fy = fiscalYear(now);
  const thisMonth = data.expenses.filter((e) => monthKey(e.date) === month);
  const total = totalOf(thisMonth);
  const savedFy = data.deposits.filter((d) => fiscalYearOf(d.date) === fy).reduce((sum, d) => sum + d.amountMinor, 0);

  // This month's categories, biggest first.
  const byCategory = new Map<string, number>();
  for (const e of thisMonth) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountMinor);
  const categories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount], i) => ({ name, amount, color: PALETTE[i % PALETTE.length] }));

  const recent = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, RECENT_LIMIT);

  return (
    <>
      <section className="home-head">
        <div className="hero-who">
          <h1>Dashboard</h1>
          <span className="hero-sub">Hi {user?.name}</span>
        </div>
        <button className="icon-btn" onClick={onAdd} aria-label="Add payment">
          <Plus size={20} strokeWidth={2.4} />
        </button>
        <button className="icon-btn" onClick={logout} aria-label="Log out">
          <LogOut size={18} />
        </button>
      </section>

      <div className="content-inner">
        <section className="card overview overview-hero">
          <span className="hero-card-label">Total spent this month</span>
          <p className="hero-amount dark">{formatMoney(total)}</p>
          <span className="muted small">
            {thisMonth.length} {thisMonth.length === 1 ? 'payment' : 'payments'} ·{' '}
            {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
        </section>

        <div className="pair-tiles">
          <div className="card pair-tile">
            <span className="pair-icon out">
              <ArrowDownRight size={18} />
            </span>
            <span className="muted small">Spent</span>
            <span className="strong">{formatMoney(total)}</span>
          </div>
          <div className="card pair-tile">
            <span className="pair-icon in">
              <ArrowUpRight size={18} />
            </span>
            <span className="muted small">Saved this FY</span>
            <span className="strong">{formatMoney(savedFy)}</span>
          </div>
        </div>

        <section className="card">
          <div className="card-head">
            <h3>This month overview</h3>
            <span className="muted small">Tap a category</span>
          </div>

          {categories.length === 0 ? (
            <p className="muted small">Nothing spent this month yet.</p>
          ) : (
            <>
              <div className="donut-center">
                <Donut segments={categories.map((c) => ({ color: c.color, value: c.amount }))} size={200} stroke={26}>
                  <span className="donut-amount">{formatMoney(total)}</span>
                  <span className="muted small">SPENT</span>
                </Donut>
              </div>

              <div className="legend-grid">
                {categories.map((c) => (
                  <button key={c.name} className="tap legend-item" onClick={() => onDrill({ period: 'month', category: c.name })}>
                    <span className="dot" style={{ background: c.color }} />
                    <span className="legend-name">{c.name}</span>
                    <span className="muted small">{Math.round((c.amount / total) * 100)}%</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Recent transactions</h3>
            <button className="ghost small" onClick={() => onNavigate('payments')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {recent.length === 0 && <p className="muted small">No payments yet.</p>}
          <div className="list">
            {recent.map((e) => {
              const Icon = CATEGORY_ICON[e.category] ?? CATEGORY_ICON.Others;
              const source = data.sources.find((s) => s.id === e.sourceId);
              return (
                <div key={e.id} className="row-item">
                  <Tile icon={Icon} color={GROUP_COLOR[groupOf(e.category)]} size="sm" />
                  <div className="row-main">
                    <span className="strong">{e.merchant || e.category}</span>
                    <span className="muted small">
                      {dayLabel(e.date)} · {describeSource(source)}
                    </span>
                  </div>
                  <span className="amount-out">−{formatMoney(e.amountMinor)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
