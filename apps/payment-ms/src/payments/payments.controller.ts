import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ForbiddenException,
} from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { RefundPaymentDto } from "./dto/refund-payment.dto";
import { PaymentResponseDto } from "./dto/payment-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../auth/decorators/user.decorator";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @User("userId") userId: string
  ): Promise<PaymentResponseDto> {
    // Ensure the user can only process payments for their own bookings
    if (createPaymentDto.userId != userId) {
      throw new ForbiddenException(
        "You can only process payments for your own bookings"
      );
    }

    return this.paymentsService.processPayment(createPaymentDto);
  }

  @Post("refund")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async processRefund(
    @Body() refundPaymentDto: RefundPaymentDto,
    @User("userId") userId: string
  ): Promise<PaymentResponseDto> {
    // Ensure the user can only process refunds for their own bookings
    if (refundPaymentDto.userId != userId) {
      throw new ForbiddenException(
        "You can only process refunds for your own bookings"
      );
    }

    return this.paymentsService.processRefund(refundPaymentDto);
  }

  @Get("booking/:bookingId")
  @UseGuards(JwtAuthGuard)
  async getPaymentByBookingId(
    @Param("bookingId") bookingId: string,
    @User("userId") userId: string
  ): Promise<any> {
    return this.paymentsService.getPaymentByBookingId(bookingId, `${userId}`);
  }

  // Microservice message handler for payment processing
  @MessagePattern({ cmd: "process-payment" })
  async processPaymentInternal(
    @Payload() data: CreatePaymentDto
  ): Promise<PaymentResponseDto> {
    // This endpoint is for internal service communication
    // No JWT authentication required for microservice communication
    return this.paymentsService.processPayment(data);
  }

  // Microservice message handler for refund processing
  @MessagePattern({ cmd: "process-refund" })
  async processRefundInternal(
    @Payload() data: RefundPaymentDto
  ): Promise<PaymentResponseDto> {
    // This endpoint is for internal service communication
    // No JWT authentication required for microservice communication
    return this.paymentsService.processRefund(data);
  }
}
