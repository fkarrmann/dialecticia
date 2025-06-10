import { NextRequest, NextResponse } from 'next/server'
import { loadPrompts, getPromptsInfo } from '@/lib/prompts'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

// GET: Cargar prompts actuales
export async function GET() {
  try {
    const prompts = loadPrompts()
    const info = getPromptsInfo()
    
    return NextResponse.json({
      ...prompts,
      _meta: {
        source: info.source,
        loadedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error loading prompts for admin:', error)
    return NextResponse.json(
      { error: 'Error cargando prompts' },
      { status: 500 }
    )
  }
}

// POST: Guardar prompts editados
export async function POST(request: NextRequest) {
  try {
    const newPrompts = await request.json()
    
    // Validar estructura básica
    if (!newPrompts.socraticPrompts || !newPrompts.philosopherPrompts) {
      return NextResponse.json(
        { error: 'Estructura de prompts inválida' },
        { status: 400 }
      )
    }

    // Actualizar timestamp
    newPrompts.lastUpdated = new Date().toISOString()
    newPrompts.version = `ui-${Date.now()}`

    // Guardar en archivo JSON
    const promptsPath = path.join(process.cwd(), 'docs', 'prompts', 'generated-prompts.json')
    fs.writeFileSync(promptsPath, JSON.stringify(newPrompts, null, 2), 'utf8')

    // Crear backup
    await createBackup('UI edit', newPrompts)

    // Opcional: Regenerar el markdown
    await updateMarkdownFromJson(newPrompts)

    return NextResponse.json({ 
      success: true, 
      version: newPrompts.version,
      savedAt: newPrompts.lastUpdated
    })
  } catch (error) {
    console.error('Error saving prompts from admin:', error)
    return NextResponse.json(
      { error: 'Error guardando prompts' },
      { status: 500 }
    )
  }
}

async function createBackup(reason: string, prompts: any) {
  try {
    const versionsDir = path.join(process.cwd(), 'docs', 'prompts', 'versions')
    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0]
    const backupData = {
      timestamp: new Date().toISOString(),
      reason,
      generatedJson: prompts,
      source: 'admin-ui'
    }

    const backupFile = path.join(versionsDir, `${timestamp}.ui-backup.json`)
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8')
  } catch (error) {
    console.error('Error creating backup:', error)
  }
}

async function updateMarkdownFromJson(prompts: any) {
  // Opcional: Regenerar el markdown desde el JSON usando reverse-transform
  // Por ahora, solo logeamos que se podría implementar
  console.log('📝 UI update saved - markdown reverse-transform could be implemented here')
} 