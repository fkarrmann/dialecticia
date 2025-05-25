import OpenAI from 'openai'
import { Philosopher } from '@prisma/client'
import { parsePersonalityTraits, parseCoreBeliefs } from './utils'

// Mock mode for development without API key
const MOCK_MODE = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here'

const openai = MOCK_MODE ? null : new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SocraticResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export async function generatePhilosopherResponse(
  philosopher: Philosopher,
  debateTopic: string,
  conversationHistory: Array<{
    sender: string
    content: string
    timestamp: Date
  }>,
  userLastMessage: string
): Promise<SocraticResponse> {
  
  if (MOCK_MODE) {
    return generateMockResponse(philosopher, userLastMessage)
  }

  const personality = parsePersonalityTraits(philosopher.personalityTraits)
  const beliefs = parseCoreBeliefs(philosopher.coreBeliefs)
  
  const systemPrompt = buildSystemPrompt(philosopher, personality, beliefs)
  const contextPrompt = buildContextPrompt(debateTopic, conversationHistory)
  const socraticPrompt = buildSocraticPrompt(userLastMessage)

  try {
    const completion = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${contextPrompt}\n\n${socraticPrompt}` }
      ],
      max_tokens: 300,
      temperature: 0.8,
    })

    return {
      content: completion.choices[0]?.message?.content || "Lo siento, no puedo responder en este momento.",
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    return generateMockResponse(philosopher, userLastMessage)
  }
}

function buildSystemPrompt(
  philosopher: Philosopher, 
  personality: any, 
  beliefs: string[]
): string {
  return `Eres ${philosopher.name}, un filósofo virtual inspirado en ${philosopher.philosophicalSchool}.

PERSONALIDAD:
${philosopher.description}

CREENCIAS FUNDAMENTALES:
${beliefs.map(belief => `• ${belief}`).join('\n')}

ESTILO ARGUMENTATIVO:
${philosopher.argumentStyle}

ENFOQUE SOCRÁTICO:
${philosopher.questioningApproach}

RASGOS DE PERSONALIDAD (1-10):
• Formalidad: ${personality.formality || 5}/10
• Agresividad: ${personality.aggression || 5}/10  
• Humor: ${personality.humor || 5}/10
• Complejidad: ${personality.complexity || 5}/10

TU MISIÓN:
1. Usar el método socrático para cuestionar las ideas del usuario
2. Hacer preguntas que expongan contradicciones o debilidades
3. Mantener tu personalidad y estilo únicos
4. Ser persuasivo pero respetuoso
5. Desarmar argumentos mediante preguntas incómodas

RESPONDE EN ESPAÑOL con máximo 2-3 párrafos.`
}

function buildContextPrompt(
  topic: string,
  history: Array<{sender: string, content: string}>
): string {
  const recentHistory = history.slice(-6) // Últimos 6 mensajes
  
  return `TEMA DEL DEBATE: "${topic}"

HISTORIAL RECIENTE:
${recentHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

CONTEXTO:
Estás participando en un debate socrático sobre el tema mencionado. Tu objetivo es cuestionar y desarmar las ideas del usuario mediante preguntas inteligentes que revelen contradicciones o puntos débiles en su razonamiento.`
}

function buildSocraticPrompt(userMessage: string): string {
  return `ÚLTIMO MENSAJE DEL USUARIO:
"${userMessage}"

Responde usando tu método socrático característico. Haz preguntas que:
1. Expongan inconsistencias en su razonamiento
2. Lo lleven a cuestionar sus premisas
3. Revelen contradicciones no consideradas
4. Lo fuercen a definir términos vagos
5. Exploren las consecuencias lógicas de sus ideas

Mantén tu personalidad única y sé persuasivo.`
}

// Mock responses para desarrollo sin API key
function generateMockResponse(philosopher: Philosopher, userMessage: string): SocraticResponse {
  const mockResponses = {
    "Sócrato": [
      `Interesante perspectiva, pero dime: ¿qué entiendes exactamente por "${extractKeyTerm(userMessage)}"? Porque si no podemos definir claramente nuestros términos, ¿cómo podemos estar seguros de que estamos hablando de lo mismo?`,
      `Hmm, pero ¿has considerado las implicaciones de lo que dices? Si tu idea fuera completamente cierta, ¿no debería llevarnos a conclusiones que contradicen tu experiencia diaria?`,
      `Me parece que asumes algo fundamental sin examinarlo. ¿Podrías explicarme en qué basas esa certeza? Porque yo, como bien sabes, solo sé que no sé nada.`
    ],
    "Platín": [
      `Tu argumento se basa en apariencias sensibles, pero ¿no consideras que los sentidos nos engañan constantemente? Lo que percibes como real podría ser meramente una sombra de la verdadera realidad de las Ideas.`,
      `Estás mezclando el mundo sensible con el inteligible. ¿Acaso la verdad que buscas no debería encontrarse en el reino de las Ideas perfectas, más allá de estas imperfecciones materiales?`,
      `Como alguien encadenado en la caverna, confundes las sombras con la realidad. ¿No crees que deberías ascender dialécticamente hacia el conocimiento verdadero?`
    ],
    "Aristótiles": [
      `Tu teoría suena hermosa, pero ¿dónde está la evidencia empírica? Sin ejemplos concretos de la experiencia, ¿no estamos simplemente especulando en el vacío?`,
      `Veo que generalizas a partir de casos limitados. ¿Has considerado todas las variables y excepciones? La inducción rigurosa requiere más que unos pocos ejemplos.`,
      `Hablemos con los pies en la tierra: ¿tu idea funciona en la práctica real? Porque una teoría que no se puede aplicar es tan útil como un martillo de papel.`
    ],
    "Nietschka": [
      `¡Ajá! Detectó valores heredados sin examinar. ¿Esas ideas realmente son tuyas, o simplemente repites lo que te enseñaron los "buenos"? ¡Es hora de crear tus propios valores!`,
      `Tu moral me huele a rebaño. ¿Por qué debería ser "bueno" lo que dices? ¿Quién decidió eso? ¡Libérate de esas cadenas y piensa más allá del bien y del mal!`,
      `¿Sabes qué veo en tu argumento? Miedo. Miedo a la libertad terrible de crear significado propio. ¿No es hora de que te conviertas en el arquitecto de tus propios valores?`
    ]
  }

  const responses = mockResponses[philosopher.name as keyof typeof mockResponses] || mockResponses["Sócrato"]
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  return {
    content: randomResponse,
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150
    }
  }
}

function extractKeyTerm(message: string): string {
  // Extraer un término clave para usar en preguntas socráticas
  const words = message.split(' ').filter(word => word.length > 5)
  return words[Math.floor(Math.random() * words.length)] || "eso"
} 