'use client'

import { useState } from 'react'
import { Brain, Sliders, Code, Info } from 'lucide-react'
import type { PromptsConfig } from '@/lib/prompts'

interface PhilosopherPersonalitiesEditorProps {
  philosopherPrompts: PromptsConfig['philosopherPrompts']
  onChange: (philosopherPrompts: PromptsConfig['philosopherPrompts']) => void
}

export function PhilosopherPersonalitiesEditor({ philosopherPrompts, onChange }: PhilosopherPersonalitiesEditorProps) {
  const [activeSection, setActiveSection] = useState<'template' | 'styles'>('template')

  const argumentStyles = [
    { key: 'platonist', name: 'Platónico/Idealista', description: 'Alegorías y conceptos abstractos' },
    { key: 'aristotelian', name: 'Aristotélico/Empirista', description: 'Lógica y evidencia empírica' },
    { key: 'nihilist', name: 'Nihilista/Nietzscheano', description: 'Provocación y demolición de valores' },
    { key: 'empiricist', name: 'Empirista Puro', description: 'Observación y experimentación' }
  ] as const

  const updateBaseTemplate = (template: string) => {
    onChange({
      ...philosopherPrompts,
      basePersonalityTemplate: template
    })
  }

  const updateArgumentStyle = (key: keyof PromptsConfig['philosopherPrompts']['argumentStyles'], value: string) => {
    onChange({
      ...philosopherPrompts,
      argumentStyles: {
        ...philosopherPrompts.argumentStyles,
        [key]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Brain className="w-5 h-5 text-green-400" />
          <h3 className="text-green-300 font-medium">Personalidades de Filósofos</h3>
        </div>
        <p className="text-green-200 text-sm">
          Configura las plantillas base y estilos argumentativos que definen la personalidad única de cada filósofo.
          Estas plantillas usan variables que se reemplazan dinámicamente.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('template')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'template'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Plantilla Base</span>
          </button>
          <button
            onClick={() => setActiveSection('styles')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === 'styles'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Estilos Argumentativos</span>
          </button>
        </nav>
      </div>

      {/* Base Template Editor */}
      {activeSection === 'template' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
              <Code className="w-4 h-4 text-green-400" />
              <span>Plantilla Base de Personalidad</span>
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Esta plantilla se usa para todos los filósofos no-Sócrates. Las variables se reemplazan dinámicamente.
            </p>
            
            <textarea
              value={philosopherPrompts.basePersonalityTemplate}
              onChange={(e) => updateBaseTemplate(e.target.value)}
              className="w-full h-96 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-green-500 focus:outline-none resize-none font-mono text-sm"
              placeholder="Escribe la plantilla base aquí..."
            />
          </div>

          {/* Variables Reference */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-5 h-5 text-blue-400" />
              <h4 className="text-blue-300 font-medium">Variables Disponibles</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <code className="text-blue-300">{'{NOMBRE}'}</code> - Nombre del filósofo
                <br />
                <code className="text-blue-300">{'{DESCRIPCIÓN}'}</code> - Descripción de personalidad
                <br />
                <code className="text-blue-300">{'{CREENCIAS_CORE}'}</code> - Creencias fundamentales
                <br />
                <code className="text-blue-300">{'{ESTILO_ARGUMENTATIVO}'}</code> - Estilo de debate
              </div>
              <div className="space-y-1">
                <code className="text-blue-300">{'{ENFOQUE_CUESTIONAMIENTO}'}</code> - Enfoque de preguntas
                <br />
                <code className="text-blue-300">{'{FORMALIDAD}'}</code> - Trait numérico (1-10)
                <br />
                <code className="text-blue-300">{'{AGRESIVIDAD}'}</code> - Trait numérico (1-10)
                <br />
                <code className="text-blue-300">{'{HUMOR}'}</code>, <code className="text-blue-300">{'{COMPLEJIDAD}'}</code> - Más traits
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Argument Styles Editor */}
      {activeSection === 'styles' && (
        <div className="space-y-4">
          {argumentStyles.map((style) => (
            <div key={style.key} className="bg-slate-800/50 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="text-white font-medium flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-green-400" />
                  <span>{style.name}</span>
                </h3>
                <p className="text-slate-400 text-sm">{style.description}</p>
              </div>

              <textarea
                value={philosopherPrompts.argumentStyles[style.key]}
                onChange={(e) => updateArgumentStyle(style.key, e.target.value)}
                className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-green-500 focus:outline-none resize-none text-sm"
                placeholder={`Describe el estilo argumentativo ${style.name.toLowerCase()}...`}
              />
            </div>
          ))}

          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-5 h-5 text-yellow-400" />
              <h4 className="text-yellow-300 font-medium">Cómo Funcionan los Estilos</h4>
            </div>
            <p className="text-yellow-200 text-sm">
              Estos estilos se integran en la plantilla base para darle a cada filósofo un enfoque argumentativo único.
              Define cómo cada escuela filosófica aborda los debates y construye sus argumentos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 