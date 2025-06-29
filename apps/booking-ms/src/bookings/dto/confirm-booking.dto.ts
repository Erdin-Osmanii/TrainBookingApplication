import {
  IsString,
  IsNumber,
  IsPositive,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class ConfirmBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  // Credit card details (will be converted to payment method internally)
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @IsString()
  @IsNotEmpty()
  expiryMonth: string;

  @IsString()
  @IsNotEmpty()
  expiryYear: string;

  @IsString()
  @IsNotEmpty()
  cvc: string;

  @IsString()
  @IsOptional()
  zipCode?: string;
}
