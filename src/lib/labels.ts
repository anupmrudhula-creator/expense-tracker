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
  return source.label;
}

// For a payment's card id. A card that was deleted shows as "Removed card", not as cash.
export function describeSourceId(sources: Source[], sourceId: string | null): string {
  if (!sourceId) return 'Cash';
  const source = sources.find((s) => s.id === sourceId);
  return source ? source.label : 'Removed card';
}
