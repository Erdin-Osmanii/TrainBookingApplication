import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryClient } from './inventory.client';
import { TrainClient } from './train.client';
import { UserClient } from './user.client';

@Module({
  imports: [ConfigModule],
  providers: [InventoryClient, TrainClient, UserClient],
  exports: [InventoryClient, TrainClient, UserClient],
})
export class ClientsModule {}
