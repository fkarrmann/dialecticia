import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      created: [] as string[],
      errors: [] as string[]
    };

    // Prompts críticos que deben existir
    const criticalPrompts = [
      {
        name: 'philosopher_chat_system',
        category: 'chat',
        description: 'Sistema de chat filosófico principal',
        template: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.

PERSONALIDAD:
{DESCRIPCIÓN}

CREENCIAS FUNDAMENTALES:
{CREENCIAS_CENTRALES}

TU ROL COMO CONTRAPUNTO:
- Sócrates modera, tú proporcionas perspectiva filosófica alternativa
- Desafías desde TU escuela filosófica específica
- Ofreces una visión diferente que enriquece el diálogo
- Complementas el cuestionamiento socrático con tu filosofía

ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTACION}

ENFOQUE DISTINTIVO:
{ENFOQUE_CUESTIONAMIENTO}

CONFIGURACIÓN DE PERSONALIDAD:
- Formalidad: {FORMALIDAD}/10
- Agresividad: {AGRESIVIDAD}/10
- Humor: {HUMOR}/10
- Complejidad: {COMPLEJIDAD}/10

TRADE-OFFS FILOSÓFICOS:
{TRADE_OFFS_INFO}

CONTRAPUNTO FILOSÓFICO:
- Respuesta BREVE y CONTUNDENTE, máximo 1-2 líneas
- Ataca el punto débil desde TU perspectiva filosófica específica
- Una declaración filosófica tajante
- Sin rodeos ni explicaciones largas

Responde en ESPAÑOL, MÁXIMO 2 líneas contundentes.`
      },
      {
        name: 'personality_analysis',
        category: 'analysis',
        description: 'Análisis de personalidad para filósofos',
        template: `Eres un experto en análisis de personalidades filosóficas. Tu tarea es analizar la información proporcionada sobre un filósofo y generar un perfil de personalidad estructurado.

FILÓSOFO A ANALIZAR:
- Nombre: {NOMBRE}
- Descripción: {DESCRIPCION}
- Escuela Filosófica: {ESCUELA_FILOSOFICA}
- Estilo Argumentativo: {ESTILO_ARGUMENTATIVO}
- Enfoque de Cuestionamiento: {ENFOQUE_CUESTIONAMIENTO}

Analiza y asigna valores del 1 al 10 para cada aspecto de personalidad:

1. FORMALIDAD (1=muy informal, 10=extremadamente formal)
2. AGRESIVIDAD (1=muy pasivo, 10=extremadamente agresivo)
3. HUMOR (1=muy serio, 10=extremadamente humorístico)
4. COMPLEJIDAD (1=muy simple, 10=extremadamente complejo)

Responde ÚNICAMENTE en el siguiente formato JSON:
{
  "formalidad": X,
  "agresividad": X,
  "humor": X,
  "complejidad": X,
  "reasoning": "Breve explicación de los valores asignados"
}`
      },
      {
        name: 'antagonistic_selection',
        category: 'selection',
        description: 'Selección de filósofos antagónicos',
        template: `Eres un experto historiador de la filosofía especializado en crear debates intelectuales estimulantes. Tu tarea es analizar el TEMA y la POSTURA del usuario para seleccionar el filósofo más ANTAGÓNICO e INTELECTUALMENTE DESAFIANTE.

ANÁLISIS REQUERIDO:

📋 TEMA DEL DEBATE: "{TEMA}"
💭 POSTURA DEL USUARIO: "{POSTURA_USUARIO}"

🎯 FILÓSOFOS DISPONIBLES:
{FILOSOFOS_DISPONIBLES}

📊 METODOLOGÍA DE ANÁLISIS:

1. **DISECCIÓN DEL TEMA**: ¿Qué área filosófica toca? (ética, epistemología, metafísica, política, existencial, etc.)

2. **ANÁLISIS DE LA POSTURA**: 
   - ¿Qué escuela de pensamiento refleja?
   - ¿Qué supuestos filosóficos asume?
   - ¿Qué valores implícitos defiende?

3. **SELECCIÓN ANTAGÓNICA**: 
   - ¿Qué filósofo tendría la MÁXIMA OPOSICIÓN filosófica?
   - ¿Quién atacaría los FUNDAMENTOS de esta postura?
   - ¿Qué escuela filosófica sería más DESAFIANTE?

4. **POTENCIAL DE DEBATE**:
   - ¿Qué filósofo generaría el contraste más ESTIMULANTE?
   - ¿Quién haría las preguntas más INCÓMODAS?
   - ¿Qué perspectiva obligaría al usuario a REPENSAR todo?

🎭 CRITERIOS PRIORITARIOS:
- Máxima oposición filosófica natural
- Diferentes paradigmas de pensamiento
- Capacidad de desafiar supuestos fundamentales
- Potencial para debate rico e intelectualmente estimulante
- Compatibilidad histórica con el tema

RESPONDE ÚNICAMENTE en el siguiente formato JSON:
{
  "suggestedPhilosopher": "NOMBRE_EXACTO_DEL_FILOSOFO",
  "reasoning": "Análisis específico de por qué este filósofo es el más antagónico para esta postura particular, mencionando la oposición filosófica específica y el potencial de debate (máximo 150 palabras)"
}`
      }
    ];

    // Crear cada prompt si no existe
    for (const promptData of criticalPrompts) {
      try {
        const existing = await prisma.promptTemplate.findFirst({
          where: { name: promptData.name }
        });

        if (!existing) {
          await prisma.promptTemplate.create({
            data: {
              name: promptData.name,
              description: promptData.description,
              template: promptData.template,
              category: promptData.category,
              isActive: true
            }
          });
          results.created.push(promptData.name);
        } else {
          // Si existe pero está inactivo, activarlo
          if (!existing.isActive) {
            await prisma.promptTemplate.update({
              where: { id: existing.id },
              data: { isActive: true }
            });
            results.created.push(`${promptData.name} (reactivado)`);
          } else {
            results.created.push(`${promptData.name} (ya existía y estaba activo)`);
          }
        }
      } catch (error: any) {
        results.errors.push(`Error creando ${promptData.name}: ${error.message}`);
      }
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    return NextResponse.json(results);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      created: [],
      errors: [error.message]
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 