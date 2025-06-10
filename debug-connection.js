const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar exactamente la misma URL que Prisma
const dbPath = './dev.db';

console.log('🔍 Debugging conexión exacta como Prisma...');
console.log('📁 Ruta exacta:', dbPath);
console.log('📁 Ruta absoluta:', path.resolve(dbPath));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar:', err.message);
    return;
  }
  console.log('✅ Conectado a SQLite con la misma ruta que Prisma');
});

// Verificar datos
const queries = [
  'SELECT COUNT(*) as count FROM philosophers',
  'SELECT COUNT(*) as count FROM users', 
  'SELECT COUNT(*) as count FROM llm_providers',
  'SELECT name FROM philosophers LIMIT 3',
  'SELECT name FROM llm_providers LIMIT 3'
];

queries.forEach((query, index) => {
  db.all(query, (err, rows) => {
    if (err) {
      console.error(`❌ Error en query ${index + 1}:`, err.message);
    } else {
      console.log(`📊 Query ${index + 1} (${query}):`, rows);
    }
    
    // Cerrar en la última query
    if (index === queries.length - 1) {
      db.close();
    }
  });
});

// También verificar el tamaño del archivo
const fs = require('fs');
const stats = fs.statSync(dbPath);
console.log('📦 Tamaño del archivo:', stats.size, 'bytes'); 