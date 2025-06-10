const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    
    const philosopherCount = await prisma.philosopher.count();
    console.log(`👥 Filósofos: ${philosopherCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`🧑‍💼 Usuarios: ${userCount}`);
    
    const debateCount = await prisma.debate.count();
    console.log(`💬 Debates: ${debateCount}`);
    
    const messageCount = await prisma.message.count();
    console.log(`📝 Mensajes: ${messageCount}`);
    
    const providerCount = await prisma.lLMProvider.count();
    console.log(`🤖 Proveedores LLM: ${providerCount}`);
    
    // Intentar obtener algunos filósofos
    const philosophers = await prisma.philosopher.findMany({
      take: 3,
      select: { name: true, id: true }
    });
    console.log('📋 Primeros 3 filósofos:');
    philosophers.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 