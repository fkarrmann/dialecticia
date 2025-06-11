const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Cliente para PostgreSQL (Vercel)
const prismaPostgres = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // PostgreSQL URL de Vercel
    }
  }
});

// Cliente para SQLite (local)
const sqliteDb = new sqlite3.Database('./dev.db');
const sqliteGet = promisify(sqliteDb.get.bind(sqliteDb));
const sqliteAll = promisify(sqliteDb.all.bind(sqliteDb));

async function migrateToPostgres() {
  try {
    console.log('🚀 Iniciando migración selectiva a PostgreSQL...');

    // 1. Migrar LLM Providers
    console.log('\n📡 Migrando LLM Providers...');
    const providers = await sqliteAll('SELECT * FROM llm_providers');
    
    for (const provider of providers) {
      await prismaPostgres.lLMProvider.upsert({
        where: { name: provider.name },
        update: {},
        create: {
          name: provider.name,
          displayName: provider.displayName,
          baseUrl: provider.baseUrl,
          isActive: Boolean(provider.isActive),
          maxTokens: provider.maxTokens,
          rateLimitRpm: provider.rateLimitRpm,
          rateLimitTpm: provider.rateLimitTpm,
          costPer1kTokens: provider.costPer1kTokens
        }
      });
      console.log(`✅ Provider migrado: ${provider.displayName}`);
    }

    // 2. Migrar LLM Models
    console.log('\n🤖 Migrando LLM Models...');
    const models = await sqliteAll(`
      SELECT m.*, p.name as providerName 
      FROM llm_models m 
      JOIN llm_providers p ON m.providerId = p.id
    `);

    for (const model of models) {
      const postgresProvider = await prismaPostgres.lLMProvider.findUnique({
        where: { name: model.providerName }
      });

      await prismaPostgres.lLMModel.upsert({
        where: { 
          providerId_modelName: {
            providerId: postgresProvider.id,
            modelName: model.modelName
          }
        },
        update: {},
        create: {
          providerId: postgresProvider.id,
          modelName: model.modelName,
          displayName: model.displayName,
          isActive: Boolean(model.isActive),
          maxTokens: model.maxTokens,
          costPer1kInput: model.costPer1kInput,
          costPer1kOutput: model.costPer1kOutput,
          usageFunction: model.usageFunction
        }
      });
      console.log(`✅ Modelo migrado: ${model.displayName}`);
    }

    // 3. Migrar Prompt Templates (CRÍTICO)
    console.log('\n📝 Migrando Prompt Templates...');
    const promptTemplates = await sqliteAll('SELECT * FROM prompt_templates WHERE isActive = 1');

    for (const template of promptTemplates) {
      await prismaPostgres.promptTemplate.upsert({
        where: {
          name_version: {
            name: template.name,
            version: template.version
          }
        },
        update: {},
        create: {
          name: template.name,
          category: template.category,
          displayName: template.displayName,
          version: template.version,
          isActive: Boolean(template.isActive),
          systemPrompt: template.systemPrompt,
          description: template.description,
          usage: template.usage
        }
      });
      console.log(`✅ Prompt migrado: ${template.displayName} v${template.version}`);
    }

    // 4. Migrar LLM Configurations
    console.log('\n⚙️ Migrando LLM Configurations...');
    const configurations = await sqliteAll(`
      SELECT c.*, m.modelName, p.name as providerName, pt.name as promptName, pt.version as promptVersion
      FROM llm_configurations c
      LEFT JOIN llm_models m ON c.modelId = m.id
      LEFT JOIN llm_providers p ON m.providerId = p.id
      LEFT JOIN prompt_templates pt ON c.promptTemplateId = pt.id
      WHERE c.isActive = 1
    `);

    for (const config of configurations) {
      let postgresModel = null;
      let postgresPrompt = null;

      if (config.modelName && config.providerName) {
        const postgresProvider = await prismaPostgres.lLMProvider.findUnique({
          where: { name: config.providerName }
        });
        
        if (postgresProvider) {
          postgresModel = await prismaPostgres.lLMModel.findUnique({
            where: {
              providerId_modelName: {
                providerId: postgresProvider.id,
                modelName: config.modelName
              }
            }
          });
        }
      }

      if (config.promptName && config.promptVersion) {
        postgresPrompt = await prismaPostgres.promptTemplate.findUnique({
          where: {
            name_version: {
              name: config.promptName,
              version: config.promptVersion
            }
          }
        });
      }

      await prismaPostgres.lLMConfiguration.upsert({
        where: { functionName: config.functionName },
        update: {},
        create: {
          functionName: config.functionName,
          modelId: postgresModel?.id,
          promptTemplateId: postgresPrompt?.id,
          isActive: Boolean(config.isActive),
          description: config.description,
          parameters: config.parameters
        }
      });
      console.log(`✅ Configuración migrada: ${config.functionName}`);
    }

    // 5. Migrar Usuario Admin (Federico Karrmann)
    console.log('\n👤 Migrando Usuario Admin...');
    const adminUser = await sqliteGet('SELECT * FROM users WHERE email = ?', ['fkarrmann@gmail.com']);
    
    if (adminUser) {
      await prismaPostgres.user.upsert({
        where: { email: adminUser.email },
        update: {},
        create: {
          email: adminUser.email,
          name: adminUser.name,
          isAdmin: Boolean(adminUser.isAdmin)
        }
      });
      console.log(`✅ Usuario admin migrado: ${adminUser.name}`);
    }

    // 6. Migrar Filósofos (con sus aspectos de personalidad)
    console.log('\n🏛️ Migrando Filósofos...');
    const philosophers = await sqliteAll('SELECT * FROM philosophers WHERE isDefault = 1 OR isPublic = 1');

    for (const philosopher of philosophers) {
      const migratedPhilosopher = await prismaPostgres.philosopher.upsert({
        where: { name: philosopher.name },
        update: {},
        create: {
          name: philosopher.name,
          description: philosopher.description,
          philosophicalSchool: philosopher.philosophicalSchool,
          personalityTraits: philosopher.personalityTraits,
          coreBeliefs: philosopher.coreBeliefs,
          argumentStyle: philosopher.argumentStyle,
          questioningApproach: philosopher.questioningApproach,
          isActive: Boolean(philosopher.isActive),
          isDefault: Boolean(philosopher.isDefault),
          isDeletable: Boolean(philosopher.isDeletable),
          isPublic: Boolean(philosopher.isPublic),
          shareableId: philosopher.shareableId,
          photoUrl: philosopher.photoUrl,
          publicDescription: philosopher.publicDescription,
          inspirationSource: philosopher.inspirationSource,
          debateMechanics: philosopher.debateMechanics,
          customPrompt: philosopher.customPrompt,
          tags: philosopher.tags,
          rating: philosopher.rating,
          totalRatings: philosopher.totalRatings
        }
      });

      // Migrar aspectos de personalidad del filósofo
      const personalityAspects = await sqliteAll('SELECT * FROM philosopher_personality_aspects WHERE philosopherId = ?', [philosopher.id]);
      
      for (const aspect of personalityAspects) {
        await prismaPostgres.philosopherPersonalityAspect.upsert({
          where: {
            philosopherId_aspectName: {
              philosopherId: migratedPhilosopher.id,
              aspectName: aspect.aspectName
            }
          },
          update: {},
          create: {
            philosopherId: migratedPhilosopher.id,
            aspectName: aspect.aspectName,
            value: aspect.value,
            generatedBy: aspect.generatedBy
          }
        });
      }

      console.log(`✅ Filósofo migrado: ${philosopher.name} (con ${personalityAspects.length} aspectos)`);
    }

    // 7. Migrar Custom Tones
    console.log('\n🎨 Migrando Custom Tones...');
    const customTones = await sqliteAll('SELECT * FROM custom_tones WHERE isActive = 1');

    for (const tone of customTones) {
      await prismaPostgres.customTone.upsert({
        where: { title: tone.title },
        update: {},
        create: {
          title: tone.title,
          userDescription: tone.user_description,
          aiInterpretation: tone.ai_interpretation,
          aiLabel: tone.ai_label,
          generatedPrompt: tone.generated_prompt,
          isActive: Boolean(tone.is_active),
          usageCount: tone.usage_count
        }
      });
      console.log(`✅ Tono migrado: ${tone.title}`);
    }

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${providers.length} Proveedores LLM`);
    console.log(`   - ${models.length} Modelos LLM`);
    console.log(`   - ${promptTemplates.length} Prompt Templates`);
    console.log(`   - ${configurations.length} Configuraciones LLM`);
    console.log(`   - 1 Usuario Admin: Federico Karrmann`);
    console.log(`   - ${philosophers.length} Filósofos`);
    console.log(`   - ${customTones.length} Tonos Personalizados`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await prismaPostgres.$disconnect();
    sqliteDb.close();
  }
}

migrateToPostgres(); 