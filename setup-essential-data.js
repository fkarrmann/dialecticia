const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupEssentialData() {
  try {
    console.log('🚀 Configurando datos esenciales...');

    // 1. Crear LLM Provider por defecto
    const provider = await prisma.lLMProvider.upsert({
      where: { name: 'anthropic-claude' },
      update: {},
      create: {
        name: 'anthropic-claude',
        displayName: 'Anthropic Claude',
        baseUrl: 'https://api.anthropic.com',
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
        providerId_modelName: {
          providerId: provider.id,
          modelName: 'claude-sonnet-4-real'
        }
      },
      update: {},
      create: {
        providerId: provider.id,
        modelName: 'claude-sonnet-4-real',
        displayName: 'Claude Sonnet 4 (Real)',
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
        name_version: {
          name: 'philosopher_chat_system',
          version: '1.6.0'
        }
      },
      update: {},
      create: {
        name: 'philosopher_chat_system',
        category: 'chat',
        displayName: 'Sistema de Chat Filosófico',
        version: '1.6.0',
        isActive: true,
        systemPrompt: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.
PERSONALIDAD:
{PERSONALIDAD_DESCRIPTION}
CREENCIAS FUNDAMENTALES:
{BELIEFS}
TONO DE COMUNICACIÓN:
{TONO_COMUNICACION}
TU ROL COMO CONTRAPUNTO:
- Desafías desde TU escuela filosófica específica
- Ofreces una visión diferente que enriquece el diálogo
- Usas el tono esperable para tu PERSONALIDAD:{TONO_COMUNICACION} + {PERSONALIDAD_DESCRIPTION}
- Debes reconocer si el usuario se alinea con tu postura, tu misión es persuadirlo a cambiar su postura original, No contradecirlo eternamente.
ESTILO ARGUMENTATIVO:
{ARGUMENTATIVE_STYLE}
ENFOQUE DISTINTIVO:
{DISTINCTIVE_APPROACH}
CONFIGURACIÓN DE PERSONALIDAD:
{PERSONALITY_CONFIG}
TRADE-OFFS FILOSÓFICOS ESPECÍFICOS:
{TRADE_OFFS}
IMPORTANTE: Estos trade-offs definen tu personalidad filosófica única. ÚSALOS para determinar cómo respondes, qué enfatizas, y tu estilo de argumentación.
CONTRAPUNTO FILOSÓFICO:
- Respuesta BREVE y CONTUNDENTE, máximo 1 o 2 líneas.
- Ataca el punto débil desde TU perspectiva filosófica específica
- Una declaración filosófica tajante
- Sin rodeos ni explicaciones largas
- Puedes responder las preguntas si tienen sentido en el contexto, si no, pides volver al debate
Responde en ESPAÑOL NEUTRO pero adaptado al RIOPLATENSE (si es argentino, usa Rioplaetense natural, sin exagerar), MÁXIMO 1 o 2 lineas contundentes.`,
        description: 'Prompt para generar respuestas de filósofos virtuales',
        usage: 'Debate filosófico socrático'
      }
    });
    console.log('✅ Prompt template creado:', promptTemplate.displayName);

    // 4. Crear configuración por defecto
    const config = await prisma.lLMConfiguration.upsert({
      where: { functionName: 'conversation_settings' },
      update: {},
      create: {
        functionName: 'conversation_settings',
        modelId: model.id,
        promptTemplateId: promptTemplate.id,
        isActive: true,
        description: 'Configuración de etapas conversacionales por defecto',
        parameters: JSON.stringify({
          conversation_stages: {
            initial: {
              min: 1,
              max: 2,
              tone: "formal",
              style: "presentation",
              description: "Fase inicial formal donde el filósofo se presenta y plantea su posición de manera estructurada"
            },
            development: {
              min: 3,
              max: 5,
              tone: "confident",
              style: "building_arguments",
              description: "Desarrollo de argumentos con confianza creciente, construyendo sobre la posición inicial"
            },
            intermediate: {
              min: 6,
              max: 10,
              tone: "direct",
              style: "questioning",
              description: "Cuestionamiento directo y referencias a puntos previos de la conversación"
            },
            advanced: {
              min: 11,
              max: 15,
              tone: "challenging",
              style: "contradictions",
              description: "Contradicciones profundas usando el método filosófico completo"
            },
            deep: {
              min: 16,
              max: null,
              tone: "familiar",
              style: "synthesis",
              description: "Familiaridad personal, síntesis y conclusiones basadas en todo el diálogo"
            }
          },
          response_guidance: {
            use_message_index: true,
            adapt_tone_by_stage: true,
            reference_previous_messages: true,
            escalate_philosophical_method: true
          }
        })
      }
    });
    console.log('✅ Configuración de conversación creada:', config.functionName);

    // 5. Crear configuración LLM por defecto
    await prisma.lLMConfiguration.upsert({
      where: { functionName: 'philosopher_chat_system' },
      update: {},
      create: {
        functionName: 'philosopher_chat_system',
        modelId: model.id,
        promptTemplateId: promptTemplate.id,
        isActive: true,
        description: 'Configuración principal para chat de filósofos'
      }
    });
    console.log('✅ Configuración de chat filosófico creada');

    console.log('🎉 Datos esenciales configurados correctamente');

  } catch (error) {
    console.error('❌ Error configurando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEssentialData(); 