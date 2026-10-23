import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import { db, HOUSEHOLD } from '../lib/firebase';
import type { AppData, Bill, BillPayment, Deposit, Expense, Plan, Settlement, Source } from './types';

export type Action =
  | { type: 'addSource'; source: Source }
  | { type: 'settleCard'; settlement: Settlement }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; expense: Expense }
  | { type: 'deleteExpense'; id: string }
  | { type: 'addBill'; bill: Bill }
  | { type: 'deleteBill'; id: string; paymentIds: string[] }
  | { type: 'deleteSource'; id: string }
  | { type: 'payBill'; payment: BillPayment; expense: Expense }
  | { type: 'unpayBill'; paymentId: string; expenseId: string }
  | { type: 'addPlan'; plan: Plan }
  | { type: 'addDeposit'; deposit: Deposit };

type Key = keyof AppData;

const KEYS: Key[] = ['sources', 'expenses', 'bills', 'billPayments', 'settlements', 'plans', 'deposits'];

const EMPTY: AppData = {
  sources: [],
  expenses: [],
  bills: [],
  billPayments: [],
  settlements: [],
  plans: [],
  deposits: [],
};

// Firestore rejects undefined fields, so strip them before saving.
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const ref = (key: Key, id: string) => doc(db, `${HOUSEHOLD}/${key}/${id}`);

async function apply(action: Action): Promise<void> {
  switch (action.type) {
    case 'addSource':
      return setDoc(ref('sources', action.source.id), clean(action.source));
    case 'settleCard':
      return setDoc(ref('settlements', action.settlement.id), clean(action.settlement));
    case 'addExpense':
      return setDoc(ref('expenses', action.expense.id), clean(action.expense));
    case 'updateExpense':
      return setDoc(ref('expenses', action.expense.id), clean(action.expense));
    case 'deleteExpense':
      return deleteDoc(ref('expenses', action.id));
    case 'addBill':
      return setDoc(ref('bills', action.bill.id), clean(action.bill));
    case 'deleteBill': {
      // The bill and its monthly payment records go. The expenses already logged stay in history.
      const batch = writeBatch(db);
      batch.delete(ref('bills', action.id));
      action.paymentIds.forEach((id) => batch.delete(ref('billPayments', id)));
      return batch.commit();
    }
    case 'deleteSource':
      return deleteDoc(ref('sources', action.id));
    case 'addPlan':
      return setDoc(ref('plans', action.plan.id), clean(action.plan));
    case 'addDeposit':
      return setDoc(ref('deposits', action.deposit.id), clean(action.deposit));
    case 'payBill': {
      // The payment record and the expense it creates are saved together, or not at all.
      const batch = writeBatch(db);
      batch.set(ref('billPayments', action.payment.id), clean(action.payment));
      batch.set(ref('expenses', action.expense.id), clean(action.expense));
      return batch.commit();
    }
    case 'unpayBill': {
      const batch = writeBatch(db);
      batch.delete(ref('billPayments', action.paymentId));
      batch.delete(ref('expenses', action.expenseId));
      return batch.commit();
    }
  }
}

interface StoreValue {
  data: AppData;
  dispatch: (action: Action) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(EMPTY);

  // Live updates: every change from either phone appears on the other straight away.
  useEffect(() => {
    if (!user) {
      setData(EMPTY);
      return;
    }
    const unsubscribers = KEYS.map((key) =>
      onSnapshot(collection(db, `${HOUSEHOLD}/${key}`), (snap) => {
        const rows = snap.docs.map((d) => d.data());
        setData((prev) => ({ ...prev, [key]: rows }));
      }),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  const dispatch = (action: Action) => {
    // Writes go to Firestore. The live listener above updates the screens once they're saved.
    apply(action).catch((error) => {
      console.error('Save failed', error);
      alert('Could not save. Check your connection and try again.');
    });
  };

  return <StoreCtx.Provider value={{ data, dispatch }}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreCtx);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

// IDs are generated on this device, so two phones can add entries without clashing.
export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
