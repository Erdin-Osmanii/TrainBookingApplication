import { IsString, IsNotEmpty } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
} 