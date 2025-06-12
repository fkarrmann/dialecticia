const { PrismaClient } = require('@prisma/client');

async function setupVercelSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Inicializando sistema LLM en Vercel...');

    // 1. Verificar conexión a BD
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL exitosa');

    // 2. Crear proveedores básicos si no existen
    const existingProviders = await prisma.lLMProvider.count();
    if (existingProviders === 0) {
      console.log('🏗️ Creando proveedores básicos...');
      
      const anthropicProvider = await prisma.lLMProvider.create({
        data: {
          name: 'anthropic',
          baseUrl: 'https://api.anthropic.com/v1',
          isActive: true,
        }
      });

      console.log(`✅ Proveedor Anthropic creado: ${anthropicProvider.id}`);
    }

    // 3. Crear modelos básicos si no existen
    const existingModels = await prisma.lLMModel.count();
    if (existingModels === 0) {
      console.log('🤖 Creando modelos básicos...');
      
      const anthropicProvider = await prisma.lLMProvider.findFirst({
        where: { name: 'anthropic' }
      });

      if (anthropicProvider) {
        await prisma.lLMModel.create({
          data: {
            name: 'claude-3-5-sonnet',
            providerId: anthropicProvider.id,
            modelIdentifier: 'claude-3-5-sonnet-20241022',
            isActive: true,
          }
        });
        console.log('✅ Modelo Claude creado');
      }
    }

    // 4. Crear prompts críticos si no existen
    const criticalPrompts = [
      {
        name: 'philosopher_chat_system',
        category: 'chat',
        description: 'Prompt principal para diálogos filosóficos',
        template: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.

PERSONALIDAD:
{DESCRIPCIÓN}

CREENCIAS FUNDAMENTALES:
{CREENCIAS_CENTRALES}

TU ROL COMO CONTRAPUNTO:
- Desafías desde TU escuela filosófica específica
- Ofreces una visión diferente que enriquece el diálogo

ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTACION}

CONTRAPUNTO FILOSÓFICO:
- Respuesta BREVE y CONTUNDENTE, máximo 2-3 líneas
- Una declaración filosófica tajante

Responde en ESPAÑOL, MÁXIMO 3 líneas contundentes.`,
        isActive: true
      },
      {
        name: 'antagonistic_selection',
        category: 'selection', 
        description: 'Selección de filósofo antagónico',
        template: `Analiza el tema "{TEMA}" y la postura "{POSTURA_USUARIO}" para seleccionar el filósofo más ANTAGÓNICO.

FILÓSOFOS DISPONIBLES:
{FILOSOFOS_DISPONIBLES}

Responde en JSON:
{
  "suggestedPhilosopher": "NOMBRE_EXACTO",
  "reasoning": "Por qué es antagónico (máximo 150 palabras)"
}`,
        isActive: true
      }
    ];

    for (const promptData of criticalPrompts) {
      const existing = await prisma.promptTemplate.findFirst({
        where: { name: promptData.name }
      });

      if (!existing) {
        await prisma.promptTemplate.create({
          data: promptData
        });
        console.log(`✅ Prompt creado: ${promptData.name}`);
      }
    }

    // 5. Crear configuración por defecto si no existe
    const existingConfigs = await prisma.lLMConfiguration.count({
      where: { isActive: true }
    });

    if (existingConfigs === 0) {
      console.log('⚙️ Creando configuración por defecto...');
      
      const model = await prisma.lLMModel.findFirst({
        where: { isActive: true },
        include: { provider: true }
      });

      if (model) {
        await prisma.lLMConfiguration.create({
          data: {
            name: 'Default Configuration',
            providerId: model.providerId,
            modelId: model.id,
            maxTokens: 1000,
            temperature: 0.7,
            isActive: true
          }
        });
        console.log('✅ Configuración por defecto creada');
      }
    }

    console.log('🎉 Sistema LLM inicializado correctamente en Vercel');
    
    // Verificación final
    const summary = {
      providers: await prisma.lLMProvider.count(),
      models: await prisma.lLMModel.count(),
      prompts: await prisma.promptTemplate.count(),
      configurations: await prisma.lLMConfiguration.count({ where: { isActive: true } })
    };
    
    console.log('📊 Resumen del sistema:', summary);
    
    return { success: true, summary };

  } catch (error) {
    console.error('❌ Error inicializando sistema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupVercelSystem()
    .then(result => {
      console.log('✅ Inicialización completada:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Inicialización falló:', error);
      process.exit(1);
    });
}

module.exports = { setupVercelSystem }; 