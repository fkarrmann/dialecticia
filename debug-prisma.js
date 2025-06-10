const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugPrisma() {
  try {
    console.log('🔍 Debugging Prisma Client...');
    
    // Intentar consulta raw
    console.log('\n📊 Consulta SQL directa via Prisma:');
    const rawPhilosophers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM philosophers`;
    console.log('Raw philosophers count:', rawPhilosophers);
    
    const rawUsers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    console.log('Raw users count:', rawUsers);
    
    // Intentar usando el modelo
    console.log('\n🤖 Via modelo Prisma:');
    
    try {
      const philosophers = await prisma.philosopher.findMany({
        take: 3,
        select: {
          id: true,
          name: true
        }
      });
      console.log('Philosophers via model:', philosophers);
    } catch (error) {
      console.error('Error al consultar philosophers:', error.message);
    }
    
    try {
      const providers = await prisma.lLMProvider.findMany({
        take: 3,
        select: {
          id: true,
          name: true
        }
      });
      console.log('Providers via model:', providers);
    } catch (error) {
      console.error('Error al consultar providers:', error.message);
    }
    
    // Verificar conexión a base de datos
    console.log('\n🔗 Test de conexión:');
    const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('Tablas encontradas via Prisma:', result);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPrisma(); 