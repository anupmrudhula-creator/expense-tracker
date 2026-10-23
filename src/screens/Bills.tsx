import { useState } from 'react';
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '../components/Sheet';
import { Seg } from '../components/Seg';
import type { Bill, BillPayment, Expense, PersonId, Settlement, Source } from '../data/types';
import { newId, useStore } from '../data/store';
import { useAuth } from '../auth/AuthContext';
import { bankBadge } from '../lib/banks';
import { totalOf } from '../lib/analysis';
import { DAY_MS, dayLabel, monthKey } from '../lib/dates';
import { MODES_FOR_KIND, PEOPLE, describeSource } from '../lib/labels';
import { formatMoney, parseMoney } from '../lib/money';
import { billIcon } from '../ui/meta';
import { CardVisual } from '../ui/CardVisual';

type TabId = 'cards' | 'fixed' | 'history';

const TABS: { value: TabId; label: string }[] = [
  { value: 'cards', label: 'Card bills' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'history', label: 'History' },
];

export function Bills() {
  const [tab, setTab] = useState<TabId>('cards');

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Bills</h1>
          <p className="muted small">{new Date().toLocaleDateString('en-IN', { month: 'long' })} · to settle, monthly and history</p>
        </div>
      </header>

      <Seg value={tab} options={TABS} onChange={setTab} />

      {tab === 'cards' && <CardBills />}
      {tab === 'fixed' && <FixedBills />}
      {tab === 'history' && <History />}
    </>
  );
}

// Days until the next occurrence of a due day. Today counts as 0.
function daysUntil(dueDay: number, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let due = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (due < today) due = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
}

