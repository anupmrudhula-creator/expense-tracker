import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { AppData, Bill, BillPayment, Deposit, Expense, Plan, Settlement, Source } from './types';

const STORAGE_KEY = 'expense-tracker:data:v1';

export type Action =
  | { type: 'addSource'; source: Source }
  | { type: 'settleCard'; settlement: Settlement }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'addBill'; bill: Bill }
  | { type: 'payBill'; payment: BillPayment; expense: Expense }
  | { type: 'unpayBill'; paymentId: string; expenseId: string }
  | { type: 'addPlan'; plan: Plan }
  | { type: 'addDeposit'; deposit: Deposit };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'addSource':
      return { ...state, sources: [...state.sources, action.source] };
    case 'settleCard':
      return { ...state, settlements: [...state.settlements, action.settlement] };
    case 'addExpense':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'addBill':
      return { ...state, bills: [...state.bills, action.bill] };
    case 'payBill':
      return {
        ...state,
        billPayments: [...state.billPayments, action.payment],
        expenses: [action.expense, ...state.expenses],
      };
    case 'unpayBill':
      return {
        ...state,
        billPayments: state.billPayments.filter((p) => p.id !== action.paymentId),
        expenses: state.expenses.filter((e) => e.id !== action.expenseId),
      };
    case 'addPlan':
      return { ...state, plans: [...state.plans, action.plan] };
    case 'addDeposit':
      return { ...state, deposits: [action.deposit, ...state.deposits] };
  }
}

// Sample data so the screens have something to show on first run.
// Dates are relative to now, so the demo always looks current.
function seed(): AppData {
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  return {
    sources: [
      { id: 's-anup-cc', kind: 'credit_card', label: 'Credit card', owner: 'anup', last4: '4821' },
      { id: 's-mru-cc', kind: 'credit_card', label: 'Credit card', owner: 'mrudhula', last4: '9034' },
      { id: 's-joint-bank', kind: 'bank_account', label: 'Joint savings', owner: 'joint', last4: '1187' },
    ],
    expenses: [
      { id: 'e1', amountMinor: 245000, date: ago(1), merchant: 'Big Basket', category: 'Groceries', sourceId: 's-joint-bank', mode: 'upi', paidBy: 'joint', enteredBy: 'mrudhula' },
      { id: 'e2', amountMinor: 89900, date: ago(2), merchant: 'Swiggy', category: 'Restaurants', sourceId: 's-anup-cc', mode: 'credit_card', paidBy: 'anup', enteredBy: 'anup' },
      { id: 'e3', amountMinor: 152000, date: ago(4), merchant: 'Reliance Digital', category: 'Offline shopping', sourceId: 's-mru-cc', mode: 'credit_card', paidBy: 'mrudhula', enteredBy: 'anup' },
      { id: 'e4', amountMinor: 60000, date: ago(6), merchant: 'Indian Oil', category: 'Fuel', sourceId: 's-anup-cc', mode: 'credit_card', paidBy: 'anup', enteredBy: 'anup' },
      { id: 'e5', amountMinor: 45000, date: ago(9), merchant: 'Cafe', category: 'Restaurants', sourceId: null, mode: 'cash', paidBy: 'mrudhula', enteredBy: 'mrudhula' },
    ],
    bills: [
      { id: 'b1', name: 'Rent', expectedMinor: 2500000, dueDay: 5, payer: 'joint', sourceId: 's-joint-bank' },
      { id: 'b2', name: 'Cook', expectedMinor: 300000, dueDay: 1, payer: 'anup', sourceId: null },
      { id: 'b3', name: 'Maid', expectedMinor: 200000, dueDay: 1, payer: 'mrudhula', sourceId: null },
      { id: 'b4', name: 'Electricity', expectedMinor: 180000, dueDay: 12, payer: 'anup', sourceId: 's-anup-cc' },
    ],
    billPayments: [],
    settlements: [],
    plans: [
      { id: 'p1', name: 'PPF', type: 'PPF', frequency: 'yearly', amountMinor: 15000000, owner: 'anup' },
      { id: 'p2', name: 'Index fund SIP', type: 'Mutual fund', frequency: 'monthly', amountMinor: 1000000, owner: 'mrudhula' },
    ],
    deposits: [],
  };
}

// Keep false for real use. Set to true only if you want the sample data for a demo.
const USE_SAMPLE_DATA = false;

function emptyData(): AppData {
  return { sources: [], expenses: [], bills: [], billPayments: [], settlements: [], plans: [], deposits: [] };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Data saved before settlements existed has no such field, so default it.
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppData>;
      return { ...saved, settlements: saved.settlements ?? [] } as AppData;
    }
  } catch {
    // Corrupt or blocked storage: start empty.
  }
  return USE_SAMPLE_DATA ? seed() : emptyData();
}

interface StoreValue {
  data: AppData;
  dispatch: Dispatch<Action>;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked: data lives only in memory for this session.
    }
  }, [data]);

  return <StoreCtx.Provider value={{ data, dispatch }}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreCtx);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

// crypto.randomUUID needs a secure context, which a LAN address over http is not.
export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
