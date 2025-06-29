import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

export interface PaymentIntentData {
  amount: number;
  currency: string;
  metadata: {
    bookingId: string;
    userId: string;
  };
}

export interface CreditCardData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  zipCode?: string;
}

export interface RefundData {
  paymentIntentId: string;
  amount?: number;
  metadata: {
    bookingId: string;
    userId: string;
  };
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  // Test token mapping for common test cards
  private readonly testTokenMap = {
    "4242424242424242": "tok_visa",
    "4000056655665556": "tok_visa_debit",
    "5555555555554444": "tok_mastercard",
    "4000000000000002": "tok_chargeDeclined",
    "4000000000009995": "tok_chargeDeclinedInsufficientFunds",
    "4000000000009987": "tok_chargeDeclinedLostCard",
    "4000000000009979": "tok_chargeDeclinedStolenCard",
    "4000000000000069": "tok_chargeDeclinedExpiredCard",
    "4000000000000127": "tok_chargeDeclinedIncorrectCvc",
    "4000000000000119": "tok_chargeDeclinedProcessingError",
  };

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-05-28.basil",
    });
  }

  private getTestTokenForCard(cardNumber: string): string | null {
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    return this.testTokenMap[cleanCardNumber] || null;
  }

  async createPaymentMethodFromCard(
    cardData: CreditCardData
  ): Promise<Stripe.PaymentMethod> {
    try {
      this.logger.log("Creating payment method from card details");

      // Check if this is a test card and get the corresponding token
      const testToken = this.getTestTokenForCard(cardData.cardNumber);

      if (testToken) {
        this.logger.log(
          `Using test token ${testToken} for card ${cardData.cardNumber}`
        );

        // Create payment method using the test token
        const paymentMethod = await this.stripe.paymentMethods.create({
          type: "card",
          card: {
            token: testToken,
          },
          billing_details: {
            address: {
              postal_code: cardData.zipCode,
            },
          },
        });

        this.logger.log(
          `Payment method created successfully with test token: ${paymentMethod.id}`
        );
        return paymentMethod;
      } else {
        // For non-test cards, create a payment method with card details
        // This will work for real cards in production
        const paymentMethod = await this.stripe.paymentMethods.create({
          type: "card",
          card: {
            number: cardData.cardNumber.replace(/\s/g, ""), // Remove spaces
            exp_month: parseInt(cardData.expiryMonth),
            exp_year: parseInt(cardData.expiryYear),
            cvc: cardData.cvc,
          },
          billing_details: {
            address: {
              postal_code: cardData.zipCode,
            },
          },
        });

        this.logger.log(
          `Payment method created successfully: ${paymentMethod.id}`
        );
        return paymentMethod;
      }
    } catch (error) {
      this.logger.error(
        `Failed to create payment method from card: ${error.message}`
      );
      throw new BadRequestException(
        `Payment method creation failed: ${error.message}`
      );
    }
  }

  async createPaymentIntentWithCard(
    data: PaymentIntentData,
    cardData: CreditCardData
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(
        `Creating payment intent with card for booking ${data.metadata.bookingId}, amount: ${data.amount}`
      );

      // First create a payment method from the card details
      const paymentMethod = await this.createPaymentMethodFromCard(cardData);

      // Then create payment intent with the payment method
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency,
        payment_method: paymentMethod.id,
        metadata: data.metadata,
        confirm: true, // Confirm immediately
        return_url: "https://example.com/return", // Optional return URL
      });

      this.logger.log(
        `Payment intent created and confirmed: ${paymentIntent.id}, status: ${paymentIntent.status}`
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent with card: ${error.message}`
      );
      throw new BadRequestException(
        `Payment processing failed: ${error.message}`
      );
    }
  }

  async createPaymentIntentWithPaymentMethod(
    data: PaymentIntentData,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(
        `Creating payment intent with payment method for booking ${data.metadata.bookingId}, amount: ${data.amount}`
      );

      // Create payment intent with the payment method
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency,
        payment_method: paymentMethodId,
        metadata: data.metadata,
        confirm: true, // Confirm immediately
        return_url: "https://example.com/return", // Optional return URL
      });

      this.logger.log(
        `Payment intent created and confirmed: ${paymentIntent.id}, status: ${paymentIntent.status}`
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent with payment method: ${error.message}`
      );
      throw new BadRequestException(
        `Payment processing failed: ${error.message}`
      );
    }
  }

  async createPaymentIntent(
    data: PaymentIntentData
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(
        `Creating payment intent for booking ${data.metadata.bookingId}, amount: ${data.amount}`
      );

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency,
        metadata: data.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(
        `Payment intent created successfully: ${paymentIntent.id}`
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException(
        `Payment intent creation failed: ${error.message}`
      );
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Confirming payment intent: ${paymentIntentId}`);

      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === "succeeded") {
        this.logger.log(`Payment intent already succeeded: ${paymentIntentId}`);
        return paymentIntent;
      }

      if (paymentIntent.status === "canceled") {
        throw new BadRequestException("Payment intent was canceled");
      }

      // For automatic payment methods, the payment is confirmed automatically
      // We just need to retrieve the final status
      const updatedPaymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      this.logger.log(`Payment intent status: ${updatedPaymentIntent.status}`);

      return updatedPaymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`);
      throw new BadRequestException(
        `Payment confirmation failed: ${error.message}`
      );
    }
  }

  async createRefund(data: RefundData): Promise<Stripe.Refund> {
    try {
      this.logger.log(
        `Creating refund for payment intent ${data.paymentIntentId}, booking: ${data.metadata.bookingId}`
      );

      const refundData: Stripe.RefundCreateParams = {
        payment_intent: data.paymentIntentId,
        metadata: data.metadata,
      };

      if (data.amount) {
        refundData.amount = Math.round(data.amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.logger.log(`Refund created successfully: ${refund.id}`);

      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new BadRequestException(`Refund creation failed: ${error.message}`);
    }
  }

  async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Retrieving payment intent: ${paymentIntentId}`);

      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      this.logger.log(
        `Payment intent retrieved: ${paymentIntent.id}, status: ${paymentIntent.status}`
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new BadRequestException(
        `Payment intent retrieval failed: ${error.message}`
      );
    }
  }

  async getRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      this.logger.log(`Retrieving refund: ${refundId}`);

      const refund = await this.stripe.refunds.retrieve(refundId);

      this.logger.log(
        `Refund retrieved: ${refund.id}, status: ${refund.status}`
      );

      return refund;
    } catch (error) {
      this.logger.error(`Failed to retrieve refund: ${error.message}`);
      throw new BadRequestException(
        `Refund retrieval failed: ${error.message}`
      );
    }
  }
}
