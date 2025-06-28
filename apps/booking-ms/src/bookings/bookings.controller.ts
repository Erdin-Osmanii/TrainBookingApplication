import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { GetBookingDto } from './dto/get-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // HTTP endpoints
  @Post()
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateBookingDto,
    @User() user: { id: number; email: string; role: string },
  ) {
    try {
      return await this.bookingsService.createBooking(dto, user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmBooking(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ConfirmBookingDto,
    @User() user: { id: number; email: string; role: string },
  ) {
    try {
      return await this.bookingsService.confirmBooking(dto, user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelBooking(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CancelBookingDto,
    @User() user: { id: number; email: string; role: string },
  ) {
    try {
      return await this.bookingsService.cancelBooking(dto, user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserBookings(
    @User() user: { id: number; email: string; role: string },
  ) {
    try {
      return await this.bookingsService.getUserBookings(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get(':bookingId')
  @UseGuards(JwtAuthGuard)
  async getBookingById(
    @Param('bookingId') bookingId: string,
    @User() user: { id: number; email: string; role: string },
  ) {
    try {
      const dto: GetBookingDto = { bookingId };
      return await this.bookingsService.getBookingById(dto, user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  // TCP endpoints for internal microservice communication
  @MessagePattern({ cmd: 'create-booking' })
  async createBookingTcp(
    @Payload()
    data: {
      dto: CreateBookingDto;
      user: { id: number; email: string; role: string };
    },
  ) {
    return this.bookingsService.createBooking(data.dto, data.user);
  }

  @MessagePattern({ cmd: 'confirm-booking' })
  async confirmBookingTcp(
    @Payload()
    data: {
      dto: ConfirmBookingDto;
      user: { id: number; email: string; role: string };
    },
  ) {
    return this.bookingsService.confirmBooking(data.dto, data.user);
  }

  @MessagePattern({ cmd: 'cancel-booking' })
  async cancelBookingTcp(
    @Payload()
    data: {
      dto: CancelBookingDto;
      user: { id: number; email: string; role: string };
    },
  ) {
    return this.bookingsService.cancelBooking(data.dto, data.user);
  }
}
