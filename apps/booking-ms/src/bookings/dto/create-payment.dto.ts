import { IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
