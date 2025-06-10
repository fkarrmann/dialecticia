import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET: Cargar una versión específica
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const versionsDir = path.join(process.cwd(), 'docs', 'prompts', 'versions')
    
    // Buscar el archivo con este ID
    const files = fs.readdirSync(versionsDir)
      .filter(file => file.startsWith(id) && (file.endsWith('.backup.json') || file.endsWith('.ui-backup.json')))
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Versión no encontrada' },
        { status: 404 }
      )
    }

    const filePath = path.join(versionsDir, files[0])
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error loading version:', error)
    return NextResponse.json(
      { error: 'Error cargando versión' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar una versión
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const versionsDir = path.join(process.cwd(), 'docs', 'prompts', 'versions')
    
    // Buscar el archivo con este ID
    const files = fs.readdirSync(versionsDir)
      .filter(file => file.startsWith(id) && (file.endsWith('.backup.json') || file.endsWith('.ui-backup.json')))
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Versión no encontrada' },
        { status: 404 }
      )
    }

    const filePath = path.join(versionsDir, files[0])
    fs.unlinkSync(filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting version:', error)
    return NextResponse.json(
      { error: 'Error eliminando versión' },
      { status: 500 }
    )
  }
} 