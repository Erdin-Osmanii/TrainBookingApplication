#!/bin/bash

# Train Booking Application Environment Setup Script

echo "🚂 Setting up Train Booking Application environment..."

# Check if .env file already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/NGenerate a NestJS microservice named payment-ms for processing train ticket payments.
This service should integrate with the booking-ms to manage payment-dependent booking flows. It simulates or validates payments, updates payment records (if persistence is enabled), and ensures that bookings are only confirmed after a successful payment. It should also support issuing refunds on booking cancellation.

🧩 Functional Requirements:
Create Payment

Endpoint: POST /payments

Accepts payment request with booking ID, user ID, and amount.

Simulates or validates the payment.

If successful:

Call booking-ms to confirm the booking.

Optionally store a Payment record.

If failed:

Call booking-ms to cancel the booking.

Refund

Triggered when a confirmed booking is canceled.

Should reverse the simulated payment and mark the payment as refunded (if persistence is used).

Refunds can be initiated by a call from booking-ms or through a secure internal endpoint.

📁 Folder Structure:
cpp
Copy
Edit
src/
├── payments/
│   ├── dto/
│   │   ├── create-payment.dto.ts         // Contains bookingId, amount, userId
│   ├── payments.controller.ts            // POST /payments
│   ├── payments.service.ts               // Core payment logic: simulate, confirm/cancel booking
│   └── payments.module.ts
│
├── clients/
│   ├── booking.client.ts                 // Sends requests to booking-ms: confirm or cancel booking
│   └── clients.module.ts
│
├── prisma/                               // Optional: for tracking payments and refund status
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── payment.module.ts                     // Root app module
└── main.ts                               // App bootstrap
🔐 Security:
Protect the POST /payments endpoint with JWT bearer authentication.

Only allow the user associated with the booking or internal services to initiate payments.

🔄 Payment Flow:
User books a ticket via booking-ms, which creates a booking with status PENDING.

payment-ms is called to process payment.

On success:

payment-ms calls booking-ms to mark booking as CONFIRMED.

On failure:

payment-ms calls booking-ms to mark booking as CANCELLED.

If a confirmed booking is later canceled:

booking-ms triggers payment-ms to refund the user.

💾 Optional Persistence:
Create a Payment model (e.g., via Prisma) with fields: id, bookingId, userId, amount, status (PAID, FAILED, REFUNDED), createdAt, updatedAt.

Store each transaction and refund for tracking and reporting.

)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Prompt for DB_PASSWORD and JWT_SECRET
echo "Enter a database password (leave blank to generate a random one):"
read -r DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "Generated DB_PASSWORD: $DB_PASSWORD"
fi

echo "Enter a JWT secret (leave blank to generate a random one):"
read -r JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

# Create .env file
cat > .env << ENV_EOF
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# Service URLs (for booking-ms)
USER_MS_URL=http://user-ms:3001
TRAIN_MS_URL=http://train-ms:3002
INVENTORY_MS_URL=http://inventory-ms:3003
PAYMENT_MS_URL=http://payment-ms:3005

# TCP Communication (for booking-ms and payment-ms)
USER_MS_TCP_HOST=user-ms
USER_MS_TCP_PORT=4001
TRAIN_MS_TCP_HOST=train-ms
TRAIN_MS_TCP_PORT=4002
INVENTORY_MS_TCP_HOST=inventory-ms
INVENTORY_MS_TCP_PORT=4003
BOOKING_MS_TCP_HOST=booking-ms
BOOKING_MS_TCP_PORT=4004
PAYMENT_MS_TCP_HOST=payment-ms
PAYMENT_MS_TCP_PORT=4005

# Service Ports
USER_MS_PORT=3001
TRAIN_MS_PORT=3002
INVENTORY_MS_PORT=3003
BOOKING_MS_PORT=3004
PAYMENT_MS_PORT=3005

# Stripe Configuration (for payment-ms)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here

# Database URLs (auto-generated from above variables)
USER_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/User?schema=public
TRAIN_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Train?schema=public
INVENTORY_MS_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Inventory?schema=public
BOOKING_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Booking?schema=public
PAYMENT_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Payment?schema=public
ENV_EOF

echo "✅ Environment file created successfully!"
echo "📝 Generated secure database password and JWT secret"
echo "🔐 Please keep your .env file secure and never commit it to version control"
echo ""
echo "Next steps:"
echo "1. Review the generated .env file"
echo "2. Run: docker-compose up -d"
echo "3. Run database migrations for each service"
echo ""
echo "⚠️  IMPORTANT: Keep your .env file secure and never share it!"
