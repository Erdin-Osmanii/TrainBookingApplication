import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import {
  ValidateUserDto,
  ValidateUserResponseDto,
} from '../bookings/dto/microservice.dto';

@Injectable()
export class UserClient {
  private readonly logger = new Logger(UserClient.name);
  private readonly client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 4001, // TCP port for user-ms
      },
    });
  }

  async validateUser(userId: number): Promise<ValidateUserResponseDto> {
    try {
      this.logger.log(`Validating user ${userId}`);

      const payload: ValidateUserDto = { userId };
      const result = await this.client
        .send<ValidateUserResponseDto>({ cmd: 'validate-user' }, payload)
        .toPromise();

      if (!result) {
        throw new HttpException('User not found', 404);
      }

      this.logger.log(`Successfully validated user ${userId}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to validate user: ${errorMessage}`);
      throw new HttpException(errorMessage || 'User not found', 404);
    }
  }

  async getUserDetails(userId: number): Promise<ValidateUserResponseDto> {
    try {
      this.logger.log(`Getting user details for user ${userId}`);

      const payload: ValidateUserDto = { userId };
      const result = await this.client
        .send<ValidateUserResponseDto>({ cmd: 'get-user-details' }, payload)
        .toPromise();

      if (!result) {
        throw new HttpException('User not found', 404);
      }

      this.logger.log(`Successfully retrieved user details for user ${userId}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get user details: ${errorMessage}`);
      throw new HttpException(errorMessage || 'User not found', 404);
    }
  }
}
