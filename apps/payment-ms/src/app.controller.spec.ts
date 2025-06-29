import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Payment Microservice is running!"', () => {
      expect(appController.getHello()).toBe('Payment Microservice is running!');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const expectedHealth = {
        status: 'healthy',
        service: 'payment-ms',
      };
      expect(appController.getHealth()).toEqual(expectedHealth);
    });
  });
}); 