import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface VersionInfo {
  id: string
  timestamp: string
  userTitle?: string
  aiDescription?: string
  mdHash?: string
  reason: string
  size: number
}

// GET: Listar todas las versiones
export async function GET() {
  try {
    const versionsDir = path.join(process.cwd(), 'docs', 'prompts', 'versions')
    
    if (!fs.existsSync(versionsDir)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(versionsDir)
      .filter(file => file.endsWith('.backup.json') || file.endsWith('.ui-backup.json'))
      .sort((a, b) => b.localeCompare(a)) // Más recientes primero

    const versions: VersionInfo[] = []

    for (const file of files) {
      try {
        const filePath = path.join(versionsDir, file)
        const stats = fs.statSync(filePath)
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))

        versions.push({
          id: file.replace(/\.(backup|ui-backup)\.json$/, ''),
          timestamp: content.timestamp || stats.mtime.toISOString(),
          userTitle: content.userTitle,
          aiDescription: content.aiDescription,
          mdHash: content.mdHash,
          reason: content.reason || 'unknown',
          size: stats.size
        })
      } catch (error) {
        console.error(`Error reading version file ${file}:`, error)
      }
    }

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error listing versions:', error)
    return NextResponse.json(
      { error: 'Error listando versiones' },
      { status: 500 }
    )
  }
} 