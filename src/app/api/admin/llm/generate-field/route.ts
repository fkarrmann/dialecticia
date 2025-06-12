import { NextRequest, NextResponse } from 'next/server'
import { LLMService } from '@/lib/llm-service'
import { prisma } from '@/lib/db'

interface GenerateFieldRequest {
  functionName: string
  data: any
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFieldRequest = await request.json()
    const { functionName, data } = body

    console.log(`🎯 GenerateField: ${functionName}`, data)

    // Obtener el prompt template de la base de datos
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { 
        name: functionName,
        isActive: true 
      }
    })

    if (!promptTemplate) {
      console.log(`❌ No se encontró prompt template: ${functionName}`)
      return NextResponse.json(
        { error: `Prompt template ${functionName} no encontrado` },
        { status: 404 }
      )
    }

    // Construir el prompt reemplazando variables
    let finalPrompt = promptTemplate.template

    // Reemplazar variables comunes
    if (data.debateMechanics) {
      finalPrompt = finalPrompt.replace(/{DEBATE_MECHANICS}/g, data.debateMechanics)
    }
    if (data.inspirationSource) {
      finalPrompt = finalPrompt.replace(/{INSPIRATION_SOURCE}/g, data.inspirationSource)
    }
    if (data.secretSauce) {
      finalPrompt = finalPrompt.replace(/{SECRET_SAUCE}/g, data.secretSauce)
    }
    // Agregar soporte para tono de comunicación
    if (data.communicationTone) {
      const toneText = typeof data.communicationTone === 'object' 
        ? `${data.communicationTone.preset}: ${data.communicationTone.description}`
        : data.communicationTone
      finalPrompt = finalPrompt.replace(/{TONO_COMUNICACION}/g, toneText)
    }

    // Variables específicas para questioning_approach_generation
    if (data.attributes && Array.isArray(data.attributes)) {
      const attributesText = data.attributes.map((attr: any) => 
        `- ${attr.name}: ${attr.value}/10 (${attr.leftExtreme} ←→ ${attr.rightExtreme})`
      ).join('\n')
      finalPrompt = finalPrompt.replace(/{ATTRIBUTES}/g, attributesText)
    }

    console.log('📤 Prompt final enviado al LLM:')
    console.log('=' .repeat(50))
    console.log(finalPrompt)
    console.log('=' .repeat(50))

    // Llamar al LLM usando el servicio centralizado
    const llmResponse = await LLMService.callLLM({
      functionName,
      messages: [
        {
          role: 'system',
          content: finalPrompt
        },
        {
          role: 'user',
          content: 'Genera el contenido solicitado basándote en la información proporcionada.'
        }
      ],
      temperature: 0.7,
      maxTokens: 500
    })

    console.log(`✅ Respuesta generada para ${functionName}:`, llmResponse.content)

    // Para core_beliefs_generation, el LLM debe retornar un array JSON
    if (functionName === 'core_beliefs_generation') {
      try {
        const cleanContent = llmResponse.content?.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanContent || '[]')
        return NextResponse.json({ content: parsed })
      } catch (error) {
        // Si no es JSON válido, tratar como texto y dividir en oraciones
        const beliefs = llmResponse.content?.split(/[.!?]/)
          .filter(belief => belief.trim().length > 10)
          .slice(0, 3)
          .map(belief => belief.trim() + '.') || []
        return NextResponse.json({ content: beliefs })
      }
    }

    // Para otros campos, retornar como texto
    return NextResponse.json({ content: llmResponse.content })

  } catch (error) {
    console.error('❌ Error en generate-field:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 