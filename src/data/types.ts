export type PersonId = 'anup' | 'mrudhula' | 'joint';

export type SourceKind = 'credit_card' | 'debit_card' | 'bank_account' | 'upi' | 'cash';

export type PayMode = 'credit_card' | 'debit_card' | 'upi' | 'bank_transfer' | 'cash';

export type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'other';

export interface Source {
  id: string;
  kind: SourceKind;
  label: string;
  owner: PersonId;
  last4?: string;
  network?: CardNetwork; // only for cards; the full card number is never stored
  dueDay?: number; // day of the month the card bill is due
}

// Amounts are stored in paise (integer) to avoid rounding errors.
export interface Expense {
  id: string;
  amountMinor: number;
  date: string; // ISO timestamp
  merchant: string;
  category: string;
  sourceId: string | null; // null = cash
  mode: PayMode;
  paidBy: PersonId;
  enteredBy: PersonId;
}

export interface Bill {
  id: string;
  name: string;
  expectedMinor: number;
  dueDay: number;
  payer: PersonId;
  sourceId: string | null;
}

export interface BillPayment {
  id: string;
  billId: string;
  month: string; // YYYY-MM
  expenseId: string;
}

export interface Plan {
  id: string;
  name: string;
  type: string;
  frequency: 'monthly' | 'yearly';
  amountMinor: number;
  owner: PersonId;
}

export interface Deposit {
  id: string;
  planId: string;
  date: string; // ISO timestamp
  amountMinor: number;
  paidBy: PersonId;
  enteredBy: PersonId;
}

// A credit card bill paid off for one month.
export interface Settlement {
  id: string;
  sourceId: string;
  month: string; // YYYY-MM
  amountMinor: number;
  enteredBy: PersonId;
  settledAt: string; // ISO timestamp
}

export interface AppData {
  sources: Source[];
  expenses: Expense[];
  bills: Bill[];
  billPayments: BillPayment[];
  settlements: Settlement[];
  plans: Plan[];
  deposits: Deposit[];
}
