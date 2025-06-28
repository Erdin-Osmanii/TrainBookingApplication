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
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Public endpoints (no authentication required)
  @Get()
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.scheduleService.searchSchedules(query);
  }

  @Get('routes')
  getAvailableRoutes() {
    return this.scheduleService.getAvailableRoutes();
  }

  @Get('date/:date')
  getSchedulesByDate(@Param('date') date: string) {
    return this.scheduleService.getSchedulesByDate(date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(Number(id));
  }

  // Internal service communication endpoints (no authentication required)
  @Get('internal/validate-route')
  validateRoute(
    @Query('departureStationId') departureStationId: string,
    @Query('arrivalStationId') arrivalStationId: string,
  ) {
    return this.scheduleService.validateRoute(
      Number(departureStationId),
      Number(arrivalStationId),
    );
  }

  @Get('internal/route-schedules')
  getRouteSchedules(
    @Query('departureStationId') departureStationId: string,
    @Query('arrivalStationId') arrivalStationId: string,
    @Query('date') date?: string,
  ) {
    return this.scheduleService.getRouteSchedules(
      Number(departureStationId),
      Number(arrivalStationId),
      date,
    );
  }

  @Get('internal/schedule/:id')
  getScheduleDetails(@Param('id') id: string) {
    return this.scheduleService.findOne(Number(id));
  }

  // Admin-only endpoints (require ADMIN role)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(Number(id), updateScheduleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(Number(id));
  }

  // TCP endpoints for internal microservice communication
  @MessagePattern({ cmd: 'validate-route' })
  async validateRouteTcp(
    @Payload() data: { departureStationId: number; arrivalStationId: number },
  ) {
    return this.scheduleService.validateRoute(
      data.departureStationId,
      data.arrivalStationId,
    );
  }

  @MessagePattern({ cmd: 'get-route-schedules' })
  async getRouteSchedulesTcp(
    @Payload()
    data: {
      departureStationId: number;
      arrivalStationId: number;
      date?: string;
    },
  ) {
    return this.scheduleService.getRouteSchedules(
      data.departureStationId,
      data.arrivalStationId,
      data.date,
    );
  }

  @MessagePattern({ cmd: 'get-schedule-details' })
  async getScheduleDetailsTcp(@Payload() data: { scheduleId: number }) {
    return this.scheduleService.findOne(data.scheduleId);
  }

  @MessagePattern({ cmd: 'validate-schedule' })
  async validateScheduleTcp(@Payload() data: { scheduleId: number }) {
    return this.scheduleService.findOne(data.scheduleId);
  }
}
