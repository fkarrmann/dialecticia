const { PrismaClient } = require('@prisma/client')

async function seedLLMData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_POSTGRES_URL
      }
    }
  })

  try {
    console.log('🌱 Seeding LLM data in PostgreSQL...')
    
    // Create OpenAI Provider (usando solo campos que existen)
    const openaiProvider = await prisma.lLMProvider.upsert({
      where: { name: 'OpenAI' },
      update: {},
      create: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        isActive: true
      }
    })
    console.log('✅ OpenAI Provider created')

    // Create OpenAI Models (usando campos correctos del schema)
    const models = [
      {
        name: 'GPT-4o',
        modelIdentifier: 'gpt-4o',
        maxTokens: 4096,
        costPer1kTokens: 10.0,
        isActive: true
      },
      {
        name: 'GPT-4o-mini',
        modelIdentifier: 'gpt-4o-mini', 
        maxTokens: 4096,
        costPer1kTokens: 0.375,
        isActive: true
      },
      {
        name: 'GPT-4-turbo',
        modelIdentifier: 'gpt-4-turbo',
        maxTokens: 4096,
        costPer1kTokens: 20.0,
        isActive: true
      }
    ]

    for (const model of models) {
      await prisma.lLMModel.upsert({
        where: { 
          providerId_modelIdentifier: {
            providerId: openaiProvider.id,
            modelIdentifier: model.modelIdentifier
          }
        },
        update: {},
        create: {
          ...model,
          providerId: openaiProvider.id
        }
      })
      console.log(`✅ Model ${model.name} created`)
    }

    // Create default LLM Configuration
    const gpt4oMini = await prisma.lLMModel.findFirst({
      where: { modelIdentifier: 'gpt-4o-mini' }
    })

    await prisma.lLMConfiguration.upsert({
      where: { name: 'Default Configuration' },
      update: {},
      create: {
        name: 'Default Configuration',
        providerId: openaiProvider.id,
        modelId: gpt4oMini.id,
        maxTokens: 800,
        temperature: 0.8,
        isActive: true
      }
    })
    console.log('✅ Default LLM Configuration created')

    // Create sample custom tone (usando campos correctos)
    await prisma.customTone.upsert({
      where: { title: 'Socrático Clásico' },
      update: {},
      create: {
        title: 'Socrático Clásico',
        userDescription: 'Tono clásico socrático con preguntas incisivas',
        aiInterpretation: 'Estilo socrático tradicional enfocado en el cuestionamiento',
        aiLabel: 'Socrático',
        generatedPrompt: 'Eres Sócrates. Usa preguntas incisivas para desafiar las ideas.',
        isActive: true
      }
    })
    console.log('✅ Sample Custom Tone created')

    console.log('🎉 LLM data seeding completed!')
    
  } catch (error) {
    console.error('❌ Error seeding LLM data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedLLMData() 