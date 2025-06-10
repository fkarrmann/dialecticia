import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

// Manejar requests CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    // Obtener el debate completo
    const debate = await prisma.debate.findUnique({
      where: { 
        id: id,
        userId: session.user.id  // Solo exportar debates propios
      },
      include: {
        messages: {
          include: {
            philosopher: {
              include: {
                personalityAspects: true,
              },
            },
          },
          orderBy: { timestamp: 'asc' },
        },
        participants: {
          include: {
            philosopher: {
              include: {
                personalityAspects: true,
              },
            },
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json({
        success: false,
        error: 'Debate no encontrado o no tienes permisos para exportarlo',
      }, { status: 404 })
    }

    // Generar PDF usando HTML + Puppeteer
    const pdfBuffer = await generateDebatePDF(debate, session.user.name || 'Usuario')

    // Retornar el PDF con headers CORS
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="debate-${debate.topic.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('Error exporting debate:', error)
    
    // Manejo específico de errores de espacio en disco
    let errorMessage = 'Error interno del servidor'
    
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC') || error.message.includes('no space left')) {
        errorMessage = 'Error: No hay suficiente espacio en disco para generar el PDF'
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'Error: Archivo temporal no encontrado - intenta nuevamente'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Error: Tiempo de espera agotado - intenta nuevamente'
      } else {
        errorMessage = `Error al generar PDF: ${error.message}`
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

async function generateDebatePDF(debate: any, userName: string): Promise<Buffer> {
  // Importar puppeteer dinámicamente
  const puppeteer = await import('puppeteer')
  
  // Función para formatear fechas
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Función para generar gráfico de barras CSS - SIN GRADIENTES
  const generateBarChart = (label: string, value: number, maxValue: number = 5, color: string = '#8B5CF6') => {
    const percentage = (value / maxValue) * 100
    return `
      <div class="bar-chart-item">
        <div class="bar-label">${label}</div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
          <span class="bar-value">${value}/${maxValue}</span>
        </div>
      </div>
    `
  }

  // Función para generar información del filósofo - TODOS LOS DATOS COMPLETOS
  const generatePhilosopherInfo = (philosopher: any) => {
    // 🔧 MEJORAR CAMPOS "GENERATED" ANTES DE PROCESAR
    const improvedPhilosopher = improveGeneratedFields(philosopher)
    
    // Obtener personalityAspects organizados por categoría
    const personalityAspects: Record<string, number> = {}
    if (improvedPhilosopher.personalityAspects && Array.isArray(improvedPhilosopher.personalityAspects)) {
      improvedPhilosopher.personalityAspects.forEach((aspect: any) => {
        personalityAspects[aspect.aspectName] = aspect.value
      })
    }
    
    // Parsear campos JSON si están en formato string
    let personalityTraits: string[] = []
    let coreBeliefs: string[] = []
    
    try {
      if (typeof improvedPhilosopher.personalityTraits === 'string') {
        const parsed = JSON.parse(improvedPhilosopher.personalityTraits)
        if (Array.isArray(parsed)) {
          personalityTraits = parsed
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Si es un objeto con valores numéricos (como formality: 7), convertir a array de strings
          personalityTraits = Object.entries(parsed).map(([key, value]) => `${key}: ${value}`)
        } else {
          personalityTraits = [String(parsed)]
        }
      } else if (Array.isArray(improvedPhilosopher.personalityTraits)) {
        personalityTraits = improvedPhilosopher.personalityTraits.map(String)
      } else if (typeof improvedPhilosopher.personalityTraits === 'object' && improvedPhilosopher.personalityTraits !== null) {
        // Si es un objeto directo con valores numéricos
        personalityTraits = Object.entries(improvedPhilosopher.personalityTraits).map(([key, value]) => `${key}: ${value}`)
      } else {
        personalityTraits = [String(improvedPhilosopher.personalityTraits || 'Sin definir')]
      }
    } catch (e) {
      personalityTraits = [String(improvedPhilosopher.personalityTraits || 'Sin definir')]
    }
    
    try {
      if (typeof improvedPhilosopher.coreBeliefs === 'string') {
        const parsed = JSON.parse(improvedPhilosopher.coreBeliefs)
        coreBeliefs = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
      } else if (Array.isArray(improvedPhilosopher.coreBeliefs)) {
        coreBeliefs = improvedPhilosopher.coreBeliefs.map(String)
      } else {
        coreBeliefs = [String(improvedPhilosopher.coreBeliefs || 'Sin definir')]
      }
    } catch (e) {
      coreBeliefs = [String(improvedPhilosopher.coreBeliefs || 'Sin definir')]
    }
    
    // Organizar aspectos por tipo
    const basicAspects = ['formality', 'aggressiveness', 'humor']
    const tradeoffAspects = [
      'Actitud hacia el Cambio',
      'Enfoque Cognitivo', 
      'Estilo de Razonamiento',
      'Método de Conocimiento',
      'Orientación Práctica'
    ]
    
    return `
      <div class="philosopher-section">
        <div class="philosopher-header">
          <h3>🏛️ ${improvedPhilosopher.name}</h3>
          <div class="philosopher-school">${improvedPhilosopher.philosophicalSchool}</div>
          ${improvedPhilosopher.inspirationSource ? `<div class="inspiration-source">Inspirado en ${improvedPhilosopher.inspirationSource}</div>` : ''}
        </div>
        
        <div class="philosopher-content">
          <!-- Información Básica del Filósofo -->
          <div class="basic-info-grid">
            <div class="info-section full-width">
              <h4>📜 Descripción Filosófica</h4>
              <p>${improvedPhilosopher.personalityDescription || improvedPhilosopher.description || 'Descripción no disponible'}</p>
            </div>
            
            <div class="info-section">
              <h4>💭 Creencias Fundamentales</h4>
              <ul class="beliefs-list">
                ${coreBeliefs.slice(0, 4).map(belief => `<li>${belief}</li>`).join('')}
              </ul>
            </div>
            
            <div class="info-section">
              <h4>🗣️ Estilo Argumentativo</h4>
              <p>${improvedPhilosopher.argumentStyle || 'Estilo dialéctico clásico'}</p>
            </div>
            
            <div class="info-section">
              <h4>❓ Enfoque de Cuestionamiento</h4>
              <p>${improvedPhilosopher.questioningApproach || 'Método socrático de preguntas'}</p>
            </div>
            
            <div class="info-section">
              <h4>⚙️ Mecánicas de Debate</h4>
              <p>${improvedPhilosopher.debateMechanics || 'Diálogo socrático'}</p>
            </div>
          </div>
          
          ${Object.keys(personalityAspects).some(key => basicAspects.includes(key)) ? `
          <!-- Rasgos de Personalidad (0-5) -->
          <div class="aspects-section">
            <h4>🎯 Rasgos de Personalidad</h4>
            <div class="aspects-grid">
              ${basicAspects.map(aspectName => {
                const value = personalityAspects[aspectName]
                if (value === undefined) return ''
                
                const colors: Record<string, string> = {
                  'formality': '#3B82F6',
                  'aggressiveness': '#EF4444', 
                  'humor': '#10B981'
                }
                
                return generateBarChart(
                  aspectName.charAt(0).toUpperCase() + aspectName.slice(1), 
                  value, 
                  5, 
                  colors[aspectName] || '#8B5CF6'
                )
              }).filter(Boolean).join('')}
            </div>
          </div>
          ` : ''}
          
          ${tradeoffAspects.some(aspectName => personalityAspects[aspectName] !== undefined) ? `
          <!-- Trade-offs Filosóficos -->
          <div class="tradeoffs-section">
            <h4>⚖️ Trade-offs Filosóficos de ${improvedPhilosopher.name}</h4>
            <div class="tradeoffs-grid">
              ${tradeoffAspects.map(aspectName => {
                const value = personalityAspects[aspectName]
                if (value === undefined) return ''
                
                const tradeoffMap: Record<string, [string, string]> = {
                  'Actitud hacia el Cambio': ['Conservador', 'Revolucionario'],
                  'Enfoque Cognitivo': ['Estructurado', 'Creativo'],
                  'Estilo de Razonamiento': ['Analítico', 'Sintético'],
                  'Método de Conocimiento': ['Sistemático', 'Intuitivo'],
                  'Orientación Práctica': ['Pragmático', 'Idealista']
                }
                
                const [leftLabel, rightLabel] = tradeoffMap[aspectName] || ['Izquierda', 'Derecha']
                
                return `
                  <div class="tradeoff-item">
                    <div class="tradeoff-header">
                      <span class="tradeoff-label">${aspectName}</span>
                    </div>
                    <div class="tradeoff-bar-container">
                      <div class="tradeoff-bar">
                        <div class="tradeoff-indicator" style="left: ${(value / 10) * 100}%"></div>
                      </div>
                    </div>
                    <div class="tradeoff-values">
                      <span class="tradeoff-left">${leftLabel}</span>
                      <span class="tradeoff-value">${value}/10</span>
                      <span class="tradeoff-right">${rightLabel}</span>
                    </div>
                  </div>
                `
              }).filter(Boolean).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `
  }

  // 🛠️ FUNCIÓN PARA MEJORAR CAMPOS "GENERATED"
  const improveGeneratedFields = (philosopher: any) => {
    const improved = { ...philosopher }
    
    // Mejorar argumentStyle si es "generated"
    if (improved.argumentStyle === 'generated') {
      const debateMechanics = improved.debateMechanics || 'socratic_dialogue'
      const styleMap: Record<string, string> = {
        'socratic_dialogue': 'Estilo socrático clásico: Utiliza preguntas incisivas para guiar al interlocutor hacia el auto-descubrimiento',
        'provocative': 'Estilo provocativo: Desafía activamente las creencias establecidas con argumentos directos',
        'contemplative': 'Estilo contemplativo: Reflexiona profundamente invitando a la meditación pausada',
        'analytical': 'Estilo analítico: Descompone argumentos examinando cada premisa con rigor metodológico',
        'creative': 'Estilo creativo: Emplea analogías y metáforas para explorar conceptos filosóficos'
      }
      improved.argumentStyle = styleMap[debateMechanics] || `Estilo dialéctico inspirado en ${improved.inspirationSource || 'la tradición clásica'}`
    }
    
    // Mejorar questioningApproach si es "generated"
    if (improved.questioningApproach === 'generated') {
      improved.questioningApproach = 'Método socrático: Formula preguntas que revelan contradicciones internas del pensamiento'
    }
    
    // Mejorar coreBeliefs si está vacío
    if (!improved.coreBeliefs || (Array.isArray(improved.coreBeliefs) && improved.coreBeliefs.length === 0)) {
      improved.coreBeliefs = [
        `Los principios de ${improved.inspirationSource || 'la filosofía clásica'} ofrecen un marco sólido para la comprensión`,
        'El diálogo filosófico es esencial para el desarrollo del pensamiento crítico',
        'Las preguntas correctas son más valiosas que las respuestas fáciles'
      ]
    }
    
    return improved
  }

  // Generar HTML profesional mejorado - SIN GRADIENTES
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Debate: ${debate.topic}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .header {
          background: #8B5CF6;
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
          font-weight: bold;
          color: white;
        }
        
        .header .subtitle {
          font-size: 1.1em;
          opacity: 0.95;
          color: white;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 30px;
        }
        
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #4C1D95;
          font-size: 1.6em;
          font-weight: bold;
          margin-bottom: 20px;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .info-item {
          background: #F8FAFC;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #8B5CF6;
          /* ✅ ARREGLADO: Eliminado box-shadow que causaba recuadros grises */
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          color: #1F2937;
          font-size: 1em;
        }
        
        .philosopher-section {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #E2E8F0;
          page-break-inside: avoid;
          break-inside: avoid;
          /* ✅ ARREGLADO: Sin sombras para evitar recuadros grises */
        }
        
        .philosopher-header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #CBD5E1;
        }
        
        .philosopher-header h3 {
          color: #4C1D95;
          font-size: 1.4em;
          margin-bottom: 6px;
        }
        
        .philosopher-school {
          background: #8B5CF6;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          display: inline-block;
          font-size: 0.85em;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .inspiration-source {
          color: #6B7280;
          font-style: italic;
          font-size: 0.8em;
        }
        
        .philosopher-content {
          display: grid;
          gap: 15px;
        }
        
        .basic-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .info-section {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #8B5CF6;
          /* ✅ ARREGLADO: Eliminado box-shadow para evitar recuadros grises */
        }
        
        .info-section.full-width {
          grid-column: 1 / -1;
        }
        
        .info-section h4 {
          color: #4C1D95;
          font-size: 0.95em;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .info-section p {
          color: #374151;
          font-size: 0.85em;
          line-height: 1.4;
        }
        
        .traits-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .trait-tag {
          background: #8B5CF6;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 500;
        }
        
        .beliefs-list {
          margin: 0;
          padding-left: 18px;
          color: #374151;
          font-size: 0.9em;
        }
        
        .beliefs-list li {
          margin-bottom: 6px;
          line-height: 1.4;
        }
        
        .aspects-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          margin-bottom: 20px;
        }
        
        .aspects-section h4 {
          color: #4C1D95;
          font-size: 1.1em;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .aspects-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .bar-chart-item {
          background: #F8FAFC;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
        }
        
        .bar-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          font-size: 0.9em;
        }
        
        .bar-container {
          position: relative;
          background: #E5E7EB;
          border-radius: 4px;
          height: 16px;
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .bar-value {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.75em;
          font-weight: 600;
          color: #374151;
          background: rgba(255,255,255,0.9);
          padding: 0 4px;
          border-radius: 2px;
        }
        
        .tradeoffs-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          margin-bottom: 20px;
        }
        
        .tradeoffs-section h4 {
          color: #4C1D95;
          font-size: 1.1em;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .tradeoffs-grid {
          display: grid;
          gap: 12px;
        }
        
        .tradeoff-item {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          /* ✅ ARREGLADO: Eliminado box-shadow en trade-offs */
        }
        
        .tradeoff-header {
          margin-bottom: 15px;
        }
        
        .tradeoff-label {
          font-weight: 700;
          color: #4C1D95;
          font-size: 1em;
          text-align: center;
          display: block;
          margin-bottom: 5px;
        }
        
        .tradeoff-bar-container {
          margin: 15px 0;
          position: relative;
        }
        
        .tradeoff-bar {
          position: relative;
          background: linear-gradient(to right, #8B5CF6 0%, #D1D5DB 20%, #D1D5DB 80%, #8B5CF6 100%);
          height: 8px;
          border-radius: 4px;
          margin: 10px 0;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .tradeoff-values {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85em;
          margin-top: 10px;
          position: relative;
        }
        
        .tradeoff-left, .tradeoff-right {
          color: #6B7280;
          font-weight: 600;
          font-size: 0.9em;
          flex: 1;
        }
        
        .tradeoff-left {
          text-align: left;
        }
        
        .tradeoff-right {
          text-align: right;
        }
        
        .tradeoff-value {
          background: #4C1D95;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85em;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
        }
        
        .tradeoff-indicator {
          position: absolute;
          top: -6px;
          width: 18px;
          height: 18px;
          background: #4C1D95;
          border-radius: 50%;
          border: 2px solid white;
          /* ✅ ARREGLADO: Eliminado box-shadow en indicadores */
          transform: translateX(-50%);
          z-index: 2;
        }
        
        /* CHAT LAYOUT MEJORADO - SIN FONDOS EXTRAÑOS */
        .chat-container {
          margin-bottom: 16px;
          display: flex;
          width: 100%;
          page-break-inside: avoid;
          max-width: 100%;
        }
        
        .chat-container.user {
          justify-content: flex-start;
        }
        
        .chat-container.philosopher {
          justify-content: flex-end;
        }
        
        .message-bubble {
          max-width: 70%;
          min-width: 200px;
          border-radius: 16px;
          overflow: hidden;
          /* ✅ ARREGLADO: Eliminado box-shadow en burbujas de mensaje */
          word-wrap: break-word;
          overflow-wrap: break-word;
          background: transparent;
        }
        
        .message-bubble.user {
          background: #DBEAFE;
          border-bottom-left-radius: 4px;
        }
        
        .message-bubble.philosopher {
          background: #EDE9FE;
          border-bottom-right-radius: 4px;
        }
        
        .message-header {
          padding: 8px 12px 4px 12px;
          background: rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.8em;
        }
        
        .message-sender {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: bold;
          color: #374151;
        }
        
        .message-sender .avatar {
          font-size: 1em;
        }
        
        .message-timestamp {
          color: #6B7280;
          font-size: 0.7em;
        }
        
        .message-content {
          padding: 10px 12px 12px 12px;
          font-size: 0.9em;
          line-height: 1.4;
          color: #374151;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          background: transparent;
        }
        
        .disclaimer {
          background: #FEF3C7;
          border: 2px solid #F59E0B;
          border-radius: 12px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .disclaimer h3 {
          color: #92400E;
          font-size: 1.2em;
          margin-bottom: 10px;
        }
        
        .disclaimer p {
          color: #78350F;
          font-size: 0.95em;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        
        .disclaimer .important {
          font-weight: bold;
          font-size: 1em;
          color: #7C2D12;
        }
        
        .footer {
          margin-top: 50px;
          padding: 30px 0;
          border-top: 2px solid #E5E7EB;
          text-align: center;
          color: #6B7280;
          background: #F9FAFB;
        }
        
        .footer .export-info {
          font-size: 0.9em;
          margin-bottom: 15px;
        }
        
        .footer .quote {
          font-style: italic;
          margin: 15px 0;
          font-size: 1.1em;
          color: #4C1D95;
          font-weight: 500;
        }
        
        .closing-message {
          margin-top: 30px;
          padding: 20px;
          background: white;
          border: 2px solid #8B5CF6;
          border-radius: 12px;
          text-align: center;
        }
        
        .closing-message h3 {
          color: #4C1D95;
          font-size: 1.2em;
          margin-bottom: 10px;
        }
        
        /* Print optimizations */
        @media print {
          .header,
          .philosopher-section,
          .message-bubble,
          .disclaimer {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .philosopher-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .chat-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .disclaimer {
            page-break-before: avoid;
            break-before: avoid;
          }
          
          .footer {
            page-break-before: avoid;
            break-before: avoid;
          }
        }
        
        /* Optimizaciones generales para evitar páginas en blanco */
        .container {
          max-width: 100%;
          padding: 0 20px;
        }
        
        h2, h3, h4 {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        .aspects-section, .tradeoffs-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .debate-info-main {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #E2E8F0;
          /* ✅ ARREGLADO: Eliminado box-shadow en información del debate */
          margin-bottom: 15px;
        }
        
        .debate-content {
          display: grid;
          gap: 15px;
        }
        
        .debate-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .field-label {
          font-weight: 700;
          color: #4C1D95;
          font-size: 0.9em;
          letter-spacing: 0.5px;
        }
        
        .field-value {
          color: #374151;
          font-size: 1em;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏛️ DIALECTICIA</h1>
        <div class="subtitle">Debate Filosófico Exportado • Plataforma de Diálogos Socráticos</div>
      </div>
      
      <div class="container">
        <div class="section">
          <h2 class="section-title">📝 El Debate</h2>
          
          <div class="debate-info-main">
            <div class="debate-content">
              <div class="debate-field">
                <span class="field-label">TEMA:</span>
                <span class="field-value">${debate.topic}</span>
              </div>
              <div class="debate-field">
                <span class="field-label">TU POSTURA INICIAL:</span>
                <span class="field-value">${debate.description.replace(/^Tu Postura\s*/i, '').trim()}</span>
              </div>
            </div>
          </div>
          
          <div class="info-grid" style="margin-top: 20px;">
            <div class="info-item">
              <div class="info-label">Usuario Participante</div>
              <div class="info-value">${userName}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Fecha de Creación</div>
              <div class="info-value">${formatDate(debate.createdAt)}</div>
            </div>
            
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Total de Intercambios</div>
              <div class="info-value">${debate.messages.length} mensajes</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">🎭 Filósofos Participantes</h2>
          ${debate.participants.map((p: any) => generatePhilosopherInfo(p.philosopher)).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">💬 Conversación Filosófica</h2>
          
          ${debate.messages.map((message: any) => {
            const sender = message.senderType === 'USER' ? userName : message.philosopher.name
            const isUser = message.senderType === 'USER'
            const avatar = isUser ? '👤' : '🏛️'
            
            return `
              <div class="chat-container ${isUser ? 'user' : 'philosopher'}">
                <div class="message-bubble ${isUser ? 'user' : 'philosopher'}">
                  <div class="message-header">
                    <div class="message-sender">
                      <span class="avatar">${avatar}</span>
                      <span>${sender}</span>
                    </div>
                    <span class="message-timestamp">${formatDate(message.timestamp)}</span>
                  </div>
                  <div class="message-content">
                    ${message.content.replace(/\n/g, '<br>')}
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>
        
        <div class="disclaimer">
          <h3>⚠️ Importante: Disclaimer Académico</h3>
          <p>Los filósofos virtuales presentados en este debate son <strong>interpretaciones algorítmicas</strong> creadas con fines educativos y de entretenimiento.</p>
          <p><strong>NO representan las opiniones reales, pensamientos auténticos, o posiciones filosóficas exactas de los filósofos históricos en los que están inspirados.</strong></p>
          <p class="important">Estas son simulaciones digitales basadas en inteligencia artificial.</p>
        </div>
        
        <div class="footer">
          <div class="export-info">Exportado desde Dialecticia el ${formatDate(new Date())}</div>
          <div class="quote">"El único conocimiento verdadero es saber que no sabes nada" - Sócrates</div>
          
          <div class="closing-message">
            <h3>📚 Esto es solo un juego, ¡agarrá libros de verdad!</h3>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  // Configurar Puppeteer para generar PDF con mejor manejo de recursos
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Reduce uso de memoria compartida
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--disable-default-apps'
    ]
  })
  
  try {
    const page = await browser.newPage()
    
    // Configurar timeouts más cortos para evitar bloqueos
    page.setDefaultTimeout(30000) // 30 segundos máximo
    
    // Configurar el contenido HTML con timeout
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 20000 // 20 segundos para cargar contenido
    })
    
    // Generar PDF con configuraciones profesionales y timeout
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      timeout: 30000 // 30 segundos máximo para generar PDF
    })
    
    return Buffer.from(pdfBuffer)
    
  } catch (puppeteerError) {
    console.error('Puppeteer error:', puppeteerError)
    
    // Re-lanzar el error con mejor información
    if (puppeteerError instanceof Error) {
      if (puppeteerError.message.includes('timeout')) {
        throw new Error('Timeout al generar PDF - intenta nuevamente')
      } else if (puppeteerError.message.includes('ENOSPC')) {
        throw new Error('No hay suficiente espacio en disco')
      } else {
        throw new Error(`Error de Puppeteer: ${puppeteerError.message}`)
      }
    }
    throw puppeteerError
    
  } finally {
    try {
      await browser.close()
    } catch (closeError) {
      console.error('Error closing browser:', closeError)
    }
  }
} 