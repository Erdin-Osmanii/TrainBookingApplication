# Train-MS Microservice

A NestJS microservice for managing train, station, and schedule data with role-based access control and internal microservice communication.

## Features

- **Station Management**: CRUD operations for train stations
- **Train Management**: CRUD operations for trains
- **Schedule Management**: CRUD operations for train schedules and routes
- **Role-Based Access Control**: JWT authentication with ADMIN/CUSTOMER roles
- **Internal Service Communication**: Endpoints for other microservices (HTTP & TCP)

## Authentication & Authorization

### User Roles

- **CUSTOMER**: Can view all data (GET endpoints)
- **ADMIN**: Can perform all operations (GET, POST, PATCH, DELETE)

### JWT Token Structure

```json
{
  "email": "user@example.com",
  "sub": 1,
  "role": "ADMIN"
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Stations

- `GET /stations` - Get all stations
- `GET /stations/search?q=query` - Search stations
- `GET /stations/:id` - Get station by ID
- `GET /stations/code/:code` - Get station by code

#### Trains

- `GET /trains` - Get all trains
- `GET /trains/active` - Get active trains
- `GET /trains/search?q=query` - Search trains
- `GET /trains/:id` - Get train by ID
- `GET /trains/number/:trainNumber` - Get train by number
- `GET /trains/:id/schedules` - Get train schedules

#### Schedules

- `GET /schedules` - Get all schedules
- `GET /schedules/search?q=query` - Search schedules
- `GET /schedules/routes` - Get available routes
- `GET /schedules/date/:date` - Get schedules by date
- `GET /schedules/:id` - Get schedule by ID

### Admin-Only Endpoints (Require ADMIN Role)

#### Stations

- `POST /stations` - Create station
- `PATCH /stations/:id` - Update station
- `DELETE /stations/:id` - Delete station

#### Trains

- `POST /trains` - Create train
- `PATCH /trains/:id` - Update train
- `DELETE /trains/:id` - Delete train

#### Schedules

- `POST /schedules` - Create schedule
- `PATCH /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule

### Internal Service Communication (HTTP & TCP)

#### HTTP Internal Endpoints

- `GET /trains/internal/validate/:id` - Validate train exists
- `GET /trains/internal/details/:id` - Get train details
- `GET /schedules/internal/validate-route?departureStationId=X&arrivalStationId=Y` - Validate route
- `GET /schedules/internal/route-schedules?departureStationId=X&arrivalStationId=Y&date=YYYY-MM-DD` - Get route schedules
- `GET /schedules/internal/schedule/:id` - Get schedule details

#### TCP Endpoints (Microservice)

- `@MessagePattern({ cmd: 'validate-train' })` - Validate train by ID
- `@MessagePattern({ cmd: 'get-train-details' })` - Get train details by ID
- `@MessagePattern({ cmd: 'get-train-schedules' })` - Get train schedules by train ID
- `@MessagePattern({ cmd: 'get-train-by-number' })` - Get train by number
- `@MessagePattern({ cmd: 'validate-route' })` - Validate route
- `@MessagePattern({ cmd: 'get-route-schedules' })` - Get route schedules
- `@MessagePattern({ cmd: 'get-schedule-details' })` - Get schedule details

## Usage Examples

### 1. Get All Trains (Public)

```bash
curl -X GET http://localhost:3002/trains
```

### 2. Create a Train (Admin Only)

```bash
curl -X POST http://localhost:3002/trains \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainNumber": "T001",
    "name": "Express Train",
    "type": "EXPRESS",
    "capacity": 200
  }'
```

### 3. Create a Schedule (Admin Only)

```bash
curl -X POST http://localhost:3002/schedules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainId": 1,
    "departureStationId": 1,
    "arrivalStationId": 2,
    "departureTime": "2024-01-15T10:00:00Z",
    "arrivalTime": "2024-01-15T12:00:00Z",
    "duration": 120,
    "price": 50.00
  }'
```

## Error Responses

### Authentication Errors

```json
{
  "statusCode": 401,
  "message": "Invalid or missing JWT token"
}
```

### Authorization Errors

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### Validation Errors

```json
{
  "statusCode": 400,
  "message": ["field must be a string"]
}
```

## Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/traindb?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3002
```

## Project Setup

```bash
npm install
```

### Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Run the Application

```bash
# development
npm run start:dev

# production
npm run build
npm run start:prod
```

The service will run at:
**http://localhost:3002**

## Built With

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [JWT](https://jwt.io/)

**Made with ❤️ using NestJS Microservices**
