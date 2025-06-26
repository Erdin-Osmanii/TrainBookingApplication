import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SeatStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running cron job to release expired seat holds');

    const expiredHolds = await this.prisma.seatHold.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
      include: {
        seat: true,
      },
    });

    if (expiredHolds.length === 0) {
      this.logger.debug('No expired seat holds found.');
      return;
    }

    for (const hold of expiredHolds) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.seat.update({
            where: { id: hold.seatId },
            data: { status: SeatStatus.AVAILABLE },
          });
          await tx.seatHold.delete({ where: { id: hold.id } });
          this.logger.log(`Released hold for seat ${hold.seat.seatNumber}`);
        });
      } catch (error: unknown) {
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Failed to release hold for seat ${hold.seat.seatNumber}`,
          errorStack,
        );
      }
    }
  }
}
