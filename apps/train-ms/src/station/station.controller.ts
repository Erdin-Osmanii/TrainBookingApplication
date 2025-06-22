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
import { StationService } from './station.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';

@Controller('stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  // Public endpoints (no authentication required)
  @Get()
  findAll() {
    return this.stationService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.stationService.searchStations(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationService.findOne(Number(id));
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.stationService.findByCode(code);
  }

  // Internal service communication endpoints (no authentication required)
  @Get('internal/validate/:id')
  validateStation(@Param('id') id: string) {
    return this.stationService.validateStation(Number(id));
  }

  @Get('internal/details/:id')
  getStationDetails(@Param('id') id: string) {
    return this.stationService.getStationDetails(Number(id));
  }

  // Admin-only endpoints (require ADMIN role)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationService.create(createStationDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateStationDto: UpdateStationDto) {
    return this.stationService.update(Number(id), updateStationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.stationService.remove(Number(id));
  }
}
