import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

export interface ConfirmBookingDto {
  bookingId: string;
}

export interface CancelBookingDto {
  bookingId: string;
}

export interface BookingResponseDto {
  success: boolean;
  message: string;
  bookingId?: string;
}

@Injectable()
export class BookingClient {
  private readonly logger = new Logger(BookingClient.name);
  private readonly client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 4004, // TCP port for booking-ms
      },
    });
  }

  async confirmBooking(data: ConfirmBookingDto): Promise<BookingResponseDto> {
    try {
      this.logger.log(`Confirming booking ${data.bookingId}`);

      const result = await this.client
        .send<BookingResponseDto>({ cmd: 'confirm-booking-internal' }, data)
        .toPromise();

      if (!result) {
        throw new HttpException('Failed to confirm booking', 400);
      }

      this.logger.log(`Successfully confirmed booking ${data.bookingId}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to confirm booking: ${errorMessage}`);
      throw new HttpException(errorMessage || 'Failed to confirm booking', 400);
    }
  }

  async cancelBooking(data: CancelBookingDto): Promise<BookingResponseDto> {
    try {
      this.logger.log(`Cancelling booking ${data.bookingId}`);

      const result = await this.client
        .send<BookingResponseDto>({ cmd: 'cancel-booking-internal' }, data)
        .toPromise();

      if (!result) {
        throw new HttpException('Failed to cancel booking', 400);
      }

      this.logger.log(`Successfully cancelled booking ${data.bookingId}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to cancel booking: ${errorMessage}`);
      throw new HttpException(errorMessage || 'Failed to cancel booking', 400);
    }
  }
} 