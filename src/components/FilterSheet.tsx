import type { PayMode, PersonId } from '../data/types';
import { useStore } from '../data/store';
import { CATEGORIES, GROUPS, groupOf } from '../lib/categories';
import { EMPTY_FILTERS, PERIOD_LABEL, type Filters, type Period } from '../lib/filters';
import { describeSource, MODE_LABEL, PEOPLE } from '../lib/labels';
import { Seg } from './Seg';
import { Sheet } from './Sheet';

const PERIODS: Period[] = ['month', '30d', '3m', 'fy', 'all', 'custom'];
const MODES = Object.keys(MODE_LABEL) as PayMode[];

interface FilterSheetProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClose: () => void;
}

export function FilterSheet({ filters, onChange, onClose }: FilterSheetProps) {
  const { data } = useStore();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const categories = filters.group ? CATEGORIES.filter((c) => groupOf(c) === filters.group) : CATEGORIES;
  const cardOptions = [
    ...data.sources.map((s) => ({ key: s.id, label: describeSource(s) })),
    { key: 'cash', label: 'Cash' },
  ];
  const toggleCard = (key: string) =>
    set({ cards: filters.cards.includes(key) ? filters.cards.filter((k) => k !== key) : [...filters.cards, key] });

  const personOptions = (people: PersonId[]) => [
    { value: 'any', label: 'Any' },
    ...people.map((p) => ({ value: p, label: PEOPLE[p] })),
  ];

  return (
    <Sheet title="Filters" onClose={onClose}>
      <div className="label">Date</div>
      <div className="chips">
        {PERIODS.map((p) => (
          <button key={p} className={`chip${filters.period === p ? ' on' : ''}`} onClick={() => set({ period: p })}>
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>
      {filters.period === 'custom' && (
        <div className="row">
          <label className="field">
            <span>From</span>
            <input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
          </label>
        </div>
      )}

      <div className="label">Category group</div>
      <div className="chips">
        {GROUPS.map((g) => (
          <button
            key={g}
            className={`chip${filters.group === g ? ' on' : ''}`}
            onClick={() => set({ group: filters.group === g ? null : g, category: null })}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="label">Category</div>
      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip${filters.category === c ? ' on' : ''}`}
            onClick={() => set({ category: filters.category === c ? null : c })}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="label">Cards & accounts</div>
      <div className="chips">
        {cardOptions.map((c) => (
          <button key={c.key} className={`chip${filters.cards.includes(c.key) ? ' on' : ''}`} onClick={() => toggleCard(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="label">Paid by</div>
      <Seg
        value={filters.paidBy ?? 'any'}
        options={personOptions(['anup', 'mrudhula', 'joint'])}
        onChange={(v) => set({ paidBy: v === 'any' ? null : (v as PersonId) })}
      />

      <div className="label">Entered by</div>
      <Seg
        value={filters.enteredBy ?? 'any'}
        options={personOptions(['anup', 'mrudhula'])}
        onChange={(v) => set({ enteredBy: v === 'any' ? null : (v as PersonId) })}
      />

      <div className="row">
        <label className="field">
          <span>Mode</span>
          <select value={filters.mode ?? ''} onChange={(e) => set({ mode: e.target.value ? (e.target.value as PayMode) : null })}>
            <option value="">Any</option>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Amount ₹</span>
          <div className="pair">
            <input inputMode="decimal" placeholder="Min" value={filters.minRupees} onChange={(e) => set({ minRupees: e.target.value })} />
            <input inputMode="decimal" placeholder="Max" value={filters.maxRupees} onChange={(e) => set({ maxRupees: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="split">
        <button className="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear all
        </button>
        <button className="primary-sm" onClick={onClose}>
          Done
        </button>
      </div>
    </Sheet>
  );
}
