const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Configurar Prisma para PostgreSQL (producción)
const postgresqlPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgres://neondb_owner:npg_snIExR8CZ0ie@ep-dark-river-a47rfl5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

// Configurar SQLite (local)
const sqlite = new sqlite3.Database('./dev.db');
const sqliteAll = promisify(sqlite.all.bind(sqlite));
const sqliteGet = promisify(sqlite.get.bind(sqlite));

async function migrateCompleteData() {
  try {
    console.log('🚀 Iniciando migración completa de datos...\n');

    // 1. Migrar filósofos
    console.log('👨‍🏫 Migrando filósofos...');
    const philosophers = await sqliteAll(`
      SELECT * FROM philosophers 
      WHERE isActive = 1 AND isDefault = 1
      ORDER BY createdAt
    `);

    let philosophersCreated = 0;
    for (const phil of philosophers) {
      try {
        await postgresqlPrisma.philosopher.upsert({
          where: { name: phil.name },
          update: {},
          create: {
            name: phil.name,
            description: phil.description,
            philosophicalSchool: phil.philosophicalSchool,
            personalityTraits: phil.personalityTraits,
            coreBeliefs: phil.coreBeliefs,
            argumentStyle: phil.argumentStyle,
            questioningApproach: phil.questioningApproach,
            isActive: Boolean(phil.isActive),
            isDefault: Boolean(phil.isDefault),
            isPublic: Boolean(phil.isPublic),
            publicDescription: phil.publicDescription,
            inspirationSource: phil.inspirationSource,
            debateMechanics: phil.debateMechanics,
            tags: phil.tags,
            rating: phil.rating || 4.5,
            totalRatings: phil.totalRatings || 50
          }
        });
        console.log(`✅ Filósofo: ${phil.name}`);
        philosophersCreated++;
      } catch (error) {
        console.log(`⚠️ Error con ${phil.name}:`, error.message);
      }
    }

    // 2. Migrar templates de prompts
    console.log('\n📝 Migrando templates de prompts...');
    const promptTemplates = await sqliteAll(`
      SELECT * FROM prompt_templates 
      WHERE isActive = 1
      ORDER BY createdAt
    `);

    let promptsCreated = 0;
    for (const template of promptTemplates) {
      try {
        await postgresqlPrisma.promptTemplate.upsert({
          where: { name: template.name },
          update: {},
          create: {
            name: template.name,
            category: template.category,
            displayName: template.displayName,
            version: template.version || '1.0.0',
            isActive: Boolean(template.isActive),
            systemPrompt: template.systemPrompt,
            userPrompt: template.userPrompt,
            parameters: template.parameters,
            description: template.description,
            usage: template.usage,
            testData: template.testData,
            createdBy: template.createdBy,
            metadata: template.metadata
          }
        });
        console.log(`✅ Template: ${template.name}`);
        promptsCreated++;
      } catch (error) {
        console.log(`⚠️ Error con template ${template.name}:`, error.message);
      }
    }

    // 3. Migrar custom tones
    console.log('\n🎭 Migrando tonos personalizados...');
    const customTones = await sqliteAll(`
      SELECT * FROM custom_tones 
      WHERE isActive = 1
      ORDER BY createdAt
    `);

    let tonesCreated = 0;
    for (const tone of customTones) {
      try {
        await postgresqlPrisma.customTone.upsert({
          where: { name: tone.name },
          update: {},
          create: {
            name: tone.name,
            description: tone.description,
            prompt: tone.prompt,
            isActive: Boolean(tone.isActive),
            isDefault: Boolean(tone.isDefault),
            category: tone.category || 'general'
          }
        });
        console.log(`✅ Tono: ${tone.name}`);
        tonesCreated++;
      } catch (error) {
        console.log(`⚠️ Error con tono ${tone.name}:`, error.message);
      }
    }

    // 4. Migrar configuraciones LLM
    console.log('\n⚙️ Migrando configuraciones LLM...');
    const llmConfigs = await sqliteAll(`
      SELECT * FROM llm_configurations 
      WHERE isActive = 1
      ORDER BY createdAt
    `);

    let configsCreated = 0;
    for (const config of llmConfigs) {
      try {
        await postgresqlPrisma.lLMConfiguration.upsert({
          where: { functionName: config.functionName },
          update: {},
          create: {
            functionName: config.functionName,
            description: config.description,
            parameters: config.parameters,
            modelId: null, // Lo conectaremos después
            isActive: Boolean(config.isActive)
          }
        });
        console.log(`✅ Config: ${config.functionName}`);
        configsCreated++;
      } catch (error) {
        console.log(`⚠️ Error con config ${config.functionName}:`, error.message);
      }
    }

    // 5. Crear usuario admin si no existe
    console.log('\n👤 Verificando usuario admin...');
    const adminUser = await postgresqlPrisma.user.upsert({
      where: { email: 'fkarrmann@gmail.com' },
      update: { isAdmin: true },
      create: {
        name: 'Federico Karrmann',
        email: 'fkarrmann@gmail.com',
        isAdmin: true
      }
    });

    // 6. Crear código de invitación válido
    console.log('\n🎫 Creando código de invitación...');
    const invitationCode = await postgresqlPrisma.invitationCode.create({
      data: {
        code: 'MIGRATION-COMPLETE-2024',
        description: 'Código post-migración completa',
        maxUses: 10,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // 7. Estadísticas finales
    console.log('\n📊 MIGRACIÓN COMPLETA - Estadísticas:');
    console.log(`✅ Filósofos migrados: ${philosophersCreated}`);
    console.log(`✅ Prompts migrados: ${promptsCreated}`);
    console.log(`✅ Tonos migrados: ${tonesCreated}`);
    console.log(`✅ Configs migradas: ${configsCreated}`);
    console.log(`✅ Admin: ${adminUser.email}`);
    console.log(`✅ Código: ${invitationCode.code}`);

    const finalStats = {
      philosophers: await postgresqlPrisma.philosopher.count(),
      templates: await postgresqlPrisma.promptTemplate.count(),
      tones: await postgresqlPrisma.customTone.count(),
      configs: await postgresqlPrisma.lLMConfiguration.count(),
      providers: await postgresqlPrisma.lLMProvider.count(),
      models: await postgresqlPrisma.lLMModel.count()
    };

    console.log('\n🎯 Estado final en PostgreSQL:');
    console.log(finalStats);

    console.log('\n🚀 ¡MIGRACIÓN EXITOSA!');
    console.log(`🔑 Usa el código: ${invitationCode.code}`);
    console.log('🌐 Accede a: https://dialecticia.vercel.app');

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await postgresqlPrisma.$disconnect();
    sqlite.close();
  }
}

// Ejecutar migración
migrateCompleteData(); 