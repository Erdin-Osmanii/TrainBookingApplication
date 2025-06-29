# Test Guide: Confirm Booking with Payment Integration

## Overview

This guide tests the complete booking confirmation flow with payment processing integration between booking-ms and payment-ms.

## Prerequisites

- All microservices are running (user-ms, train-ms, inventory-ms, booking-ms, payment-ms)
- Valid JWT token for authentication
- Test data in the database (schedules, trains, stations)

## Test Flow

### 1. Create a Booking

First, create a booking with PENDING status:

```bash
curl -X POST http://localhost:3004/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "schedule_id_here",
    "seatIds": ["seat1", "seat2"],
    "notes": "Test booking"
  }'
```

Expected response:

```json
{
  "bookingId": "cmchwhnm70001f9rbeutjwf2i",
  "status": "PENDING",
  "holdIds": ["hold1", "hold2"],
  "message": "Booking created successfully. Seats are held for 15 minutes."
}
```

### 2. Confirm Booking with Payment

Confirm the booking with payment details (userId is taken from JWT token, not request body):

```bash
curl -X POST http://localhost:3004/bookings/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "cmchwhnm70001f9rbeutjwf2i",
    "amount": 50.00,
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123",
    "zipCode": "12345"
  }'
```

**Important Notes:**

- `userId` is NOT required in the request body - it's extracted from the JWT token
- `amount` must be at least the schedule price (only schedule price is charged)
- Credit card details are accepted in the API but converted to Stripe test tokens internally
- Test card numbers are mapped to Stripe test tokens to avoid security warnings

Expected response:

```json
{
  "bookingId": "cmchwhnm70001f9rbeutjwf2i",
  "status": "CONFIRMED",
  "holdIds": [],
  "message": "Booking confirmed successfully"
}
```

### 3. Verify Payment Record

Check the payment record in payment-ms:

```bash
curl -X GET http://localhost:3005/payments/booking/cmchwhnm70001f9rbeutjwf2i \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:

```json
{
  "id": "payment_id",
  "bookingId": "cmchwhnm70001f9rbeutjwf2i",
  "userId": "user_id_from_jwt",
  "amount": 50.0,
  "status": "PAID",
  "stripePaymentIntentId": "pi_xxx",
  "currency": "usd",
  "refunded": false,
  "createdAt": "2025-06-29T...",
  "updatedAt": "2025-06-29T..."
}
```

## Test Cards

The system accepts these test card numbers which are automatically converted to Stripe test tokens:

- `4242424242424242` - Visa (successful payment)
- `4000056655665556` - Visa Debit (successful payment)
- `5555555555554444` - Mastercard (successful payment)
- `4000000000000002` - Declined card
- `4000000000009995` - Insufficient funds
- `4000000000009987` - Lost card
- `4000000000009979` - Stolen card
- `4000000000000069` - Expired card
- `4000000000000127` - Incorrect CVC
- `4000000000000119` - Processing error

## Error Scenarios

### Invalid Amount

```bash
curl -X POST http://localhost:3004/bookings/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "cmchwhnm70001f9rbeutjwf2i",
    "amount": 10.00,
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123"
  }'
```

Expected error:

```json
{
  "message": "Payment amount (10) must be at least the schedule price (50)",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Declined Payment

```bash
curl -X POST http://localhost:3004/bookings/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "cmchwhnm70001f9rbeutjwf2i",
    "amount": 50.00,
    "cardNumber": "4000000000000002",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123"
  }'
```

Expected error:

```json
{
  "message": "Payment failed: Your card was declined.",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Cancel Booking with Refund

To test the refund functionality:

```bash
curl -X POST http://localhost:3004/bookings/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "cmchwhnm70001f9rbeutjwf2i"
  }'
```

This will:

1. Cancel the booking
2. Release seats in inventory-ms
3. Process refund in payment-ms via TCP
4. Update payment status to REFUNDED

## Troubleshooting

### Payment Processing Issues

- Check payment-ms logs for Stripe API errors
- Verify STRIPE_SECRET_KEY is set correctly
- Ensure payment-ms is running on port 4005 for TCP communication

### Booking Confirmation Issues

- Verify all microservices are running
- Check JWT token is valid and contains user information
- Ensure booking exists and is in PENDING status
- Verify schedule price validation

### TCP Communication Issues

- Check if payment-ms is listening on port 4005
- Verify message patterns match between services
- Check network connectivity between services
