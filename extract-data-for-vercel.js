const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔄 Extracting data from SQLite backup for Vercel PostgreSQL...');

const db = new sqlite3.Database('./dev.db');

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

// Extract LLM Providers
db.all("SELECT * FROM llm_providers ORDER BY id", (err, providers) => {
  if (err) {
    console.error('Error extracting providers:', err);
    return;
  }
  
  console.log(`📊 Found ${providers.length} LLM providers`);
  
  providers.forEach(provider => {
    sqlOutput += `INSERT INTO "LLMProvider" (id, name, "apiKeyRequired", "baseUrl", "isActive", "createdAt", "updatedAt") VALUES (${provider.id}, '${provider.name.replace(/'/g, "''")}', ${provider.apiKeyRequired}, ${provider.baseUrl ? `'${provider.baseUrl.replace(/'/g, "''")}'` : 'NULL'}, ${provider.isActive}, '${provider.createdAt}', '${provider.updatedAt}');\n`;
  });
  
  // Extract LLM Models
  db.all("SELECT * FROM llm_models ORDER BY id", (err, models) => {
    if (err) {
      console.error('Error extracting models:', err);
      return;
    }
    
    console.log(`📊 Found ${models.length} LLM models`);
    
    models.forEach(model => {
      sqlOutput += `INSERT INTO "LLMModel" (id, name, "providerId", "modelIdentifier", "isActive", "maxTokens", "costPer1kTokens", "createdAt", "updatedAt") VALUES (${model.id}, '${model.name.replace(/'/g, "''")}', ${model.providerId}, '${model.modelIdentifier.replace(/'/g, "''")}', ${model.isActive}, ${model.maxTokens || 'NULL'}, ${model.costPer1kTokens || 'NULL'}, '${model.createdAt}', '${model.updatedAt}');\n`;
    });
    
    // Extract Prompt Templates
    db.all("SELECT * FROM prompt_templates ORDER BY id", (err, prompts) => {
      if (err) {
        console.error('Error extracting prompts:', err);
        return;
      }
      
      console.log(`📊 Found ${prompts.length} prompt templates`);
      
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
        
        console.log(`📊 Found ${philosophers.length} philosophers`);
        
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
          
          console.log(`📊 Found ${codes.length} invitation codes`);
          
          codes.forEach(code => {
            const codeValue = code.code ? code.code.replace(/'/g, "''") : '';
            const description = code.description ? code.description.replace(/'/g, "''") : '';
            
            sqlOutput += `INSERT INTO "InvitationCode" (id, code, description, "maxUses", "currentUses", "isActive", "createdAt", "updatedAt") VALUES (${code.id}, '${codeValue}', '${description}', ${code.maxUses}, ${code.currentUses}, ${code.isActive}, '${code.createdAt}', '${code.updatedAt}');\n`;
          });
          
          // Extract Users
          db.all("SELECT * FROM users ORDER BY id", (err, users) => {
            if (err) {
              console.error('Error extracting users:', err);
              return;
            }
            
            console.log(`📊 Found ${users.length} users`);
            
            users.forEach(user => {
              const name = user.name ? user.name.replace(/'/g, "''") : '';
              const email = user.email ? user.email.replace(/'/g, "''") : '';
              
              sqlOutput += `INSERT INTO "User" (id, name, email, "isAdmin", "createdAt", "updatedAt") VALUES (${user.id}, '${name}', ${email ? `'${email}'` : 'NULL'}, ${user.isAdmin}, '${user.createdAt}', '${user.updatedAt}');\n`;
            });
            
            // Add sequence resets for PostgreSQL
            sqlOutput += `
-- Reset sequences for PostgreSQL
SELECT setval('"LLMProvider_id_seq"', (SELECT MAX(id) FROM "LLMProvider"));
SELECT setval('"LLMModel_id_seq"', (SELECT MAX(id) FROM "LLMModel"));
SELECT setval('"PromptTemplate_id_seq"', (SELECT MAX(id) FROM "PromptTemplate"));
SELECT setval('"Philosopher_id_seq"', (SELECT MAX(id) FROM "Philosopher"));
SELECT setval('"InvitationCode_id_seq"', (SELECT MAX(id) FROM "InvitationCode"));
SELECT setval('"User_id_seq"', (SELECT MAX(id) FROM "User"));

-- Verification queries
SELECT COUNT(*) as providers FROM "LLMProvider";
SELECT COUNT(*) as models FROM "LLMModel";
SELECT COUNT(*) as prompts FROM "PromptTemplate";
SELECT COUNT(*) as philosophers FROM "Philosopher";
SELECT COUNT(*) as codes FROM "InvitationCode";
SELECT COUNT(*) as users FROM "User";
`;
            
            // Write to file
            fs.writeFileSync('vercel-data-import.sql', sqlOutput);
            console.log('✅ Data extraction completed!');
            console.log('📄 Generated: vercel-data-import.sql');
            console.log('📊 Summary:');
            console.log(`   - ${providers.length} LLM providers`);
            console.log(`   - ${models.length} LLM models`);
            console.log(`   - ${prompts.length} prompt templates`);
            console.log(`   - ${philosophers.length} philosophers`);
            console.log(`   - ${codes.length} invitation codes`);
            console.log(`   - ${users.length} users`);
            
            db.close();
          });
        });
      });
    });
  });
}); 