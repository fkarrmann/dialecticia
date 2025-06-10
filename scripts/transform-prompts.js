#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const OpenAI = require('openai')

// Configuración
const PROMPTS_DIR = path.join(__dirname, '..', 'docs', 'prompts')
const MD_FILE = path.join(PROMPTS_DIR, 'socratic-strategy.md')
const JSON_FILE = path.join(PROMPTS_DIR, 'generated-prompts.json')
const SCHEMA_FILE = path.join(PROMPTS_DIR, 'prompts.schema.json')
const CACHE_FILE = path.join(PROMPTS_DIR, '.prompts-cache')
const VERSIONS_DIR = path.join(PROMPTS_DIR, 'versions')

// Configurar OpenAI para GPT-4o-mini
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = 'gpt-4o-mini' // Más barato y perfecto para transformaciones

async function main() {
  try {
    console.log('🤖 Dialecticia Prompt Transformer')
    console.log('=====================================')

    // Verificar si existe el archivo markdown
    if (!fs.existsSync(MD_FILE)) {
      console.error('❌ No se encontró socratic-strategy.md')
      process.exit(1)
    }

    // Leer contenido del markdown
    const mdContent = fs.readFileSync(MD_FILE, 'utf8')
    const currentHash = crypto.createHash('md5').update(mdContent).digest('hex')

    // Verificar si hay cambios
    let lastHash = ''
    if (fs.existsSync(CACHE_FILE)) {
      lastHash = fs.readFileSync(CACHE_FILE, 'utf8').trim()
    }

    if (currentHash === lastHash) {
      console.log('📄 No hay cambios en el markdown - omitiendo transformación')
      return
    }

    console.log('📝 Detectados cambios en socratic-strategy.md')
    console.log(`🔄 Hash: ${currentHash.substring(0, 8)}...`)

    // Crear backup antes de transformar
    await createBackup(mdContent)

    // Transformar markdown a JSON usando GPT-4o-mini
    console.log('🤖 Transformando con GPT-4o-mini...')
    const generatedJson = await transformMarkdownToJson(mdContent)

    // Validar el JSON generado
    console.log('✅ Validando estructura...')
    await validateGeneratedJson(generatedJson)

    // Guardar el JSON generado
    fs.writeFileSync(JSON_FILE, JSON.stringify(generatedJson, null, 2), 'utf8')
    console.log('💾 JSON generado guardado')

    // Actualizar cache
    fs.writeFileSync(CACHE_FILE, currentHash, 'utf8')
    console.log('🔄 Cache actualizado')

    console.log('✨ Transformación completada exitosamente')

  } catch (error) {
    console.error('❌ Error durante la transformación:', error.message)
    process.exit(1)
  }
}

async function transformMarkdownToJson(mdContent) {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'))

  const systemPrompt = `Eres un experto en transformar documentación de prompts desde Markdown hacia JSON estructurado.

Tu tarea es extraer los prompts y configuraciones del markdown y convertirlos al formato JSON específico.

IMPORTANTE:
- Extrae exactamente los prompts que están entre bloques de código \`\`\`
- Mantén la información de estilo y longitud máxima
- Genera ejemplos basados en los que aparecen en el markdown
- El JSON debe seguir exactamente el schema proporcionado
- NO inventes información que no esté en el markdown
- SÉ PRECISO con las extracciones`

  const userPrompt = `Transforma este markdown de estrategia socrática a JSON:

MARKDOWN:
${mdContent}

SCHEMA A SEGUIR:
${JSON.stringify(schema, null, 2)}

Devuelve SOLO el JSON válido sin explicaciones adicionales.`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.1, // Muy baja para consistencia
    })

    const jsonString = completion.choices[0]?.message?.content?.trim()
    
    if (!jsonString) {
      throw new Error('GPT-4o-mini no devolvió contenido')
    }

    // Intentar parsear el JSON
    const parsedJson = JSON.parse(jsonString)
    
    // Agregar metadata
    parsedJson.version = "1.0.0"
    parsedJson.lastUpdated = new Date().toISOString()

    console.log(`💰 Tokens usados: ${completion.usage?.total_tokens || 'unknown'}`)
    
    return parsedJson

  } catch (error) {
    throw new Error(`Error en transformación GPT-4o-mini: ${error.message}`)
  }
}

async function validateGeneratedJson(jsonData) {
  // Validaciones básicas de estructura
  const requiredKeys = ['version', 'lastUpdated', 'socraticPrompts', 'philosopherPrompts']
  
  for (const key of requiredKeys) {
    if (!(key in jsonData)) {
      throw new Error(`Falta la clave requerida: ${key}`)
    }
  }

  // Validar prompts socráticos
  const requiredSocraticPrompts = [
    'SOCRATIC_MODERATOR_PLURAL',
    'SOCRATIC_TO_USER', 
    'SOCRATIC_TO_PHILOSOPHER',
    'RESPONDING_TO_SOCRATES',
    'SOCRATIC_DEFAULT'
  ]

  for (const promptType of requiredSocraticPrompts) {
    if (!(promptType in jsonData.socraticPrompts)) {
      throw new Error(`Falta prompt socrático: ${promptType}`)
    }
    
    const prompt = jsonData.socraticPrompts[promptType]
    if (!prompt.systemPrompt || !prompt.style || !prompt.maxLength) {
      throw new Error(`Prompt ${promptType} incompleto`)
    }
  }

  console.log('✅ Validación de estructura pasada')
}

async function createBackup(mdContent) {
  // Crear directorio de versiones si no existe
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true })
  }

  // Leer JSON actual si existe
  let currentJson = null
  if (fs.existsSync(JSON_FILE)) {
    try {
      currentJson = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
    } catch (e) {
      console.log('⚠️ No se pudo leer JSON actual para backup')
    }
  }

  // Crear backup
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0]
  const backupData = {
    timestamp: new Date().toISOString(),
    mdHash: crypto.createHash('md5').update(mdContent).digest('hex'),
    markdownSource: mdContent,
    generatedJson: currentJson,
    reason: 'auto-transform'
  }

  const backupFile = path.join(VERSIONS_DIR, `${timestamp}.backup.json`)
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8')

  console.log(`💾 Backup creado: ${timestamp}.backup.json`)
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { transformMarkdownToJson, validateGeneratedJson } 