import {
  IsOptional,
  IsNumber,
  IsDateString,
  IsPositive,
  Min,
  IsEnum,
} from 'class-validator';
import { ScheduleStatus } from './create-schedule.dto';

export class UpdateScheduleDto {
  @IsOptional()
  @IsNumber()
  trainId?: number;

  @IsOptional()
  @IsNumber()
  departureStationId?: number;

  @IsOptional()
  @IsNumber()
  arrivalStationId?: number;

  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}
