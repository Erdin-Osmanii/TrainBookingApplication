import { IsString } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  bookingId: string;
}