function dueText(days: number): string {
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

function CardBills() {
  const { data, dispatch } = useStore();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Source | null>(null);
  const [adding, setAdding] = useState(false);

  const now = new Date();
  const month = monthKey(now);
  const thisMonth = data.expenses.filter((e) => monthKey(e.date) === month);

  const rows = data.sources
    .filter((s) => s.kind === 'credit_card')
    .map((s) => ({
      source: s,
      spent: totalOf(thisMonth.filter((e) => e.sourceId === s.id)),
      settled: data.settlements.find((x) => x.sourceId === s.id && x.month === month),
    }));

  const toSettle = rows.filter((r) => !r.settled).reduce((sum, r) => sum + r.spent, 0);
  const settledCount = rows.filter((r) => r.settled).length;

  const settle = (source: Source, amountMinor: number) => {
    if (!user) return;
    const settlement: Settlement = {
      id: newId(),
      sourceId: source.id,
      month,
      amountMinor,
      enteredBy: user.id,
      settledAt: new Date().toISOString(),
      cardLabel: source.label,
    };
    dispatch({ type: 'settleCard', settlement });
    setSelected(null);
  };

  const removeCard = (source: Source) => {
    if (!window.confirm(`Delete ${source.label}? Past payments stay in your history.`)) return;
    dispatch({ type: 'deleteSource', id: source.id });
    setSelected(null);
  };

  return (
    <>
      <section className="card cc-list">
        <div className="card-head">
          <h3>Credit cards</h3>
          <button className="pill small" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add card
          </button>
        </div>

        {rows.length === 0 && <p className="muted small">No cards yet. Add one to start tracking its bill.</p>}

        {rows.map((r) => {
          const badge = bankBadge(r.source.label);
          const days = r.source.dueDay ? daysUntil(r.source.dueDay, now) : null;
          const urgency = days === null ? 'muted' : days <= 3 ? 'due-hot' : days <= 7 ? 'due-warm' : 'muted';
          const shown = r.settled ? r.settled.amountMinor : r.spent;
          return (
            <button key={r.source.id} className="tap cc-row" onClick={() => setSelected(r.source)}>
              <span className="cc-thumb" style={{ background: badge.color }}>
                {badge.text}
              </span>
              <span className="cc-info">
                <span className="strong">{r.source.label}</span>
                <span className="muted small">{PEOPLE[r.source.owner]}</span>
              </span>
              <span className="cc-amt">
                <span className="strong">{formatMoney(shown)}</span>
                {r.settled ? (
                  <span className="small ok">Settled</span>
                ) : days !== null ? (
                  <span className={`small ${urgency}`}>{dueText(days)}</span>
                ) : (
                  <span className="small muted">This month</span>
                )}
              </span>
              <ChevronRight size={18} className="muted-icon" />
            </button>
          );
        })}

        <div className="cc-footer">
          <div className="cat-meta">
            <span className="muted small">Total due</span>
            <span className="big-num">{formatMoney(toSettle)}</span>
          </div>
          <span className="pill-muted">
            {settledCount}/{rows.length} settled
          </span>
        </div>
      </section>

      {adding && <AddCardSheet onClose={() => setAdding(false)} />}
      {selected && (
        <CardSheet
          source={selected}
          spent={rows.find((r) => r.source.id === selected.id)?.spent ?? 0}
          settled={rows.find((r) => r.source.id === selected.id)?.settled}
          onClose={() => setSelected(null)}
          onSettle={(amountMinor) => settle(selected, amountMinor)}
          onDelete={() => removeCard(selected)}
        />
      )}
    </>
  );
}

// Settle asks for the exact amount paid. Delete removes the card but keeps its past payments.
function CardSheet({
  source,
  spent,
  settled,
  onClose,
  onSettle,
  onDelete,
}: {
  source: Source;
  spent: number;
  settled: Settlement | undefined;
  onClose: () => void;
  onSettle: (amountMinor: number) => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState('');
  const amountMinor = parseMoney(amount);

  return (
    <Sheet title={source.label} onClose={onClose}>
      <CardVisual source={source} spent={spent} />

      {settled ? (
        <div className="card form-card">
          <span className="muted small">Settled this month</span>
          <span className="big-num">{formatMoney(settled.amountMinor)}</span>
        </div>
      ) : (
        <>
          <div className="card form-card">
            <span className="muted small">Amount you paid for this month's bill</span>
            <div className="amount-field">
              <span className="rupee">₹</span>
              <input className="amount bare" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            </div>
            <span className="muted small">Card spend this month: {formatMoney(spent)}</span>
          </div>
          <button className="primary" disabled={amountMinor <= 0} onClick={() => onSettle(amountMinor)}>
            <Check size={18} /> Settle {amountMinor > 0 ? formatMoney(amountMinor) : ''}
          </button>
        </>
      )}

      <button className="danger" onClick={onDelete}>
        <Trash2 size={16} /> Delete card
      </button>
    </Sheet>
  );
}

// Only the card name, the holder, and the due day are asked for. No card number.
function AddCardSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState<PersonId>('anup');
  const [dueDay, setDueDay] = useState('');

  const due = Number(dueDay);
  const valid = name.trim() && (!dueDay || (due >= 1 && due <= 31));

  const save = () => {
    if (!valid) return;
    dispatch({
      type: 'addSource',
      source: {
        id: newId(),
        kind: 'credit_card',
        label: name.trim(),
        owner,
        dueDay: dueDay ? due : undefined,
      },
    });
    onClose();
  };

  return (
    <Sheet title="Add credit card" onClose={onClose}>
      <CardVisual source={{ id: 'preview', kind: 'credit_card', label: name.trim() || 'Card name', owner }} spent={0} />
      <div className="card form-card">
        <span className="muted small">Card name</span>
        <input className="bare" placeholder="HDFC Millennia, Axis Rewards…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="row">
        <label className="field">
          <span>Card holder</span>
          <select value={owner} onChange={(e) => setOwner(e.target.value as PersonId)}>
            <option value="anup">Anup</option>
            <option value="mrudhula">Mrudhula</option>
          </select>
        </label>
        <label className="field">
          <span>Bill due day</span>
          <input inputMode="numeric" placeholder="e.g. 28" value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
        </label>
      </div>
      <button className="primary" disabled={!valid} onClick={save}>
        Save card
      </button>
    </Sheet>
  );
}

function FixedBills() {
  const { data, dispatch } = useStore();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [detail, setDetail] = useState<Bill | null>(null);

  const now = new Date();
  const month = monthKey(now);
  const today = now.getDate();

  const bills = [...data.bills].sort((a, b) => a.dueDay - b.dueDay);
  const paymentFor = (billId: string) => data.billPayments.find((p) => p.billId === billId && p.month === month);
  const pendingTotal = bills.filter((b) => !paymentFor(b.id)).reduce((sum, b) => sum + b.expectedMinor, 0);
  const paidCount = bills.filter((b) => paymentFor(b.id)).length;

  const removeBill = (bill: Bill) => {
    if (!window.confirm(`Delete ${bill.name}? Past payments stay in your history.`)) return;
    const paymentIds = data.billPayments.filter((p) => p.billId === bill.id).map((p) => p.id);
    dispatch({ type: 'deleteBill', id: bill.id, paymentIds });
    setDetail(null);
  };

  return (
    <>
      <div className="split-head">
        <span className="muted small">Monthly fixed payouts</span>
        <button className="pill" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add bill
        </button>
      </div>

      <section className="hero-card">
        <div className="cat-meta">
          <span className="hero-card-label">Still to pay this month</span>
          <span className="hero-card-amount">{formatMoney(pendingTotal)}</span>
        </div>
        <span className="hero-card-count">
          {paidCount}/{bills.length} paid
        </span>
      </section>

      {bills.length === 0 && <p className="muted empty">No bills yet. Add rent, cook, maid, electricity and so on.</p>}

      <div className="list-stack">
        {bills.map((b) => {
          const payment = paymentFor(b.id);
          const source = data.sources.find((s) => s.id === b.sourceId);
          const overdue = !payment && today > b.dueDay;
          const shown = payment ? amountOf(data.expenses, payment.expenseId) : b.expectedMinor;
          const Icon = billIcon(b.name);
          const status = payment ? 'paid' : overdue ? 'overdue' : 'pending';
          return (
            <div key={b.id} className="card bill-row tap-row" role="button" onClick={() => setDetail(b)}>
              <span className="bill-icon">
                <Icon size={20} />
              </span>
              <div className="cat-meta">
                <span className="strong">{b.name}</span>
                <span className="muted small">
                  Due {b.dueDay} · {PEOPLE[b.payer]} · {describeSource(source)}
                </span>
                <span className={`status status-${status}`}>
                  {status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Pending'}
                </span>
              </div>
              <div className="bill-side">
                <span className="strong">{formatMoney(shown)}</span>
                {!payment && (
                  <button
                    className="pill solid small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaying(b);
                    }}
                  >
                    <Check size={14} /> Paid
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <BillDetail
          bill={detail}
          payment={paymentFor(detail.id)}
          amountMinor={(() => {
            const p = paymentFor(detail.id);
            return p ? amountOf(data.expenses, p.expenseId) : detail.expectedMinor;
          })()}
          sourceName={describeSource(data.sources.find((s) => s.id === detail.sourceId))}
          onClose={() => setDetail(null)}
          onPay={() => {
            setPaying(detail);
            setDetail(null);
          }}
          onUnpay={() => {
            const p = paymentFor(detail.id);
            if (p) dispatch({ type: 'unpayBill', paymentId: p.id, expenseId: p.expenseId });
            setDetail(null);
          }}
          onDelete={() => removeBill(detail)}
        />
      )}

      {adding && <BillForm onClose={() => setAdding(false)} />}
      {paying && user && (
        <PayBill
          bill={paying}
          onClose={() => setPaying(null)}
          onSave={(amountMinor) => {
            const expenseId = newId();
            const source = data.sources.find((s) => s.id === paying.sourceId);
            const mode = source ? MODES_FOR_KIND[source.kind][0] : 'bank_transfer';
            const payment: BillPayment = { id: newId(), billId: paying.id, month, expenseId, billName: paying.name };
            dispatch({
              type: 'payBill',
              payment,
              expense: {
                id: expenseId,
                amountMinor,
                date: new Date().toISOString(),
                merchant: paying.name,
                category: 'Bills',
                sourceId: paying.sourceId,
                mode,
                paidBy: paying.payer,
                enteredBy: user.id,
              },
            });
            setPaying(null);
          }}
        />
      )}
    </>
  );
}

// Shows one fixed bill. A paid bill can be marked unpaid again. Delete removes the bill itself.
function BillDetail({
  bill,
  payment,
  amountMinor,
  sourceName,
  onClose,
  onPay,
  onUnpay,
  onDelete,
}: {
  bill: Bill;
  payment: BillPayment | undefined;
  amountMinor: number;
  sourceName: string;
  onClose: () => void;
  onPay: () => void;
  onUnpay: () => void;
  onDelete: () => void;
}) {
  const Icon = billIcon(bill.name);
  return (
    <Sheet title={bill.name} onClose={onClose}>
      <div className="card bill-detail">
        <span className="bill-icon">
          <Icon size={22} />
        </span>
        <span className="big-num">{formatMoney(amountMinor)}</span>
        <span className={`status status-${payment ? 'paid' : 'pending'}`}>{payment ? 'Paid this month' : 'Not paid yet'}</span>
        <span className="muted small">
          Due {bill.dueDay} · {PEOPLE[bill.payer]} · {sourceName}
        </span>
      </div>
      {payment ? (
        <button className="primary" onClick={onUnpay}>
          Mark as unpaid
        </button>
      ) : (
        <button className="primary" onClick={onPay}>
          <Check size={18} /> Mark as paid
        </button>
      )}
      <button className="danger" onClick={onDelete}>
        <Trash2 size={16} /> Delete bill
      </button>
    </Sheet>
  );
}

// Month-by-month record: what was spent, which card bills were settled, and which fixed bills were paid.
function History() {
  const { data } = useStore();

  const months = [
    ...new Set([
      ...data.expenses.map((e) => monthKey(e.date)),
      ...data.settlements.map((s) => s.month),
      ...data.billPayments.map((p) => p.month),
    ]),
  ]
    .sort()
    .reverse();

  if (months.length === 0) return <p className="muted empty">Nothing logged yet. Your monthly history appears here.</p>;

  return (
    <div className="list-stack">
      {months.map((m) => (
        <MonthRecord key={m} month={m} />
      ))}
    </div>
  );
}

function MonthRecord({ month }: { month: string }) {
  const { data } = useStore();
  const [year, mon] = month.split('-').map(Number);
  const label = new Date(year, mon - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const spent = totalOf(data.expenses.filter((e) => monthKey(e.date) === month));
  const settlements = data.settlements.filter((s) => s.month === month);
  const payments = data.billPayments.filter((p) => p.month === month);
  const cardTotal = settlements.reduce((sum, s) => sum + s.amountMinor, 0);
  const fixedTotal = payments.reduce((sum, p) => sum + amountOf(data.expenses, p.expenseId), 0);

  const cardName = (s: Settlement) => s.cardLabel ?? data.sources.find((x) => x.id === s.sourceId)?.label ?? 'Removed card';
  const billName = (p: BillPayment) => p.billName ?? data.bills.find((b) => b.id === p.billId)?.name ?? 'Removed bill';

  return (
    <section className="card history">
      <div className="card-head">
        <h3>{label}</h3>
        <span className="strong">{formatMoney(spent)}</span>
      </div>
      <p className="muted small">
        Card bills settled {formatMoney(cardTotal)} · Fixed bills paid {formatMoney(fixedTotal)}
      </p>

      {settlements.length > 0 && (
        <>
          <h3 className="sub-title">Card bills settled</h3>
          {settlements.map((s) => (
            <div key={s.id} className="line-row">
              <span>
                {cardName(s)}
                <span className="muted small"> · {dayLabel(s.settledAt)}</span>
              </span>
              <span className="strong">{formatMoney(s.amountMinor)}</span>
            </div>
          ))}
        </>
      )}

      {payments.length > 0 && (
        <>
          <h3 className="sub-title">Fixed bills paid</h3>
          {payments.map((p) => {
            const expense = data.expenses.find((e) => e.id === p.expenseId);
            return (
              <div key={p.id} className="line-row">
                <span>
                  {billName(p)}
                  {expense && <span className="muted small"> · {dayLabel(expense.date)}</span>}
                </span>
                <span className="strong">{formatMoney(expense?.amountMinor ?? 0)}</span>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

function amountOf(expenses: Expense[], expenseId: string): number {
  return expenses.find((e) => e.id === expenseId)?.amountMinor ?? 0;
}

function newBillFromForm(name: string, expected: number, day: number, payer: PersonId, sourceId: string): Bill {
  return { id: newId(), name, expectedMinor: expected, dueDay: day, payer, sourceId: sourceId || null };
}

function BillForm({ onClose }: { onClose: () => void }) {
  const { data, dispatch } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [payer, setPayer] = useState<PersonId>('anup');
  const [sourceId, setSourceId] = useState<string>('');

  const expected = parseMoney(amount);
  const day = Number(dueDay);
  const valid = name.trim() && expected > 0 && day >= 1 && day <= 31;

  const save = () => {
    if (!valid) return;
    dispatch({ type: 'addBill', bill: newBillFromForm(name.trim(), expected, day, payer, sourceId) });
    onClose();
  };

  return (
    <Sheet title="Add bill" onClose={onClose}>
      <div className="card form-card">
        <span className="muted small">Name</span>
        <input className="bare" placeholder="Rent, Cook, Electricity…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="card form-card">
        <span className="muted small">Usual amount</span>
        <div className="amount-field">
          <span className="rupee">₹</span>
          <input className="bare" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <label className="field">
          <span>Due day</span>
          <input inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
        </label>
        <label className="field">
          <span>Paid by</span>
          <select value={payer} onChange={(e) => setPayer(e.target.value as PersonId)}>
            {(['anup', 'mrudhula', 'joint'] as PersonId[]).map((p) => (
              <option key={p} value={p}>
                {PEOPLE[p]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>From</span>
        <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="">Cash / not set</option>
          {data.sources.map((s) => (
            <option key={s.id} value={s.id}>
              {describeSource(s)}
            </option>
          ))}
        </select>
      </label>
      <button className="primary" disabled={!valid} onClick={save}>
        Save bill
      </button>
    </Sheet>
  );
}

function PayBill({ bill, onClose, onSave }: { bill: Bill; onClose: () => void; onSave: (amountMinor: number) => void }) {
  const [amount, setAmount] = useState(String(bill.expectedMinor / 100));
  const amountMinor = parseMoney(amount);

  return (
    <Sheet title={`Pay ${bill.name}`} onClose={onClose}>
      <div className="card form-card">
        <span className="muted small">Actual amount this month</span>
        <div className="amount-field">
          <span className="rupee">₹</span>
          <input className="amount bare" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
      </div>
      <button className="primary" disabled={amountMinor <= 0} onClick={() => onSave(amountMinor)}>
        <Check size={18} /> Save {amountMinor > 0 ? formatMoney(amountMinor) : ''}
      </button>
    </Sheet>
  );
}
