#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting custom build with database setup...');

// Debug environment
console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');

// Check if using Prisma Accelerate
const isPrismaAccelerate = process.env.DATABASE_URL?.startsWith('prisma://');
console.log('Using Prisma Accelerate:', isPrismaAccelerate);

try {
  console.log('📦 Step 1: Generate Prisma client...');
  if (isPrismaAccelerate) {
    console.log('Using Prisma Accelerate - generating with --accelerate flag');
    execSync('npx prisma generate --accelerate', { stdio: 'inherit' });
  } else {
    execSync('npx prisma generate', { stdio: 'inherit' });
  }
  
  if (isPrismaAccelerate) {
    console.log('🗄️ Step 2: Skipping db push for Prisma Accelerate (schema managed externally)');
    console.log('⚠️ Make sure your Prisma Accelerate database has the correct schema');
    
    console.log('🌱 Step 3: Seed essential data (if schema exists)...');
    try {
      execSync('npx tsx prisma/seed-essential.ts', { stdio: 'inherit' });
    } catch (seedError) {
      console.log('⚠️ Seed failed - might be because schema not applied yet. This is OK for first deployment.');
      console.log('Seed error:', seedError.message);
    }
  } else {
    console.log('🗄️ Step 2: Apply database schema...');
    console.log('Running: npx prisma db push');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('🌱 Step 3: Seed essential data...');
    console.log('Running: npx tsx prisma/seed-essential.ts');
    execSync('npx tsx prisma/seed-essential.ts', { stdio: 'inherit' });
  }
  
  console.log('🏗️ Step 4: Build Next.js app...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
  if (isPrismaAccelerate) {
    console.log('📋 IMPORTANT: If this is first deployment, apply schema manually to your Prisma Accelerate database');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
} 