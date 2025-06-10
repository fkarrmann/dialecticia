const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');

console.log('🔍 Conectando directamente a SQLite...');
console.log('📁 Ruta de la base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar:', err.message);
    return;
  }
  console.log('✅ Conectado a SQLite');
});

// Verificar tablas
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Error al obtener tablas:', err.message);
    return;
  }
  console.log('📋 Tablas encontradas:', tables.map(t => t.name));
});

// Contar registros
const queries = [
  { name: 'Filósofos', query: 'SELECT COUNT(*) as count FROM philosophers' },
  { name: 'Usuarios', query: 'SELECT COUNT(*) as count FROM users' },
  { name: 'Debates', query: 'SELECT COUNT(*) as count FROM debates' },
  { name: 'Mensajes', query: 'SELECT COUNT(*) as count FROM messages' },
  { name: 'Proveedores LLM', query: 'SELECT COUNT(*) as count FROM llm_providers' }
];

queries.forEach(({ name, query }) => {
  db.get(query, (err, row) => {
    if (err) {
      console.error(`❌ Error en ${name}:`, err.message);
    } else {
      console.log(`📊 ${name}: ${row.count}`);
    }
  });
});

// Obtener algunos filósofos
db.all("SELECT id, name FROM philosophers LIMIT 5", (err, philosophers) => {
  if (err) {
    console.error('❌ Error al obtener filósofos:', err.message);
  } else {
    console.log('👥 Filósofos:');
    philosophers.forEach(p => console.log(`  - ${p.name} (${p.id})`));
  }
  
  db.close();
}); 