// Categories roll up into a few spend groups for the analysis view.
export type Group = 'Essentials' | 'Home & bills' | 'Shopping' | 'Lifestyle' | 'Finance' | 'Other';

export const GROUPS: Group[] = ['Essentials', 'Home & bills', 'Shopping', 'Lifestyle', 'Finance', 'Other'];

// Order here is the order shown when picking a category.
const CATEGORY_GROUP: Record<string, Group> = {
  Food: 'Essentials',
  Groceries: 'Essentials',
  Fuel: 'Essentials',
  Clothes: 'Shopping',
  Entertainment: 'Lifestyle',
  Travel: 'Lifestyle',
  Restaurants: 'Lifestyle',
  'Online shopping': 'Shopping',
  'Offline shopping': 'Shopping',
  Health: 'Essentials',
  Loans: 'Finance',
  Insurance: 'Finance',
  Fees: 'Finance',
  Others: 'Other',
};

// Categories from earlier versions. They stay mapped so older payments keep their group.
const LEGACY_GROUP: Record<string, Group> = {
  Bills: 'Home & bills',
  Shopping: 'Shopping',
  Dining: 'Lifestyle',
  'EMI & loans': 'Finance',
  Other: 'Other',
};

export const CATEGORIES = Object.keys(CATEGORY_GROUP);

export function groupOf(category: string): Group {
  return CATEGORY_GROUP[category] ?? LEGACY_GROUP[category] ?? 'Other';
}

export const GROUP_COLOR: Record<Group, string> = {
  Essentials: '#22c55e',
  'Home & bills': '#3b82f6',
  Shopping: '#f97316',
  Lifestyle: '#ec4899',
  Finance: '#8b5cf6',
  Other: '#94a3b8',
};
