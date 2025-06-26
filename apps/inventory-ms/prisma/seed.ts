import { PrismaClient, SeatStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Read the train seed data JSON
  const dataPath = path.resolve(
    __dirname,
    '../../train-ms/prisma/train-seed-data.json',
  );
  const trainSeedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as {
    trainId: number;
    scheduleId: number;
    seats: string[];
  }[];

  for (const entry of trainSeedData) {
    const { trainId, scheduleId, seats } = entry;
    for (const seatNumber of seats) {
      await prisma.seat.create({
        data: {
          seatNumber,
          scheduleId,
          trainId,
          status: SeatStatus.AVAILABLE,
        },
      });
    }
  }
  console.log('Seats seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
