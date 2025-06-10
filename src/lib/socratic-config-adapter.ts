export interface SocraticStage {
  id: string;
  name: 'bienvenida' | 'provocacion' | 'definicion' | 'elenchos' | 'aporia' | 'busqueda';
  displayName: string;
  icon: string;
  minMessage: number;
  maxMessage: number | null;
  description: string;
  behavior: string; // Texto libre
  isCyclic: boolean;
  intensity: number; // 1-10
  isFlexible: boolean; // Indica si la etapa puede extenderse según el ritmo del usuario
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SocraticConfig {
  stages: SocraticStage[];
  metadata: {
    version: string;
    created: string;
    preset?: string;
  };
}

export class SocraticConfigAdapter {
  
  /**
   * Convierte un timeline de etapas socráticas a JSON compatible con LLMConfiguration
   */
  static timelineToJSON(stages: SocraticStage[]): string {
    const config = {
      stages: stages.reduce((acc, stage) => {
        const key = `${stage.name}_${stage.minMessage}_${stage.maxMessage || 'infinity'}`;
        acc[key] = {
          min_messages: stage.minMessage,
          max_messages: stage.maxMessage,
          behavior: stage.behavior,
          intensity: stage.intensity,
          is_cyclic: stage.isCyclic,
          description: stage.description,
          display_name: stage.displayName,
          icon: stage.icon
        };
        return acc;
      }, {} as any),
      metadata: {
        type: 'socratic_timeline',
        version: '3.0.0',
        created: new Date().toISOString(),
        total_stages: stages.length
      }
    };
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Convierte JSON de LLMConfiguration a timeline de etapas socráticas
   */
  static jsonToTimeline(json: string): SocraticStage[] {
    try {
      const config = JSON.parse(json);
      
      // Si ya es formato timeline, extraer stages
      if (config.metadata?.type === 'socratic_timeline') {
        return this.extractStagesFromTimeline(config);
      }
      
      // Si es formato legacy, migrar
      return this.migrateOldConfig(config);
      
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return this.getDefaultStages();
    }
  }

  /**
   * Extrae stages de configuración timeline existente
   */
  private static extractStagesFromTimeline(config: any): SocraticStage[] {
    const stages: SocraticStage[] = [];
    
    Object.entries(config.stages || {}).forEach(([key, value]: [string, any]) => {
      const [name] = key.split('_');
      stages.push({
        id: key,
        name: name as SocraticStage['name'],
        displayName: value.display_name || this.getDisplayName(name),
        icon: value.icon || this.getIcon(name),
        minMessage: value.min_messages || 1,
        maxMessage: value.max_messages,
        description: value.description || '',
        behavior: value.behavior || '',
        isCyclic: value.is_cyclic || false,
        intensity: value.intensity || 5,
        isFlexible: value.is_flexible !== undefined ? value.is_flexible : true
      });
    });
    
    return stages.sort((a, b) => a.minMessage - b.minMessage);
  }

  /**
   * Migra configuración antigua al formato timeline
   */
  static migrateOldConfig(oldConfig: any): SocraticStage[] {
    // Si tiene estructura de stages legacy
    if (oldConfig.stages) {
      return this.migrateFromLegacyStages(oldConfig.stages);
    }
    
    // Si es configuración muy antigua, crear stages por defecto
    return this.getDefaultStages();
  }

  /**
   * Migra desde formato legacy de stages
   */
  private static migrateFromLegacyStages(legacyStages: any): SocraticStage[] {
    const stageNames: Array<SocraticStage['name']> = 
      ['provocacion', 'definicion', 'elenchos', 'aporia', 'busqueda'];
    
    return stageNames.map((name, index) => {
      const legacyStage = legacyStages[name] || legacyStages[`stage_${index + 1}`];
      return {
        id: `${name}_${index + 1}`,
        name,
        displayName: this.getDisplayName(name),
        icon: this.getIcon(name),
        minMessage: this.getDefaultMinMessage(index),
        maxMessage: this.getDefaultMaxMessage(index),
        description: legacyStage?.description || this.getDefaultDescription(name),
        behavior: legacyStage?.behavior || legacyStage?.prompt || this.getDefaultBehavior(name),
        isCyclic: name === 'elenchos' || name === 'aporia',
        intensity: legacyStage?.intensity || 5,
        isFlexible: name !== 'bienvenida'
      };
    });
  }

  /**
   * Valida que la configuración del timeline sea válida
   */
  static validateTimeline(stages: SocraticStage[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (stages.length === 0) {
      errors.push('Debe tener al menos una etapa');
      return { isValid: false, errors, warnings };
    }

    // Verificar rangos
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      if (stage.minMessage < 1) {
        errors.push(`Etapa ${stage.displayName}: minMessage debe ser >= 1`);
      }
      
      if (stage.maxMessage !== null && stage.maxMessage < stage.minMessage) {
        errors.push(`Etapa ${stage.displayName}: maxMessage debe ser >= minMessage`);
      }
      
      if (!stage.behavior?.trim()) {
        warnings.push(`Etapa ${stage.displayName}: comportamiento vacío`);
      }
      
      // Verificar solapamientos
      for (let j = i + 1; j < stages.length; j++) {
        const nextStage = stages[j];
        if (this.stagesOverlap(stage, nextStage)) {
          warnings.push(`Solapamiento entre ${stage.displayName} y ${nextStage.displayName}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Verifica si dos etapas se solapan en rangos
   */
  private static stagesOverlap(stage1: SocraticStage, stage2: SocraticStage): boolean {
    const max1 = stage1.maxMessage || Infinity;
    const max2 = stage2.maxMessage || Infinity;
    
    return !(stage1.minMessage > max2 || stage2.minMessage > max1);
  }

  /**
   * Retorna las etapas por defecto basadas en el método socrático tradicional
   */
  static getDefaultStages(): SocraticStage[] {
    return [
      {
        id: 'bienvenida_1',
        name: 'bienvenida',
        displayName: 'Bienvenida e Invitación',
        icon: '🏛️',
        minMessage: 1,
        maxMessage: 1,
        description: 'Mensaje inicial de bienvenida e invitación al debate filosófico',
        behavior: 'Da la bienvenida al usuario de forma cálida y filosófica. Invita al debate e indica que el usuario puede definir el tema y su tesis. Muestra entusiasmo por el diálogo socrático que está por comenzar.',
        isCyclic: false,
        intensity: 3,
        isFlexible: false
      },
      {
        id: 'provocacion_2',
        name: 'provocacion',
        displayName: 'Provocación',
        icon: '🎯',
        minMessage: 2,
        maxMessage: 3,
        description: 'Formulación de la pregunta fundamental que desafía las creencias',
        behavior: 'Una vez que el usuario presenta su tema y tesis, formula preguntas penetrantes que pongan en cuestión las asunciones básicas. Usa la ironía socrática para mostrar las contradicciones.',
        isCyclic: false,
        intensity: 7,
        isFlexible: true
      },
      {
        id: 'definicion_3',
        name: 'definicion',
        displayName: 'Definición Inicial',
        icon: '💭',
        minMessage: 4,
        maxMessage: 6,
        description: 'Exploración de la respuesta inicial y sus fundamentos',
        behavior: 'Escucha activamente la respuesta inicial. Pide clarificaciones y definiciones precisas. Identifica puntos débiles sin atacar directamente. Adapta el ritmo según las respuestas del usuario.',
        isCyclic: false,
        intensity: 5,
        isFlexible: true
      },
      {
        id: 'elenchos_4',
        name: 'elenchos',
        displayName: 'Élenchos (Refutación)',
        icon: '⚔️',
        minMessage: 7,
        maxMessage: 12,
        description: 'Examen crítico mediante preguntas que revelan contradicciones',
        behavior: 'Aplica el método élenchos: preguntas que revelan contradicciones internas. Mantén la presión intelectual sin ser agresivo personalmente. Si el usuario avanza rápido, intensifica; si va lento, da tiempo.',
        isCyclic: true,
        intensity: 8,
        isFlexible: true
      },
      {
        id: 'aporia_5',
        name: 'aporia',
        displayName: 'Aporía (Perplejidad)',
        icon: '🤔',
        minMessage: 13,
        maxMessage: 18,
        description: 'Reconocimiento de la ignorancia y la perplejidad',
        behavior: 'Guía hacia el reconocimiento de la ignorancia. Celebra la aporía como un logro, no como un fracaso. Prepara para la búsqueda conjunta. Permite que el usuario llegue a su ritmo.',
        isCyclic: true,
        intensity: 6,
        isFlexible: true
      },
      {
        id: 'busqueda_6',
        name: 'busqueda',
        displayName: 'Búsqueda Conjunta',
        icon: '🔍',
        minMessage: 19,
        maxMessage: null,
        description: 'Exploración colaborativa hacia una comprensión más profunda',
        behavior: 'Inicia la búsqueda colaborativa de la verdad. Construye sobre la humildad intelectual alcanzada. Explora nuevas perspectivas juntos. Mantén la flexibilidad total.',
        isCyclic: false,
        intensity: 4,
        isFlexible: true
      }
    ];
  }

  /**
   * Helpers para datos por defecto
   */
  private static getDisplayName(name: string): string {
    const names = {
      bienvenida: 'Bienvenida e Invitación',
      provocacion: 'Provocación',
      definicion: 'Definición Inicial',
      elenchos: 'Élenchos (Refutación)',
      aporia: 'Aporía (Perplejidad)',
      busqueda: 'Búsqueda Conjunta'
    };
    return names[name as keyof typeof names] || name;
  }

  private static getIcon(name: string): string {
    const icons = {
      bienvenida: '🏛️',
      provocacion: '🎯',
      definicion: '💭',
      elenchos: '⚔️',
      aporia: '🤔',
      busqueda: '🔍'
    };
    return icons[name as keyof typeof icons] || '📝';
  }

  private static getDefaultMinMessage(index: number): number {
    return [1, 3, 6, 11, 16][index] || 1;
  }

  private static getDefaultMaxMessage(index: number): number | null {
    return [2, 5, 10, 15, null][index] || null;
  }

  private static getDefaultDescription(name: string): string {
    const descriptions = {
      provocacion: 'Formulación de la pregunta fundamental que desafía las creencias',
      definicion: 'Exploración de la respuesta inicial y sus fundamentos',
      elenchos: 'Examen crítico mediante preguntas que revelan contradicciones',
      aporia: 'Reconocimiento de la ignorancia y la perplejidad',
      busqueda: 'Exploración colaborativa hacia una comprensión más profunda'
    };
    return descriptions[name as keyof typeof descriptions] || '';
  }

  private static getDefaultBehavior(name: string): string {
    const behaviors = {
      provocacion: 'Formula preguntas penetrantes que pongan en cuestión las asunciones básicas del interlocutor.',
      definicion: 'Escucha activamente la respuesta inicial. Pide clarificaciones y definiciones precisas.',
      elenchos: 'Aplica el método élenchos: preguntas que revelan contradicciones internas.',
      aporia: 'Guía hacia el reconocimiento de la ignorancia. Celebra la aporía como un logro.',
      busqueda: 'Inicia la búsqueda colaborativa de la verdad. Explora nuevas perspectivas juntos.'
    };
    return behaviors[name as keyof typeof behaviors] || '';
  }
} 