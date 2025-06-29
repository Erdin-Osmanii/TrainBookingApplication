# Train Booking Application

A microservices-based train booking system built with NestJS, featuring user management, train scheduling, inventory management, booking orchestration, and payment processing with persistent storage and enhanced seat information.

## Architecture

The application consists of five microservices, each supporting both HTTP API and TCP microservice communication:

- **user-ms**: User management and authentication
  - HTTP API: Port 3001
  - TCP Microservice: Port 4001
- **train-ms**: Train and schedule management
  - HTTP API: Port 3002
  - TCP Microservice: Port 4002
- **inventory-ms**: Seat inventory and availability management
  - HTTP API: Port 3003
  - TCP Microservice: Port 4003
- **booking-ms**: Booking orchestration and workflow management with persistent storage
  - HTTP API: Port 3004
  - TCP Microservice: Port 4004
- **payment-ms**: Payment processing with Stripe integration
  - HTTP API: Port 3005
  - TCP Microservice: Port 4005

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker and Docker Compose

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd TrainBookingApplication
   ```

2. **Set up environment variables**

   ```bash
   # Option 1: Use the automated setup script (recommended)
   ./setup-env.sh

   # Option 2: Manual setup
   cp .env.example .env
   # Edit .env file with your secure values
   ```

   The setup script will:

   - Generate secure random passwords and JWT secrets
   - Create a `.env` file with all required variables
   - Set up proper database URLs

3. **Start all services**

   ```bash
   docker-compose up -d
   ```

4. **Access the services**
   - User MS: http://localhost:3001 (HTTP) / localhost:4001 (TCP)
   - Train MS: http://localhost:3002 (HTTP) / localhost:4002 (TCP)
   - Inventory MS: http://localhost:3003 (HTTP) / localhost:4003 (TCP)
   - Booking MS: http://localhost:3004 (HTTP) / localhost:4004 (TCP)
   - Payment MS: http://localhost:3005 (HTTP) / localhost:4005 (TCP)

### Manual Setup (Alternative)

If you prefer to run services individually:

1. **Set up environment variables** (see Environment Variables section below)

2. **Start PostgreSQL**

   ```bash
   # Using Docker with environment variables
   docker run -d --name postgres \
     -e POSTGRES_USER=${POSTGRES_USER} \
     -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
     -e POSTGRES_DB=${POSTGRES_DB} \
     -p ${POSTGRES_PORT}:5432 \
     postgres:15
   ```

3. **Setup each microservice**

   ```bash
   # For each microservice (user-ms, train-ms, inventory-ms, booking-ms, payment-ms)
   cd apps/<service-name>
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run start:dev
   ```

## Environment Variables

The application uses environment variables for secure configuration. Create a `.env` file in the root directory:

### Required Environment Variables

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Service URLs (for booking-ms)
USER_MS_URL=http://user-ms:3001
TRAIN_MS_URL=http://train-ms:3002
INVENTORY_MS_URL=http://inventory-ms:3003
PAYMENT_MS_URL=http://payment-ms:3005

# TCP Communication (for booking-ms)
USER_MS_TCP_HOST=user-ms
USER_MS_TCP_PORT=4001
TRAIN_MS_TCP_HOST=train-ms
TRAIN_MS_TCP_PORT=4002
INVENTORY_MS_TCP_HOST=inventory-ms
INVENTORY_MS_TCP_PORT=4003
PAYMENT_MS_TCP_HOST=payment-ms
PAYMENT_MS_TCP_PORT=4005

# Service Ports
USER_MS_PORT=3001
TRAIN_MS_PORT=3002
INVENTORY_MS_PORT=3003
BOOKING_MS_PORT=3004
PAYMENT_MS_PORT=3005

# Stripe Configuration (for payment-ms)
STRIPE_SECRET_KEY=your-stripe-secret-key-here

# Database URLs (auto-generated from above variables)
USER_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/User?schema=public
TRAIN_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/Train?schema=public
INVENTORY_MS_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/Inventory?schema=public
BOOKING_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/Booking?schema=public
PAYMENT_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/Payment?schema=public
```

