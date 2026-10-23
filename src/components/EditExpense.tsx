import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';
import { useStore } from '../data/store';
import type { Expense, PayMode } from '../data/types';
import { CATEGORIES, GROUP_COLOR, groupOf } from '../lib/categories';
import { isoDay } from '../lib/dates';
import { describeSource, MODES_FOR_KIND } from '../lib/labels';
import { formatMoney, parseMoney } from '../lib/money';
import { CATEGORY_ICON } from '../ui/meta';
import { Tile } from '../ui/Tile';

const CASH = 'cash';

interface EditExpenseProps {
  expense: Expense;
  onClose: () => void;
}

export function EditExpense({ expense, onClose }: EditExpenseProps) {
  const { data, dispatch } = useStore();
  const [amount, setAmount] = useState(String(expense.amountMinor / 100));
  const [merchant, setMerchant] = useState(expense.merchant);
  const [category, setCategory] = useState(expense.category);
  const [sourceKey, setSourceKey] = useState(expense.sourceId ?? CASH);
  const [date, setDate] = useState(isoDay(new Date(expense.date)));

  const amountMinor = parseMoney(amount);
  // Payments made from a fixed bill are undone from the Bills tab, so they can't be deleted here.
  const fromBill = data.billPayments.some((p) => p.expenseId === expense.id);

  const save = () => {
    if (amountMinor <= 0 || !date) return;
    const source = data.sources.find((s) => s.id === sourceKey) ?? null;
    // If the card changed, the payment mode follows the new card. The original time of day is kept.
    const changedSource = sourceKey !== (expense.sourceId ?? CASH);
    const mode: PayMode = changedSource ? (source ? MODES_FOR_KIND[source.kind][0] : 'cash') : expense.mode;
    const original = new Date(expense.date);
    const [y, m, d] = date.split('-').map(Number);
    const when = new Date(y, m - 1, d, original.getHours(), original.getMinutes());

    dispatch({
      type: 'updateExpense',
      expense: {
        ...expense,
        amountMinor,
        merchant: merchant.trim(),
        category,
        sourceId: source ? source.id : null,
        mode,
        paidBy: source ? source.owner : expense.paidBy,
        date: when.toISOString(),
      },
    });
    onClose();
  };

  const remove = () => {
    if (!window.confirm('Delete this payment?')) return;
    dispatch({ type: 'deleteExpense', id: expense.id });
    onClose();
  };

  return (
    <Sheet title="Edit payment" onClose={onClose}>
      <div className="card form-card">
        <span className="muted small">Amount</span>
        <div className="amount-field">
          <span className="rupee">₹</span>
          <input className="amount bare" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>

      <div className="card form-card">
        <span className="muted small">Paid from</span>
        <select className="source-select" value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}>
          {data.sources.map((s) => (
            <option key={s.id} value={s.id}>
              {describeSource(s)}
            </option>
          ))}
          <option value={CASH}>Cash</option>
        </select>
      </div>

      <div className="card form-card">
        <span className="muted small">Category</span>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c] ?? CATEGORY_ICON.Others;
            return (
              <button key={c} className={`cat-pick${category === c ? ' on' : ''}`} onClick={() => setCategory(c)}>
                <Tile icon={Icon} color={GROUP_COLOR[groupOf(c)]} size="sm" />
                <span className="small">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card form-card">
        <input className="bare" placeholder="Where? (optional)" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        <input className="bare" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <button className="primary" disabled={amountMinor <= 0} onClick={save}>
        <Check size={18} /> Save {amountMinor > 0 ? formatMoney(amountMinor) : ''}
      </button>

      <button className="danger" disabled={fromBill} onClick={remove}>
        <Trash2 size={16} /> Delete payment
      </button>
      {fromBill && <p className="muted small center">This was paid as a fixed bill. Undo it from the Bills tab.</p>}
    </Sheet>
  );
}
