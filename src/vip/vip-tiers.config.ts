// Static VIP tier table — per blueprint's "VIP 1-10" benefits list.
// Move to an admin-editable DB table if pricing needs to change without a deploy.
export interface VipTier {
  level: number;
  name: string;
  coinPrice: number; // price for a 30-day membership at this level
  perks: string[];
}

export const VIP_TIERS: VipTier[] = [
  { level: 1, name: 'VIP 1', coinPrice: 5000, perks: ['Profile badge'] },
  { level: 2, name: 'VIP 2', coinPrice: 10000, perks: ['Profile badge', 'Name colour'] },
  { level: 3, name: 'VIP 3', coinPrice: 20000, perks: ['Profile badge', 'Name colour', 'Animated entry'] },
  { level: 4, name: 'VIP 4', coinPrice: 35000, perks: ['+ Exclusive gifts'] },
  { level: 5, name: 'VIP 5', coinPrice: 55000, perks: ['+ Higher daily rewards'] },
  { level: 6, name: 'VIP 6', coinPrice: 80000, perks: ['+ Premium support'] },
  { level: 7, name: 'VIP 7', coinPrice: 110000, perks: ['+ Priority in gift rankings'] },
  { level: 8, name: 'VIP 8', coinPrice: 150000, perks: ['+ Exclusive entry animation'] },
  { level: 9, name: 'VIP 9', coinPrice: 200000, perks: ['+ Bigger daily bonus'] },
  { level: 10, name: 'VIP 10', coinPrice: 300000, perks: ['All perks + top badge'] },
];

export const VIP_MEMBERSHIP_DURATION_DAYS = 30;
