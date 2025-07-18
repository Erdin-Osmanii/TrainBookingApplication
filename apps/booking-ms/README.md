# Booking Microservice

A NestJS microservice that orchestrates the train booking process across multiple microservices. This service coordinates between the user, train, inventory, and payment microservices to provide a seamless booking experience with persistent storage.

## Features

- **Booking Orchestration**: Coordinates booking creation, confirmation, and cancellation across microservices
- **Seat Management**: Integrates with inventory-ms for seat holding, confirmation, and release
- **User Validation**: Validates users through user-ms
- **Schedule Validation**: Validates train schedules through train-ms
- **Payment Integration**: Processes payments through payment-ms with Stripe
- **JWT Authentication**: Secure endpoints with JWT token validation and user extraction
- **Persistent Storage**: PostgreSQL database storage for booking records with Prisma ORM
- **Error Handling**: Comprehensive error handling and logging
- **Microservice Communication**: TCP-based communication with other microservices
- **Hybrid Architecture**: Supports both HTTP endpoints and TCP microservice communication

## Architecture

The booking-ms acts as an orchestration layer that:

1. **Validates** user and schedule data through respective microservices
2. **Holds** seats in inventory-ms during booking creation
3. **Processes** payments through payment-ms during confirmation
4. **Confirms** or **releases** seats based on user actions
5. **Maintains** booking state in PostgreSQL database
6. **Coordinates** the entire booking workflow
7. **Extracts** user information from JWT tokens
8. **Supports** both HTTP and TCP communication patterns

## Ports

- **HTTP API**: Port 3004 (public endpoints)
- **TCP Microservice**: Port 4004 (internal communication)

## API Endpoints

### Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT token should contain:

- `sub`: User ID
- `email`: User email
- `role`: User role (CUSTOMER or ADMIN)

### Create Booking

**POST** `/bookings`

Creates a new booking and holds the specified seats.

**Request Body:**

```json
{
  "scheduleId": 1,
  "seatIds": ["1", "2", "3"],
  "notes": "Window seats preferred"
}
```

**Response:**

```json
{
  "bookingId": "booking_1",
  "status": "PENDING",
  "holdIds": ["hold_1", "hold_2", "hold_3"],
  "message": "Booking created successfully. Seats are held for 15 minutes."
}
```

### Confirm Booking

**POST** `/bookings/confirm`

Confirms a pending booking and permanently reserves the seats.

**Request Body:**

```json
{
  "bookingId": "booking_1"
}
```

**Response:**

```json
{
  "bookingId": "booking_1",
  "status": "CONFIRMED",
  "confirmedAt": "2024-01-15T10:30:00.000Z",
  "message": "Booking confirmed successfully"
}
```

### Cancel Booking

**POST** `/bookings/cancel`

Cancels a booking and releases held seats.

**Request Body:**

```json
{
  "bookingId": "booking_1"
}
```

**Response:**

```json
{
  "bookingId": "booking_1",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-15T10:35:00.000Z",
  "message": "Booking cancelled successfully"
}
```

### Get User Bookings

**GET** `/bookings`

Retrieves all bookings for the authenticated user.

**Response:**

```json
{
  "bookings": [
    {
      "id": "booking_1",
      "scheduleId": 1,
      "seats": [
        {
          "id": "seat_1",
          "seatNumber": "A1"
        }
      ],
      "status": "CONFIRMED",
      "notes": "Window seat preferred",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "confirmedAt": "2024-01-15T10:32:00.000Z",
      "cancelledAt": null
    }
  ],
  "count": 1
}
```

### Get Booking Details

**GET** `/bookings/:bookingId`

Retrieves detailed booking information including schedule and seat details.

**Response:**

```json
{
  "id": "booking_1",
  "scheduleId": 1,
  "seats": [
    {
      "id": "seat_1",
      "seatNumber": "A1"
    }
  ],
  "status": "CONFIRMED",
  "notes": "Window seat preferred",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "confirmedAt": "2024-01-15T10:32:00.000Z",
  "cancelledAt": null,
  "schedule": {
    "origin": "New York",
    "destination": "Boston",
    "departureTime": "2024-01-15T10:00:00.000Z",
    "arrivalTime": "2024-01-15T12:00:00.000Z",
    "trainNumber": "T123",
    "trainName": "Northeast Express"
  }
}
```

