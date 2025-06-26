# User Microservice - NestJS

This is a **User Microservice** built using [NestJS](https://nestjs.com/) with support for user CRUD operations, authentication, and internal microservice communication. It uses Prisma ORM for PostgreSQL and is designed for a microservice-based system.

## Features

- User CRUD (create, read, update, delete)
- User role management (ADMIN/CUSTOMER)
- JWT authentication (login/register)
- Internal endpoints for service-to-service communication (TCP)
- Prisma ORM for PostgreSQL

## Authentication & Authorization

### User Roles

- **CUSTOMER**: Can register, login, and update their own data
- **ADMIN**: Can update user roles and perform all operations

### JWT Token Structure

```json
{
  "email": "user@example.com",
  "sub": 1,
  "role": "ADMIN"
}
```

## API Endpoints

### Public Endpoints

- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register a new user

### User Endpoints

- `POST /users` - Create a new user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/role` (ADMIN only) - Update user role
- `DELETE /users/:id` - Delete user

### Internal Service Communication (TCP)

- `@MessagePattern({ cmd: 'validate-user' })` - Validate user by ID
- `@MessagePattern({ cmd: 'get-user-by-email' })` - Get user by email
- `@MessagePattern({ cmd: 'get-user-details' })` - Get user details by ID

## Usage Examples

### 1. Register a User

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Get All Users (JWT Required)

```bash
curl -X GET http://localhost:3001/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update User Role (Admin Only)

```bash
curl -X PATCH http://localhost:3001/users/1/role \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "role": "ADMIN" }'
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
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/userdb"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
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
**http://localhost:3001**

## Built With

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [JWT](https://jwt.io/)

**Made with ❤️ using NestJS Microservices**
