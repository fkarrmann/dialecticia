'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Save, AlertCircle, Info } from 'lucide-react'
import PhilosopherWizard from './PhilosopherWizard'

interface Philosopher {
  id: string
  name: string
  description: string
  philosophicalSchool: string
  argumentStyle?: string
  questioningApproach?: string
  isActive: boolean
  createdBy: string
  photoUrl?: string
  personalityScores?: { name: string; value: number }[]
  coreBeliefs?: string[]
  tags?: string[]
  personalityAspects?: any // Para los trade-offs
}

interface CommunicationTone {
  preset: string
  description: string
}

interface PhilosopherData {
  name: string
  photoUrl?: string
  inspirationType: 'philosopher' | 'school' | ''
  inspirationSource: string
  attributes: { name: string; leftExtreme: string; rightExtreme: string; value: number }[]
  communicationTone: CommunicationTone
  secretSauce: string
  debateMechanics: string
  personalityScores: { name: string; value: number }[]
  generatedDescription: string
  generatedFields?: {
    personalityTraits?: string[] | { name: string }[]
    coreBeliefs?: string[]
    argumentStyle?: string
  }
  isPublic: boolean
}

interface EditPhilosopherWizardProps {
  philosopher: Philosopher
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPhilosopher: Philosopher) => void
  currentUserId: string
  isCurrentUserAdmin?: boolean
  isDuplicating?: boolean
}

// Función para interpretar el valor trade-off (misma lógica que en PhilosopherWizard)
const getTradeOffLabel = (attribute: { name: string; leftExtreme: string; rightExtreme: string; value: number }): string => {
  if (attribute.value <= 2) return attribute.leftExtreme
  if (attribute.value >= 8) return attribute.rightExtreme
  if (attribute.value <= 4) return `Más ${attribute.leftExtreme}`
  if (attribute.value >= 6) return `Más ${attribute.rightExtreme}`
  return "Equilibrado"
}

