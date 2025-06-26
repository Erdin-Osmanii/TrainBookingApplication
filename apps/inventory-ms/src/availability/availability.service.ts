import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeatAvailability(scheduleId: number) {
    return this.prisma.seat.findMany({
      where: { scheduleId },
      select: {
        id: true,
        seatNumber: true,
        status: true,
      },
    });
  }
}
