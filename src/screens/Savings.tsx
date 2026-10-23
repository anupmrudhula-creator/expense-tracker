import { useState } from 'react';
import { PiggyBank, Plus } from 'lucide-react';
import { Sheet } from '../components/Sheet';
import type { Deposit, PersonId, Plan } from '../data/types';
import { newId, useStore } from '../data/store';
import { useAuth } from '../auth/AuthContext';
import { fiscalYear, fiscalYearOf } from '../lib/dates';
import { formatMoney, parseMoney } from '../lib/money';
import { PEOPLE } from '../lib/labels';
import { PLAN_ICON } from '../ui/meta';
import { Tile } from '../ui/Tile';

const PLAN_TYPES = ['PPF', 'NPS', 'Mutual fund', 'Stocks', 'FD / RD', 'Gold', 'Other'];
const SAVE_COLOR = '#16a34a';

// Months elapsed in the current financial year (April = 1).
function monthsIntoFy(now: Date): number {
  const m = now.getMonth();
  return m >= 3 ? m - 2 : m + 10;
}

export function Savings() {
  const { data } = useStore();
  const { user } = useAuth();
  const [addingPlan, setAddingPlan] = useState(false);
  const [depositFor, setDepositFor] = useState<Plan | null>(null);

  const now = new Date();
  const fy = fiscalYear(now);
  const elapsed = monthsIntoFy(now);
  const totalThisFy = data.deposits
    .filter((d) => fiscalYearOf(d.date) === fy)
    .reduce((sum, d) => sum + d.amountMinor, 0);

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Savings</h1>
          <p className="muted small">FY {fy}</p>
        </div>
        <button className="pill" onClick={() => setAddingPlan(true)}>
          <Plus size={16} /> Add plan
        </button>
      </header>

      <section className="card summary">
        <Tile icon={PiggyBank} color={SAVE_COLOR} />
        <div className="cat-meta">
          <span className="muted small">Saved this financial year</span>
          <span className="big-num">{formatMoney(totalThisFy)}</span>
        </div>
      </section>

      {data.plans.length === 0 && <p className="muted empty">No plans yet. Add PPF, NPS, SIPs, stocks and so on.</p>}

      <div className="list-stack">
        {data.plans.map((p) => {
          const thisFy = data.deposits
            .filter((d) => d.planId === p.id && fiscalYearOf(d.date) === fy)
            .reduce((sum, d) => sum + d.amountMinor, 0);
          // Yearly plans aim for one payment a year; monthly plans aim for one payment each month so far.
          const target = p.frequency === 'yearly' ? p.amountMinor : p.amountMinor * elapsed;
          const pct = target ? Math.min(100, (thisFy / target) * 100) : 0;
          const Icon = PLAN_ICON[p.type] ?? PLAN_ICON.Other;
          return (
            <section key={p.id} className="card plan">
              <div className="plan-head">
                <Tile icon={Icon} color={SAVE_COLOR} />
                <div className="cat-meta">
                  <span className="strong">{p.name}</span>
                  <span className="muted small">
                    {p.type} · {p.frequency === 'monthly' ? 'Monthly' : 'Yearly'} · {PEOPLE[p.owner]}
                  </span>
                </div>
                <button className="pill solid small" onClick={() => setDepositFor(p)}>
                  <Plus size={14} /> Deposit
                </button>
              </div>
              <div className="progress">
                <div style={{ width: `${pct}%`, background: SAVE_COLOR }} />
              </div>
              <div className="plan-foot">
                <span className="muted small">
                  {formatMoney(thisFy)} of {formatMoney(target)} this FY
                </span>
                <span className="small strong">{Math.round(pct)}%</span>
              </div>
            </section>
          );
        })}
      </div>

      {addingPlan && user && <PlanForm onClose={() => setAddingPlan(false)} />}
      {depositFor && user && <DepositForm plan={depositFor} enteredBy={user.id} onClose={() => setDepositFor(null)} />}
    </>
  );
}

function PlanForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [type, setType] = useState(PLAN_TYPES[0]);
  const [frequency, setFrequency] = useState<Plan['frequency']>('monthly');
  const [amount, setAmount] = useState('');
  const [owner, setOwner] = useState<PersonId>('anup');

  const amountMinor = parseMoney(amount);
  const valid = name.trim() && amountMinor > 0;

  const save = () => {
    if (!valid) return;
    dispatch({
      type: 'addPlan',
      plan: { id: newId(), name: name.trim(), type, frequency, amountMinor, owner },
    });
    onClose();
  };

  return (
    <Sheet title="Add savings plan" onClose={onClose}>
      <div className="card form-card">
        <span className="muted small">Name</span>
        <input className="bare" placeholder="PPF, Index fund SIP…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="row">
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {PLAN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>How often</span>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as Plan['frequency'])}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
      </div>
      <div className="card form-card">
        <span className="muted small">Amount per payment</span>
        <div className="amount-field">
          <span className="rupee">₹</span>
          <input className="bare" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <label className="field">
        <span>Owner</span>
        <select value={owner} onChange={(e) => setOwner(e.target.value as PersonId)}>
          <option value="anup">Anup</option>
          <option value="mrudhula">Mrudhula</option>
          <option value="joint">Joint</option>
        </select>
      </label>
      <button className="primary" disabled={!valid} onClick={save}>
        Save plan
      </button>
    </Sheet>
  );
}

function DepositForm({ plan, enteredBy, onClose }: { plan: Plan; enteredBy: PersonId; onClose: () => void }) {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState(String(plan.amountMinor / 100));
  const amountMinor = parseMoney(amount);

  const save = () => {
    if (amountMinor <= 0) return;
    const deposit: Deposit = {
      id: newId(),
      planId: plan.id,
      date: new Date().toISOString(),
      amountMinor,
      paidBy: plan.owner,
      enteredBy,
    };
    dispatch({ type: 'addDeposit', deposit });
    onClose();
  };

  return (
    <Sheet title={`Deposit to ${plan.name}`} onClose={onClose}>
      <div className="card form-card">
        <span className="muted small">Amount</span>
        <div className="amount-field">
          <span className="rupee">₹</span>
          <input className="amount bare" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
      </div>
      <p className="muted small center">
        Paid by {PEOPLE[plan.owner]} · entered by {PEOPLE[enteredBy]}
      </p>
      <button className="primary" disabled={amountMinor <= 0} onClick={save}>
        Save {amountMinor > 0 ? formatMoney(amountMinor) : ''}
      </button>
    </Sheet>
  );
}
