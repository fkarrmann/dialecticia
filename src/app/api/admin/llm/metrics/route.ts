import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

// GET: Get LLM metrics and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const providerId = searchParams.get('providerId')
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Basic metrics
    const totalInteractions = await prisma.lLMInteraction.count({
      where: {
        createdAt: { gte: startDate },
        ...(providerId && { providerId })
      }
    })

    const totalCost = await prisma.lLMInteraction.aggregate({
      where: {
        createdAt: { gte: startDate },
        ...(providerId && { providerId })
      },
      _sum: { cost: true }
    })

    const avgLatency = await prisma.lLMInteraction.aggregate({
      where: {
        createdAt: { gte: startDate },
        success: true,
        ...(providerId && { providerId })
      },
      _avg: { latencyMs: true }
    })

    const totalTokens = await prisma.lLMInteraction.aggregate({
      where: {
        createdAt: { gte: startDate },
        ...(providerId && { providerId })
      },
      _sum: { 
        inputTokens: true, 
        outputTokens: true,
        totalTokens: true
      }
    })

    // Calculate success rate manually
    const successfulInteractions = await prisma.lLMInteraction.count({
      where: {
        createdAt: { gte: startDate },
        success: true,
        ...(providerId && { providerId })
      }
    })

    const successRate = totalInteractions > 0 ? (successfulInteractions / totalInteractions) * 100 : 0

    // Usage by function
    const usageByFunction = await prisma.lLMInteraction.groupBy({
      by: ['functionName'],
      where: {
        createdAt: { gte: startDate },
        ...(providerId && { providerId })
      },
      _count: true,
      _sum: { cost: true, totalTokens: true },
      _avg: { latencyMs: true },
      orderBy: { _count: { functionName: 'desc' } }
    })

    // Usage by model
    const usageByModel = await prisma.lLMInteraction.groupBy({
      by: ['modelId'],
      where: {
        createdAt: { gte: startDate },
        ...(providerId && { providerId })
      },
      _count: true,
      _sum: { cost: true, totalTokens: true },
      _avg: { latencyMs: true },
      orderBy: { _count: { modelId: 'desc' } }
    })

    // Get model details for the usage stats
    const modelIds = usageByModel.map(u => u.modelId).filter(Boolean) as string[]
    const models = await prisma.lLMModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, modelName: true, displayName: true }
    })

    const usageByModelWithNames = usageByModel.map(usage => ({
      ...usage,
      model: models.find(m => m.id === usage.modelId)
    }))

    // Daily usage - Fixed SQL query using Prisma groupBy instead of raw SQL
    const dailyInteractions = await prisma.lLMInteraction.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(providerId && { providerId })
      },
      select: {
        createdAt: true,
        cost: true,
        totalTokens: true,
        latencyMs: true,
        success: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by date manually since Prisma doesn't support DATE() in groupBy
    const dailyUsageMap = new Map()
    
    dailyInteractions.forEach(interaction => {
      const date = interaction.createdAt.toISOString().split('T')[0] // Get YYYY-MM-DD
      
      if (!dailyUsageMap.has(date)) {
        dailyUsageMap.set(date, {
          date,
          interactions: 0,
          cost: 0,
          tokens: 0,
          totalLatency: 0,
          successfulCount: 0
        })
      }
      
      const dayData = dailyUsageMap.get(date)
      dayData.interactions += 1
      dayData.cost += interaction.cost || 0
      dayData.tokens += interaction.totalTokens || 0
      
      if (interaction.success && interaction.latencyMs) {
        dayData.totalLatency += interaction.latencyMs
        dayData.successfulCount += 1
      }
    })

    const dailyUsage = Array.from(dailyUsageMap.values())
      .map(day => ({
        ...day,
        avgLatency: day.successfulCount > 0 ? day.totalLatency / day.successfulCount : 0
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)

    // Top prompts
    const topPrompts = await prisma.lLMInteraction.groupBy({
      by: ['promptTemplateId'],
      where: {
        createdAt: { gte: startDate },
        promptTemplateId: { not: null },
        ...(providerId && { providerId })
      },
      _count: true,
      _sum: { cost: true },
      orderBy: { _count: { promptTemplateId: 'desc' } },
      take: 10
    })

    // Get prompt details
    const promptIds = topPrompts.map(p => p.promptTemplateId).filter(Boolean) as string[]
    const prompts = await prisma.promptTemplate.findMany({
      where: { id: { in: promptIds } },
      select: { id: true, name: true, displayName: true, category: true }
    })

    const topPromptsWithNames = topPrompts.map(usage => ({
      ...usage,
      prompt: prompts.find(p => p.id === usage.promptTemplateId)
    }))

    // Error analysis
    const errorAnalysis = await prisma.lLMInteraction.groupBy({
      by: ['errorMessage'],
      where: {
        createdAt: { gte: startDate },
        success: false,
        errorMessage: { not: null },
        ...(providerId && { providerId })
      },
      _count: true,
      orderBy: { _count: { errorMessage: 'desc' } },
      take: 5
    })

    const metrics = {
      summary: {
        totalInteractions,
        totalCost: totalCost._sum.cost || 0,
        avgLatency: Math.round(avgLatency._avg.latencyMs || 0),
        totalTokens: totalTokens._sum.totalTokens || 0,
        inputTokens: totalTokens._sum.inputTokens || 0,
        outputTokens: totalTokens._sum.outputTokens || 0,
        successRate: Math.round(successRate * 100) / 100,
        timeRange: `${days} days`
      },
      usageByFunction: usageByFunction.map(u => ({
        function: u.functionName || 'unknown',
        interactions: u._count,
        cost: Math.round((u._sum.cost || 0) * 100) / 100,
        tokens: u._sum.totalTokens || 0,
        avgLatency: Math.round(u._avg.latencyMs || 0)
      })),
      usageByModel: usageByModelWithNames.map(u => ({
        modelId: u.modelId,
        modelName: u.model?.modelName || 'Unknown',
        displayName: u.model?.displayName || 'Unknown Model',
        interactions: u._count,
        cost: Math.round((u._sum.cost || 0) * 100) / 100,
        tokens: u._sum.totalTokens || 0,
        avgLatency: Math.round(u._avg.latencyMs || 0)
      })),
      dailyUsage: dailyUsage.map(day => ({
        date: day.date,
        interactions: day.interactions,
        cost: Math.round(day.cost * 100) / 100,
        tokens: day.tokens,
        avgLatency: Math.round(day.avgLatency)
      })),
      topPrompts: topPromptsWithNames.map(p => ({
        promptId: p.promptTemplateId,
        promptName: p.prompt?.name || 'Unknown',
        displayName: p.prompt?.displayName || 'Unknown Prompt',
        category: p.prompt?.category || 'unknown',
        interactions: p._count,
        cost: Math.round((p._sum.cost || 0) * 100) / 100
      })),
      errorAnalysis: errorAnalysis.map(e => ({
        error: e.errorMessage || 'Unknown error',
        count: e._count
      }))
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
} 