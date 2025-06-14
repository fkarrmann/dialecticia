const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupEssentialData() {
  try {
    console.log('🚀 Configurando datos esenciales...');

    // 1. Crear LLM Provider por defecto
    const provider = await prisma.lLMProvider.upsert({
      where: { name: 'anthropic' },
      update: {
        baseUrl: 'https://api.anthropic.com/v1',
        displayName: 'Anthropic'
      },
      create: {
        name: 'anthropic',
        displayName: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        isActive: true,
        maxTokens: 8000,
        rateLimitRpm: 60,
        rateLimitTpm: 60000,
        costPer1kTokens: 0.015
      }
    });
    console.log('✅ Provider creado:', provider.displayName);

    // 2. Crear modelo por defecto
    const model = await prisma.lLMModel.upsert({
      where: { 
        providerId_modelIdentifier: {
          providerId: provider.id,
          modelIdentifier: 'claude-sonnet-4-20250514'
        }
      },
      update: {
        name: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4'
      },
      create: {
        providerId: provider.id,
        name: 'claude-sonnet-4-20250514',
        modelIdentifier: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        isActive: true,
        maxTokens: 8000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        usageFunction: 'philosopher_chat_system'
      }
    });
    console.log('✅ Modelo creado:', model.displayName);

    // 3. Crear prompt template
    const promptTemplate = await prisma.promptTemplate.upsert({
      where: { 
        name: 'philosopher_chat_system'
      },
      update: {
        template: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.
PERSONALIDAD:
{DESCRIPCIÓN}
CREENCIAS FUNDAMENTALES:
{CREENCIAS_CENTRALES}
ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTACION}
ENFOQUE DE CUESTIONAMIENTO:
{ENFOQUE_CUESTIONAMIENTO}
TRADE-OFFS FILOSÓFICOS ESPECÍFICOS:
{TRADE_OFFS_INFO}
IMPORTANTE: Estos trade-offs definen tu personalidad filosófica única. ÚSALOS para determinar cómo respondes, qué enfatizas, y tu estilo de argumentación.
Responde en ESPAÑOL, máximo 2-3 líneas contundentes.`
      },
      create: {
        name: 'philosopher_chat_system',
        category: 'chat',
        description: 'Prompt para generar respuestas de filósofos virtuales',
        template: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.
PERSONALIDAD:
{DESCRIPCIÓN}
CREENCIAS FUNDAMENTALES:
{CREENCIAS_CENTRALES}
ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTACION}
ENFOQUE DE CUESTIONAMIENTO:
{ENFOQUE_CUESTIONAMIENTO}
TRADE-OFFS FILOSÓFICOS ESPECÍFICOS:
{TRADE_OFFS_INFO}
IMPORTANTE: Estos trade-offs definen tu personalidad filosófica única. ÚSALOS para determinar cómo respondes, qué enfatizas, y tu estilo de argumentación.
Responde en ESPAÑOL, máximo 2-3 líneas contundentes.`,
        isActive: true
      }
    });
    console.log('✅ Prompt template creado:', promptTemplate.displayName);

    // 4. Crear configuración LLM por defecto
    const config = await prisma.lLMConfiguration.upsert({
      where: { name: 'philosopher_chat_system' },
      update: {},
      create: {
        name: 'philosopher_chat_system',
        providerId: provider.id,
        modelId: model.id,
        promptTemplateId: promptTemplate.id,
        isActive: true,
        maxTokens: 4000,
        temperature: 0.7
      }
    });
    console.log('✅ Configuración de chat filosófico creada:', config.name);

    console.log('🎉 Datos esenciales configurados correctamente');

  } catch (error) {
    console.error('❌ Error configurando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEssentialData(); 