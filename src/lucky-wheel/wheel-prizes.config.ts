// Weighted prize pool. Weights don't need to sum to 100 — they're relative.
export interface WheelPrize {
  coins: number;
  weight: number;
}

export const WHEEL_PRIZES: WheelPrize[] = [
  { coins: 5, weight: 35 },
  { coins: 10, weight: 25 },
  { coins: 20, weight: 20 },
  { coins: 50, weight: 10 },
  { coins: 100, weight: 7 },
  { coins: 1000, weight: 2 },
  { coins: 5000, weight: 1 },
];

export const PAID_SPIN_COST_COINS = 20;

export function drawPrize(): WheelPrize {
  const totalWeight = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const prize of WHEEL_PRIZES) {
    if (roll < prize.weight) return prize;
    roll -= prize.weight;
  }
  return WHEEL_PRIZES[0]; // fallback, should not happen
}
