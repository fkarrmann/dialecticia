#!/bin/bash

echo "🚨 NUCLEAR CACHE CLEANUP - Starting complete Prisma regeneration..."

# Remove all possible Prisma cache locations
rm -rf .next
rm -rf .prisma
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf prisma/generated

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Generating Prisma client with force flag..."
npx prisma generate --no-engine

echo "🏗️ Building Next.js application..."
npx next build

echo "✅ Nuclear cleanup and build completed!" 