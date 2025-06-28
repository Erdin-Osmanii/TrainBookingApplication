#!/bin/bash

# Train Booking Application Environment Setup Script

echo "🚂 Setting up Train Booking Application environment..."

# Check if .env file already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/N)"
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

# TCP Communication (for booking-ms)
USER_MS_TCP_HOST=user-ms
USER_MS_TCP_PORT=4001
TRAIN_MS_TCP_HOST=train-ms
TRAIN_MS_TCP_PORT=4002
INVENTORY_MS_TCP_HOST=inventory-ms
INVENTORY_MS_TCP_PORT=4003

# Service Ports
USER_MS_PORT=3001
TRAIN_MS_PORT=3002
INVENTORY_MS_PORT=3003
BOOKING_MS_PORT=3004

# Database URLs (auto-generated from above variables)
USER_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/User?schema=public
TRAIN_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Train?schema=public
INVENTORY_MS_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Inventory?schema=public
BOOKING_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/Booking?schema=public
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
