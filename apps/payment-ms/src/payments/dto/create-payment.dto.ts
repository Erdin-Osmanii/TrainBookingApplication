import { IsString, IsNumber, IsNotEmpty, IsOptional } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
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
