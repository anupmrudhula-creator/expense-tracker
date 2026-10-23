import { useState } from 'react';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { Sheet } from '../components/Sheet';
import type { AuthUser } from '../auth/AuthContext';
import type { PersonId } from '../data/types';
import { newId, useStore } from '../data/store';
import { CATEGORIES, GROUP_COLOR, groupOf } from '../lib/categories';
import { isoDay } from '../lib/dates';
import { describeSource, MODES_FOR_KIND } from '../lib/labels';
import { formatMoney, parseMoney } from '../lib/money';
import { CATEGORY_ICON, KIND_ICON } from '../ui/meta';
import { Tile } from '../ui/Tile';

const CASH = 'cash';

interface AddExpenseProps {
  user: AuthUser;
  onClose: () => void;
}

// The payment mode comes from the card or account, so it isn't asked for.
function modeFor(kind: keyof typeof MODES_FOR_KIND) {
  return MODES_FOR_KIND[kind][0];
}

export function AddExpense({ user, onClose }: AddExpenseProps) {
  const { data, dispatch } = useStore();
  const [amount, setAmount] = useState('');
  const [sourceKey, setSourceKey] = useState<string>(data.sources[0]?.id ?? CASH);
  const [category, setCategory] = useState('Groceries');
  const [date, setDate] = useState(isoDay(new Date()));

  const source = data.sources.find((s) => s.id === sourceKey) ?? null;
  const kind = source ? source.kind : 'cash';
  const SourceIcon = KIND_ICON[kind];
  // The card's owner is recorded against the payment. Cash is recorded against the person logged in.
  const paidBy: PersonId = source ? source.owner : user.id;
  const amountMinor = parseMoney(amount);

  const save = () => {
    if (amountMinor <= 0 || !date) return;
    // Keep today's time of day, so same-day payments still sort by when they were logged.
    const now = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const when = new Date(y, m - 1, d, now.getHours(), now.getMinutes());
    dispatch({
      type: 'addExpense',
      expense: {
        id: newId(),
        amountMinor,
        date: when.toISOString(),
        merchant: '',
        category,
        sourceId: source ? source.id : null,
        mode: modeFor(kind),
        paidBy,
        enteredBy: user.id,
      },
    });
    onClose();
  };

  return (
    <Sheet title="New payment" onClose={onClose}>
      <div className="card form-card">
        <span className="muted small">Amount</span>
        <div className="amount-field">
          <span className="rupee">₹</span>
          <input
            className="amount bare"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="card form-card">
        <span className="muted small">Paid from</span>
        <div className="form-row">
          <Tile icon={SourceIcon} color="#6c4cf5" size="sm" />
          <div className="cat-meta">
            <select className="source-select" value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}>
              {data.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {describeSource(s)}
                </option>
              ))}
              <option value={CASH}>Cash</option>
            </select>
          </div>
          <ChevronDown size={18} className="muted-icon" />
        </div>
      </div>

      <div className="card form-card">
        <span className="muted small">Category</span>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c] ?? CATEGORY_ICON.Others;
            const on = category === c;
            return (
              <button key={c} className={`cat-pick${on ? ' on' : ''}`} onClick={() => setCategory(c)}>
                <Tile icon={Icon} color={GROUP_COLOR[groupOf(c)]} size="sm" />
                <span className="small">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card form-card">
        <label className="form-row">
          <Calendar size={18} className="muted-icon" />
          <input className="source-select date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <button className="primary" disabled={amountMinor <= 0} onClick={save}>
        <Check size={18} /> Save {amountMinor > 0 ? formatMoney(amountMinor) : ''}
      </button>
    </Sheet>
  );
}
