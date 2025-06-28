import { IsString } from 'class-validator';

export class ReleaseReservedSeatsDto {
  @IsString()
  seatId: string;
}
