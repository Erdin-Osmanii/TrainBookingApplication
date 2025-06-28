import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class BookingEntityDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsNumber()
  scheduleId: number;

  @IsArray()
  @IsString({ each: true })
  seatIds: string[];

  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsArray()
  @IsString({ each: true })
  holdIds: string[];

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsDate()
  confirmedAt?: Date | null;

  @IsOptional()
  @IsDate()
  cancelledAt?: Date | null;
}
