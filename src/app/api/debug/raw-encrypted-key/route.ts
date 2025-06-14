import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Obtener el provider de Anthropic
    const provider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' })
    }
    
    const encryptedKey = (provider as any).apiKeyEncrypted
    
    return NextResponse.json({
      success: true,
      encryptedKey: encryptedKey,
      length: encryptedKey?.length || 0,
      hasColon: encryptedKey?.includes(':') || false,
      startsWithSk: encryptedKey?.startsWith('sk-') || false,
      isHex: /^[0-9a-fA-F]+$/.test(encryptedKey || ''),
      preview: encryptedKey ? `${encryptedKey.substring(0, 50)}...` : 'NO KEY'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
} 