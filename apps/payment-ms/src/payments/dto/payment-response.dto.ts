export class PaymentResponseDto {
  success: boolean;
  message: string;
  paymentId?: string;
  bookingId?: string;
  amount?: number;
  status?: string;
} 