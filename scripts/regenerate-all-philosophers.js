#!/usr/bin/env node

/**
 * Script para regenerar todos los filósofos existentes con el nuevo sistema GPT-4o
 * 
 * Este script:
 * 1. Llama al endpoint /api/admin/philosophers/regenerate-all
 * 2. Muestra el progreso en tiempo real
 * 3. Reporta los resultados finales
 */

const SERVER_URL = 'http://localhost:3001'

async function regenerateAllPhilosophers() {
  console.log('🚀 Iniciando regeneración masiva de filósofos...')
  console.log('═'.repeat(60))
  
  try {
    console.log('📡 Llamando al endpoint de regeneración...')
    
    const response = await fetch(`${SERVER_URL}/api/admin/philosophers/regenerate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        securityKey: 'migration2025'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`API Error: ${result.error}`)
    }
    
    console.log('🎉 ¡Regeneración completada exitosamente!')
    console.log('═'.repeat(60))
    console.log('📊 RESULTADOS FINALES:')
    console.log(`   • Filósofos procesados: ${result.results.processed}`)
    console.log(`   • Actualizados exitosamente: ${result.results.updated}`)
    console.log(`   • Errores: ${result.results.errors}`)
    console.log('')
    
    if (result.results.details && result.results.details.length > 0) {
      console.log('📋 DETALLES POR FILÓSOFO:')
      console.log('─'.repeat(60))
      
      result.results.details.forEach((detail, index) => {
        const status = detail.status === 'success' ? '✅' : '❌'
        console.log(`${index + 1}. ${status} ${detail.name}`)
        
        if (detail.status === 'success' && detail.newTraits) {
          console.log(`     Nuevos rasgos: ${detail.newTraits}`)
        } else if (detail.status === 'error' && detail.error) {
          console.log(`     Error: ${detail.error}`)
        }
        console.log('')
      })
    }
    
    if (result.results.updated > 0) {
      console.log('🎯 RECOMENDACIONES:')
      console.log('   • Verifica los nuevos rasgos en el laboratorio de filósofos')
      console.log('   • Prueba crear un debate para ver las mejoras')
      console.log('   • Los filósofos ahora usan GPT-4o para mejor coherencia')
    }
    
  } catch (error) {
    console.error('❌ Error durante la regeneración:')
    console.error('   ', error.message)
    console.log('')
    console.log('🔧 POSIBLES SOLUCIONES:')
    console.log('   • Verifica que el servidor esté ejecutándose en', SERVER_URL)
    console.log('   • Asegúrate de tener permisos de administrador')
    console.log('   • Revisa los logs del servidor para más detalles')
    process.exit(1)
  }
}

// Verificar que el servidor esté funcionando
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/api/status`)
    if (!response.ok) {
      throw new Error('Servidor no responde')
    }
    console.log('✅ Servidor verificado y funcionando')
    return true
  } catch (error) {
    console.error('❌ Error conectando al servidor:', error.message)
    console.log('💡 Asegúrate de que el servidor esté ejecutándose:')
    console.log('   npm run dev')
    return false
  }
}

// Ejecutar
async function main() {
  console.log('🔄 REGENERACIÓN MASIVA DE FILÓSOFOS')
  console.log('📅 Fecha:', new Date().toLocaleString())
  console.log('🌐 Servidor:', SERVER_URL)
  console.log('')
  
  // Verificar servidor
  const serverOk = await checkServer()
  if (!serverOk) {
    process.exit(1)
  }
  
  console.log('')
  
  // Confirmar acción
  console.log('⚠️  ADVERTENCIA: Esta operación regenerará TODOS los filósofos existentes')
  console.log('   • Se actualizarán las descripciones usando GPT-4o')
  console.log('   • Se regenerarán los rasgos de personalidad')
  console.log('   • El proceso puede tardar varios minutos')
  console.log('')
  
  // Para uso en scripts, simplemente ejecutar
  // En un entorno interactivo podrías agregar confirmación aquí
  
  await regenerateAllPhilosophers()
}

// Ejecutar script
main().catch(console.error) 