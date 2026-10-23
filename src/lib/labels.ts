import type { PayMode, PersonId, Source, SourceKind } from '../data/types';

export const PEOPLE: Record<PersonId, string> = {
  anup: 'Anup',
  mrudhula: 'Mrudhula',
  joint: 'Joint',
};

export const KIND_LABEL: Record<SourceKind, string> = {
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  bank_account: 'Bank account',
  upi: 'UPI',
  cash: 'Cash',
};

export const MODE_LABEL: Record<PayMode, string> = {
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
};

// Which payment modes make sense for each kind of source.
export const MODES_FOR_KIND: Record<SourceKind, PayMode[]> = {
  credit_card: ['credit_card'],
  debit_card: ['debit_card'],
  bank_account: ['upi', 'bank_transfer', 'debit_card'],
  upi: ['upi'],
  cash: ['cash'],
};

export function describeSource(source: Source | undefined): string {
  if (!source) return 'Cash';
  const tail = source.last4 ? ` ••${source.last4}` : '';
  return `${source.label}${tail}`;
}
