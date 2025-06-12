const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔄 Starting data extraction...');

const db = new sqlite3.Database('./dev.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('✅ Database opened successfully');
});

// Test basic query first
db.get("SELECT COUNT(*) as count FROM prompt_templates", (err, row) => {
  if (err) {
    console.error('Error querying database:', err);
    return;
  }
  console.log(`📊 Found ${row.count} prompt templates`);
  
  // Now extract all data
  extractAllData();
});

function extractAllData() {
  let sqlOutput = `-- DIALECTICIA DATA EXTRACTION FOR VERCEL POSTGRESQL
-- Generated: ${new Date().toISOString()}
-- Source: Dialecticia-BACKUP-PRE-GITHUB-20250610-132758

-- Clear existing data (be careful!)
DELETE FROM "DebateMessage" WHERE true;
DELETE FROM "Debate" WHERE true;
DELETE FROM "Session" WHERE true;
DELETE FROM "User" WHERE true;
DELETE FROM "InvitationCode" WHERE true;
DELETE FROM "PromptTemplate" WHERE true;
DELETE FROM "Philosopher" WHERE true;
DELETE FROM "LLMModel" WHERE true;
DELETE FROM "LLMProvider" WHERE true;

`;

  // Extract Prompt Templates
  db.all("SELECT * FROM prompt_templates ORDER BY id", (err, prompts) => {
    if (err) {
      console.error('Error extracting prompts:', err);
      return;
    }
    
    console.log(`📊 Extracting ${prompts.length} prompt templates`);
    
    prompts.forEach(prompt => {
      const template = prompt.template ? prompt.template.replace(/'/g, "''") : '';
      const description = prompt.description ? prompt.description.replace(/'/g, "''") : '';
      const name = prompt.name ? prompt.name.replace(/'/g, "''") : '';
      const category = prompt.category ? prompt.category.replace(/'/g, "''") : '';
      
      sqlOutput += `INSERT INTO "PromptTemplate" (id, name, description, template, category, "isActive", "createdAt", "updatedAt") VALUES (${prompt.id}, '${name}', '${description}', '${template}', '${category}', ${prompt.isActive}, '${prompt.createdAt}', '${prompt.updatedAt}');\n`;
    });
    
    // Extract Philosophers
    db.all("SELECT * FROM philosophers ORDER BY id", (err, philosophers) => {
      if (err) {
        console.error('Error extracting philosophers:', err);
        return;
      }
      
      console.log(`📊 Extracting ${philosophers.length} philosophers`);
      
      philosophers.forEach(philosopher => {
        const name = philosopher.name ? philosopher.name.replace(/'/g, "''") : '';
        const description = philosopher.description ? philosopher.description.replace(/'/g, "''") : '';
        const personality = philosopher.personality ? philosopher.personality.replace(/'/g, "''") : '';
        const avatarUrl = philosopher.avatarUrl ? philosopher.avatarUrl.replace(/'/g, "''") : '';
        const era = philosopher.era ? philosopher.era.replace(/'/g, "''") : '';
        const school = philosopher.school ? philosopher.school.replace(/'/g, "''") : '';
        const keyIdeas = philosopher.keyIdeas ? philosopher.keyIdeas.replace(/'/g, "''") : '';
        const debateStyle = philosopher.debateStyle ? philosopher.debateStyle.replace(/'/g, "''") : '';
        const aspects = philosopher.aspects ? philosopher.aspects.replace(/'/g, "''") : '';
        
        sqlOutput += `INSERT INTO "Philosopher" (id, name, description, personality, "avatarUrl", era, school, "keyIdeas", "debateStyle", aspects, "isActive", "createdAt", "updatedAt") VALUES (${philosopher.id}, '${name}', '${description}', '${personality}', ${avatarUrl ? `'${avatarUrl}'` : 'NULL'}, ${era ? `'${era}'` : 'NULL'}, ${school ? `'${school}'` : 'NULL'}, ${keyIdeas ? `'${keyIdeas}'` : 'NULL'}, ${debateStyle ? `'${debateStyle}'` : 'NULL'}, ${aspects ? `'${aspects}'` : 'NULL'}, ${philosopher.isActive}, '${philosopher.createdAt}', '${philosopher.updatedAt}');\n`;
      });
      
      // Extract Invitation Codes
      db.all("SELECT * FROM invitation_codes ORDER BY id", (err, codes) => {
        if (err) {
          console.error('Error extracting invitation codes:', err);
          return;
        }
        
        console.log(`📊 Extracting ${codes.length} invitation codes`);
        
        codes.forEach(code => {
          const codeValue = code.code ? code.code.replace(/'/g, "''") : '';
          const description = code.description ? code.description.replace(/'/g, "''") : '';
          
          sqlOutput += `INSERT INTO "InvitationCode" (id, code, description, "maxUses", "currentUses", "isActive", "createdAt", "updatedAt") VALUES (${code.id}, '${codeValue}', '${description}', ${code.maxUses}, ${code.currentUses}, ${code.isActive}, '${code.createdAt}', '${code.updatedAt}');\n`;
        });
        
        // Add verification queries
        sqlOutput += `
-- Verification queries
SELECT COUNT(*) as prompts FROM "PromptTemplate";
SELECT COUNT(*) as philosophers FROM "Philosopher";
SELECT COUNT(*) as codes FROM "InvitationCode";
`;
        
        // Write to file
        fs.writeFileSync('vercel-data-import.sql', sqlOutput);
        console.log('✅ Data extraction completed!');
        console.log('📄 Generated: vercel-data-import.sql');
        console.log(`📊 Summary:`);
        console.log(`   - ${prompts.length} prompt templates`);
        console.log(`   - ${philosophers.length} philosophers`);
        console.log(`   - ${codes.length} invitation codes`);
        
        db.close();
      });
    });
  });
} 