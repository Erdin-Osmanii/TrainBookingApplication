import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrainMsModule } from './train.module';

@Module({
  imports: [TrainMsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
