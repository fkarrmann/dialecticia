// Utilidades de autenticación compatibles con Edge Runtime

// Generar token seguro usando Web Crypto API (compatible con Edge Runtime)
export function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Web Crypto API (compatible con Edge Runtime)
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    // Fallback simple para entornos que no soportan Web Crypto
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36)
  }
}

// Configuración
export const SESSION_COOKIE_NAME = 'dialecticia-session'
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 días 