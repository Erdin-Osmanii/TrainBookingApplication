import { IsString, IsNumber } from 'class-validator';

export class CreateSeatDto {
  @IsString()
  seatNumber: string;

  @IsNumber()
  scheduleId: number;

  @IsNumber()
  trainId: number;
}
