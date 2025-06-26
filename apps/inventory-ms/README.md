# Inventory-MS Microservice

A NestJS microservice for managing train seat inventory, including seat holding, confirmation, release, and admin seat management. Supports role-based access control and internal microservice communication.

## Features

- **Seat Management**: CRUD operations for seats (admin only)
- **Seat Hold/Release/Confirm**: Hold, confirm, and release seats for booking
- **Availability**: Query seat availability for a schedule
- **Role-Based Access Control**: JWT authentication with ADMIN/CUSTOMER roles
- **Internal Service Communication**: Endpoints for other microservices

## Authentication & Authorization

### User Roles

- **CUSTOMER**: Can hold, confirm, and release seats
- **ADMIN**: Can perform all operations, including seat CRUD

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

- `GET /availability/schedule/:scheduleId` - Get seat availability for a schedule

### Seat Operations (Require JWT)

- `POST /seats/hold` - Hold seats (body: `{ scheduleId, seatIds, userId }`)
- `POST /seats/confirm` - Confirm held seats (body: `{ holdId }`)
- `POST /seats/release` - Release held seats (body: `{ holdId }`)
- `GET /seats/held-by-seat/:seatId` - Get hold info for a seat

### Admin-Only Endpoints (Require ADMIN Role)

- `POST /seats` - Create a seat (body: `{ seatNumber, scheduleId, trainId }`)
- `DELETE /seats` - Remove a seat (body: `{ seatId }`)

### Internal Service Communication (Microservice/TCP or HTTP)

- `@MessagePattern({ cmd: 'hold-seats' })` - Hold seats (microservice)
- `@MessagePattern({ cmd: 'confirm-seats' })` - Confirm seats (microservice)
- `@MessagePattern({ cmd: 'release-seats' })` - Release seats (microservice)
- `@MessagePattern({ cmd: 'get-held-by-seat-id' })` - Get hold info by seatId (microservice)

## Usage Examples

### 1. Get Seat Availability

```bash
curl -X GET http://localhost:3003/availability/schedule/1
```

### 2. Hold Seats (JWT Required)

```bash
curl -X POST http://localhost:3003/seats/hold \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": 1,
    "seatIds": ["seat1", "seat2"],
    "userId": "user-uuid"
  }'
```

### 3. Confirm Seats (JWT Required)

```bash
curl -X POST http://localhost:3003/seats/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "holdId": "hold-uuid"
  }'
```

### 4. Release Seats (JWT Required)

```bash
curl -X POST http://localhost:3003/seats/release \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "holdId": "hold-uuid"
  }'
```

### 5. Create a Seat (Admin Only)

```bash
curl -X POST http://localhost:3003/seats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatNumber": "A1",
    "scheduleId": 1,
    "trainId": 1
  }'
```

### 6. Remove a Seat (Admin Only)

```bash
curl -X DELETE http://localhost:3003/seats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatId": "seat-uuid"
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
  "message": ["seatNumber must be a string", "scheduleId must be a number"]
}
```

## Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/inventorydb?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3003
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
**http://localhost:3003**

## Built With

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [JWT](https://jwt.io/)

**Made with ❤️ using NestJS Microservices**
