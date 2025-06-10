'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Edit, Info } from 'lucide-react'
import type { PromptsConfig } from '@/lib/prompts'

interface SocraticPromptsEditorProps {
  prompts: PromptsConfig['socraticPrompts']
  onChange: (prompts: PromptsConfig['socraticPrompts']) => void
}

type PromptType = keyof PromptsConfig['socraticPrompts']

export function SocraticPromptsEditor({ prompts, onChange }: SocraticPromptsEditorProps) {
  const [expandedPrompt, setExpandedPrompt] = useState<PromptType | null>('SOCRATIC_TO_USER')

  const promptTypes: Array<{
    key: PromptType
    title: string
    description: string
    context: string
  }> = [
    {
      key: 'SOCRATIC_MODERATOR_PLURAL',
      title: 'Moderador Plural',
      description: 'Sócrates invita al filósofo a posicionarse',
      context: 'Inicio del diálogo tripartito'
    },
    {
      key: 'SOCRATIC_TO_USER',
      title: 'Quirúrgico al Usuario',
      description: 'Preguntas devastadoras dirigidas al usuario',
      context: 'Atacar contradicciones específicas'
    },
    {
      key: 'SOCRATIC_TO_PHILOSOPHER',
      title: 'Desafío entre Colegas',
      description: 'Sócrates cuestiona al filósofo',
      context: 'Debate intelectual directo'
    },
    {
      key: 'RESPONDING_TO_SOCRATES',
      title: 'Respuesta Filosófica',
      description: 'Filósofos dan su postura sin preguntas',
      context: 'Declaraciones tajantes'
    },
    {
      key: 'SOCRATIC_DEFAULT',
      title: 'Devastador Clásico',
      description: 'Prompt base socrático',
      context: 'Situaciones generales'
    }
  ]

  const updatePrompt = (type: PromptType, field: keyof PromptsConfig['socraticPrompts'][PromptType], value: string | number | string[]) => {
    onChange({
      ...prompts,
      [type]: {
        ...prompts[type],
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="text-blue-300 font-medium">Prompts Socráticos</h3>
        </div>
        <p className="text-blue-200 text-sm">
          Configura los 5 tipos de prompts que moldean las interacciones de Sócrates y los filósofos.
          Cada tipo tiene un propósito específico en el diálogo socrático.
        </p>
      </div>

      {promptTypes.map((promptType) => (
        <div key={promptType.key} className="bg-slate-800/50 rounded-lg border border-slate-700">
          {/* Header */}
          <button
            onClick={() => setExpandedPrompt(expandedPrompt === promptType.key ? null : promptType.key)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {expandedPrompt === promptType.key ? (
                <ChevronDown className="w-5 h-5 text-purple-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <h3 className="text-white font-medium">{promptType.title}</h3>
                <p className="text-slate-400 text-sm">{promptType.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-400 text-sm">{promptType.context}</div>
              <div className="text-slate-500 text-xs">
                Máx: {prompts[promptType.key].maxLength} palabras
              </div>
            </div>
          </button>

          {/* Content */}
          {expandedPrompt === promptType.key && (
            <div className="px-4 pb-4 space-y-4 border-t border-slate-700">
              {/* Style & Max Length */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estilo
                  </label>
                  <input
                    type="text"
                    value={prompts[promptType.key].style}
                    onChange={(e) => updatePrompt(promptType.key, 'style', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="ej: Quirúrgico y directo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Longitud Máxima (palabras)
                  </label>
                  <input
                    type="number"
                    value={prompts[promptType.key].maxLength}
                    onChange={(e) => updatePrompt(promptType.key, 'maxLength', parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    min="50"
                    max="500"
                  />
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Edit className="w-4 h-4 inline mr-1" />
                  Prompt del Sistema
                </label>
                <textarea
                  value={prompts[promptType.key].systemPrompt}
                  onChange={(e) => updatePrompt(promptType.key, 'systemPrompt', e.target.value)}
                  className="w-full h-48 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
                  placeholder="Escribe el prompt del sistema aquí..."
                />
              </div>

              {/* Examples */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ejemplos (uno por línea)
                </label>
                <textarea
                  value={prompts[promptType.key].examples?.join('\n') || ''}
                  onChange={(e) => updatePrompt(promptType.key, 'examples', e.target.value.split('\n').filter(Boolean))}
                  className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none text-sm"
                  placeholder="Ejemplo 1&#10;Ejemplo 2&#10;Ejemplo 3"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 