// Script para ejecutar SOLO en Vercel o con DATABASE_POSTGRES_PRISMA_URL configurada
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Usar la URL de PostgreSQL de Vercel
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_POSTGRES_PRISMA_URL
    }
  }
});

// Función de encriptación actualizada (sin deprecated)
function encryptApiKey(apiKey) {
  const encryptionKey = process.env.LLM_ENCRYPTION_KEY || 'your-dev-encryption-key-32-chars!!';
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, encryptionKey);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function fixVercelApiKeys() {
  console.log('🔧 Iniciando reparación de API keys en Vercel...');
  
  try {
    // Verificar que estamos usando PostgreSQL
    if (!process.env.DATABASE_POSTGRES_PRISMA_URL) {
      throw new Error('DATABASE_POSTGRES_PRISMA_URL no está configurada. Este script es solo para Vercel.');
    }

    // Verificar variables de entorno
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('🔍 Verificando variables de entorno:');
    console.log(`- OPENAI_API_KEY: ${openaiKey ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`- ANTHROPIC_API_KEY: ${anthropicKey ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`- DATABASE_POSTGRES_PRISMA_URL: ${process.env.DATABASE_POSTGRES_PRISMA_URL ? 'CONFIGURADA' : 'NO CONFIGURADA'}`);
    
    // Actualizar proveedor Anthropic (MÁS IMPORTANTE)
    if (anthropicKey) {
      console.log('🔐 Encriptando y guardando API key de Anthropic...');
      const encryptedAnthropicKey = encryptApiKey(anthropicKey);
      
      // Usar query cruda para evitar problemas de tipos
      const anthropicResult = await prisma.$executeRaw`
        UPDATE llm_providers 
        SET "apiKeyEncrypted" = ${encryptedAnthropicKey}, "isActive" = true, "updatedAt" = now()
        WHERE name = 'anthropic'
      `;
      
      console.log(`✅ Anthropic actualizado: ${anthropicResult} filas afectadas`);
    }
    
    // Actualizar proveedor OpenAI
    if (openaiKey) {
      console.log('🔐 Encriptando y guardando API key de OpenAI...');
      const encryptedOpenaiKey = encryptApiKey(openaiKey);
      
      // Actualizar todos los proveedores de OpenAI
      const openaiResult = await prisma.$executeRaw`
        UPDATE llm_providers 
        SET "apiKeyEncrypted" = ${encryptedOpenaiKey}, "isActive" = true, "updatedAt" = now()
        WHERE name IN ('OpenAI', 'openai')
      `;
      
      console.log(`✅ OpenAI actualizado: ${openaiResult} filas afectadas`);
    }
    
    // Verificar el resultado
    console.log('🔍 Verificando estado final...');
    const providersWithKeys = await prisma.$queryRaw`
      SELECT name, "isActive", 
             CASE WHEN "apiKeyEncrypted" IS NOT NULL THEN 'SI' ELSE 'NO' END as has_key
      FROM llm_providers
    `;
    
    console.log('📋 Estado de proveedores:');
    providersWithKeys.forEach(p => {
      console.log(`- ${p.name}: ${p.isActive ? 'ACTIVO' : 'INACTIVO'}, API Key: ${p.has_key}`);
    });
    
    console.log('🎉 Reparación completada!');
    
    // Verificar configuraciones
    const activeConfigs = await prisma.$queryRaw`
      SELECT c.name, p.name as provider_name, m.name as model_name
      FROM llm_configurations c
      JOIN llm_providers p ON c."providerId" = p.id
      JOIN llm_models m ON c."modelId" = m.id
      WHERE c."isActive" = true
    `;
    
    console.log('⚙️ Configuraciones activas:');
    activeConfigs.forEach(c => {
      console.log(`- ${c.name}: ${c.provider_name}/${c.model_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixVercelApiKeys();
}

module.exports = { fixVercelApiKeys }; 