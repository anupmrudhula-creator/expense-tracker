import type { CardNetwork } from '../data/types';

export const NETWORK_LABEL: Record<CardNetwork, string> = {
  visa: 'VISA',
  mastercard: 'mastercard',
  rupay: 'RuPay',
  amex: 'AMEX',
  other: 'CARD',
};

// Card face colours per network, so each card looks like its issuer's family.
export const NETWORK_GRADIENT: Record<CardNetwork, string> = {
  visa: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
  mastercard: 'linear-gradient(135deg, #7c2d12, #ea580c)',
  rupay: 'linear-gradient(135deg, #064e3b, #10b981)',
  amex: 'linear-gradient(135deg, #334155, #64748b)',
  other: 'linear-gradient(150deg, #a48bff, #6c4cf5)',
};

// Works out the network from the leading digits. These are the common ranges, not a full list.
export function detectNetwork(digits: string): CardNetwork {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^(60|65|81|82|508|353|356)/.test(digits)) return 'rupay';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'other';
}
