import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TrainService } from './train.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('trains')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  // Public endpoints (no authentication required)
  @Get()
  findAll() {
    return this.trainService.findAll();
  }

  @Get('active')
  getActiveTrains() {
    return this.trainService.getActiveTrains();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.trainService.searchTrains(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainService.findOne(Number(id));
  }

  @Get('number/:trainNumber')
  findByNumber(@Param('trainNumber') trainNumber: string) {
    return this.trainService.findByNumber(trainNumber);
  }

  @Get(':id/schedules')
  getTrainSchedules(@Param('id') id: string) {
    return this.trainService.getTrainSchedules(Number(id));
  }

  // Internal service communication endpoints (no authentication required)
  @Get('internal/validate/:id')
  validateTrain(@Param('id') id: string) {
    return this.trainService.validateTrain(Number(id));
  }

  @Get('internal/details/:id')
  getTrainDetails(@Param('id') id: string) {
    return this.trainService.getTrainDetails(Number(id));
  }

  // Admin-only endpoints (require ADMIN role)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createTrainDto: CreateTrainDto) {
    return this.trainService.create(createTrainDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateTrainDto: UpdateTrainDto) {
    return this.trainService.update(Number(id), updateTrainDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.trainService.remove(Number(id));
  }

  // TCP endpoints for internal microservice communication
  @MessagePattern({ cmd: 'validate-train' })
  async validateTrainTcp(@Payload() data: { id: number }) {
    return this.trainService.validateTrain(data.id);
  }

  @MessagePattern({ cmd: 'get-train-details' })
  async getTrainDetailsTcp(@Payload() data: { trainId: number }) {
    return this.trainService.getTrainDetails(data.trainId);
  }

  @MessagePattern({ cmd: 'get-train-schedules' })
  async getTrainSchedulesTcp(@Payload() data: { id: number }) {
    return this.trainService.getTrainSchedules(data.id);
  }

  @MessagePattern({ cmd: 'get-train-by-number' })
  async getTrainByNumberTcp(@Payload() data: { trainNumber: string }) {
    return this.trainService.findByNumber(data.trainNumber);
  }
}
