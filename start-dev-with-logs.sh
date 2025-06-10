#!/bin/bash

echo "🚀 Iniciando servidor de desarrollo con logs detallados..."
echo "📍 Puerto: 3001"
echo "🔍 Logs de debugging habilitados"
echo "=" * 60

# Matar cualquier proceso en puerto 3001
echo "🧹 Limpiando puerto 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 2

# Iniciar servidor con logs colorados
echo "🎯 Iniciando Next.js..."
npm run dev 2>&1 | while IFS= read -r line; do
    case "$line" in
        *"🤖"*) echo -e "\033[1;34m$line\033[0m" ;;           # Azul para filósofos
        *"✅"*) echo -e "\033[1;32m$line\033[0m" ;;           # Verde para éxito
        *"❌"*) echo -e "\033[1;31m$line\033[0m" ;;           # Rojo para errores
        *"🚨"*) echo -e "\033[1;91m$line\033[0m" ;;           # Rojo brillante para debugging errors
        *"🔥"*) echo -e "\033[1;93m$line\033[0m" ;;           # Amarillo para debugging
        *"📋"*) echo -e "\033[1;36m$line\033[0m" ;;           # Cyan para detalles de prompts
        *"🎯"*) echo -e "\033[1;35m$line\033[0m" ;;           # Magenta para generación
        *"Error"*) echo -e "\033[1;31m$line\033[0m" ;;        # Rojo para errores
        *) echo "$line" ;;                                    # Normal para el resto
    esac
done 