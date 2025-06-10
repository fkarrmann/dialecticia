'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Download, X } from 'lucide-react'

interface ExportProgressModalProps {
  debateId: string
  buttonText?: string
  buttonClassName?: string
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportCancel?: () => void
  disabled?: boolean
}

export default function ExportProgressModal({
  debateId,
  buttonText = 'PDF',
  buttonClassName = "flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm",
  onExportStart,
  onExportComplete,
  onExportCancel,
  disabled = false
}: ExportProgressModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [mounted, setMounted] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timersRef = useRef<{ timer?: NodeJS.Timeout, progressTimer?: NodeJS.Timeout }>({})
  const userCancelledRef = useRef(false)

  const progressSteps = [
    { step: 0, text: 'Iniciando exportación...', emoji: '🚀' },
    { step: 1, text: 'Recopilando mensajes del debate...', emoji: '💬' },
    { step: 2, text: 'Procesando información de filósofos...', emoji: '🏛️' },
    { step: 3, text: 'Generando estructura del PDF...', emoji: '📄' },
    { step: 4, text: 'Aplicando estilos y formato...', emoji: '🎨' },
    { step: 5, text: 'Optimizando para descarga...', emoji: '⚡' },
    { step: 6, text: '¡Completado! Iniciando descarga...', emoji: '✅' }
  ]

  const clearTimers = () => {
    if (timersRef.current.timer) {
      clearInterval(timersRef.current.timer)
      timersRef.current.timer = undefined
    }
    if (timersRef.current.progressTimer) {
      clearInterval(timersRef.current.progressTimer)
      timersRef.current.progressTimer = undefined
    }
  }

  const resetState = () => {
    setIsExporting(false)
    setShowProgressModal(false)
    setProgressStep(0)
    setTimeElapsed(0)
    clearTimers()
    abortControllerRef.current = null
    userCancelledRef.current = false
  }

  const handleCancel = () => {
    console.log('🚫 Usuario canceló la exportación explícitamente')
    // IMPORTANTE: Marcar como cancelado ANTES de abortar para evitar race condition
    userCancelledRef.current = true
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    resetState()
    onExportCancel?.()
  }

  const handleExport = async () => {
    console.log('🚀 ExportProgressModal: Iniciando exportación', { debateId })
    setIsExporting(true)
    setShowProgressModal(true)
    setProgressStep(0)
    setTimeElapsed(0)
    userCancelledRef.current = false
    
    // Crear nuevo AbortController para esta exportación
    abortControllerRef.current = new AbortController()
    
    onExportStart?.()

    // Timer para contar tiempo transcurrido
    timersRef.current.timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    // Simular progreso paso a paso - más lento para dar tiempo al servidor
    timersRef.current.progressTimer = setInterval(() => {
      setProgressStep(prev => {
        if (prev < progressSteps.length - 2) {
          return prev + 1
        }
        return prev
      })
    }, 3000) // Aumentado de 2s a 3s para dar más tiempo

    try {
      console.log('📡 ExportProgressModal: Enviando petición a', `/api/debates/${debateId}/export`)
      const response = await fetch(`/api/debates/${debateId}/export`, {
        signal: abortControllerRef.current.signal,
        // Agregar headers explícitos para evitar problemas CORS
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json',
        }
      })
      
      console.log('📨 ExportProgressModal: Respuesta recibida', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      // Paso final del progreso
      setProgressStep(progressSteps.length - 1)
      
      if (response.ok) {
        console.log('✅ ExportProgressModal: Respuesta OK, procesando PDF...')
        
        // Verificar que es un PDF
        const contentType = response.headers.get('content-type')
        console.log('📄 Content-Type:', contentType)
        
        if (contentType !== 'application/pdf') {
          throw new Error('El servidor no devolvió un PDF válido')
        }
        
        // Obtener el contenido como blob
        console.log('💾 ExportProgressModal: Convirtiendo a blob...')
        const blob = await response.blob()
        
        // Crear URL para descarga
        const url = URL.createObjectURL(blob)
        
        // Obtener nombre del archivo de los headers
        const contentDisposition = response.headers.get('content-disposition')
        let filename = 'debate.pdf'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }
        
        // Crear enlace temporal para descarga
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        
        // Ejecutar la descarga
        console.log('🎯 ExportProgressModal: Iniciando descarga...', filename)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        // Limpiar el URL
        URL.revokeObjectURL(url)
        
        console.log('🎉 ExportProgressModal: Descarga completada exitosamente!')
        onExportComplete?.()
      } else {
        const result = await response.json()
        const errorMessage = result.error || 'Error al exportar el debate'
        console.error('❌ Error del servidor:', errorMessage)
        // Solo mostrar alert si NO fue cancelado por el usuario
        if (!userCancelledRef.current) {
          alert(errorMessage)
        }
      }
    } catch (error) {
      console.error('❌ Error exporting debate:', error)
      
      // REVISAR CANCELACIÓN ANTES QUE NADA
      if (userCancelledRef.current) {
        console.log('✅ Cancelación del usuario detectada - saliendo sin error')
        return
      }
      
      let errorMessage = 'Error al exportar el debate'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('⚠️ AbortError detectado - verificando si fue cancelado por el usuario')
          // Si fue cancelado por el usuario, no mostrar error
          if (userCancelledRef.current) {
            return
          }
          errorMessage = 'La exportación tardó demasiado - intenta nuevamente'
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'Error de conexión - Verifica tu conexión a internet'
        } else {
          errorMessage = 'Error al exportar el debate: ' + error.message
        }
      }
      
      console.error('❌ Error final:', errorMessage)
      // Solo mostrar alert si NO fue cancelado por el usuario
      if (!userCancelledRef.current) {
        alert(errorMessage)
      }
    } finally {
      clearTimers()
      setIsExporting(false)
      
      // Solo mostrar el modal de completado si NO fue cancelado por el usuario
      if (!userCancelledRef.current) {
        setTimeout(() => {
          setShowProgressModal(false)
          setProgressStep(0)
          setTimeElapsed(0)
        }, 2000)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    return () => {
      clearTimers()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting || disabled}
        className={buttonClassName}
        title="Exportar debate a PDF"
      >
        <Download className="w-4 h-4" />
        <span>{isExporting ? 'Exportando...' : buttonText}</span>
      </button>

      {/* Modal de Progreso - Usando Portal para evitar z-index issues */}
      {mounted && showProgressModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center" 
          style={{ 
            zIndex: 9999999, // Z-index extremadamente alto
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            isolation: 'isolate' // Crear un nuevo contexto de apilamiento
          }}
        >
          <div 
            className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl max-w-md w-full mx-4 overflow-hidden relative" 
            style={{ 
              zIndex: 9999999,
              position: 'relative',
              isolation: 'isolate' // Asegurar el contexto de apilamiento
            }}
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-center relative">
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors z-10"
                title="Cancelar exportación"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="text-3xl mb-2">📄</div>
              <h3 className="text-xl font-bold text-white">Exportando Debate</h3>
              <p className="text-purple-100 text-sm mt-1">Generando PDF profesional...</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-2xl mb-2">
                  {progressSteps[progressStep]?.emoji}
                </div>
                <p className="text-white font-medium mb-1">
                  {progressSteps[progressStep]?.text}
                </p>
                <p className="text-slate-400 text-sm">
                  Paso {progressStep + 1} de {progressSteps.length}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progreso</span>
                  <span>{Math.round(((progressStep + 1) / progressSteps.length) * 100)}%</span>
                </div>
                <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${((progressStep + 1) / progressSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center text-slate-400 text-sm mb-4">
                ⏱️ Tiempo transcurrido: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </div>

              <button
                onClick={handleCancel}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar Exportación
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 