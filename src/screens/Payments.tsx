import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { FilterSheet } from '../components/FilterSheet';
import { Seg } from '../components/Seg';
import { Analyse } from './Analyse';
import { useStore } from '../data/store';
import type { Source } from '../data/types';
import { totalOf } from '../lib/analysis';
import { GROUP_COLOR, groupOf } from '../lib/categories';
import { dayLabel } from '../lib/dates';
import { activeFilterCount, applyFilters, PERIOD_LABEL, type Filters } from '../lib/filters';
import { describeSource, MODE_LABEL, PEOPLE } from '../lib/labels';
import { formatMoney } from '../lib/money';
import { CATEGORY_ICON, KIND_ICON } from '../ui/meta';
import { Tile } from '../ui/Tile';

interface PaymentsProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

interface ActiveChip {
  label: string;
  clear: Partial<Filters>;
}

// One removable chip per active filter, so the current view is always visible.
function activeChips(f: Filters, sources: Source[]): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.period !== 'all') {
    const label = f.period === 'custom' ? `${f.from || '…'} to ${f.to || '…'}` : PERIOD_LABEL[f.period];
    chips.push({ label, clear: { period: 'all', from: '', to: '' } });
  }
  if (f.group) chips.push({ label: f.group, clear: { group: null, category: null } });
  if (f.category) chips.push({ label: f.category, clear: { category: null } });
  for (const key of f.cards) {
    const label = key === 'cash' ? 'Cash' : describeSource(sources.find((s) => s.id === key));
    chips.push({ label, clear: { cards: f.cards.filter((k) => k !== key) } });
  }
  if (f.paidBy) chips.push({ label: `Paid: ${PEOPLE[f.paidBy]}`, clear: { paidBy: null } });
  if (f.enteredBy) chips.push({ label: `Entered: ${PEOPLE[f.enteredBy]}`, clear: { enteredBy: null } });
  if (f.mode) chips.push({ label: MODE_LABEL[f.mode], clear: { mode: null } });
  if (f.minRupees || f.maxRupees) {
    chips.push({ label: `₹${f.minRupees || '0'} – ${f.maxRupees || 'any'}`, clear: { minRupees: '', maxRupees: '' } });
  }
  return chips;
}

type View = 'list' | 'analyse';

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'list', label: 'Payments' },
  { value: 'analyse', label: 'Analyse' },
];

export function Payments({ filters, onChange }: PaymentsProps) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('list');

  const rows = useMemo(
    () => applyFilters(data.expenses, filters).sort((a, b) => b.date.localeCompare(a.date)),
    [data.expenses, filters],
  );
  const chips = activeChips(filters, data.sources);
  const count = activeFilterCount(filters);

  // Group rows by day, keeping the sorted order.
  const groups: { day: string; items: typeof rows }[] = [];
  for (const row of rows) {
    const day = dayLabel(row.date);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(row);
    else groups.push({ day, items: [row] });
  }

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Payments</h1>
          <p className="muted small">
            {rows.length} {rows.length === 1 ? 'payment' : 'payments'} · {formatMoney(totalOf(rows))}
          </p>
        </div>
        <button className="filter-btn" onClick={() => setOpen(true)} aria-label="Filters">
          <SlidersHorizontal size={18} />
          {count > 0 && <span className="badge">{count}</span>}
        </button>
      </header>

      <Seg value={view} options={VIEW_OPTIONS} onChange={setView} />

      <label className="search">
        <Search size={18} />
        <input
          className="bare"
          placeholder="Search merchant or category"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </label>

      {chips.length > 0 && (
        <div className="chips">
          {chips.map((c) => (
            <button key={c.label + JSON.stringify(c.clear)} className="chip on" onClick={() => onChange({ ...filters, ...c.clear })}>
              {c.label} <X size={14} />
            </button>
          ))}
        </div>
      )}

      {view === 'analyse' && <Analyse expenses={rows} />}

      {view === 'list' && rows.length === 0 && <p className="muted empty">No payments match these filters.</p>}

      {view === 'list' &&
        groups.map((g) => (
        <section key={g.day} className="group">
          <p className="day-label">{g.day}</p>
          <div className="card list">
            {g.items.map((e) => {
              const source = data.sources.find((s) => s.id === e.sourceId);
              const SourceIcon = source ? KIND_ICON[source.kind] : KIND_ICON.cash;
              const CatIcon = CATEGORY_ICON[e.category] ?? CATEGORY_ICON.Other;
              // Card modes repeat what the card already says, so only bank-linked modes get shown.
              const showMode = source?.kind === 'bank_account' || source?.kind === 'upi';
              return (
                <div key={e.id} className="row-item">
                  <Tile icon={CatIcon} color={GROUP_COLOR[groupOf(e.category)]} />
                  <div className="row-main">
                    <span className="strong">{e.merchant || e.category}</span>
                    <span className="muted small meta-line">
                      <SourceIcon size={12} /> {describeSource(source)}
                      {showMode && ` · ${MODE_LABEL[e.mode]}`}
                    </span>
                  </div>
                  <span className="amount-out">−{formatMoney(e.amountMinor)}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {open && <FilterSheet filters={filters} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}
