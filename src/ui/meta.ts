import {
  Activity,
  Apple,
  BadgePercent,
  Banknote,
  Building2,
  Circle,
  Clapperboard,
  Coins,
  ChefHat,
  CreditCard,
  Fuel,
  HeartPulse,
  House,
  Landmark,
  Lock,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { SourceKind } from '../data/types';

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  Food: Apple,
  Groceries: ShoppingBasket,
  Fuel: Fuel,
  Clothes: Shirt,
  Entertainment: Clapperboard,
  Travel: Plane,
  Restaurants: UtensilsCrossed,
  'Online shopping': ShoppingCart,
  'Offline shopping': ShoppingBag,
  Health: HeartPulse,
  Loans: Landmark,
  Insurance: ShieldCheck,
  Fees: BadgePercent,
  Others: Circle,
  // Earlier names, kept so older payments still show an icon.
  Bills: Receipt,
  Shopping: ShoppingBag,
  Dining: UtensilsCrossed,
  'EMI & loans': Landmark,
  Other: Circle,
};

export const KIND_ICON: Record<SourceKind, LucideIcon> = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  bank_account: Building2,
  upi: Smartphone,
  cash: Banknote,
};

export const PLAN_ICON: Record<string, LucideIcon> = {
  PPF: PiggyBank,
  NPS: Sprout,
  'Mutual fund': TrendingUp,
  Stocks: Activity,
  'FD / RD': Lock,
  Gold: Coins,
  Other: Target,
};

// Bills are matched by name, so "Electricity bill" and "Electricity" both get the bolt.
const BILL_ICON_BY_WORD: [string, LucideIcon][] = [
  ['rent', House],
  ['cook', ChefHat],
  ['maid', Sparkles],
  ['electric', Zap],
  ['phone', Smartphone],
  ['internet', Wifi],
];

export function billIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  return BILL_ICON_BY_WORD.find(([word]) => lower.includes(word))?.[1] ?? Receipt;
}
