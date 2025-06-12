const { Client } = require('pg');
const fs = require('fs');
const Database = require('better-sqlite3');

// Configuración de PostgreSQL (Vercel)
const client = new Client({
  connectionString: process.env.DATABASE_POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuración de SQLite local
const db = new Database('./dev.db');

async function importCompleteData() {
  try {
    console.log('🚀 Conectando a PostgreSQL...');
    await client.connect();
    
    console.log('📊 Extrayendo datos de SQLite...');
    
    // 1. PROMPTS (40 prompts completos con corrección ortográfica)
    console.log('📝 Importando prompts...');
    const prompts = db.prepare(`
      SELECT * FROM prompt_templates ORDER BY createdAt
    `).all();
    
    // Limpiar prompts existentes
    await client.query('DELETE FROM "PromptTemplate"');
    
    for (const prompt of prompts) {
      await client.query(`
        INSERT INTO "PromptTemplate" (
          id, name, description, template, category, "isActive", 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          template = EXCLUDED.template,
          category = EXCLUDED.category,
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [
        prompt.id,
        prompt.displayName || prompt.name,
        prompt.description || prompt.usage || 'Prompt importado',
        prompt.systemPrompt,
        prompt.category,
        prompt.isActive === 1 || prompt.isActive === true,
        new Date(prompt.createdAt),
        new Date(prompt.updatedAt || prompt.createdAt)
      ]);
    }
    console.log(`✅ Importados ${prompts.length} prompts`);
    
    // 2. FILÓSOFOS (18 filósofos completos)
    console.log('🧠 Importando filósofos...');
    const philosophers = db.prepare(`
      SELECT * FROM philosophers ORDER BY createdAt
    `).all();
    
    // Limpiar filósofos existentes
    await client.query('DELETE FROM "Philosopher"');
    
    for (const phil of philosophers) {
      await client.query(`
        INSERT INTO "Philosopher" (
          id, name, description, "imageUrl", "isActive", 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          "imageUrl" = EXCLUDED."imageUrl",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [
        phil.id,
        phil.name,
        phil.description,
        phil.imageUrl,
        phil.isActive === 1 || phil.isActive === true,
        new Date(phil.createdAt),
        new Date(phil.updatedAt || phil.createdAt)
      ]);
    }
    console.log(`✅ Importados ${philosophers.length} filósofos`);
    
    // 3. ASPECTOS DE PERSONALIDAD
    console.log('🎭 Importando aspectos de personalidad...');
    const aspects = db.prepare(`
      SELECT * FROM philosopher_personality_aspects ORDER BY createdAt
    `).all();
    
    // Limpiar aspectos existentes
    await client.query('DELETE FROM "PhilosopherPersonalityAspect"');
    
    for (const aspect of aspects) {
      await client.query(`
        INSERT INTO "PhilosopherPersonalityAspect" (
          id, "philosopherId", "aspectType", content, 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          "philosopherId" = EXCLUDED."philosopherId",
          "aspectType" = EXCLUDED."aspectType",
          content = EXCLUDED.content,
          "updatedAt" = EXCLUDED."updatedAt"
      `, [
        aspect.id,
        aspect.philosopherId,
        aspect.aspectType,
        aspect.content,
        new Date(aspect.createdAt),
        new Date(aspect.updatedAt || aspect.createdAt)
      ]);
    }
    console.log(`✅ Importados ${aspects.length} aspectos de personalidad`);
    
    // 4. PROVEEDORES LLM
    console.log('🔧 Importando proveedores LLM...');
    const providers = db.prepare(`
      SELECT * FROM llm_providers ORDER BY createdAt
    `).all();
    
    for (const provider of providers) {
      await client.query(`
        INSERT INTO "LLMProvider" (
          id, name, "apiEndpoint", "isActive", 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "apiEndpoint" = EXCLUDED."apiEndpoint",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [
        provider.id,
        provider.name,
        provider.apiEndpoint,
        provider.isActive === 1 || provider.isActive === true,
        new Date(provider.createdAt),
        new Date(provider.updatedAt || provider.createdAt)
      ]);
    }
    console.log(`✅ Importados ${providers.length} proveedores`);
    
    // 5. MODELOS LLM
    console.log('🤖 Importando modelos LLM...');
    const models = db.prepare(`
      SELECT * FROM llm_models ORDER BY createdAt
    `).all();
    
    for (const model of models) {
      await client.query(`
        INSERT INTO "LLMModel" (
          id, name, "providerId", "modelIdentifier", "isActive", 
          "maxTokens", "costPer1kTokens", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "providerId" = EXCLUDED."providerId",
          "modelIdentifier" = EXCLUDED."modelIdentifier",
          "isActive" = EXCLUDED."isActive",
          "maxTokens" = EXCLUDED."maxTokens",
          "costPer1kTokens" = EXCLUDED."costPer1kTokens",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [
        model.id,
        model.name,
        model.providerId,
        model.modelIdentifier,
        model.isActive === 1 || model.isActive === true,
        model.maxTokens,
        parseFloat(model.costPer1kTokens || 0),
        new Date(model.createdAt),
        new Date(model.updatedAt || model.createdAt)
      ]);
    }
    console.log(`✅ Importados ${models.length} modelos`);
    
    // 6. VERIFICACIÓN FINAL
    console.log('🔍 Verificando importación...');
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM "PromptTemplate") as prompts,
        (SELECT COUNT(*) FROM "Philosopher") as philosophers,
        (SELECT COUNT(*) FROM "PhilosopherPersonalityAspect") as aspects,
        (SELECT COUNT(*) FROM "LLMProvider") as providers,
        (SELECT COUNT(*) FROM "LLMModel") as models
    `);
    
    console.log('📊 RESUMEN DE IMPORTACIÓN:');
    console.log(`   Prompts: ${counts.rows[0].prompts}`);
    console.log(`   Filósofos: ${counts.rows[0].philosophers}`);
    console.log(`   Aspectos: ${counts.rows[0].aspects}`);
    console.log(`   Proveedores: ${counts.rows[0].providers}`);
    console.log(`   Modelos: ${counts.rows[0].models}`);
    
    // Verificar que el prompt de corrección ortográfica está presente
    const orthoPrompt = await client.query(`
      SELECT name FROM "PromptTemplate" 
      WHERE template LIKE '%ortográf%' OR template LIKE '%error%'
      LIMIT 1
    `);
    
    if (orthoPrompt.rows.length > 0) {
      console.log('✅ Prompt de corrección ortográfica confirmado');
    } else {
      console.log('⚠️  Prompt de corrección ortográfica no encontrado');
    }
    
    console.log('🎉 ¡Importación completa exitosa!');
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    throw error;
  } finally {
    await client.end();
    db.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  importCompleteData().catch(console.error);
}

module.exports = { importCompleteData }; 