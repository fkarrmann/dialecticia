const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Función de encriptación (debe coincidir con la del sistema)
function encryptApiKey(apiKey) {
  const encryptionKey = process.env.LLM_ENCRYPTION_KEY || 'your-dev-encryption-key-32-chars!!';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function fixApiKeys() {
  console.log('🔧 Iniciando reparación de API keys...');
  
  try {
    // Verificar variables de entorno
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('🔍 Verificando variables de entorno:');
    console.log(`- OPENAI_API_KEY: ${openaiKey ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`- ANTHROPIC_API_KEY: ${anthropicKey ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Actualizar proveedor OpenAI
    if (openaiKey) {
      console.log('🔐 Encriptando y guardando API key de OpenAI...');
      const encryptedOpenaiKey = encryptApiKey(openaiKey);
      
      await prisma.lLMProvider.updateMany({
        where: { name: { in: ['OpenAI', 'openai'] } },
        data: { 
          apiKeyEncrypted: encryptedOpenaiKey,
          isActive: true 
        }
      });
      console.log('✅ API key de OpenAI actualizada');
    }
    
    // Actualizar proveedor Anthropic
    if (anthropicKey) {
      console.log('🔐 Encriptando y guardando API key de Anthropic...');
      const encryptedAnthropicKey = encryptApiKey(anthropicKey);
      
      await prisma.lLMProvider.updateMany({
        where: { name: 'anthropic' },
        data: { 
          apiKeyEncrypted: encryptedAnthropicKey,
          isActive: true 
        }
      });
      console.log('✅ API key de Anthropic actualizada');
    }
    
    // Verificar configuraciones
    console.log('🔍 Verificando configuraciones...');
    const configurations = await prisma.lLMConfiguration.findMany({
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    });
    
    console.log(`📋 Encontradas ${configurations.length} configuraciones:`);
    configurations.forEach(config => {
      console.log(`- ${config.name}: ${config.provider.name}/${config.model.name} (${config.isActive ? 'ACTIVA' : 'INACTIVA'})`);
    });
    
    // Crear configuración final si no existe
    console.log('🔍 Verificando configuración final...');
    const finalConfig = await prisma.lLMConfiguration.findFirst({
      where: { name: 'final_personality_generation' }
    });
    
    if (!finalConfig) {
      console.log('➕ Creando configuración para generación final...');
      const anthropicProvider = await prisma.lLMProvider.findFirst({
        where: { name: 'anthropic' }
      });
      
      const claudeModel = await prisma.lLMModel.findFirst({
        where: { 
          providerId: anthropicProvider.id,
          name: { contains: 'Claude' }
        }
      });
      
      const finalPrompt = await prisma.promptTemplate.findFirst({
        where: { name: 'final_personality_generation' }
      });
      
      if (anthropicProvider && claudeModel && finalPrompt) {
        await prisma.lLMConfiguration.create({
          data: {
            name: 'final_personality_generation',
            providerId: anthropicProvider.id,
            modelId: claudeModel.id,
            promptTemplateId: finalPrompt.id,
            maxTokens: 2000,
            temperature: 0.7,
            isActive: true
          }
        });
        console.log('✅ Configuración final creada');
      } else {
        console.log('⚠️ No se pudo crear configuración final - faltan componentes');
      }
    } else {
      console.log('✅ Configuración final ya existe');
    }
    
    console.log('🎉 Reparación completada!');
    
  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixApiKeys();
}

module.exports = { fixApiKeys }; 