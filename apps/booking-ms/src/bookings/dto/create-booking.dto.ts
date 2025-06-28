import {
  IsNumber,
  IsArray,
  IsString,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  scheduleId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seatIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
