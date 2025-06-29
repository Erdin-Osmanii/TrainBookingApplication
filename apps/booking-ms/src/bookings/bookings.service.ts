import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { GetBookingDto } from './dto/get-booking.dto';
import {
  BookingResponseDto,
  UserBookingsResponseDto,
  BookingWithScheduleDto,
} from './dto/booking-response.dto';
import { InventoryClient } from '../clients/inventory.client';
import { TrainClient } from '../clients/train.client';
import { UserClient } from '../clients/user.client';
import { PaymentClient } from '../clients/payment.client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingEntityDto, BookingStatus } from './dto/booking-entity.dto';

interface HoldResult {
  id: string;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly inventoryClient: InventoryClient,
    private readonly trainClient: TrainClient,
    private readonly userClient: UserClient,
    private readonly paymentClient: PaymentClient,
    private readonly prisma: PrismaService,
  ) {}

  async createBooking(
    dto: CreateBookingDto,
    user: { id: number },
  ): Promise<BookingResponseDto> {
    this.logger.log(
      `Creating booking for user ${user.id}, schedule ${dto.scheduleId}`,
    );

    try {
      // 1. Validate user exists
      await this.userClient.validateUser(user.id);

      // 2. Validate schedule exists
      await this.trainClient.validateSchedule(dto.scheduleId);

      // 3. Hold seats in inventory-ms
      const holdResult = (await this.inventoryClient.holdSeats({
        scheduleId: dto.scheduleId,
        seatIds: dto.seatIds,
        userId: user.id.toString(),
      })) as HoldResult[];

      // 4. Create booking record with PENDING status in database
      const booking = (await this.prisma.booking.create({
        data: {
          userId: user.id.toString(),
          scheduleId: dto.scheduleId,
          seatIds: dto.seatIds,
          status: BookingStatus.PENDING,
          holdIds: holdResult.map((hold: HoldResult) => hold.id),
          notes: dto.notes,
        },
      })) as BookingEntityDto;

      this.logger.log(
        `Successfully created booking ${booking.id} with status PENDING`,
      );

      return {
        bookingId: booking.id,
        status: booking.status,
        holdIds: booking.holdIds,
        message: 'Booking created successfully. Seats are held for 15 minutes.',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create booking: ${errorMessage}`);
      throw error;
    }
  }

  async confirmBooking(
    dto: ConfirmBookingDto,
    user: { id: number },
  ): Promise<BookingResponseDto> {
    this.logger.log(`Confirming booking ${dto.bookingId} for user ${user.id}`);

    try {
      // 1. Find and validate booking
      const booking = (await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      })) as BookingEntityDto | null;

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId !== user.id.toString()) {
        throw new ForbiddenException('You can only confirm your own bookings');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Booking is not in pending status');
      }

      // 2. Get schedule price from train-ms
      const schedulePrice = await this.trainClient.getSchedulePrice(
        booking.scheduleId,
      );

      // 3. Validate payment amount
      if (dto.amount < schedulePrice) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) must be at least the schedule price (${schedulePrice})`,
        );
      }

      // 4. Process payment with credit card details
      const paymentData = {
        bookingId: dto.bookingId,
        userId: user.id.toString(),
        amount: schedulePrice, // Only charge the schedule price
        cardNumber: dto.cardNumber,
        expiryMonth: dto.expiryMonth,
        expiryYear: dto.expiryYear,
        cvc: dto.cvc,
        zipCode: dto.zipCode,
      };

      const paymentResult =
        await this.paymentClient.processPayment(paymentData);

      if (!paymentResult.success) {
        throw new BadRequestException(
          `Payment failed: ${paymentResult.message}`,
        );
      }

      // 5. Confirm seats in inventory-ms
      for (const holdId of booking.holdIds) {
        const confirmSeatsResult = await this.inventoryClient.confirmSeats({
          holdId,
          bookingId: dto.bookingId,
        });

        if (!confirmSeatsResult) {
          throw new BadRequestException(
            `Seat confirmation failed for hold ${holdId}`,
          );
        }
      }

      // 6. Update booking status to CONFIRMED
      const updatedBooking = (await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      })) as BookingEntityDto;

      this.logger.log(`Booking ${dto.bookingId} confirmed successfully`);

      return {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        holdIds: [],
        message: 'Booking confirmed successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to confirm booking: ${errorMessage}`);
      throw error;
    }
  }

  async cancelBooking(
    dto: CancelBookingDto,
    user: { id: number },
  ): Promise<BookingResponseDto> {
    this.logger.log(`Cancelling booking ${dto.bookingId} for user ${user.id}`);

    try {
      // 1. Find and validate booking
      const booking = (await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      })) as BookingEntityDto | null;

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId !== user.id.toString()) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking is already cancelled');
      }

      // 2. Release seats if they are still held (PENDING status)
      if (booking.status === BookingStatus.PENDING) {
        for (const holdId of booking.holdIds) {
          await this.inventoryClient.releaseSeats({ holdId });
        }
      } else if (booking.status === BookingStatus.CONFIRMED) {
        // 3. If booking is confirmed, we need to release the reserved seats
        for (const seatId of booking.seatIds) {
          await this.inventoryClient.releaseReservedSeats({ seatId });
        }

        // 4. Process refund for confirmed booking
        const refundResult = await this.paymentClient.processRefund(
          dto.bookingId,
          user.id.toString(),
        );

        if (!refundResult.success) {
          this.logger.warn(
            `Refund failed for booking ${dto.bookingId}: ${refundResult.message}`,
          );
          // Continue with cancellation even if refund fails
        } else {
          this.logger.log(
            `Refund successful for booking ${dto.bookingId}: ${refundResult.paymentId}`,
          );
        }
      }

      // 5. Update booking status to CANCELLED
      const updatedBooking = (await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      })) as BookingEntityDto;

      this.logger.log(`Successfully cancelled booking ${dto.bookingId}`);

      return {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        holdIds: [],
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to cancel booking: ${errorMessage}`);
      throw error;
    }
  }

  async getUserBookings(user: {
    id: number;
  }): Promise<UserBookingsResponseDto> {
    this.logger.log(`Getting bookings for user ${user.id}`);

    try {
      const bookings = (await this.prisma.booking.findMany({
        where: { userId: user.id.toString() },
        orderBy: { createdAt: 'desc' },
      })) as BookingEntityDto[];

      // Get seat details for all bookings
      const bookingsWithSeats = await Promise.all(
        bookings.map(async (booking) => {
          const seatDetails = await this.inventoryClient.getSeatDetails(
            booking.seatIds,
          );
          return {
            id: booking.id,
            scheduleId: booking.scheduleId,
            seats: seatDetails,
            status: booking.status,
            notes: booking.notes || undefined,
            createdAt: booking.createdAt,
            confirmedAt: booking.confirmedAt || undefined,
            cancelledAt: booking.cancelledAt || undefined,
          };
        }),
      );

      return {
        bookings: bookingsWithSeats,
        count: bookings.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get user bookings: ${errorMessage}`);
      throw error;
    }
  }

  async getBookingById(
    dto: GetBookingDto,
    user: { id: number },
  ): Promise<BookingWithScheduleDto> {
    this.logger.log(`Getting booking ${dto.bookingId} for user ${user.id}`);

    try {
      // 1. Find booking
      const booking = (await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      })) as BookingEntityDto | null;

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId !== user.id.toString()) {
        throw new ForbiddenException('You can only view your own bookings');
      }

      // 2. Get seat details from inventory-ms
      const seatDetails = await this.inventoryClient.getSeatDetails(
        booking.seatIds,
      );

      // 3. Get schedule details from train-ms
      const scheduleDetails = await this.trainClient.getScheduleDetails(
        booking.scheduleId,
      );

      return {
        id: booking.id,
        scheduleId: booking.scheduleId,
        seats: seatDetails,
        status: booking.status,
        notes: booking.notes || undefined,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt || undefined,
        cancelledAt: booking.cancelledAt || undefined,
        schedule: {
          origin: scheduleDetails.departureStation.name,
          destination: scheduleDetails.arrivalStation.name,
          departureTime: new Date(scheduleDetails.departureTime),
          arrivalTime: new Date(scheduleDetails.arrivalTime),
          trainNumber: scheduleDetails.train.trainNumber,
          trainName: scheduleDetails.train.name,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get booking: ${errorMessage}`);
      throw error;
    }
  }

  async getBookingByIdInternal(bookingId: string): Promise<BookingEntityDto> {
    this.logger.log(`Getting booking ${bookingId} for internal processing`);

    try {
      const booking = (await this.prisma.booking.findUnique({
        where: { id: bookingId },
      })) as BookingEntityDto | null;

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      return booking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get booking for internal processing: ${errorMessage}`,
      );
      throw error;
    }
  }
}
