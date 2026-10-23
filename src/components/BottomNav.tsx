import { CalendarClock, LayoutDashboard, PiggyBank, ReceiptText, type LucideIcon } from 'lucide-react';

export type Tab = 'home' | 'payments' | 'bills' | 'savings';

interface BottomNavProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

const ITEMS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'payments', label: 'Payments', icon: ReceiptText },
  { id: 'bills', label: 'Bills', icon: CalendarClock },
  { id: 'savings', label: 'Savings', icon: PiggyBank },
];

export function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <div className="nav-pill">
        {ITEMS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} className={`nav-item${active ? ' active' : ''}`} onClick={() => onChange(t.id)} aria-label={t.label}>
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
