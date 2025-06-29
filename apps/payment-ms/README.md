# Payment Microservice

This microservice handles payment processing for train bookings using Stripe.

## Features

- **Secure Payment Processing**: Accepts card details in API but uses Stripe test tokens internally
- **Payment Validation**: Validates card details and processes payments securely
- **Refund Processing**: Handles refunds for cancelled bookings
- **JWT Authentication**: Protected endpoints for secure payment processing
- **Microservice Communication**: TCP-based communication with booking-ms
- **Persistent Storage**: PostgreSQL database storage with Prisma ORM

## Security

This service follows a secure approach for handling payments:

- **API Interface**: Accepts raw card details in the request body for simplicity
- **Test Token Mapping**: Converts test card numbers to Stripe test tokens internally
- **Stripe Integration**: Uses Stripe's secure test token system for payment methods
- **No Card Storage**: Card details are never stored, only used to create payment methods

## Test Token Mapping

The service automatically maps common test card numbers to Stripe test tokens:

| Card Number        | Test Token                            | Description          |
| ------------------ | ------------------------------------- | -------------------- |
| `4242424242424242` | `tok_visa`                            | Visa (success)       |
| `4000056655665556` | `tok_visa_debit`                      | Visa Debit (success) |
| `5555555555554444` | `tok_mastercard`                      | Mastercard (success) |
| `4000000000000002` | `tok_chargeDeclined`                  | Generic decline      |
| `4000000000009995` | `tok_chargeDeclinedInsufficientFunds` | Insufficient funds   |
| `4000000000009987` | `tok_chargeDeclinedLostCard`          | Lost card            |
| `4000000000009979` | `tok_chargeDeclinedStolenCard`        | Stolen card          |
| `4000000000000069` | `tok_chargeDeclinedExpiredCard`       | Expired card         |
| `4000000000000127` | `tok_chargeDeclinedIncorrectCvc`      | Incorrect CVC        |
| `4000000000000119` | `tok_chargeDeclinedProcessingError`   | Processing error     |

## Frontend Integration

To use this service, your frontend should:

1. **Create Payment Method**: Use Stripe.js to create a payment method from card details
2. **Send Payment Method Details**: Send the payment method details to this service
3. **Handle Response**: Process the payment result from this service

## API Endpoints

### POST /payments (Protected with JWT)

Process a payment for a booking.

**Request Body:**

```json
{
  "bookingId": "booking_123",
  "userId": "user_456",
  "amount": 150.0,
  "cardNumber": "4242424242424242",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cvc": "123",
  "zipCode": "12345"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment processed successfully",
  "paymentId": "payment_789",
  "bookingId": "booking_123",
  "amount": 150.0,
  "status": "PAID"
}
```

### POST /payments/refund (Protected with JWT)

Process a refund for a booking.

**Request Body:**

```json
{
  "bookingId": "booking_123",
  "userId": "user_456"
}
```

## Test Credit Cards

For testing purposes, you can use these Stripe test card numbers:

### Success Cards

- `4242424242424242` - Visa (success)
- `4000056655665556` - Visa (debit)
- `5555555555554444` - Mastercard

### Decline Cards

- `4000000000000002` - Generic decline
- `4000000000009995` - Insufficient funds
- `4000000000009987` - Lost card
- `4000000000009979` - Stolen card

**Test Card Details:**