### Security Notes

- **Never commit `.env` files** to version control
- **Use strong, unique passwords** for production
- **Rotate JWT secrets** regularly
- **Use different databases** for each microservice in production
- **Consider using a secrets management service** for production deployments

## API Documentation

### Authentication

All services use JWT authentication. Get a token by logging in through the user-ms:

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

Use the returned token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The JWT token contains:

- `sub`: User ID
- `email`: User email
- `role`: User role (CUSTOMER or ADMIN)

### User Management (user-ms)

**HTTP Endpoints:**

- `POST /auth/login` - User login
- `GET /users` - Get all users (admin only)
- `POST /users` - Create new user
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (admin only)

**TCP Endpoints:**

- `{ cmd: 'validate-user' }` - Validate user by ID
- `{ cmd: 'get-user-by-email' }` - Get user by email
- `{ cmd: 'get-user-details' }` - Get user details by ID

### Train Management (train-ms)

**HTTP Endpoints:**

- `GET /trains` - Get all trains
- `POST /trains` - Create train (admin only)
- `GET /trains/:id` - Get train by ID
- `PUT /trains/:id` - Update train (admin only)
- `DELETE /trains/:id` - Delete train (admin only)
- `GET /schedules` - Get all schedules
- `POST /schedules` - Create schedule (admin only)
- `GET /schedules/:id` - Get schedule by ID
- `PUT /schedules/:id` - Update schedule (admin only)
- `DELETE /schedules/:id` - Delete schedule (admin only)
- `GET /stations` - Get all stations
- `POST /stations` - Create station (admin only)
- `GET /stations/:id` - Get station by ID
- `PUT /stations/:id` - Update station (admin only)
- `DELETE /stations/:id` - Delete station (admin only)

**TCP Endpoints:**

- `{ cmd: 'validate-schedule' }` - Validate schedule by ID
- `{ cmd: 'get-schedule-details' }` - Get schedule details by ID

### Inventory Management (inventory-ms)

**HTTP Endpoints:**

- `GET /availability/schedule/:scheduleId` - Check seat availability
- `POST /seats/hold` - Hold seats
- `POST /seats/confirm` - Confirm seat holds
- `POST /seats/release` - Release seat holds
- `GET /seats/held-by-seat/:seatId` - Get hold info by seat ID
- `GET /seats` - Get all seats (admin only)
- `POST /seats` - Create seat (admin only)
- `DELETE /seats` - Remove seat (admin only)

**TCP Endpoints:**

- `{ cmd: 'hold-seats' }` - Hold seats
- `{ cmd: 'confirm-seats' }` - Confirm seat holds
- `{ cmd: 'release-seats' }` - Release seat holds
- `{ cmd: 'release-reserved-seats' }` - Release reserved seats
- `{ cmd: 'get-held-by-seat-id' }` - Get hold info by seat ID
- `{ cmd: 'get-seat-details' }` - Get seat details by seat IDs

### Booking Management (booking-ms)

**HTTP Endpoints:**

- `POST /bookings` - Create new booking
- `POST /bookings/confirm` - Confirm pending booking
- `POST /bookings/cancel` - Cancel booking
- `GET /bookings` - Get all bookings for the authenticated user
- `GET /bookings/:bookingId` - Get specific booking details with schedule and seat information

**TCP Endpoints:**

- `{ cmd: 'create-booking' }` - Create new booking
- `{ cmd: 'confirm-booking' }` - Confirm pending booking
- `{ cmd: 'cancel-booking' }` - Cancel booking

### Payment Management (payment-ms)

**HTTP Endpoints:**

- `POST /payments` - Process payment for booking
- `POST /payments/refund` - Process refund for booking
- `GET /payments/booking/:bookingId` - Get payment details for booking

**TCP Endpoints:**

- `{ cmd: 'process-payment' }` - Process payment with card details
- `{ cmd: 'process-refund' }` - Process refund for booking

## Booking Workflow

