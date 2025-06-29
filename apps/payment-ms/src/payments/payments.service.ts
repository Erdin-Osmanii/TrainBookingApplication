import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentResponseDto } from "./dto/payment-response.dto";
import { RefundPaymentDto } from "./dto/refund-payment.dto";
import { PaymentStatus } from "@prisma/client";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService
  ) {}

  async processPayment(
    createPaymentDto: CreatePaymentDto
  ): Promise<PaymentResponseDto> {
    try {
      this.logger.log(
        `Processing payment for booking ${createPaymentDto.bookingId}, amount: ${createPaymentDto.amount}`
      );

      // Check if payment already exists
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId: createPaymentDto.bookingId,
          userId: createPaymentDto.userId,
        },
      });

      // If payment exists and is already PAID, don't allow retry
      if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
        throw new BadRequestException(
          "Payment already exists for this booking"
        );
      }

      // If payment exists but failed, we can retry
      if (existingPayment && existingPayment.status === PaymentStatus.FAILED) {
        this.logger.log(
          `Retrying failed payment for booking ${createPaymentDto.bookingId}`
        );
      }

      // Prepare payment intent data
      const paymentIntentData = {
        amount: createPaymentDto.amount,
        currency: "usd",
        metadata: {
          bookingId: createPaymentDto.bookingId,
          userId: createPaymentDto.userId,
        },
      };

      // Prepare credit card data
      const cardData = {
        cardNumber: createPaymentDto.cardNumber,
        expiryMonth: createPaymentDto.expiryMonth,
        expiryYear: createPaymentDto.expiryYear,
        cvc: createPaymentDto.cvc,
        zipCode: createPaymentDto.zipCode,
      };

      // Create and confirm payment intent with credit card
      const paymentIntent =
        await this.stripeService.createPaymentIntentWithCard(
          paymentIntentData,
          cardData
        );

      if (paymentIntent.status === "succeeded") {
        // Payment successful
        const payment = existingPayment
          ? await this.prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                amount: createPaymentDto.amount,
                status: PaymentStatus.PAID,
                stripePaymentIntentId: paymentIntent.id,
                updatedAt: new Date(),
              },
            })
          : await this.prisma.payment.create({
              data: {
                bookingId: createPaymentDto.bookingId,
                userId: createPaymentDto.userId,
                amount: createPaymentDto.amount,
                status: PaymentStatus.PAID,
                stripePaymentIntentId: paymentIntent.id,
                currency: "usd",
              },
            });

        this.logger.log(
          `Payment successful for booking ${createPaymentDto.bookingId}, Stripe PI: ${paymentIntent.id}`
        );

        return {
          success: true,
          message: "Payment processed successfully",
          paymentId: payment.id,
          bookingId: createPaymentDto.bookingId,
          amount: createPaymentDto.amount,
          status: PaymentStatus.PAID,
        };
      } else {
        // Payment failed
        const payment = existingPayment
          ? await this.prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                amount: createPaymentDto.amount,
                status: PaymentStatus.FAILED,
                stripePaymentIntentId: paymentIntent.id,
                updatedAt: new Date(),
              },
            })
          : await this.prisma.payment.create({
              data: {
                bookingId: createPaymentDto.bookingId,
                userId: createPaymentDto.userId,
                amount: createPaymentDto.amount,
                status: PaymentStatus.FAILED,
                stripePaymentIntentId: paymentIntent.id,
                currency: "usd",
              },
            });

        this.logger.log(
          `Payment failed for booking ${createPaymentDto.bookingId}, Stripe PI: ${paymentIntent.id}, status: ${paymentIntent.status}`
        );

        return {
          success: false,
          message: `Payment processing failed: ${paymentIntent.status}`,
          paymentId: payment.id,
          bookingId: createPaymentDto.bookingId,
          amount: createPaymentDto.amount,
          status: PaymentStatus.FAILED,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error processing payment for booking ${createPaymentDto.bookingId}: ${error.message}`
      );

      // If we haven't created a payment record yet, create a failed one
      try {
        const existingPayment = await this.prisma.payment.findFirst({
          where: {
            bookingId: createPaymentDto.bookingId,
            userId: createPaymentDto.userId,
          },
        });

        if (!existingPayment) {
          await this.prisma.payment.create({
            data: {
              bookingId: createPaymentDto.bookingId,
              userId: createPaymentDto.userId,
              amount: createPaymentDto.amount,
              status: PaymentStatus.FAILED,
              currency: "usd",
            },
          });
        }
      } catch (dbError) {
        this.logger.error(
          `Failed to create payment record: ${dbError.message}`
        );
      }

      throw new HttpException(
        error.message || "Payment processing failed",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async processRefund(
    refundPaymentDto: RefundPaymentDto
  ): Promise<PaymentResponseDto> {
    try {
      this.logger.log(
        `Processing refund for booking ${refundPaymentDto.bookingId}`
      );

      // Find the payment record - only look for PAID payments that haven't been refunded
      const payment = await this.prisma.payment.findFirst({
        where: {
          bookingId: refundPaymentDto.bookingId,
          userId: refundPaymentDto.userId,
          status: PaymentStatus.PAID,
          refunded: false,
        },
      });

      if (!payment) {
        // Check if there's any payment record for this booking
        const anyPayment = await this.prisma.payment.findFirst({
          where: {
            bookingId: refundPaymentDto.bookingId,
            userId: refundPaymentDto.userId,
          },
        });

        if (!anyPayment) {
          throw new BadRequestException("No payment found for this booking");
        }

        if (anyPayment.status === PaymentStatus.FAILED) {
          throw new BadRequestException("Cannot refund a failed payment");
        }

        if (anyPayment.status === PaymentStatus.REFUNDED) {
          throw new BadRequestException("Payment has already been refunded");
        }

        throw new BadRequestException(
          "No successful payment found for this booking"
        );
      }

      if (!payment.stripePaymentIntentId) {
        throw new BadRequestException(
          "Payment does not have a Stripe payment intent ID"
        );
      }

      // Create Stripe refund
      const refundData = {
        paymentIntentId: payment.stripePaymentIntentId,
        amount: payment.amount,
        metadata: {
          bookingId: refundPaymentDto.bookingId,
          userId: refundPaymentDto.userId,
        },
      };

      const refund = await this.stripeService.createRefund(refundData);

      if (refund.status === "succeeded") {
        // Refund successful
        const updatedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refunded: true,
            refundedAt: new Date(),
            stripeRefundId: refund.id,
          },
        });

        this.logger.log(
          `Refund successful for booking ${refundPaymentDto.bookingId}, Stripe refund: ${refund.id}`
        );

        return {
          success: true,
          message: "Refund processed successfully",
          paymentId: updatedPayment.id,
          bookingId: refundPaymentDto.bookingId,
          amount: updatedPayment.amount,
          status: PaymentStatus.REFUNDED,
        };
      } else {
        this.logger.log(
          `Refund failed for booking ${refundPaymentDto.bookingId}, Stripe refund: ${refund.id}, status: ${refund.status}`
        );

        return {
          success: false,
          message: `Refund processing failed: ${refund.status}`,
          paymentId: payment.id,
          bookingId: refundPaymentDto.bookingId,
          amount: payment.amount,
          status: payment.status,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error processing refund for booking ${refundPaymentDto.bookingId}: ${error.message}`
      );

      throw new HttpException(
        error.message || "Refund processing failed",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPaymentByBookingId(bookingId: string, userId: string): Promise<any> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          bookingId,
          userId,
        },
      });

      if (!payment) {
        throw new BadRequestException("Payment not found for this booking");
      }

      return payment;
    } catch (error) {
      this.logger.error(
        `Error retrieving payment for booking ${bookingId}: ${error.message}`
      );
      throw new HttpException(
        error.message || "Failed to retrieve payment",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