- **Expiry**: Any future date (e.g., "12/2025")
- **CVC**: Any 3 digits (e.g., "123")
- **ZIP**: Any 5 digits (e.g., "12345")

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/payment_db"
JWT_SECRET="your-secret-key"
PORT=3005
STRIPE_SECRET_KEY="your-stripe-secret-key"
```

## Microservice Messages

### process-payment

Process a payment with card details.

**Message:**

```json
{
  "bookingId": "booking_123",
  "userId": "user_456",
  "amount": 150.0,
  "cardNumber": "4242424242424242",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cvc": "123",
  "zipCode": "12345"
}
```

### process-refund

Process a refund for a booking.

**Message:**

```json
{
  "bookingId": "booking_123",
  "userId": "user_456"
}
```

## Payment Flow

1. **API Request**: Frontend sends card details to booking-ms
2. **Validation**: booking-ms validates amount against schedule price
3. **Payment Processing**: booking-ms sends card details to payment-ms
4. **Token Mapping**: payment-ms maps test card numbers to Stripe test tokens
5. **Payment Method**: payment-ms creates payment method using test token
6. **Payment Intent**: payment-ms creates and confirms Stripe Payment Intent
7. **Database Update**: Payment status is updated in database
8. **Booking Confirmation**: booking-ms confirms booking if payment succeeds

## Internal Security Process

When card details are received:

1. **Card Validation**: Card details are validated
2. **Token Mapping**: Test card numbers are mapped to Stripe test tokens
3. **Payment Method Creation**: Payment method is created using the test token
4. **Secure Transmission**: Only the payment method ID is used for subsequent Stripe API calls
5. **No Storage**: Raw card details are never stored in the database
6. **Stripe Security**: Leverages Stripe's secure test token infrastructure

## Database Schema

The service uses a `Payment` model with the following fields:

- `id`: Unique payment identifier
- `bookingId`: Associated booking ID
- `userId`: User who made the payment
- `amount`: Payment amount
- `status`: Payment status (PENDING, PAID, FAILED, REFUNDED)
- `stripePaymentIntentId`: Stripe Payment Intent ID
- `stripeRefundId`: Stripe Refund ID (if refunded)
- `currency`: Payment currency (default: "usd")
- `refunded`: Whether the payment has been refunded
- `refundedAt`: When the refund was processed
- `createdAt`: Payment creation timestamp
- `updatedAt`: Last update timestamp

## Configuration

The service is configured to run on:

- **HTTP Port**: 3005
- **TCP Port**: 4005 (for microservice communication)
- **Database**: PostgreSQL with Prisma ORM

## Installation & Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Database Setup**:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Environment Configuration**:
   Create a `.env` file with:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/payment_db"
   JWT_SECRET="your-secret-key"
   PORT=3005
   ```

4. **Run the Service**:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run start:prod
   ```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Microservice Communication

The payment-ms communicates with booking-ms using TCP transport:

- **Port**: 4005 (payment-ms microservice port)
- **Commands**:
  - `process-payment`: Process payment during booking confirmation
  - `process-refund`: Process refund when booking is cancelled

## Docker Deployment

The payment-ms is included in the main docker-compose.yml file:

```yaml
payment-ms:
  build:
    context: ./apps/payment-ms
    dockerfile: Dockerfile
  ports:
    - "${PAYMENT_MS_PORT:-3005}:3005"
    - "${PAYMENT_MS_TCP_PORT:-4005}:4005"
  environment:
    DATABASE_URL: ${PAYMENT_DATABASE_URL}
    JWT_SECRET: ${JWT_SECRET}
    BOOKING_MS_TCP_HOST: ${BOOKING_MS_TCP_HOST}
    BOOKING_MS_TCP_PORT: ${BOOKING_MS_TCP_PORT}
  depends_on:
    - postgres
    - booking-ms
```

## Usage Examples

### Process a Payment (Direct)

```bash
curl -X POST http://localhost:3005/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123",
    "userId": "user_456",
    "amount": 150.00,
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123",
    "zipCode": "12345"
  }'
```

### Confirm Booking with Payment (via booking-ms)

```bash
curl -X POST http://localhost:3004/bookings/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123",
    "amount": 150.00,
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123",
    "zipCode": "12345"
  }'
```

### Process a Refund

```bash
curl -X POST http://localhost:3005/payments/refund \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123",
    "userId": "user_456"
  }'
```

### Cancel Booking (triggers refund automatically)

```bash
curl -X POST http://localhost:3004/bookings/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123"
  }'
```

### Get Payment Details

```bash
curl -X GET http://localhost:3005/payments/booking/booking_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

- **HTTPS Required**: Always use HTTPS in production
- **JWT Validation**: All endpoints require valid JWT tokens
- **Input Validation**: Card details are validated before processing
- **Error Handling**: Sensitive information is not exposed in error messages
- **Logging**: Card details are not logged for security
- **Test Tokens**: Uses Stripe's recommended test token approach