1. **User Authentication**: Login through user-ms to get JWT token
2. **Schedule Selection**: Browse available schedules through train-ms
3. **Seat Selection**: Check seat availability through inventory-ms
4. **Booking Creation**: Create booking through booking-ms (holds seats for 15 minutes)
5. **Payment Processing**: Process payment through payment-ms using Stripe
6. **Booking Confirmation**: Confirm booking to finalize seat reservation
7. **Booking Management**: View, manage, and cancel bookings as needed

## Enhanced Features

### Persistent Booking Storage

- **Database Integration**: Bookings are now stored in PostgreSQL using Prisma ORM
- **Booking States**: PENDING → CONFIRMED → CANCELLED
- **Audit Trail**: Created, confirmed, and cancelled timestamps
- **Data Integrity**: Proper foreign key relationships and constraints

### Enhanced Seat Information

- **Seat Details**: Both seat ID and seat number are returned in booking responses
- **Rich Booking Data**: Complete booking information including schedule details
- **User-Friendly**: Seat numbers make it easier for users to identify their seats

### New Endpoints

- **User Bookings**: `GET /bookings` - Retrieve all bookings for authenticated user
- **Booking Details**: `GET /bookings/:bookingId` - Get detailed booking information
- **Seat Information**: Enhanced responses include seat numbers and schedule details

### Microservice Communication

- **TCP Protocol**: All inter-service communication uses TCP for better performance
- **Type Safety**: Proper DTOs for all microservice communications
- **Error Handling**: Comprehensive error handling and logging
- **Seat Details**: New endpoint to fetch seat information from inventory service

### Payment Integration

- **Stripe Integration**: Secure payment processing with Stripe
- **Test Card Support**: Automatic mapping of test card numbers to Stripe test tokens
- **Refund Processing**: Automatic refund processing for cancelled bookings
- **Payment Tracking**: Complete payment history and status tracking

## API Examples

### Create a Booking

```http
POST http://localhost:3004/bookings
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "scheduleId": 8,
  "seatIds": ["cmcan7d920005f9eyny5brx4g"],
  "notes": "Window seat preferred"
}
```

**Response:**

```json
{
  "bookingId": "cmcgav43k0003f9gvfd56v73t",
  "status": "PENDING",
  "holdIds": ["cmcgav43k0003f9gvfd56v73t"],
  "message": "Booking created successfully. Seats are held for 15 minutes."
}
```

### Get User Bookings

```http
GET http://localhost:3004/bookings
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "bookings": [
    {
      "id": "cmcgav43k0003f9gvfd56v73t",
      "scheduleId": 8,
      "seats": [
        {
          "id": "cmcan7d920005f9eyny5brx4g",
          "seatNumber": "A1"
        }
      ],
      "status": "CONFIRMED",
      "notes": "Window seat preferred",
      "createdAt": "2025-06-28T15:30:00.000Z",
      "confirmedAt": "2025-06-28T15:32:00.000Z",
      "cancelledAt": null
    }
  ],
  "count": 1
}
```

### Get Booking Details

```http
GET http://localhost:3004/bookings/cmcgav43k0003f9gvfd56v73t
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "id": "cmcgav43k0003f9gvfd56v73t",
  "scheduleId": 8,
  "seats": [
    {
      "id": "cmcan7d920005f9eyny5brx4g",
      "seatNumber": "A1"
    }
  ],
  "status": "CONFIRMED",
  "notes": "Window seat preferred",
  "createdAt": "2025-06-28T15:30:00.000Z",
  "confirmedAt": "2025-06-28T15:32:00.000Z",
  "cancelledAt": null,
  "schedule": {
    "origin": "New York",
    "destination": "Boston",
    "departureTime": "2025-06-28T10:00:00.000Z",
    "arrivalTime": "2025-06-28T12:00:00.000Z",
    "trainNumber": "T123",
    "trainName": "Northeast Express"
  }
}
```

### Process Payment

