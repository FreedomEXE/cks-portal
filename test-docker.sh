#!/bin/bash

echo "🚀 Starting CKS Portal Docker Testing Environment..."

# Build and start services
echo "📦 Building Docker containers..."
docker-compose up --build -d frontend backend

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Run cross-browser tests
echo "🧪 Running cross-browser tests..."
docker-compose run --rm playwright

# Show results
echo "📊 Test Results:"
echo "- Screenshots saved in tests/screenshots/"
echo "- HTML report available at playwright-report/index.html"

# Keep services running for manual testing
echo "🔍 Services running at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop services..."
docker-compose logs -f