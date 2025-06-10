#!/bin/bash

echo "🔍 Monitoreando logs de debugging en tiempo real..."
echo "🎯 Filtrando: prompts, errores de debugging, y respuestas de filósofos"
echo "🔥 Presiona Ctrl+C para salir"
echo "=" * 60

# Monitorear logs del servidor (asumiendo que ya está corriendo)
# Filtra solo logs importantes de debugging
tail -f ~/.npm/_logs/*.log 2>/dev/null | grep -E "(🤖|✅|❌|🚨|🔥|📋|🎯|PROMPT|DEBUGGING|Error)" --color=always || \
echo "⚠️ No se encontraron logs de npm. Usa el siguiente comando para logs en tiempo real:"
echo ""
echo "npm run dev | grep -E \"(🤖|✅|❌|🚨|🔥|📋|🎯|PROMPT|DEBUGGING|Error)\" --color=always" 