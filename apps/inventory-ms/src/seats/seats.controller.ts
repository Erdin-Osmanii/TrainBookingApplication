import {
  Controller,
  Body,
  Delete,
  Param,
  Post,
  UseGuards,
  Get,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SeatsService } from './seats.service';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import { ConfirmSeatsDto } from './dto/confirm-seats.dto';
import { ReleaseSeatsDto } from './dto/release-seats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { SeatHold } from '@prisma/client';
import { CreateSeatDto } from './dto/create-seat.dto';
import { RemoveSeatDto } from './dto/remove-seat.dto';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post('/hold')
  async holdSeatsHttp(@Body() holdSeatsDto: HoldSeatsDto) {
    return this.seatsService.holdSeats(holdSeatsDto);
  }

  @MessagePattern({ cmd: 'hold-seats' })
  holdSeats(@Payload() holdSeatsDto: HoldSeatsDto) {
    return this.seatsService.holdSeats(holdSeatsDto);
  }

  @Post('/confirm')
  async confirmSeatsHttp(@Body() confirmSeatsDto: ConfirmSeatsDto) {
    return this.seatsService.confirmSeats(confirmSeatsDto);
  }

  @MessagePattern({ cmd: 'confirm-seats' })
  confirmSeats(@Payload() confirmSeatsDto: ConfirmSeatsDto) {
    return this.seatsService.confirmSeats(confirmSeatsDto);
  }

  @Post('/release')
  async releaseSeatsHttp(@Body() releaseSeatsDto: ReleaseSeatsDto) {
    return this.seatsService.releaseSeats(releaseSeatsDto);
  }

  @MessagePattern({ cmd: 'release-seats' })
  releaseSeats(@Payload() releaseSeatsDto: ReleaseSeatsDto) {
    return this.seatsService.releaseSeats(releaseSeatsDto);
  }

  @Get('held-by-seat/:seatId')
  getHoldBySeatId(@Param('seatId') seatId: string): Promise<SeatHold[]> {
    return this.seatsService.getHoldBySeatId(seatId);
  }

  @MessagePattern({ cmd: 'get-held-by-seat-id' })
  getHoldBySeatIdTcp(@Payload() data: { seatId: string }): Promise<SeatHold[]> {
    return this.seatsService.getHoldBySeatId(data.seatId);
  }

  // Admin: Add a seat
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSeat(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createSeatDto: CreateSeatDto,
  ) {
    try {
      return await this.seatsService.createSeat(createSeatDto);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Admin: Remove a seat
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeSeat(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    removeSeatDto: RemoveSeatDto,
  ) {
    try {
      return await this.seatsService.removeSeat(removeSeatDto.seatId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
