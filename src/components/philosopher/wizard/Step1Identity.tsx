'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, User, Camera, Sparkles } from 'lucide-react'

interface PhilosopherData {
  name: string
  photoUrl?: string
  publicDescription: string
  [key: string]: any
}

interface Step1IdentityProps {
  data: PhilosopherData
  onUpdate: (data: Partial<PhilosopherData>) => void
}

export default function Step1Identity({ data, onUpdate }: Step1IdentityProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ publicDescription: e.target.value })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // En una implementación real, aquí subirías la imagen a un servicio
      // Por ahora, creamos una URL temporal
      const url = URL.createObjectURL(file)
      onUpdate({ photoUrl: url })
    }
  }

  const generateDescription = async () => {
    if (!data.name.trim()) {
      alert('Por favor, ingresa un nombre primero')
      return
    }

    setIsGeneratingDescription(true)
    try {
      // Simular llamada a API para generar descripción
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedDescription = `${data.name} es un filósofo contemporáneo conocido por su enfoque innovador hacia las grandes preguntas de la existencia. Con una perspectiva única que combina sabiduría clásica y pensamiento moderno, ${data.name} invita a explorar las profundidades del conocimiento humano a través del diálogo socrático.`
      
      onUpdate({ publicDescription: generatedDescription })
    } catch (error) {
      console.error('Error generando descripción:', error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 mx-auto text-pink-500 mb-3" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Identidad y Apariencia
        </h3>
        <p className="text-slate-400">
          Define la identidad básica de tu filósofo
        </p>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Nombre del Filósofo *
        </Label>
        <Input
          id="name"
          value={data.name}
          onChange={handleNameChange}
          placeholder="Ej: Sócrates Moderno, Aristóteles Digital..."
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
        />
        <p className="text-xs text-slate-500">
          Puede ser un nombre original o inspirado en filósofos históricos
        </p>
      </div>

      {/* Foto */}
      <div className="space-y-2">
        <Label className="text-white">
          Foto del Filósofo (Opcional)
        </Label>
        <div className="flex items-center gap-4">
          {data.photoUrl ? (
            <div className="relative">
              <img
                src={data.photoUrl}
                alt="Foto del filósofo"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-slate-700 border-slate-600"
                onClick={() => onUpdate({ photoUrl: undefined })}
              >
                ×
              </Button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center">
              <Camera className="w-8 h-8 text-slate-500" />
            </div>
          )}
          
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <Label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Subir Foto
            </Label>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG o GIF. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Descripción Pública */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="text-white">
            Descripción Pública *
          </Label>
          <Button
            size="sm"
            variant="outline"
            onClick={generateDescription}
            disabled={isGeneratingDescription || !data.name.trim()}
            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
          >
            {isGeneratingDescription ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generar con IA
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="description"
          value={data.publicDescription}
          onChange={handleDescriptionChange}
          placeholder="Describe brevemente a tu filósofo para que otros usuarios puedan conocerlo..."
          rows={4}
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
        />
        <p className="text-xs text-slate-500">
          Esta descripción será visible para otros usuarios si decides hacer público tu filósofo
        </p>
      </div>

      {/* Preview */}
      {(data.name || data.publicDescription) && (
        <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Vista Previa
          </h4>
          <div className="flex items-start gap-3">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <h5 className="text-white font-medium">
                {data.name || 'Nombre del Filósofo'}
              </h5>
              <p className="text-slate-300 text-sm mt-1">
                {data.publicDescription || 'Descripción del filósofo...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, User, Camera, Sparkles } from 'lucide-react'

interface PhilosopherData {
  name: string
  photoUrl?: string
  publicDescription: string
  [key: string]: any
}

interface Step1IdentityProps {
  data: PhilosopherData
  onUpdate: (data: Partial<PhilosopherData>) => void
}

export default function Step1Identity({ data, onUpdate }: Step1IdentityProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ publicDescription: e.target.value })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // En una implementación real, aquí subirías la imagen a un servicio
      // Por ahora, creamos una URL temporal
      const url = URL.createObjectURL(file)
      onUpdate({ photoUrl: url })
    }
  }

  const generateDescription = async () => {
    if (!data.name.trim()) {
      alert('Por favor, ingresa un nombre primero')
      return
    }

    setIsGeneratingDescription(true)
    try {
      // Simular llamada a API para generar descripción
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedDescription = `${data.name} es un filósofo contemporáneo conocido por su enfoque innovador hacia las grandes preguntas de la existencia. Con una perspectiva única que combina sabiduría clásica y pensamiento moderno, ${data.name} invita a explorar las profundidades del conocimiento humano a través del diálogo socrático.`
      
      onUpdate({ publicDescription: generatedDescription })
    } catch (error) {
      console.error('Error generando descripción:', error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 mx-auto text-pink-500 mb-3" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Identidad y Apariencia
        </h3>
        <p className="text-slate-400">
          Define la identidad básica de tu filósofo
        </p>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Nombre del Filósofo *
        </Label>
        <Input
          id="name"
          value={data.name}
          onChange={handleNameChange}
          placeholder="Ej: Sócrates Moderno, Aristóteles Digital..."
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
        />
        <p className="text-xs text-slate-500">
          Puede ser un nombre original o inspirado en filósofos históricos
        </p>
      </div>

      {/* Foto */}
      <div className="space-y-2">
        <Label className="text-white">
          Foto del Filósofo (Opcional)
        </Label>
        <div className="flex items-center gap-4">
          {data.photoUrl ? (
            <div className="relative">
              <img
                src={data.photoUrl}
                alt="Foto del filósofo"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-slate-700 border-slate-600"
                onClick={() => onUpdate({ photoUrl: undefined })}
              >
                ×
              </Button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center">
              <Camera className="w-8 h-8 text-slate-500" />
            </div>
          )}
          
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <Label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Subir Foto
            </Label>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG o GIF. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Descripción Pública */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="text-white">
            Descripción Pública *
          </Label>
          <Button
            size="sm"
            variant="outline"
            onClick={generateDescription}
            disabled={isGeneratingDescription || !data.name.trim()}
            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
          >
            {isGeneratingDescription ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generar con IA
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="description"
          value={data.publicDescription}
          onChange={handleDescriptionChange}
          placeholder="Describe brevemente a tu filósofo para que otros usuarios puedan conocerlo..."
          rows={4}
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
        />
        <p className="text-xs text-slate-500">
          Esta descripción será visible para otros usuarios si decides hacer público tu filósofo
        </p>
      </div>

      {/* Preview */}
      {(data.name || data.publicDescription) && (
        <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Vista Previa
          </h4>
          <div className="flex items-start gap-3">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <h5 className="text-white font-medium">
                {data.name || 'Nombre del Filósofo'}
              </h5>
              <p className="text-slate-300 text-sm mt-1">
                {data.publicDescription || 'Descripción del filósofo...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 