export default function EditPhilosopherWizard({
  philosopher,
  isOpen,
  onClose,
  onSave,
  currentUserId,
  isCurrentUserAdmin = false,
  isDuplicating = false
}: EditPhilosopherWizardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSignificantChanges, setHasSignificantChanges] = useState(false)
  
  const isOwner = philosopher.createdBy === currentUserId || isCurrentUserAdmin
  const shouldCheckChanges = isDuplicating || !isOwner

  if (!isOpen) return null

  // Convertir filósofo existente a formato wizard
  const philosopherToWizardData = (phil: Philosopher): Partial<PhilosopherData> => {
    console.log('🎯 Convirtiendo datos del filósofo para wizard:', {
      name: phil.name,
      photoUrl: phil.photoUrl,
      philosophicalSchool: phil.philosophicalSchool,
      argumentStyle: phil.argumentStyle,
      questioningApproach: phil.questioningApproach,
      personalityScores: phil.personalityScores,
      personalityAspects: phil.personalityAspects
    })

    // Detectar si es inspirado en filósofo o escuela
    const inspirationType: 'philosopher' | 'school' | '' = phil.philosophicalSchool?.includes('Inspirado en') ? 'philosopher' : 'school'
    const inspirationSource = phil.philosophicalSchool?.replace('Inspirado en ', '').replace('Escuela ', '') || ''

    console.log('🔍 Tipo de inspiración detectado:', { inspirationType, inspirationSource })

    // Atributos por defecto con las nuevas etiquetas
    const defaultAttributes = [
      { name: "Actitud hacia el Cambio", leftExtreme: "Conservador", rightExtreme: "Revolucionario", value: 5 },
      { name: "Enfoque Cognitivo", leftExtreme: "Estructurado", rightExtreme: "Creativo", value: 5 },
      { name: "Estilo de Razonamiento", leftExtreme: "Analítico", rightExtreme: "Sintético", value: 5 },
      { name: "Método de Conocimiento", leftExtreme: "Sistemático", rightExtreme: "Intuitivo", value: 5 },
      { name: "Orientación Práctica", leftExtreme: "Pragmático", rightExtreme: "Idealista", value: 5 }
    ]

    // Mapear personalityAspects correctamente - SIEMPRE usar nuevas etiquetas, solo preservar valores
    let mappedAttributes = [...defaultAttributes] // Empezar con los atributos base actualizados
    
    if (phil.personalityAspects) {
      console.log('🔍 PersonalityAspects disponibles:', phil.personalityAspects)
      
      let storedAttributes = []
      
      // Extraer atributos almacenados
      if (phil.personalityAspects.attributes && Array.isArray(phil.personalityAspects.attributes)) {
        storedAttributes = phil.personalityAspects.attributes
        console.log('✅ Usando personalityAspects.attributes:', storedAttributes)
      }
      // Si personalityAspects es directamente un array
      else if (Array.isArray(phil.personalityAspects)) {
        storedAttributes = phil.personalityAspects
        console.log('✅ Usando personalityAspects como array:', storedAttributes)
      }
      
      // Mapear valores de los atributos almacenados a los nuevos atributos
      if (storedAttributes.length > 0) {
        mappedAttributes = defaultAttributes.map(defaultAttr => {
          const storedAttr = storedAttributes.find((stored: any) => stored.name === defaultAttr.name)
          if (storedAttr && typeof storedAttr.value === 'number') {
            console.log(`🔄 Mapeando ${defaultAttr.name}: valor ${storedAttr.value} con nuevas etiquetas`)
            return {
              ...defaultAttr, // Usar las nuevas etiquetas
              value: storedAttr.value // Preservar solo el valor
            }
          }
          return defaultAttr
        })
        console.log('✅ Atributos mapeados con nuevas etiquetas:', mappedAttributes)
      } else {
        console.log('🔍 PersonalityAspects estructura no reconocida, usando defaults')
      }
    }

    // Parsear personalityScores si están almacenados como JSON
    let parsedPersonalityScores = []
    try {
      if (typeof phil.personalityScores === 'string') {
        parsedPersonalityScores = JSON.parse(phil.personalityScores)
      } else if (Array.isArray(phil.personalityScores)) {
        parsedPersonalityScores = phil.personalityScores
      }
      console.log('✅ PersonalityScores parseados:', parsedPersonalityScores)
    } catch (e) {
      console.warn('❌ Error parsing personalityScores:', e)
    }

    // Detectar mecánica de debate
    const detectedDebateMechanics = detectDebateMechanics(phil.questioningApproach || '')
    console.log('🎪 Mecánica de debate detectada:', { questioningApproach: phil.questioningApproach, detectedDebateMechanics })

    // Parsear los campos generados de la base de datos
    let generatedFields: any = {}
    
    // personalityTraits ya están en personalityScores
    if (parsedPersonalityScores && parsedPersonalityScores.length > 0) {
      generatedFields.personalityTraits = parsedPersonalityScores
    }
    
    // coreBeliefs 
    if (phil.coreBeliefs) {
      try {
        const coreBeliefs = typeof phil.coreBeliefs === 'string' 
          ? JSON.parse(phil.coreBeliefs) 
          : phil.coreBeliefs
        generatedFields.coreBeliefs = Array.isArray(coreBeliefs) ? coreBeliefs : [coreBeliefs]
      } catch (e) {
        console.warn('Error parsing coreBeliefs:', e)
        generatedFields.coreBeliefs = typeof phil.coreBeliefs === 'string' ? [phil.coreBeliefs] : []
      }
    }
    
    // argumentStyle
    if (phil.argumentStyle) {
      generatedFields.argumentStyle = phil.argumentStyle
    }

    // Detectar tono de comunicación (usar 'formal' como default)
    const communicationTone = {
      preset: 'formal',
      description: 'Utiliza un lenguaje académico, preciso y respetuoso en todos los intercambios'
    }

    const result = {
      name: isDuplicating ? `${phil.name} (Copia)` : phil.name,
      photoUrl: phil.photoUrl,
      inspirationType,
      inspirationSource,
      attributes: mappedAttributes,
      communicationTone,
      secretSauce: phil.argumentStyle || '',
      debateMechanics: detectedDebateMechanics,
      personalityScores: parsedPersonalityScores,
      generatedDescription: phil.description,
      generatedFields: generatedFields,
      isPublic: true
    }
    
    console.log('🎯 Resultado final para wizard:', result)
    
    return result
  }

  // Detectar mecánica de debate basada en el enfoque de cuestionamiento
  const detectDebateMechanics = (questioningApproach: string): string => {
    if (!questioningApproach) return 'socratic_dialogue'
    
    const approach = questioningApproach.toLowerCase()
    
    // Buscar palabras clave específicas
    if (approach.includes('provocat') || approach.includes('desafí') || approach.includes('challenging')) return 'provocative'
    if (approach.includes('socrát') || approach.includes('pregunta') || approach.includes('inquiry')) return 'socratic_dialogue'
    if (approach.includes('dialéctic') || approach.includes('dialectical')) return 'dialectical'
    if (approach.includes('analíti') || approach.includes('analytical') || approach.includes('systematic')) return 'analytical'
    if (approach.includes('retóric') || approach.includes('elocuen') || approach.includes('rhetorical')) return 'rhetorical'
    if (approach.includes('contempla') || approach.includes('reflexi') || approach.includes('contemplative')) return 'contemplative'
    
    // Si contiene "mecánica" seguido de un tipo
    if (approach.includes('mecánica')) {
      if (approach.includes('provocative')) return 'provocative'
      if (approach.includes('socratic')) return 'socratic_dialogue'
      if (approach.includes('dialectical')) return 'dialectical'
      if (approach.includes('analytical')) return 'analytical'
      if (approach.includes('rhetorical')) return 'rhetorical'
      if (approach.includes('contemplative')) return 'contemplative'
    }
    
    return 'socratic_dialogue'
  }

  // Detectar cambios significativos
  const checkSignificantChanges = (newData: PhilosopherData) => {
    const original = philosopherToWizardData(philosopher)
    
    // Solo cambios de nombre y foto no son significativos para duplicación
    const significantFields = [
      'inspirationType', 'inspirationSource', 'attributes', 
      'communicationTone', 'secretSauce', 'debateMechanics'
    ]

    for (const field of significantFields) {
      if (field === 'attributes') {
        // Comparar atributos trade-off
        const originalAttrs = original.attributes || []
        const newAttrs = newData.attributes || []
        
        if (originalAttrs.length !== newAttrs.length) return true
        
        for (let i = 0; i < originalAttrs.length; i++) {
          if (originalAttrs[i].value !== newAttrs[i].value) return true
        }
      } else if (field === 'communicationTone') {
        // Comparar tono de comunicación
        const originalTone = original.communicationTone
        const newTone = newData.communicationTone
        
        if (originalTone?.preset !== newTone?.preset || originalTone?.description !== newTone?.description) return true
      } else {
        if ((original as any)[field] !== (newData as any)[field]) return true
      }
    }
    
    return false
  }

  const handleWizardComplete = async (wizardData: PhilosopherData) => {
    setIsLoading(true)
    setError('')

    try {
      // Verificar cambios significativos si es necesario
      if (shouldCheckChanges) {
        const hasChanges = checkSignificantChanges(wizardData)
        if (!hasChanges && isDuplicating) {
          setError('Debes realizar cambios significativos para duplicar un filósofo (nombre y foto no cuentan)')
          setIsLoading(false)
          return
        }
        setHasSignificantChanges(hasChanges)
      }

      // 🔥 ASEGURAR QUE EL PERFIL ESTÉ ACTUALIZADO CON LOS TRADE-OFFS ACTUALES
      let finalWizardData = wizardData
      if (!wizardData.personalityScores || wizardData.personalityScores.length === 0) {
        console.log('🔄 Generando perfil final antes de guardar...')
        const regenerateResponse = await fetch('/api/admin/philosophers/generate-final-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: wizardData.name,
            inspirationSource: wizardData.inspirationSource,
            inspirationType: wizardData.inspirationType,
            attributes: wizardData.attributes,
            secretSauce: wizardData.secretSauce,
            debateMechanics: wizardData.debateMechanics
          })
        })

        if (regenerateResponse.ok) {
          const result = await regenerateResponse.json()
          
          // Incluir los campos generados si están disponibles
          const generatedFields = result.fields || {}
          
          finalWizardData = {
            ...wizardData,
            personalityScores: result.personalityScores,
            generatedDescription: result.description,
            generatedFields: {
              personalityTraits: generatedFields.personalityTraits || result.personalityScores,
              coreBeliefs: generatedFields.coreBeliefs || [],
              argumentStyle: generatedFields.argumentStyle || wizardData.secretSauce
            }
          }
          console.log('✅ Perfil regenerado exitosamente con campos adicionales:', {
            personalityScores: result.personalityScores?.length || 0,
            coreBeliefs: generatedFields.coreBeliefs?.length || 0,
            argumentStyle: generatedFields.argumentStyle ? 'generado' : 'fallback'
          })
        }
      }

      // Transformar los datos del wizard al formato del API
      const apiData = {
        name: finalWizardData.name,
        photoUrl: finalWizardData.photoUrl || null,
        description: finalWizardData.generatedDescription,
        philosophicalSchool: finalWizardData.inspirationType === 'school' 
          ? `Escuela ${finalWizardData.inspirationSource}` 
          : `Inspirado en ${finalWizardData.inspirationSource}`,
        argumentStyle: finalWizardData.secretSauce,
        questioningApproach: `Mecánica ${finalWizardData.debateMechanics}`,
        isActive: true,
        personalityScores: finalWizardData.personalityScores, // ✅ INCLUIR SCORES ACTUALIZADOS
        personalityAspects: {
          attributes: finalWizardData.attributes,
          debateMechanics: finalWizardData.debateMechanics
        },
        tags: [
          finalWizardData.inspirationType === 'philosopher' ? 'Filósofo' : 'Escuela',
          finalWizardData.inspirationSource
        ],
        coreBeliefs: finalWizardData.attributes.map(attr => `${attr.name}: ${getTradeOffLabel(attr)}`)
      }

      // Realizar la llamada al API
      const response = await fetch(`/api/philosophers/${philosopher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el filósofo')
      }

      const result = await response.json()
      onSave(result.data)

    } catch (error) {
      console.error('Error saving philosopher:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl border border-slate-700 w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/95 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center">
              {isDuplicating && <Copy className="w-5 h-5 mr-2 text-blue-400" />}
              {isDuplicating ? 'Duplicar Filósofo' : 'Editar Filósofo'}: {philosopher.name}
            </h2>
            {isDuplicating && (
              <p className="text-sm text-slate-400 mt-1">
                Debes realizar cambios significativos para guardar la copia
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Info sobre permisos */}
        {!isOwner && !isDuplicating && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mx-6 mt-4">
            <div className="flex items-center text-amber-300 text-sm">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              No eres el creador de este filósofo. Solo puedes duplicarlo para crear tu propia versión.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 mx-6 mt-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Wizard */}
        <div className="p-6">
          <PhilosopherWizard
            onComplete={handleWizardComplete}
            onCancel={handleClose}
            initialData={philosopherToWizardData(philosopher)}
          />
        </div>
      </div>
    </div>
  )
} 