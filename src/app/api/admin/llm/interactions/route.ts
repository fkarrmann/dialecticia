import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

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
    const limit = parseInt(searchParams.get('limit') || '50')
    const functionName = searchParams.get('functionName')
    const providerId = searchParams.get('providerId')
    const success = searchParams.get('success')

    // Build where clause
    const where: any = {}
    if (functionName) {
      // Find prompt template by name
      const promptTemplate = await prisma.promptTemplate.findFirst({
        where: { name: functionName }
      })
      if (promptTemplate) {
        where.promptTemplateId = promptTemplate.id
      }
    }
    if (success !== null && success !== undefined) {
      where.success = success === 'true'
    }

    // Get interactions with full details
    const interactions = await prisma.lLMInteraction.findMany({
      where,
      include: {
        model: {
          include: {
            provider: true
          }
        },
        promptTemplate: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Get recent debate messages to correlate with interactions
    const recentMessages = await prisma.message.findMany({
      where: {
        senderType: 'AI',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        debate: {
          select: {
            topic: true,
            id: true
          }
        },
        philosopher: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    })

    // Enhanced interactions with stored prompts and responses
    const enhancedInteractions = await Promise.all(
      interactions.map(async (interaction) => {
        // Try to find corresponding debate message
        const correspondingMessage = recentMessages.find(msg => {
          const timeDiff = Math.abs(
            new Date(msg.timestamp).getTime() - new Date(interaction.createdAt).getTime()
          )
          return timeDiff < 30000 // Within 30 seconds
        })

        // Get stored prompt data if available
        let systemPrompt = null
        let userPrompt = null
        let response = null

        // Try to reconstruct the prompt from the template and recent context
        if (interaction.promptTemplate) {
          try {
            // For philosopher_chat_system, try to get the actual prompt used
                         if (interaction.promptTemplate.name === 'philosopher_chat_system' && correspondingMessage) {
               const philosopher = correspondingMessage.philosopher
               if (philosopher) {
                 // Get philosopher details - need to find by name since we only have name in the select
                 const fullPhilosopher = await prisma.philosopher.findFirst({
                   where: { name: philosopher.name },
                   include: {
                     personalityAspects: true
                   }
                 })

                if (fullPhilosopher) {
                  // Reconstruct the system prompt
                  systemPrompt = await reconstructSystemPrompt(
                    interaction.promptTemplate.template,
                    fullPhilosopher
                  )
                }
              }
            } else {
              // For other prompts, use the template as-is
              systemPrompt = interaction.promptTemplate.template
            }
          } catch (error) {
            console.error('Error reconstructing prompt:', error)
            systemPrompt = interaction.promptTemplate.template
          }
        }

        // Get the actual response from the message if available
        if (correspondingMessage) {
          response = correspondingMessage.content
          
          // Try to reconstruct user prompt for chat interactions
          if (interaction.promptTemplate?.name === 'philosopher_chat_system') {
            userPrompt = await reconstructUserPrompt(correspondingMessage)
          }
        }

        return {
          id: interaction.id,
          functionName: interaction.promptTemplate?.name || 'Unknown',
          provider: interaction.model?.provider?.name || 'Unknown',
          model: interaction.model?.name || 'Unknown',
          inputTokens: interaction.inputTokens || 0,
          outputTokens: interaction.outputTokens || 0,
          totalCost: interaction.totalCost || 0,
          responseTime: interaction.responseTime || 0,
          success: interaction.success,
          timestamp: interaction.createdAt.toISOString(),
          systemPrompt,
          userPrompt,
          response,
          errorMessage: interaction.errorMessage,
          philosopher: correspondingMessage?.philosopher?.name,
          debateTopic: correspondingMessage?.debate?.topic
        }
      })
    )

    return NextResponse.json({
      success: true,
      interactions: enhancedInteractions,
      total: interactions.length
    })

  } catch (error) {
    console.error('❌ Error fetching LLM interactions:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to reconstruct system prompt
async function reconstructSystemPrompt(template: string, philosopher: any): Promise<string> {
  try {
    // Get personality aspects
    const personality = {
      formality: philosopher.personalityAspects?.find((a: any) => a.aspectName === 'formality')?.value || 5,
      aggression: philosopher.personalityAspects?.find((a: any) => a.aspectName === 'aggression')?.value || 5,
      humor: philosopher.personalityAspects?.find((a: any) => a.aspectName === 'humor')?.value || 5,
      complexity: philosopher.personalityAspects?.find((a: any) => a.aspectName === 'complexity')?.value || 5
    }

    // Parse core beliefs
    const beliefs = philosopher.coreBeliefs ? 
      philosopher.coreBeliefs.split('\n').filter((b: string) => b.trim()) : 
      ['Creencia no especificada']

    // Build trade-offs info
    const tradeOffsInfo = philosopher.personalityAspects?.map((aspect: any) => {
      const label = aspect.value <= 2 ? 'EXTREMO BAJO' :
                    aspect.value >= 8 ? 'EXTREMO ALTO' :
                    aspect.value <= 4 ? 'Tiende hacia bajo' :
                    aspect.value >= 6 ? 'Tiende hacia alto' : 'Equilibrado'
      return `- ${aspect.aspectName}: ${label} (${aspect.value}/10)`
    }).join('\n') || 'No hay información de trade-offs'

    // Replace variables
    const variables = {
      NOMBRE: philosopher.name,
      DESCRIPCIÓN: philosopher.description,
      CREENCIAS_CENTRALES: beliefs.map((belief: string) => `• ${belief}`).join('\n'),
      ESTILO_ARGUMENTACION: philosopher.argumentStyle,
      ENFOQUE_CUESTIONAMIENTO: philosopher.questioningApproach,
      FORMALIDAD: String(personality.formality),
      AGRESIVIDAD: String(personality.aggression),
      HUMOR: String(personality.humor),
      COMPLEJIDAD: String(personality.complexity),
      TRADE_OFFS_INFO: tradeOffsInfo
    }

    let finalPrompt = template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      finalPrompt = finalPrompt.replace(new RegExp(placeholder, 'g'), value)
    })

    return finalPrompt
  } catch (error) {
    console.error('Error reconstructing system prompt:', error)
    return template
  }
}

// Helper function to reconstruct user prompt
async function reconstructUserPrompt(message: any): Promise<string> {
  try {
    // Get the debate and recent messages to reconstruct context
    const debate = await prisma.debate.findUnique({
      where: { id: message.debateId },
      include: {
        messages: {
          where: {
            timestamp: {
              lt: message.timestamp
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10,
          include: {
            philosopher: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!debate) return 'Contexto no disponible'

    // Find the user's last message
    const userLastMessage = debate.messages.find(m => m.senderType === 'USER')
    const conversationHistory = debate.messages.slice(0, 6).reverse()

    // Calculate response index
    const responseIndex = Math.ceil(debate.messages.length / 2)

    // Reconstruct the context prompt
    let contextPrompt = `🚨 INSTRUCCIONES CRÍTICAS DE ETAPA - DEBES SEGUIR EXACTAMENTE:\n`
    contextPrompt += `==================================================\n`
    contextPrompt += `ETAPA ACTUAL: ${responseIndex === 1 ? 'INITIAL' : responseIndex <= 3 ? 'DEVELOPMENT' : 'INTERMEDIATE'}\n`
    contextPrompt += `COMPORTAMIENTO REQUERIDO: ${responseIndex === 1 ? 'Presentación y establecimiento' : 'Desarrollo del diálogo'}\n`
    contextPrompt += `==================================================\n\n`
    
    contextPrompt += `TEMA DEL DEBATE: "${debate.topic}"\n\n`
    
    contextPrompt += `CONTEXTO DE CONVERSACIÓN:\n`
    contextPrompt += `- Esta será tu respuesta #${responseIndex} en este debate\n`
    contextPrompt += `- Total de intercambios hasta ahora: ${debate.messages.length}\n\n`
    
    if (conversationHistory.length > 0) {
      contextPrompt += `HISTORIAL RECIENTE:\n`
      contextPrompt += conversationHistory.map(msg => 
        `${msg.senderType === 'USER' ? 'Usuario' : msg.philosopher?.name || 'AI'}: ${msg.content}`
      ).join('\n')
      contextPrompt += '\n\n'
    }
    
    if (userLastMessage) {
      contextPrompt += `ÚLTIMO MENSAJE DEL USUARIO:\n"${userLastMessage.content}"\n\n`
    }
    
    contextPrompt += `Responde usando tu personalidad filosófica única COMBINADA con el comportamiento específico de la etapa.`

    return contextPrompt
  } catch (error) {
    console.error('Error reconstructing user prompt:', error)
    return 'Error reconstruyendo contexto'
  }
} 