import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import { ConfirmSeatsDto } from './dto/confirm-seats.dto';
import { ReleaseSeatsDto } from './dto/release-seats.dto';
import { SeatStatus, SeatHold } from '@prisma/client';

const HOLD_DURATION_MINUTES = 15;

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async holdSeats(holdSeatsDto: HoldSeatsDto) {
    const { scheduleId, seatIds, userId } = holdSeatsDto;

    return this.prisma.$transaction(async (tx) => {
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          scheduleId: scheduleId,
          status: SeatStatus.AVAILABLE,
        },
      });

      if (seats.length !== seatIds.length) {
        throw new BadRequestException('Some seats are not available.');
      }

      const expiresAt = new Date(
        Date.now() + HOLD_DURATION_MINUTES * 60 * 1000,
      );

      // Create holds and return the created records
      const createdHolds = await Promise.all(
        seats.map((seat) =>
          tx.seatHold.create({
            data: {
              seatId: seat.id,
              userId,
              expiresAt,
            },
          }),
        ),
      );

      await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
        },
        data: {
          status: SeatStatus.HELD,
        },
      });

      return createdHolds;
    });
  }

  async confirmSeats(confirmSeatsDto: ConfirmSeatsDto) {
    const { holdId } = confirmSeatsDto;

    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.seatHold.findUnique({
        where: { id: holdId },
        include: { seat: true },
      });

      if (!hold) {
        throw new NotFoundException('Seat hold not found.');
      }

      const reservation = await tx.reservation.create({
        data: {
          seatId: hold.seatId,
          userId: hold.userId,
          bookingId: `booking_${new Date().getTime()}`, // Example booking ID
        },
      });

      await tx.seat.update({
        where: { id: hold.seatId },
        data: { status: SeatStatus.RESERVED },
      });

      await tx.seatHold.delete({ where: { id: holdId } });

      return reservation;
    });
  }

  async releaseSeats(releaseSeatsDto: ReleaseSeatsDto) {
    const { holdId } = releaseSeatsDto;

    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.seatHold.findUnique({
        where: { id: holdId },
      });

      if (!hold) {
        throw new NotFoundException('Seat hold not found.');
      }

      await tx.seat.update({
        where: { id: hold.seatId },
        data: { status: SeatStatus.AVAILABLE },
      });

      await tx.seatHold.delete({ where: { id: holdId } });

      return { message: 'Seat released successfully.' };
    });
  }

  // Admin: Add a seat
  async createSeat({
    seatNumber,
    scheduleId,
    trainId,
  }: {
    seatNumber: string;
    scheduleId: number;
    trainId: number;
  }) {
    return this.prisma.seat.create({
      data: {
        seatNumber,
        scheduleId,
        trainId,
        status: SeatStatus.AVAILABLE,
      },
    });
  }

  // Admin: Remove a seat
  async removeSeat(seatId: string) {
    return this.prisma.seat.delete({
      where: { id: seatId },
    });
  }

  // Get hold(s) by seatId (or seatIds)
  async getHoldBySeatId(seatId: string): Promise<SeatHold[]> {
    return this.prisma.seatHold.findMany({
      where: { seatId },
    });
  }
}
