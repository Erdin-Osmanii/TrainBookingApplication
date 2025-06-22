# User Microservice - NestJS

This is a **User Microservice** built using [NestJS](https://nestjs.com/) with support for user CRUD operations and authentication. It follows a modular architecture using Prisma ORM for PostgreSQL and is designed to run as part of a microservice-based system.

## 📁 Project Structure

```
apps/user-ms/src/
├── prisma/
│   ├── prisma.service.ts      # Prisma client initialization
│   └── prisma.module.ts       # Prisma module for DI
├── user/
│   ├── dto/                   # DTOs for validation
│   ├── schemas/               # User-related schema definitions
│   ├── user.service.ts        # Business logic
│   ├── user.controller.ts     # REST endpoints
│   └── user.module.ts         # User module
├── auth/
│   ├── dto/                   # Login DTO
│   ├── schemas/               # Auth-related schemas
│   ├── auth.service.ts        # Auth logic (login/register)
│   ├── auth.controller.ts     # Auth endpoints
│   └── auth.module.ts         # Auth module
├── app.controller.ts          # Optional root controller
├── app.service.ts             # Optional root service
├── app.module.ts              # Main app module
└── main.ts                    # Application bootstrap
```

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18.x)
- npm or yarn
- PostgreSQL
- [Prisma CLI](https://www.prisma.io/docs/reference/api-reference/command-reference)

### Installation

```bash
npm install
# or
yarn install
```

### Environment Variables

Create a `.env` file in the root and configure your database:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/yourdbname"
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

## 🧠 API Endpoints

### 👤 User CRUD

| Method | Endpoint     | Description       |
| ------ | ------------ | ----------------- |
| POST   | `/users`     | Create a new user |
| GET    | `/users`     | Get all users     |
| GET    | `/users/:id` | Get user by ID    |
| PATCH  | `/users/:id` | Update user       |
| DELETE | `/users/:id` | Delete user       |

> ⚠️ The update endpoint ensures **email uniqueness**.

### 🔐 Authentication

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | `/auth/login`    | Login with email/password |
| POST   | `/auth/register` | Register new user         |

## 🧪 Testing

TBD (You can add `Jest` or `Supertest` support for integration tests.)

## 📦 Built With

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [JWT](https://jwt.io/)

**Made with ❤️ using NestJS Microservices**
