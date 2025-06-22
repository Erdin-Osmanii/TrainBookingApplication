import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StationModule } from './station/station.module';
import { TrainModule } from './train/train.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    StationModule,
    TrainModule,
    ScheduleModule,
    AuthModule,
  ],
  exports: [
    PrismaModule,
    StationModule,
    TrainModule,
    ScheduleModule,
    AuthModule,
  ],
})
export class TrainMsModule {}
