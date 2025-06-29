import { Module } from '@nestjs/common';
import { BookingClient } from './booking.client';

@Module({
  providers: [BookingClient],
  exports: [BookingClient],
})
export class ClientsModule {} 