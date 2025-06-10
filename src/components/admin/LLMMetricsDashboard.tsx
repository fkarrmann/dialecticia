'use client'

import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, DollarSign, Clock, Zap, AlertTriangle } from 'lucide-react'

interface MetricsSummary {
  totalInteractions: number
  totalCost: number
  avgLatency: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  successRate: number
  timeRange: string
}

interface UsageByFunction {
  function: string
  interactions: number
  cost: number
  tokens: number
  avgLatency: number
}

interface UsageByModel {
  modelId: string
  modelName: string
  displayName: string
  interactions: number
  cost: number
  tokens: number
  avgLatency: number
}

interface TopPrompt {
  promptId: string
  promptName: string
  displayName: string
  category: string
  interactions: number
  cost: number
}

interface ErrorAnalysis {
  error: string
  count: number
}

interface MetricsData {
  summary: MetricsSummary
  usageByFunction: UsageByFunction[]
  usageByModel: UsageByModel[]
  dailyUsage: any[]
  topPrompts: TopPrompt[]
  errorAnalysis: ErrorAnalysis[]
}

export default function LLMMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMetrics()
  }, [timeRange, selectedProvider])

  const fetchMetrics = async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({
        days: timeRange.toString(),
        ...(selectedProvider && { providerId: selectedProvider })
      })
      
      const response = await fetch(`/api/admin/llm/metrics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        console.error('Error fetching metrics:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-slate-300">Cargando métricas...</span>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center text-slate-400">
        Error al cargar las métricas
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Métricas del Sistema</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value={1}>Último día</option>
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Interacciones</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(metrics.summary.totalInteractions)}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {metrics.summary.timeRange}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Costo Total</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(metrics.summary.totalCost)}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {formatNumber(metrics.summary.totalTokens)} tokens
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Latencia Promedio</p>
              <p className="text-2xl font-bold text-blue-400">
                {Math.round(metrics.summary.avgLatency)}ms
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Tiempo de respuesta
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-yellow-400">
                {metrics.summary.successRate.toFixed(1)}%
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Llamadas exitosas
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uso por función */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Uso por Función</h3>
          <div className="space-y-3">
            {metrics.usageByFunction.slice(0, 5).map((func, index) => (
              <div key={func.function} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-300 font-medium">
                      {func.function}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {formatNumber(func.interactions)} llamadas
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                    <span>Costo: {formatCurrency(func.cost)}</span>
                    <span>Tokens: {formatNumber(func.tokens)}</span>
                    <span>Latencia: {Math.round(func.avgLatency)}ms</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-purple-400 h-2 rounded-full"
                      style={{
                        width: `${(func.interactions / Math.max(...metrics.usageByFunction.map(f => f.interactions))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uso por modelo */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Uso por Modelo</h3>
          <div className="space-y-3">
            {metrics.usageByModel.slice(0, 5).map((model, index) => (
              <div key={model.modelId} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-300 font-medium">
                      {model.displayName}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {formatNumber(model.interactions)} llamadas
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                    <span>Costo: {formatCurrency(model.cost)}</span>
                    <span>Tokens: {formatNumber(model.tokens)}</span>
                    <span>Latencia: {Math.round(model.avgLatency)}ms</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full"
                      style={{
                        width: `${(model.interactions / Math.max(...metrics.usageByModel.map(m => m.interactions))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prompts más utilizados */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Prompts Utilizados</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-300 py-2">Prompt</th>
                <th className="text-left text-slate-300 py-2">Categoría</th>
                <th className="text-right text-slate-300 py-2">Interacciones</th>
                <th className="text-right text-slate-300 py-2">Costo</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPrompts.slice(0, 8).map((prompt) => (
                <tr key={prompt.promptId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3">
                    <div>
                      <p className="text-slate-200 font-medium">{prompt.displayName}</p>
                      <p className="text-slate-400 text-sm">{prompt.promptName}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {prompt.category}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-200">
                    {formatNumber(prompt.interactions)}
                  </td>
                  <td className="py-3 text-right text-green-400">
                    {formatCurrency(prompt.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis de errores */}
      {metrics.errorAnalysis.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Análisis de Errores</h3>
          </div>
          <div className="space-y-3">
            {metrics.errorAnalysis.slice(0, 5).map((error, index) => (
              <div key={index} className="flex items-center justify-between bg-red-900/20 p-3 rounded-lg border border-red-800/30">
                <div className="flex-1">
                  <p className="text-red-200 font-medium">{error.error}</p>
                </div>
                <div className="text-red-400 font-bold">
                  {error.count} veces
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desglose de tokens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h4 className="text-slate-300 font-medium mb-2">Tokens de Entrada</h4>
          <p className="text-2xl font-bold text-blue-400">
            {formatNumber(metrics.summary.inputTokens)}
          </p>
          <p className="text-slate-400 text-sm">
            {((metrics.summary.inputTokens / metrics.summary.totalTokens) * 100).toFixed(1)}% del total
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h4 className="text-slate-300 font-medium mb-2">Tokens de Salida</h4>
          <p className="text-2xl font-bold text-green-400">
            {formatNumber(metrics.summary.outputTokens)}
          </p>
          <p className="text-slate-400 text-sm">
            {((metrics.summary.outputTokens / metrics.summary.totalTokens) * 100).toFixed(1)}% del total
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h4 className="text-slate-300 font-medium mb-2">Costo por Token</h4>
          <p className="text-2xl font-bold text-yellow-400">
            {formatCurrency(metrics.summary.totalCost / metrics.summary.totalTokens)}
          </p>
          <p className="text-slate-400 text-sm">
            Promedio por token
          </p>
        </div>
      </div>
    </div>
  )
} 