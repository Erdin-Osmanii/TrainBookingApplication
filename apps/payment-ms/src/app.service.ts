import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Payment Microservice is running!';
  }

  getHealth(): { status: string; service: string } {
    return {
      status: 'healthy',
      service: 'payment-ms',
    };
  }
} 