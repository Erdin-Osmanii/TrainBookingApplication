# Train-MS Microservice

A NestJS microservice for managing train-related data with role-based access control.

## Features

- **Station Management**: CRUD operations for train stations
- **Train Management**: CRUD operations for trains with different types
- **Schedule Management**: CRUD operations for train schedules and routes
- **Role-Based Access Control**: JWT authentication with ADMIN/CUSTOMER roles
- **Internal Service Communication**: Endpoints for other microservices

## Authentication & Authorization

### User Roles

- **CUSTOMER**: Can view all data (GET endpoints)
- **ADMIN**: Can perform all operations (GET, POST, PUT, DELETE)

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

All GET endpoints are public and can be accessed without authentication.

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

All POST, PUT, PATCH, and DELETE endpoints require ADMIN role.

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

### Internal Service Communication

These endpoints are designed for inter-service communication and don't require authentication.

- `GET /stations/internal/validate/:id` - Validate station exists
- `GET /stations/internal/details/:id` - Get station details
- `GET /trains/internal/validate/:id` - Validate train exists
- `GET /trains/internal/details/:id` - Get train details
- `GET /schedules/internal/validate-route?departureStationId=X&arrivalStationId=Y` - Validate route
- `GET /schedules/internal/route-schedules?departureStationId=X&arrivalStationId=Y&date=YYYY-MM-DD` - Get route schedules
- `GET /schedules/internal/schedule/:id` - Get schedule details

## Usage Examples

### 1. Get All Stations (Public)

```bash
curl -X GET http://localhost:3002/stations
```

### 2. Create a Station (Admin Only)

```bash
curl -X POST http://localhost:3002/stations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Central Station",
    "code": "CST",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "latitude": 40.7589,
    "longitude": -73.9851
  }'
```

### 3. Create a Train (Admin Only)

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

### 4. Create a Schedule (Admin Only)

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

### 5. Search for Routes (Public)

```bash
curl -X GET "http://localhost:3002/schedules/routes"
```

### 6. Get Schedules by Date (Public)

```bash
curl -X GET "http://localhost:3002/schedules/date/2024-01-15"
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
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ]
}
```

## Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/traindb?schema=public"
JWT_SECRET="your-secret-key"
PORT=3002
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env`

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run database migrations:

```bash
npm run prisma:migrate
```

5. Start the service:

```bash
npm run start:dev
```

## Database Schema

The service uses PostgreSQL with the following main entities:

- **Station**: Train stations with location data
- **Train**: Trains with type and capacity information
- **Schedule**: Train schedules with routes and timing

## Security Considerations

- JWT tokens are validated on every protected request
- Role-based access control is enforced at the controller level
- All user inputs are validated using DTOs
- Sensitive operations require ADMIN role
- Internal endpoints are available for service-to-service communication
