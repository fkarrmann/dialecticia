const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Configurar SQLite (local)
const sqlite = new sqlite3.Database('./dev.db');
const sqliteAll = promisify(sqlite.all.bind(sqlite));

async function exportSQLiteData() {
  try {
    console.log('📦 Exportando datos del SQLite local...\n');

    // 1. Exportar filósofos
    console.log('👨‍🏫 Exportando filósofos...');
    const philosophers = await sqliteAll(`
      SELECT * FROM philosophers 
      WHERE isActive = 1
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/philosophers.json', JSON.stringify(philosophers, null, 2));
    console.log(`✅ ${philosophers.length} filósofos exportados`);

    // 2. Exportar templates de prompts
    console.log('\n📝 Exportando templates de prompts...');
    const promptTemplates = await sqliteAll(`
      SELECT * FROM prompt_templates 
      WHERE isActive = 1
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/prompt_templates.json', JSON.stringify(promptTemplates, null, 2));
    console.log(`✅ ${promptTemplates.length} templates exportados`);

    // 3. Exportar custom tones (si existen)
    console.log('\n🎭 Exportando tonos personalizados...');
    try {
      const customTones = await sqliteAll(`
        SELECT * FROM custom_tones 
        ORDER BY createdAt
      `);
      fs.writeFileSync('migration-data/custom_tones.json', JSON.stringify(customTones, null, 2));
      console.log(`✅ ${customTones.length} tonos exportados`);
    } catch (error) {
      console.log('⚠️ Tabla custom_tones no encontrada o vacía');
      fs.writeFileSync('migration-data/custom_tones.json', JSON.stringify([], null, 2));
    }

    // 4. Exportar configuraciones LLM
    console.log('\n⚙️ Exportando configuraciones LLM...');
    const llmConfigs = await sqliteAll(`
      SELECT * FROM llm_configurations 
      WHERE isActive = 1
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/llm_configurations.json', JSON.stringify(llmConfigs, null, 2));
    console.log(`✅ ${llmConfigs.length} configuraciones exportadas`);

    // 5. Exportar proveedores LLM
    console.log('\n🔌 Exportando proveedores LLM...');
    const llmProviders = await sqliteAll(`
      SELECT * FROM llm_providers 
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/llm_providers.json', JSON.stringify(llmProviders, null, 2));
    console.log(`✅ ${llmProviders.length} proveedores exportados`);

    // 6. Exportar modelos LLM
    console.log('\n🤖 Exportando modelos LLM...');
    const llmModels = await sqliteAll(`
      SELECT * FROM llm_models 
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/llm_models.json', JSON.stringify(llmModels, null, 2));
    console.log(`✅ ${llmModels.length} modelos exportados`);

    // 7. Exportar usuarios
    console.log('\n👤 Exportando usuarios...');
    const users = await sqliteAll(`
      SELECT * FROM users 
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/users.json', JSON.stringify(users, null, 2));
    console.log(`✅ ${users.length} usuarios exportados`);

    // 8. Exportar códigos de invitación
    console.log('\n🎫 Exportando códigos de invitación...');
    const invitationCodes = await sqliteAll(`
      SELECT * FROM invitation_codes 
      ORDER BY createdAt
    `);
    
    fs.writeFileSync('migration-data/invitation_codes.json', JSON.stringify(invitationCodes, null, 2));
    console.log(`✅ ${invitationCodes.length} códigos exportados`);

    console.log('\n🎯 EXPORTACIÓN COMPLETA');
    console.log('Archivos creados en migration-data/');
    console.log('Ahora puedes usar estos archivos para importar a PostgreSQL');

    // Crear resumen
    const summary = {
      philosophers: philosophers.length,
      promptTemplates: promptTemplates.length,
      customTones: 0, // Se actualiza si hay datos
      llmConfigs: llmConfigs.length,
      llmProviders: llmProviders.length,
      llmModels: llmModels.length,
      users: users.length,
      invitationCodes: invitationCodes.length,
      exportDate: new Date().toISOString()
    };

    fs.writeFileSync('migration-data/export_summary.json', JSON.stringify(summary, null, 2));
    console.log('\n📊 Resumen guardado en export_summary.json');

  } catch (error) {
    console.error('❌ Error en exportación:', error);
  } finally {
    sqlite.close();
  }
}

// Crear directorio si no existe
if (!fs.existsSync('migration-data')) {
  fs.mkdirSync('migration-data');
}

// Ejecutar exportación
exportSQLiteData(); 