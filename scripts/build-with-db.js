#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting custom build with database setup...');

// Debug environment
console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');

try {
  console.log('📦 Step 1: Generate Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🗄️ Step 2: Apply database schema...');
  console.log('Running: npx prisma db push --force-reset');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
  
  console.log('🌱 Step 3: Seed essential data...');
  console.log('Running: npx tsx prisma/seed-essential.ts');
  execSync('npx tsx prisma/seed-essential.ts', { stdio: 'inherit' });
  
  console.log('🏗️ Step 4: Build Next.js app...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
} 