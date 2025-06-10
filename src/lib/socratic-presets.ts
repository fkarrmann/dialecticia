import { SocraticStage } from './socratic-config-adapter';

export interface SocraticPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetAudience: string;
}

export class SocraticPresetManager {
  /**
   * Preset Académico - Formal y estructurado para entornos educativos
   */
  static getAcademicoPreset(): SocraticPreset {
    return {
      id: 'academico',
      name: 'Académico',
      description: 'Diálogo formal y estructurado, ideal para entornos educativos y debates académicos',
      icon: '🎓',
      targetAudience: 'Estudiantes universitarios, académicos, investigadores'
    };
  }

  /**
   * Preset Moderno - Estilo conversacional y dinámico para audiencias contemporáneas
   */
  static getModernoPreset(): SocraticPreset {
    return {
      id: 'moderno',
      name: 'Moderno',
      description: 'Estilo conversacional y dinámico, adaptado a las sensibilidades contemporáneas',
      icon: '🚀',
      targetAudience: 'Profesionales, emprendedores, audiencia general contemporánea'
    };
  }

  /**
   * Preset Intenso - Diálogo profundo y desafiante para mentes preparadas
   */
  static getIntensoPreset(): SocraticPreset {
    return {
      id: 'intenso',
      name: 'Intenso',
      description: 'Diálogo profundo y desafiante, para exploraciones filosóficas rigurosas',
      icon: '🔥',
      targetAudience: 'Filósofos, pensadores avanzados, exploradores intelectuales'
    };
  }

  /**
   * Obtiene todos los presets disponibles
   */
  static getAllPresets(): SocraticPreset[] {
    return [
      this.getAcademicoPreset(),
      this.getModernoPreset(),
      this.getIntensoPreset()
    ];
  }

  /**
   * Obtiene un preset por su ID
   */
  static getPresetById(id: string): SocraticPreset | null {
    const presets = this.getAllPresets();
    return presets.find(preset => preset.id === id) || null;
  }

  /**
   * Aplica un preset al timeline actual
   */
  static applyPreset(presetId: string, baseStages: SocraticStage[]): SocraticStage[] {
    switch (presetId) {
      case 'academico':
        return this.applyAcademicoModifications(baseStages);
      case 'moderno':
        return this.applyModernoModifications(baseStages);
      case 'intenso':
        return this.applyIntensoModifications(baseStages);
      default:
        return baseStages;
    }
  }

  /**
   * Modificaciones para el preset Académico
   */
  private static applyAcademicoModifications(stages: SocraticStage[]): SocraticStage[] {
    return stages.map(stage => ({
      ...stage,
      behavior: this.getAcademicoBehavior(stage.name),
      intensity: stage.name === 'elenchos' ? 8 : stage.intensity,
      maxMessage: stage.name === 'busqueda' ? 25 : stage.maxMessage
    }));
  }

  /**
   * Modificaciones para el preset Moderno
   */
  private static applyModernoModifications(stages: SocraticStage[]): SocraticStage[] {
    return stages.map(stage => ({
      ...stage,
      behavior: this.getModernoBehavior(stage.name),
      intensity: Math.max(4, Math.min(7, stage.intensity)),
      isFlexible: true
    }));
  }

  /**
   * Modificaciones para el preset Intenso
   */
  private static applyIntensoModifications(stages: SocraticStage[]): SocraticStage[] {
    return stages.map(stage => ({
      ...stage,
      behavior: this.getIntensoBehavior(stage.name),
      intensity: Math.min(10, stage.intensity + 2),
      maxMessage: stage.maxMessage ? Math.floor(stage.maxMessage * 1.5) : null
    }));
  }

  /**
   * Comportamientos específicos para preset Académico
   */
  private static getAcademicoBehavior(stageName: string): string {
    const behaviors = {
      bienvenida: 'Saluda de manera formal y académica. Establece el marco intelectual del diálogo con rigor metodológico.',
      provocacion: 'Formula preguntas epistemológicas que cuestionen los fundamentos teóricos. Usa referencias académicas.',
      definicion: 'Solicita definiciones operacionales precisas. Explora implicaciones teóricas y marcos conceptuales.',
      elenchos: 'Aplica élenchos con rigor académico. Identifica falacias lógicas y debilidades metodológicas.',
      aporia: 'Presenta limitaciones epistemológicas como logros intelectuales válidos para investigación futura.',
      busqueda: 'Co-construye conocimiento usando métodos académicos y propone líneas de investigación.'
    };
    return behaviors[stageName as keyof typeof behaviors] || '';
  }

  /**
   * Comportamientos específicos para preset Moderno
   */
  private static getModernoBehavior(stageName: string): string {
    const behaviors = {
      bienvenida: 'Saluda de manera cálida y contemporánea. Invita como conversación entre iguales con relevancia práctica.',
      provocacion: 'Formula preguntas conectadas con la realidad actual. Usa ejemplos modernos y referencias culturales.',
      definicion: 'Busca claridad con enfoque práctico. Pregunta por ejemplos concretos y aplicaciones cotidianas.',
      elenchos: 'Presenta escenarios alternativos y casos límite con ejemplos modernos y relevancia contemporánea.',
      aporia: 'Presenta complejidad como característica natural. Usa metáforas contemporáneas para la perplejidad productiva.',
      busqueda: 'Explora colaborativamente con enfoque en insights aplicables y soluciones innovadoras.'
    };
    return behaviors[stageName as keyof typeof behaviors] || '';
  }

  /**
   * Comportamientos específicos para preset Intenso
   */
  private static getIntensoBehavior(stageName: string): string {
    const behaviors = {
      bienvenida: 'Establece la seriedad del diálogo. Invita a exploración sin concesiones con exigencia intelectual.',
      provocacion: 'Formula preguntas que vayan a la raíz de supuestos fundamentales. Cuestiona verdades incuestionables.',
      definicion: 'Disecciona conceptos hasta elementos básicos. Busca esencia ontológica y exige precisión absoluta.',
      elenchos: 'Aplica élenchos con máxima intensidad. Destruye argumentos débiles y busca contradicciones profundas.',
      aporia: 'Presenta aporía como revelación sobre límites del conocimiento. Contempla el abismo epistemológico.',
      busqueda: 'Construye marcos conceptuales desde tabula rasa. Busca fundamentos para nuevo edificio intelectual.'
    };
    return behaviors[stageName as keyof typeof behaviors] || '';
  }
} 