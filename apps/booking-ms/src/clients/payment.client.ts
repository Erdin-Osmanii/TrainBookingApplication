import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export interface CreatePaymentDto {
  bookingId: string;
  userId: string;
  amount: number;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  zipCode?: string;
}

export interface PaymentResponseDto {
  success: boolean;
  message: string;
  paymentId: string;
  bookingId: string;
  amount: number;
  status: string;
}

export interface RefundPaymentDto {
  bookingId: string;
  userId: string;
}

@Injectable()
export class PaymentClient {
  private readonly logger = new Logger(PaymentClient.name);
  private readonly client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 4005, // TCP port for payment-ms
      },
    });
  }

  async processPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      this.logger.log(
        `Sending payment request to payment-ms for booking ${createPaymentDto.bookingId}`,
      );

      const response = await firstValueFrom(
        this.client.send<PaymentResponseDto>(
          { cmd: 'process-payment' },
          createPaymentDto,
        ),
      );

      this.logger.log(
        `Payment response received for booking ${createPaymentDto.bookingId}: ${response.success}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error processing payment for booking ${createPaymentDto.bookingId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async processRefund(
    bookingId: string,
    userId: string,
  ): Promise<PaymentResponseDto> {
    try {
      this.logger.log(
        `Sending refund request to payment-ms for booking ${bookingId}`,
      );

      const response = await firstValueFrom(
        this.client.send<PaymentResponseDto>(
          { cmd: 'process-refund' },
          {
            bookingId,
            userId,
          },
        ),
      );

      this.logger.log(
        `Refund response received for booking ${bookingId}: ${response.success}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error processing refund for booking ${bookingId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
