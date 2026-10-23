import type { Source } from '../data/types';
import { bankBadge } from '../lib/banks';
import { PEOPLE } from '../lib/labels';
import { formatMoney } from '../lib/money';

interface CardVisualProps {
  source: Source;
  spent: number; // this month's spend on the card, in paise
}

// A card face showing only the card name, in the colour of its bank.
export function CardVisual({ source, spent }: CardVisualProps) {
  const { color } = bankBadge(source.label);
  return (
    <div className="credit-card" style={{ background: `linear-gradient(150deg, ${color}, #1f1b3a)` }}>
      <div className="cc-top">
        <span className="cc-bank">{source.label}</span>
      </div>
      <span className="cc-chip" aria-hidden="true" />
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
