'use client'

import { useState } from 'react'
import { Database, Bot, FileText, BarChart3, Settings } from 'lucide-react'
import LLMProvidersManager from './LLMProvidersManager'
import LLMModelsManager from './LLMModelsManager'
import LLMPromptsManager from './LLMPromptsManager'
import LLMMetricsDashboard from './LLMMetricsDashboard'
import LLMConfigurationsManager from './LLMConfigurationsManager'

type TabType = 'providers' | 'models' | 'prompts' | 'configurations' | 'metrics'

const tabs = [
  {
    id: 'providers' as TabType,
    label: 'Proveedores',
    icon: Database,
    description: 'Gestiona proveedores LLM y API keys'
  },
  {
    id: 'models' as TabType,
    label: 'Modelos',
    icon: Bot,
    description: 'Configura modelos y costos'
  },
  {
    id: 'prompts' as TabType,
    label: 'Prompts',
    icon: FileText,
    description: 'Editor de prompts y versionado'
  },
  {
    id: 'configurations' as TabType,
    label: 'Configuraciones',
    icon: Settings,
    description: 'Configuraciones de funciones LLM'
  },
  {
    id: 'metrics' as TabType,
    label: 'Métricas',
    icon: BarChart3,
    description: 'Analytics y dashboard'
  }
]

export default function LLMManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('providers')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'providers':
        return <LLMProvidersManager />
      case 'models':
        return <LLMModelsManager />
      case 'prompts':
        return <LLMPromptsManager />
      case 'configurations':
        return <LLMConfigurationsManager />
      case 'metrics':
        return <LLMMetricsDashboard />
      default:
        return <LLMProvidersManager />
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Icon 
                  className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`} 
                />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <p className="text-slate-300 text-sm">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  )
} 