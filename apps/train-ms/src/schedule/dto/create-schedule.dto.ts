import {
  IsNumber,
  IsNotEmpty,
  IsDateString,
  IsPositive,
  Min,
} from 'class-validator';

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
  COMPLETED = 'COMPLETED',
}

export class CreateScheduleDto {
  @IsNumber()
  @IsNotEmpty()
  trainId: number;

  @IsNumber()
  @IsNotEmpty()
  departureStationId: number;

  @IsNumber()
  @IsNotEmpty()
  arrivalStationId: number;

  @IsDateString()
  departureTime: string;

  @IsDateString()
  arrivalTime: string;

  @IsNumber()
  @Min(1)
  duration: number; // in minutes

  @IsNumber()
  @IsPositive()
  price: number;
}
