#!/bin/bash
set -e

echo "🔍 Running checks..."
echo ""

# Check backend
echo "📦 Checking backend..."
cd backend
npm install --silent
npm run build
npm test
cd ..

echo ""
echo "⚛️  Checking frontend..."
# Check frontend
npm install --silent
npm run lint
npm run build

echo ""
echo "✅ All checks passed!"
