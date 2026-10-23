// Short marks for common card issuers, matched against the card name the user types.
// Banks not listed fall back to their initials in a neutral colour.
const KNOWN_BANKS: { match: RegExp; short: string; color: string }[] = [
  { match: /hdfc/i, short: 'HDFC', color: '#004c8f' },
  { match: /icici/i, short: 'ICICI', color: '#b02a30' },
  { match: /axis/i, short: 'Axis', color: '#97144d' },
  { match: /\bsbi\b/i, short: 'SBI', color: '#1e6fb8' },
  { match: /kotak/i, short: 'Kotak', color: '#c1272d' },
  { match: /amex|american express/i, short: 'Amex', color: '#2e77bc' },
  { match: /citi/i, short: 'Citi', color: '#003b70' },
  { match: /idfc/i, short: 'IDFC', color: '#9c1c2c' },
  { match: /yes bank/i, short: 'Yes', color: '#00529b' },
  { match: /indusind/i, short: 'IndusInd', color: '#8b1d2c' },
];

export interface BankBadge {
  text: string;
  color: string;
}

export function bankBadge(name: string): BankBadge {
  const known = KNOWN_BANKS.find((b) => b.match.test(name));
  if (known) return { text: known.short, color: known.color };

  const words = name.trim().split(/\s+/).filter(Boolean);
  const text = words.length > 1 ? `${words[0][0]}${words[1][0]}` : (words[0] ?? '?').slice(0, 2);
  return { text: text.toUpperCase(), color: '#6c4cf5' };
}
