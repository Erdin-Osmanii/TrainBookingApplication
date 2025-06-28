import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import {
  ValidateScheduleDto,
  GetScheduleDetailsDto,
  ScheduleDetailsResponseDto,
} from '../bookings/dto/microservice.dto';

@Injectable()
export class TrainClient {
  private readonly logger = new Logger(TrainClient.name);
  private readonly client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 4002, // TCP port for train-ms
      },
    });
  }

  async validateSchedule(scheduleId: number): Promise<any> {
    try {
      this.logger.log(`Validating schedule ${scheduleId}`);

      const payload: ValidateScheduleDto = { scheduleId };
      const result = await this.client
        .send({ cmd: 'validate-schedule' }, payload)
        .toPromise();

      this.logger.log(`Successfully validated schedule ${scheduleId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to validate schedule: ${error.message}`);
      throw new HttpException(error.message || 'Schedule not found', 404);
    }
  }

  async getScheduleDetails(
    scheduleId: number,
  ): Promise<ScheduleDetailsResponseDto> {
    try {
      this.logger.log(`Getting schedule details for schedule ${scheduleId}`);

      const payload: GetScheduleDetailsDto = { scheduleId };
      const result = await this.client
        .send<ScheduleDetailsResponseDto>(
          { cmd: 'get-schedule-details' },
          payload,
        )
        .toPromise();

      if (!result) {
        throw new HttpException('Schedule not found', 404);
      }

      this.logger.log(
        `Successfully retrieved schedule details for schedule ${scheduleId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to get schedule details: ${error.message}`);
      throw new HttpException(error.message || 'Schedule not found', 404);
    }
  }

  async getTrainDetails(trainId: number): Promise<any> {
    try {
      this.logger.log(`Getting train details for train ${trainId}`);

      const result = await this.client
        .send({ cmd: 'get-train-details' }, { trainId })
        .toPromise();

      this.logger.log(
        `Successfully retrieved train details for train ${trainId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to get train details: ${error.message}`);
      throw new HttpException(error.message || 'Train not found', 404);
    }
  }
}
