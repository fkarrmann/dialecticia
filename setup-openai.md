# 🔑 Configurar OpenAI API Key

## Para Testing Local

1. **Obtén tu API Key**:
   - Ve a [platform.openai.com](https://platform.openai.com/api-keys)
   - Crea una nueva API key
   - Cópiala (algo como: `sk-proj-abc123...`)

2. **Configura Local**:
   - Edita el archivo `.env.local` (ya creado)
   - Reemplaza `sk-your-actual-openai-api-key-here` con tu key real
   - **OPCIONAL**: Agrega `OPENAI_MODEL="gpt-4o"` para usar GPT-4o
   - Guarda el archivo

3. **Reinicia el servidor**:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

## Para Deploy en Vercel

1. **Variables de entorno en Vercel**:
   - Ve a tu proyecto en [vercel.com](https://vercel.com)
   - Settings → Environment Variables
   - Agrega: `OPENAI_API_KEY` = tu key real

## ✅ Verificar que Funciona

- En la consola del navegador verás: `🤖 Generating response for [Filósofo] | Mode: OPENAI`
- Si ves `MOCK`, significa que aún no detecta el API key

## 💰 Costos Aproximados por Modelo

### GPT-4o (Más Avanzado)
- **Por respuesta**: ~$0.005 - $0.01
- **Debate completo**: ~$0.10 - $0.30
- **Testing diario**: ~$5 - $15

### GPT-4o Mini (Recomendado para testing)
- **Por respuesta**: ~$0.0001 - $0.0005
- **Debate completo**: ~$0.01 - $0.05
- **Testing diario**: ~$1 - $5

### Configuración Recomendada
- **Para testing**: `OPENAI_MODEL="gpt-4o-mini"`
- **Para producción**: `OPENAI_MODEL="gpt-4o"`

## 🔧 Debugging

Si algo no funciona, revisa:
1. Key correcta en .env.local
2. Servidor reiniciado
3. Logs en consola del terminal 