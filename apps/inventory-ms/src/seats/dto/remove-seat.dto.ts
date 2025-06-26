import { IsString } from 'class-validator';

export class RemoveSeatDto {
  @IsString()
  seatId: string;
}
