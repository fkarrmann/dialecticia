import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const philosophers = await prisma.philosopher.findMany({
      where: {
        isActive: true,
        OR: [
          { isPublic: true },
          { isDefault: true }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        philosophicalSchool: true,
        personalityTraits: true,
        coreBeliefs: true,
        argumentStyle: true,
        questioningApproach: true,
        isActive: true,
        isDefault: true,
        isPublic: true,
        photoUrl: true,
        publicDescription: true,
        inspirationSource: true,
        debateMechanics: true,
        tags: true,
        rating: true,
        totalRatings: true,
        usageCount: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { rating: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      philosophers,
      count: philosophers.length
    });

  } catch (error) {
    console.error('Error fetching philosophers:', error);
    return NextResponse.json({ 
      error: 'Error fetching philosophers', 
      details: error instanceof Error ? error.message : 'Unknown error',
      philosophers: [],
      count: 0
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 