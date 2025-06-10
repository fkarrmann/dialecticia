-- Crear tabla para tonos personalizados
CREATE TABLE custom_tones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  user_description TEXT NOT NULL,
  ai_interpretation TEXT NOT NULL,
  ai_label TEXT NOT NULL,
  generated_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);

-- Solo puede haber un tono activo a la vez
CREATE UNIQUE INDEX idx_single_active_tone ON custom_tones(is_active) WHERE is_active = TRUE; 