## Microservice TCP Endpoints

### Create Booking (TCP)

**Pattern**: `{ cmd: 'create-booking' }`

**Payload:**

```json
{
  "dto": {
    "scheduleId": 1,
    "seatIds": ["1", "2", "3"],
    "notes": "Window seats preferred"
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

### Confirm Booking (TCP)

**Pattern**: `{ cmd: 'confirm-booking' }`

**Payload:**

```json
{
  "dto": {
    "bookingId": "booking_1"
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

### Cancel Booking (TCP)

**Pattern**: `{ cmd: 'cancel-booking' }`

**Payload:**

```json
{
  "dto": {
    "bookingId": "booking_1"
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Cannot confirm booking with status CONFIRMED",
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "You can only confirm your own bookings",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Booking not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3004

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/booking_db

# Microservice URLs
USER_MS_URL=http://localhost:3001
TRAIN_MS_URL=http://localhost:3002
INVENTORY_MS_URL=http://localhost:3003
PAYMENT_MS_URL=http://localhost:3005

# TCP Communication
USER_MS_TCP_HOST=localhost
USER_MS_TCP_PORT=4001
TRAIN_MS_TCP_HOST=localhost
TRAIN_MS_TCP_PORT=4002
INVENTORY_MS_TCP_HOST=localhost
INVENTORY_MS_TCP_PORT=4003
PAYMENT_MS_TCP_HOST=localhost
PAYMENT_MS_TCP_PORT=4005
```

## Installation & Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start the service:**

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## Dependencies

- **@nestjs/common**: NestJS core framework
- **@nestjs/config**: Configuration management
- **@nestjs/jwt**: JWT authentication
- **@nestjs/microservices**: Microservice communication
- **@nestjs/passport**: Authentication strategies
- **@nestjs/platform-express**: Express platform
- **@prisma/client**: Prisma ORM client
- **class-transformer**: Object transformation
- **class-validator**: Validation decorators
- **passport-jwt**: JWT passport strategy
- **rxjs**: Reactive programming

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

## Microservice Communication

The booking-ms communicates with other microservices using TCP clients:

- **UserClient**: Validates user existence and permissions
- **TrainClient**: Validates train schedules and retrieves schedule information
- **InventoryClient**: Manages seat holds, confirmations, and releases
- **PaymentClient**: Processes payments and refunds

## JWT User Extraction

The service extracts user information from JWT tokens using:

- **JwtStrategy**: Validates JWT tokens and extracts user payload
- **User Decorator**: Extracts user information from request context
- **JwtAuthGuard**: Protects endpoints with JWT authentication

User information includes:

- `id`: User ID from JWT sub claim
- `email`: User email from JWT payload
- `role`: User role (CUSTOMER or ADMIN)

## Booking Workflow

1. **Create Booking**:
   - Extract user from JWT token
   - Validate user exists
   - Validate schedule exists
   - Hold seats in inventory-ms
   - Create booking record with PENDING status in database

2. **Confirm Booking**:
   - Extract user from JWT token
   - Validate booking ownership
   - Process payment through payment-ms
   - Confirm all seat holds in inventory-ms
   - Update booking status to CONFIRMED in database

3. **Cancel Booking**:
   - Extract user from JWT token
   - Validate booking ownership
   - Process refund through payment-ms if payment was made
   - Release seat holds if still PENDING
   - Update booking status to CANCELLED in database

## Database Schema

The service uses a `Booking` model with the following fields:

- `id`: Unique booking identifier
- `userId`: User who made the booking
- `scheduleId`: Associated train schedule
- `status`: Booking status (PENDING, CONFIRMED, CANCELLED)
- `notes`: Optional booking notes
- `createdAt`: Booking creation timestamp
- `confirmedAt`: Booking confirmation timestamp
- `cancelledAt`: Booking cancellation timestamp

## Notes

- This service uses PostgreSQL database for persistent booking storage
- Booking data is persisted across service restarts
- The service integrates with payment-ms for payment processing
- Enhanced seat information includes both seat ID and seat number
- Supports both HTTP API and TCP microservice communication patterns
- User information is extracted from JWT tokens for all operations
