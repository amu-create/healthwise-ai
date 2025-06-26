#!/bin/bash
# Quick setup for first time users

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
    echo ""
    echo "⚠️  Please edit frontend/.env and add your Firebase configuration!"
    echo ""
fi

# Run Docker
echo "Starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

echo ""
echo "✅ Setup complete!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
