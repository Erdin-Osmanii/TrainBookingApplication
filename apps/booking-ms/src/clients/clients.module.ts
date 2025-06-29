import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryClient } from './inventory.client';
import { TrainClient } from './train.client';
import { UserClient } from './user.client';
import { PaymentClient } from './payment.client';

@Module({
  imports: [ConfigModule],
  providers: [InventoryClient, TrainClient, UserClient, PaymentClient],
  exports: [InventoryClient, TrainClient, UserClient, PaymentClient],
})
export class ClientsModule {}
