'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Sparkles, RotateCcw, Wand2 } from 'lucide-react'

interface PersonalityAspect {
  id: string
  aspectName: string
  value: number
  generatedBy: string
  createdAt: string
}

interface PersonalityAspectsManagerProps {
  philosopherId?: string
  philosopherName?: string
  aspects?: PersonalityAspect[]
  onAspectsGenerated?: () => void
}

export default function PersonalityAspectsManager({ 
  philosopherId, 
  philosopherName, 
  aspects = [],
  onAspectsGenerated 
}: PersonalityAspectsManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAspects, setCurrentAspects] = useState<PersonalityAspect[]>(aspects)
  const [error, setError] = useState<string | null>(null)

  const generateAspects = async (forceRegenerate = false) => {
    if (!philosopherId) {
      setError('ID de filósofo requerido')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/philosophers/generate-aspects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          philosopherId,
          forceRegenerate
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error generando aspectos')
      }

      if (data.success && data.aspects) {
        setCurrentAspects(data.aspects)
        onAspectsGenerated?.()
      }

    } catch (error) {
      console.error('Error generating aspects:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAllAspects = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/philosophers/generate-aspects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error generando aspectos')
      }

      if (data.success) {
        onAspectsGenerated?.()
      }

    } catch (error) {
      console.error('Error generating all aspects:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
  }

  const getValueColor = (value: number) => {
    if (value >= 4) return 'bg-red-100 text-red-800 border-red-200'
    if (value >= 3) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (value >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (value >= 1) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getValueLabel = (value: number) => {
    const labels = ['Muy Bajo', 'Bajo', 'Medio', 'Alto', 'Muy Alto', 'Extremo']
    return labels[value] || 'Desconocido'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Aspectos de Personalidad
          {philosopherName && (
            <span className="text-sm font-normal text-muted-foreground">
              - {philosopherName}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Aspectos de personalidad generados automáticamente por IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Aspectos actuales */}
        {currentAspects.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Aspectos Actuales:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentAspects.map((aspect) => (
                <div 
                  key={aspect.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{aspect.aspectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {getValueLabel(aspect.value)}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 ${getValueColor(aspect.value)}`}
                  >
                    {aspect.value}/5
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          {philosopherId && (
            <>
              {currentAspects.length === 0 ? (
                <Button 
                  onClick={() => generateAspects(false)}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  {isGenerating ? 'Generando...' : 'Generar Aspectos'}
                </Button>
              ) : (
                <Button 
                  onClick={() => generateAspects(true)}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isGenerating ? 'Regenerando...' : 'Regenerar'}
                </Button>
              )}
            </>
          )}
          
          <Button 
            onClick={generateAllAspects}
            disabled={isGenerating}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Generando...' : 'Generar para Todos'}
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Los aspectos se generan automáticamente basándose en la información del filósofo</p>
          <p>• Cada aspecto tiene un valor del 0 (muy bajo) al 5 (extremo)</p>
          <p>• La IA analiza el nombre, descripción, escuela filosófica y estilo argumentativo</p>
        </div>
      </CardContent>
    </Card>
  )
} 