import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import {
  HoldSeatsDto,
  HoldSeatsResponseDto,
  ConfirmSeatsDto,
  ReleaseSeatsDto,
  ReleaseReservedSeatsDto,
  ReleaseSeatsResponseDto,
} from '../bookings/dto/microservice.dto';

@Injectable()
export class InventoryClient {
  private readonly logger = new Logger(InventoryClient.name);
  private readonly client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 4003, // TCP port for inventory-ms
      },
    });
  }

  async holdSeats(data: HoldSeatsDto): Promise<HoldSeatsResponseDto[]> {
    try {
      this.logger.log(
        `Holding seats for schedule ${data.scheduleId}, seats: ${data.seatIds.join(', ')}`,
      );

      const result = await this.client
        .send<HoldSeatsResponseDto[]>({ cmd: 'hold-seats' }, data)
        .toPromise();

      if (!result) {
        throw new HttpException('Failed to hold seats', 400);
      }

      this.logger.log(
        `Successfully held seats, hold IDs: ${result.map((h) => h.id).join(', ')}`,
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to hold seats: ${errorMessage}`);
      throw new HttpException(errorMessage || 'Failed to hold seats', 400);
    }
  }

  async confirmSeats(data: ConfirmSeatsDto): Promise<{ message: string }> {
    try {
      this.logger.log(`Confirming seats for hold ${data.holdId}`);

      const result = await this.client
        .send<{ message: string }>({ cmd: 'confirm-seats' }, data)
        .toPromise();

      this.logger.log(`Successfully confirmed seats for hold ${data.holdId}`);
      return result || { message: 'Seats confirmed successfully' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to confirm seats: ${errorMessage}`);
      throw new HttpException(errorMessage || 'Failed to confirm seats', 400);
    }
  }

  async releaseSeats(data: ReleaseSeatsDto): Promise<ReleaseSeatsResponseDto> {
    try {
      this.logger.log(`Releasing seats for hold ${data.holdId}`);

      const result = await this.client
        .send<ReleaseSeatsResponseDto>({ cmd: 'release-seats' }, data)
        .toPromise();

      if (!result) {
        throw new HttpException('Failed to release seats', 400);
      }

      this.logger.log(`Successfully released seats for hold ${data.holdId}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to release seats: ${errorMessage}`);
      throw new HttpException(errorMessage || 'Failed to release seats', 400);
    }
  }

  async releaseReservedSeats(
    dto: ReleaseReservedSeatsDto,
  ): Promise<ReleaseSeatsResponseDto> {
    try {
      this.logger.log(`Releasing reserved seat ${dto.seatId}`);

      const result = await this.client
        .send<ReleaseSeatsResponseDto>({ cmd: 'release-reserved-seats' }, dto)
        .toPromise();

      if (!result) {
        throw new HttpException('Failed to release reserved seat', 400);
      }

      this.logger.log(`Successfully released reserved seat ${dto.seatId}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to release reserved seat: ${errorMessage}`);
      throw new HttpException(
        errorMessage || 'Failed to release reserved seat',
        400,
      );
    }
  }

  async getSeatDetails(
    seatIds: string[],
  ): Promise<{ id: string; seatNumber: string }[]> {
    try {
      this.logger.log(`Getting seat details for ${seatIds.length} seats`);

      const result = await this.client
        .send<
          { id: string; seatNumber: string }[]
        >({ cmd: 'get-seat-details' }, { seatIds })
        .toPromise();

      this.logger.log(
        `Successfully retrieved seat details for ${seatIds.length} seats`,
      );
      return result || [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get seat details: ${errorMessage}`);
      throw new HttpException(
        errorMessage || 'Failed to get seat details',
        400,
      );
    }
  }
}
