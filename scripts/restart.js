#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

async function main() {
  try {
    console.log('🚀 Dialecticia Restart Sequence')
    console.log('================================')

    // Paso 1: Transformar prompts
    console.log('1️⃣ Transformando prompts...')
    await runScript('transform-prompts.js')

    console.log('\n2️⃣ Prompts actualizados exitosamente')
    console.log('✨ El dev server usará los nuevos prompts automáticamente')
    console.log('\n🎯 Para probar los cambios:')
    console.log('   npm run dev')
    console.log('\n📝 Para editar prompts:')
    console.log('   Edita: docs/prompts/socratic-strategy.md')
    console.log('   Luego: npm run restart')

  } catch (error) {
    console.error('❌ Error en restart sequence:', error.message)
    process.exit(1)
  }
}

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName)
    const child = spawn('node', [scriptPath], { 
      stdio: 'inherit',
      cwd: process.cwd()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Script ${scriptName} falló con código ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`Error ejecutando ${scriptName}: ${error.message}`))
    })
  })
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
} 