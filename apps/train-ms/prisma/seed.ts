import {
  PrismaClient,
  TrainType,
  TrainStatus,
  ScheduleStatus,
} from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  //If needed, uncomment the following lines to clear existing data
  // await prisma.schedule.deleteMany();
  // await prisma.train.deleteMany();
  // await prisma.station.deleteMany();

  // Create stations
  const pristina = await prisma.station.create({
    data: {
      name: 'Prishtina Railway Station',
      code: 'PRN',
      city: 'Prishtina',
      state: 'District of Prishtina',
      country: 'Kosovo',
      latitude: 42.6629,
      longitude: 21.1655,
    },
  });

  const peja = await prisma.station.create({
    data: {
      name: 'Peja Station',
      code: 'PEJ',
      city: 'Peja',
      state: 'District of Peja',
      country: 'Kosovo',
      latitude: 42.66,
      longitude: 20.2883,
    },
  });

  const ferizaj = await prisma.station.create({
    data: {
      name: 'Ferizaj Station',
      code: 'FRZ',
      city: 'Ferizaj',
      state: 'District of Ferizaj',
      country: 'Kosovo',
      latitude: 42.3706,
      longitude: 21.155,
    },
  });

  // Create trains
  const train1 = await prisma.train.create({
    data: {
      trainNumber: 'KS1001',
      name: 'Kosova Express',
      type: TrainType.EXPRESS,
      capacity: 180,
      status: TrainStatus.ACTIVE,
    },
  });

  const train2 = await prisma.train.create({
    data: {
      trainNumber: 'KS2001',
      name: 'Balkan Line',
      type: TrainType.LOCAL,
      capacity: 120,
      status: TrainStatus.ACTIVE,
    },
  });

  // Create schedules
  await prisma.schedule.create({
    data: {
      trainId: train1.id,
      departureStationId: pristina.id,
      arrivalStationId: peja.id,
      departureTime: new Date('2025-06-23T07:30:00Z'),
      arrivalTime: new Date('2025-06-23T09:00:00Z'),
      duration: 90,
      price: 4.5,
      status: ScheduleStatus.ACTIVE,
    },
  });

  await prisma.schedule.create({
    data: {
      trainId: train2.id,
      departureStationId: ferizaj.id,
      arrivalStationId: pristina.id,
      departureTime: new Date('2025-06-23T10:00:00Z'),
      arrivalTime: new Date('2025-06-23T11:00:00Z'),
      duration: 60,
      price: 3.0,
      status: ScheduleStatus.ACTIVE,
    },
  });
}

main()
  .then(async () => {
    // Fetch all trains and their schedules
    const trains = await prisma.train.findMany({
      include: { schedules: true },
    });

    // Generate seat data for each schedule
    const output: { trainId: number; scheduleId: number; seats: string[] }[] =
      [];
    for (const train of trains) {
      for (const schedule of train.schedules) {
        // Example: 2 coaches (A, B), 10 seats each
        const seats: string[] = [];
        ['A', 'B'].forEach((coach) => {
          for (let i = 1; i <= 10; i++) {
            seats.push(`${i}${coach}`);
          }
        });
        output.push({
          trainId: train.id,
          scheduleId: schedule.id,
          seats,
        });
      }
    }

    fs.writeFileSync(
      __dirname + '/train-seed-data.json',
      JSON.stringify(output, null, 2),
    );
    console.log(
      'Seeding completed successfully and train-seed-data.json written',
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
