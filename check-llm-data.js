const { PrismaClient } = require('@prisma/client')

async function checkLLMData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_POSTGRES_URL
      }
    }
  })

  try {
    console.log('🔍 Checking LLM data in PostgreSQL...')
    
    // Check LLM Providers
    const providers = await prisma.lLMProvider.count()
    console.log(`📊 LLM Providers: ${providers}`)
    
    // Check LLM Models  
    const models = await prisma.lLMModel.count()
    console.log(`🤖 LLM Models: ${models}`)
    
    // Check LLM Configurations
    const configs = await prisma.lLMConfiguration.count()
    console.log(`⚙️ LLM Configurations: ${configs}`)
    
    // Check Custom Tones
    const tones = await prisma.customTone.count()
    console.log(`🎨 Custom Tones: ${tones}`)
    
    if (providers === 0) {
      console.log('❌ No LLM data found! Need to seed LLM tables.')
    } else {
      console.log('✅ LLM data exists')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLLMData() 