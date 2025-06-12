import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Función de encriptación actualizada
function encryptApiKey(apiKey: string): string {
  const encryptionKey = process.env.LLM_ENCRYPTION_KEY || 'your-dev-encryption-key-32-chars!!';
  const algorithm = 'aes-256-cbc';
  const iv = randomBytes(16);
  
  // Asegurar que la key sea de 32 bytes
  const key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32));
  
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Retornar IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

export async function POST(request: NextRequest) {
  try {
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      operations: [] as string[],
      errors: [] as string[]
    };

    // Verificar variables de entorno
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    results.operations.push(`Variables: OpenAI ${openaiKey ? '✓' : '✗'}, Anthropic ${anthropicKey ? '✓' : '✗'}`);

    // Actualizar Anthropic con SQL crudo
    if (anthropicKey) {
      try {
        const encryptedKey = encryptApiKey(anthropicKey);
        
        const result = await prisma.$executeRaw`
          UPDATE llm_providers 
          SET "apiKeyEncrypted" = ${encryptedKey}, "isActive" = true, "updatedAt" = now()
          WHERE name = 'anthropic'
        `;
        
        results.operations.push(`Anthropic actualizado: ${result} proveedores`);
      } catch (error: any) {
        results.errors.push(`Error Anthropic: ${error.message}`);
      }
    }

    // Actualizar OpenAI con SQL crudo
    if (openaiKey) {
      try {
        const encryptedKey = encryptApiKey(openaiKey);
        
        const result = await prisma.$executeRaw`
          UPDATE llm_providers 
          SET "apiKeyEncrypted" = ${encryptedKey}, "isActive" = true, "updatedAt" = now()
          WHERE name IN ('OpenAI', 'openai')
        `;
        
        results.operations.push(`OpenAI actualizado: ${result} proveedores`);
      } catch (error: any) {
        results.errors.push(`Error OpenAI: ${error.message}`);
      }
    }

    // Verificar resultado
    const checkResult = await prisma.$queryRaw`
      SELECT name, "isActive", 
             CASE WHEN "apiKeyEncrypted" IS NOT NULL THEN 'SI' ELSE 'NO' END as has_key
      FROM llm_providers
    `;
    
    results.operations.push(`Estado proveedores:`);
    (checkResult as any[]).forEach((p: any) => {
      results.operations.push(`- ${p.name}: ${p.isActive ? 'ACTIVO' : 'INACTIVO'}, Key: ${p.has_key}`);
    });

    if (results.errors.length > 0) {
      results.success = false;
    }

    return NextResponse.json(results);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      operations: [],
      errors: [error.message]
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 