import { IsString, IsDate, IsOptional, IsArray } from 'class-validator';

export class BookingResponseDto {
  @IsString()
  bookingId: string;

  @IsString()
  status: string;

  @IsArray()
  @IsString({ each: true })
  holdIds: string[];

  @IsString()
  message: string;
}

export interface SeatInfo {
  id: string;
  seatNumber: string;
}

export class BookingDetailsDto {
  @IsString()
  id: string;

  @IsString()
  scheduleId: number;

  @IsArray()
  seats: SeatInfo[];

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsDate()
  confirmedAt?: Date;

  @IsOptional()
  @IsDate()
  cancelledAt?: Date;
}

export class UserBookingsResponseDto {
  @IsArray()
  bookings: BookingDetailsDto[];

  @IsString()
  count: number;
}

export class ScheduleDetailsDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsDate()
  departureTime: Date;

  @IsDate()
  arrivalTime: Date;

  @IsString()
  trainNumber: string;

  @IsString()
  trainName: string;
}

export class BookingWithScheduleDto extends BookingDetailsDto {
  schedule: ScheduleDetailsDto;
}
