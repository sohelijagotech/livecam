/**
 * Run once after first migration to populate an initial gift catalog.
 * Usage: ts-node src/seed/seed-gifts.ts
 */
import dataSource from '../config/typeorm.config';
import { Gift } from '../gifts/entities/gift.entity';

const GIFTS = [
  { name: 'Rose', coinPrice: 10 },
  { name: 'Heart', coinPrice: 50 },
  { name: 'Sports Car', coinPrice: 5000 },
  { name: 'Crown', coinPrice: 20000 },
  { name: 'Rocket', coinPrice: 100000 },
];

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Gift);

  for (const g of GIFTS) {
    const existing = await repo.findOne({ where: { name: g.name } });
    if (!existing) {
      await repo.save(repo.create({ ...g, active: true }));
      console.log(`Seeded gift: ${g.name}`);
    }
  }

  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
