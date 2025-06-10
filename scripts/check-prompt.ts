import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPrompt() {
  const prompt = await prisma.promptTemplate.findFirst({
    where: { name: 'core_beliefs_generation' }
  })
  
  console.log('📋 PROMPT CORE_BELIEFS_GENERATION:')
  console.log('=' .repeat(80))
  console.log(prompt?.systemPrompt || 'NO ENCONTRADO')
  console.log('=' .repeat(80))
  
  await prisma.$disconnect()
}

checkPrompt().catch(console.error) 