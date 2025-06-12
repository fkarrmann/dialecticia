'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Eye, Clock, DollarSign, Zap, MessageSquare, User, Bot } from 'lucide-react'

interface LLMInteraction {
  id: string
  functionName: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  totalCost: number
  responseTime: number
  success: boolean
  timestamp: string
  systemPrompt?: string
  userPrompt?: string
  response?: string
  errorMessage?: string
  philosopher?: string
  debateTopic?: string
}

interface LLMMetrics {
  totalInteractions: number
  totalCost: number
  avgResponseTime: number
  successRate: number
  topFunctions: Array<{ name: string; count: number }>
}

export default function LLMMonitoringPage() {
  const [interactions, setInteractions] = useState<LLMInteraction[]>([])
  const [metrics, setMetrics] = useState<LLMMetrics | null>(null)
  const [selectedInteraction, setSelectedInteraction] = useState<LLMInteraction | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch live prompts (new endpoint)
      const livePromptsRes = await fetch('/api/admin/llm/live-prompts')
      const livePromptsData = await livePromptsRes.json()
      
      // Fetch metrics
      const metricsRes = await fetch('/api/admin/llm/metrics?days=1')
      const metricsData = await metricsRes.json()
      
      if (livePromptsData.success) {
        // Convert live prompts to interaction format
        const convertedInteractions = livePromptsData.prompts.map((prompt: any) => ({
          id: prompt.id,
          functionName: prompt.functionName,
          provider: 'Live',
          model: 'Monitoring',
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          responseTime: 0,
          success: true,
          timestamp: prompt.timestamp,
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          response: prompt.response,
          philosopher: prompt.philosopher,
          debateTopic: prompt.debateTopic
        }))
        setInteractions(convertedInteractions)
      }
      
      if (metricsData.success) {
        setMetrics(metricsData.metrics)
      }
    } catch (error) {
      console.error('Error fetching LLM data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatCost = (cost: number) => `$${cost.toFixed(6)}`
  const formatTime = (ms: number) => `${ms}ms`
  const formatTokens = (tokens: number) => tokens.toLocaleString()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🤖 Monitoreo LLM</h1>
          <p className="text-muted-foreground">
            Visualización en tiempo real de las interacciones con el LLM
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interacciones</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInteractions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(metrics.totalCost)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(metrics.avgResponseTime)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Prompts Recientes</CardTitle>
            <CardDescription>
              Últimos prompts enviados al LLM en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-y-auto">
              <div className="space-y-2">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedInteraction?.id === interaction.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedInteraction(interaction)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={interaction.success ? "default" : "destructive"}>
                          {interaction.functionName}
                        </Badge>
                        {interaction.philosopher && (
                          <Badge variant="outline">{interaction.philosopher}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(interaction.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {interaction.provider}/{interaction.model}
                        </span>
                        <span className="text-muted-foreground">
                          Live Monitoring
                        </span>
                      </div>
                    </div>
                    
                    {interaction.debateTopic && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        Debate: {interaction.debateTopic}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Prompt</CardTitle>
            <CardDescription>
              {selectedInteraction 
                ? `Función: ${selectedInteraction.functionName}` 
                : 'Selecciona un prompt para ver los detalles'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedInteraction ? (
              <Tabs defaultValue="prompts" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                  <TabsTrigger value="response">Respuesta</TabsTrigger>
                </TabsList>
                
                <TabsContent value="prompts" className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <h4 className="font-semibold">System Prompt</h4>
                    </div>
                    <div className="h-[200px] w-full border rounded-md p-3 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {selectedInteraction.systemPrompt || 'No disponible'}
                      </pre>
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="font-semibold">User Prompt</h4>
                    </div>
                    <div className="h-[200px] w-full border rounded-md p-3 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {selectedInteraction.userPrompt || 'No disponible'}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="response" className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4" />
                      <h4 className="font-semibold">Respuesta del LLM</h4>
                    </div>
                    <div className="h-[400px] w-full border rounded-md p-3 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {selectedInteraction.success 
                          ? selectedInteraction.response || 'No disponible'
                          : selectedInteraction.errorMessage || 'Error desconocido'
                        }
                      </pre>
                    </div>
                  </div>
                  
                  {selectedInteraction.philosopher && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Contexto</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Filósofo:</span> {selectedInteraction.philosopher}
                        </div>
                        {selectedInteraction.debateTopic && (
                          <div>
                            <span className="font-medium">Tema:</span> {selectedInteraction.debateTopic}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Timestamp:</span> {new Date(selectedInteraction.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un prompt para ver los detalles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 