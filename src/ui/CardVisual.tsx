import type { Source } from '../data/types';
import { NETWORK_GRADIENT, NETWORK_LABEL } from '../lib/cardNetwork';
import { PEOPLE } from '../lib/labels';
import { formatMoney } from '../lib/money';

interface CardVisualProps {
  source: Source;
  spent: number; // this month's spend on the card, in paise
}

// A card face in the style of a payment app: issuer colour, network mark, last four digits.
export function CardVisual({ source, spent }: CardVisualProps) {
  const network = source.network ?? 'other';
  return (
    <div className="credit-card" style={{ background: NETWORK_GRADIENT[network] }}>
      <div className="cc-top">
        <span className="cc-bank">{source.label}</span>
        <span className="cc-network">{NETWORK_LABEL[network]}</span>
      </div>
      <span className="cc-chip" aria-hidden="true" />
      <span className="cc-number">•••• •••• •••• {source.last4 ?? '••••'}</span>
      <div className="cc-bottom">
        <div className="cc-col">
          <span className="cc-cap">Card holder</span>
          <span className="cc-val">{PEOPLE[source.owner]}</span>
        </div>
        <div className="cc-col cc-right">
          <span className="cc-cap">This month</span>
          <span className="cc-val">{formatMoney(spent)}</span>
        </div>
      </div>
    </div>
  );
}
