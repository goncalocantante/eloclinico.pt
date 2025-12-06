#!/bin/bash

# Script to reset the database completely

echo "🛑 Stopping Docker containers and removing volumes..."
docker compose down -v

echo "🚀 Starting fresh database..."
docker compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "📦 Running migrations..."
pnpm db:migrate

echo "✅ Database reset complete!"

