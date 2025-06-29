# Testing Payment Integration with Test Tokens

## Overview

This guide shows how to test the payment integration where card details are sent to the API and automatically converted to Stripe test tokens internally.

## Prerequisites

1. **Stripe Account**: You need a Stripe account with test API keys
2. **Backend Running**: All microservices should be running
3. **JWT Token**: You need a valid JWT token for authentication

## How It Works

The system automatically maps test card numbers to Stripe test tokens:

- `4242424242424242` → `tok_visa` (success)
- `4000000000000002` → `tok_chargeDeclined` (decline)
- `4000000000009995` → `tok_chargeDeclinedInsufficientFunds` (insufficient funds)

This approach follows Stripe's recommended testing practices while maintaining a simple API interface.

## Step 1: Test the API Directly

You can test the payment API directly using curl or any HTTP client:

### Test Payment Endpoint

```bash
curl -X POST http://localhost:3005/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "test_booking_123",
    "userId": "test_user_456",
    "amount": 150.00,
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123",
    "zipCode": "12345"
  }'
```

### Test Booking Confirmation

```bash
curl -X POST http://localhost:3004/bookings/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "test_booking_123",
    "userId": "test_user_456",
    "amount": 150.00,
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvc": "123",
    "zipCode": "12345"
  }'
```

## Step 2: Test Credit Cards

Use these test card numbers (automatically mapped to Stripe test tokens):

### Success Cards

- `4242424242424242` - Visa (success) → `tok_visa`
- `4000056655665556` - Visa (debit) → `tok_visa_debit`
- `5555555555554444` - Mastercard → `tok_mastercard`

### Decline Cards

- `4000000000000002` - Generic decline → `tok_chargeDeclined`
- `4000000000009995` - Insufficient funds → `tok_chargeDeclinedInsufficientFunds`
- `4000000000009987` - Lost card → `tok_chargeDeclinedLostCard`
- `4000000000009979` - Stolen card → `tok_chargeDeclinedStolenCard`

### Test Details

- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## Step 3: Simple HTML Test Page

Create a simple HTML file to test the payment flow:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Payment with Test Tokens</title>
  </head>
  <body>
    <h1>Test Payment with Test Tokens</h1>

    <form id="payment-form">
      <div>
        <label>Card Number:</label>
        <input type="text" id="cardNumber" value="4242424242424242" />
        <small>Will be automatically converted to Stripe test token</small>
      </div>
      <div>
        <label>Expiry Month:</label>
        <input type="text" id="expiryMonth" value="12" />
      </div>
      <div>
        <label>Expiry Year:</label>
        <input type="text" id="expiryYear" value="2025" />
      </div>
      <div>
        <label>CVC:</label>
        <input type="text" id="cvc" value="123" />
      </div>
      <div>
        <label>ZIP Code:</label>
        <input type="text" id="zipCode" value="12345" />
      </div>
      <button type="submit">Pay $150.00</button>
    </form>

    <div id="result"></div>

    <script>
      document
        .getElementById("payment-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();

          const paymentData = {
            bookingId: "test_booking_123",
            userId: "test_user_456",
            amount: 150.0,
            cardNumber: document.getElementById("cardNumber").value,
            expiryMonth: document.getElementById("expiryMonth").value,
            expiryYear: document.getElementById("expiryYear").value,
            cvc: document.getElementById("cvc").value,
            zipCode: document.getElementById("zipCode").value,
          };

          try {
            const response = await fetch("http://localhost:3005/payments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
              },
              body: JSON.stringify(paymentData),
            });

            const result = await response.json();
            document.getElementById("result").innerHTML =
              `Payment Result: ${JSON.stringify(result, null, 2)}`;
          } catch (error) {
            document.getElementById("result").innerHTML =
              `Error: ${error.message}`;
          }
        });
    </script>
  </body>
</html>
```

## Step 4: Test the Flow

1. **Start Services**: Ensure all microservices are running
2. **Test API**: Use curl or the HTML page to test payments
3. **Check Logs**: Monitor payment-ms logs for token mapping details
4. **Verify Database**: Check that payment records are created

## Step 5: Verify Backend Processing

Check the payment-ms logs to see:

- Card details received
- Test token mapping (e.g., "Using test token tok_visa for card 4242424242424242")
- Payment method created with test token
- Stripe Payment Intent created
- Payment status updated in database

## Security Benefits

This approach provides several benefits:

1. **Simple API**: Frontend can send card details directly
2. **Stripe Compliance**: Uses Stripe's recommended test token approach
3. **No Security Warnings**: Avoids Stripe's "unsafe" warnings for test cards
4. **Test Coverage**: Comprehensive test scenarios with different card types
5. **Production Ready**: Works with real cards in production

## Internal Process

When a payment request is received:

1. **Card Validation**: Card details are validated
2. **Token Mapping**: Test card numbers are mapped to Stripe test tokens
3. **Payment Method Creation**: Payment method is created using the test token
4. **Payment Intent**: Stripe Payment Intent is created with the payment method
5. **Confirmation**: Payment is confirmed immediately
6. **Database Update**: Payment status is stored in database

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend allows requests from your frontend domain
2. **JWT Token**: Make sure you have a valid JWT token for authentication
3. **Stripe Key**: Verify you're using the correct Stripe secret key
4. **Network**: Ensure all microservices are running and accessible

### Debug Steps

1. Check browser console for JavaScript errors
2. Check payment-ms logs for token mapping and processing details
3. Verify Stripe dashboard for payment attempts
4. Check database for payment records
5. Ensure JWT token is valid and not expired

### Expected Log Messages

Look for these log messages in payment-ms:

- `"Using test token tok_visa for card 4242424242424242"`
- `"Payment method created successfully with test token: pm_..."`
- `"Payment intent created and confirmed: pi_..., status: succeeded"`
