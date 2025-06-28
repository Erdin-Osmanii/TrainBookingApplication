import { IsNumber, IsString, IsArray } from 'class-validator';

// User Microservice DTOs
export class ValidateUserDto {
  @IsNumber()
  userId: number;
}

export class ValidateUserResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  role: string;
}

// Train Microservice DTOs
export class ValidateScheduleDto {
  @IsNumber()
  scheduleId: number;
}

export class GetScheduleDetailsDto {
  @IsNumber()
  scheduleId: number;
}

export class StationDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;
}

export class TrainDto {
  @IsNumber()
  id: number;

  @IsString()
  trainNumber: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  capacity: number;

  @IsString()
  status: string;
}

export class ScheduleDetailsResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  trainId: number;

  @IsNumber()
  departureStationId: number;

  @IsNumber()
  arrivalStationId: number;

  @IsString()
  departureTime: string;

  @IsString()
  arrivalTime: string;

  @IsNumber()
  duration: number;

  @IsNumber()
  price: number;

  @IsString()
  status: string;

  departureStation: StationDto;

  arrivalStation: StationDto;

  train: TrainDto;
}

// Inventory Microservice DTOs
export class HoldSeatsDto {
  @IsNumber()
  scheduleId: number;

  @IsArray()
  @IsString({ each: true })
  seatIds: string[];

  @IsString()
  userId: string;
}

export class HoldSeatsResponseDto {
  @IsString()
  id: string;

  @IsString()
  seatId: string;

  @IsString()
  userId: string;

  @IsString()
  expiresAt: string;
}

export class ConfirmSeatsDto {
  @IsString()
  holdId: string;
}

export class ReleaseSeatsDto {
  @IsString()
  holdId: string;
}

export class ReleaseReservedSeatsDto {
  @IsString()
  seatId: string;
}

export class ReleaseSeatsResponseDto {
  @IsString()
  message: string;
}