```http
POST http://localhost:3005/payments
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "bookingId": "cmcgav43k0003f9gvfd56v73t",
  "userId": "user_456",
  "amount": 150.00,
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
  "bookingId": "cmcgav43k0003f9gvfd56v73t",
  "amount": 150.0,
  "status": "PAID"
}
```

## Database Schema

Each microservice has its own database with the following schemas:

### User Database

- **User**: Users, roles, authentication
- **Auth**: JWT tokens and session management

### Train Database

- **Train**: Trains, schedules, stations
- **Schedule**: Train schedules with origin/destination
- **Station**: Station information

### Inventory Database

- **Seat**: Seats with seat numbers and status
- **SeatHold**: Temporary seat holds
- **Reservation**: Confirmed seat reservations

### Booking Database

- **Booking**: Persistent booking records with status tracking
- **BookingStatus**: Enum for booking states (PENDING, CONFIRMED, CANCELLED)

### Payment Database

- **Payment**: Payment records with Stripe integration
- **PaymentStatus**: Enum for payment states (PENDING, PAID, FAILED, REFUNDED)

## Development

### Project Structure

```
TrainBookingApplication/
├── apps/
│   ├── user-ms/          # User management service
│   ├── train-ms/         # Train management service
│   ├── inventory-ms/     # Inventory management service
│   ├── booking-ms/       # Booking orchestration service
│   └── payment-ms/       # Payment processing service
├── docker-compose.yml    # Docker orchestration
└── README.md            # This file
```

### Adding New Features

1. **Backend Changes**: Modify the appropriate microservice
2. **Database Changes**: Update Prisma schema and run migrations
3. **API Changes**: Update DTOs and controllers
4. **Testing**: Add unit and integration tests

> **Note**: For environment variable configuration, see the [Environment Variables](#environment-variables) section above.

## Testing

### Unit Tests

```bash
cd apps/<service-name>
npm run test
```

### E2E Tests

```bash
cd apps/<service-name>
npm run test:e2e
```

## Microservice Communication

The services communicate using both HTTP and TCP protocols:

- **HTTP**: Used for public API endpoints and external communication
- **TCP**: Used for internal microservice-to-microservice communication
- **JWT**: Used for authentication and user context across all services
- **DTOs**: Type-safe data transfer objects for all communications

## Technical Improvements

### Type Safety

- **Prisma Integration**: Full type safety with generated Prisma client
- **DTO Validation**: Class-validator decorators for request validation
- **Microservice DTOs**: Proper typing for all inter-service communication

### Error Handling

- **Comprehensive Logging**: Detailed error logging with context
- **Graceful Degradation**: Proper error responses and fallbacks
- **User-Friendly Messages**: Clear error messages for end users

### Performance

- **TCP Communication**: Fast inter-service communication
- **Database Optimization**: Proper indexing and query optimization
- **Connection Pooling**: Efficient database connection management

## Notes

- All services support hybrid architecture (HTTP + TCP)
- JWT tokens are used for authentication and user context extraction
- All services now use persistent PostgreSQL storage
- Services can be scaled independently
- Docker Compose includes all necessary ports for both HTTP and TCP communication
- Enhanced seat information provides better user experience

## Deployment

### Production Considerations

1. **Security**:
   - Use strong, unique passwords for all databases
   - Rotate JWT secrets regularly
   - Never commit `.env` files to version control
   - Use secrets management services (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Enable SSL/TLS for database connections
2. **Database**: Use production PostgreSQL instance with proper backups
3. **Environment**: Set NODE_ENV=production
4. **Monitoring**: Add logging and monitoring
5. **Scaling**: Use load balancers and multiple instances
6. **Data Migration**: Plan for database schema updates

### Docker Deployment

```bash
# Set up environment variables first
./setup-env.sh

# Build and start all services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Management

For production deployments:

1. **Create production environment file**:

   ```bash
   cp .env.example .env.production
   # Edit with production values
   ```

2. **Use environment-specific compose file**:

   ```bash
   docker-compose -f docker-compose.yml --env-file .env.production up -d
   ```

3. **Consider using Docker secrets** for sensitive data:
   ```yaml
   # In docker-compose.yml
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
