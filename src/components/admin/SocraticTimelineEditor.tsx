'use client';

import React, { useState, useEffect } from 'react';
import { SocraticStage, SocraticConfigAdapter } from '@/lib/socratic-config-adapter';
import { SocraticPresetManager } from '@/lib/socratic-presets';
import { TimelineStage } from './timeline/TimelineStage';
import { StageConfigPanel } from './timeline/StageConfigPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RotateCcw, Sparkles, Plus } from 'lucide-react';

export const SocraticTimelineEditor: React.FC = () => {
  const [stages, setStages] = useState<SocraticStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/llm/configurations');
      const configurations = await response.json();
      
      const socraticConfig = configurations.find((config: any) => 
        config.functionName === 'conversation_settings'
      );

      if (socraticConfig && socraticConfig.parameters) {
        try {
          // Intentar cargar configuración existente
          const loadedStages = SocraticConfigAdapter.jsonToTimeline(socraticConfig.parameters);
          setStages(loadedStages);
          console.log('✅ Configuración del timeline cargada desde BD');
        } catch (error) {
          console.warn('⚠️ Error parseando configuración existente, usando defaults:', error);
          setStages(SocraticConfigAdapter.getDefaultStages());
        }
      } else {
        // No existe configuración, usar defaults
        console.log('ℹ️ No hay configuración guardada, usando defaults');
        setStages(SocraticConfigAdapter.getDefaultStages());
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      setStages(SocraticConfigAdapter.getDefaultStages());
    }
  };

  const handleStageUpdate = (updatedStage: SocraticStage) => {
    setStages(prev => prev.map(stage => 
      stage.id === updatedStage.id ? updatedStage : stage
    ));
    setSelectedStageId(null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const timelineJson = SocraticConfigAdapter.timelineToJSON(stages);
      
      // Buscar configuración existente de timeline socrático
      const response = await fetch('/api/admin/llm/configurations');
      const configurations = await response.json();
      
      const socraticConfig = configurations.find((config: any) => 
        config.functionName === 'conversation_settings'
      );

      if (socraticConfig) {
        // Actualizar configuración existente
        const updateResponse = await fetch(`/api/admin/llm/configurations/${socraticConfig.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            functionName: 'conversation_settings',
            description: 'Configuración del Timeline Socrático - Etapas conversacionales del método socrático',
            parameters: timelineJson,
            isActive: true
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Error actualizando configuración');
        }
      } else {
        // Crear nueva configuración
        const createResponse = await fetch('/api/admin/llm/configurations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            functionName: 'conversation_settings',
            description: 'Configuración del Timeline Socrático - Etapas conversacionales del método socrático',
            parameters: timelineJson,
            isActive: true
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Error creando configuración');
        }
      }
      
      setHasChanges(false);
      console.log('✅ Timeline socrático guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando timeline:', error);
      alert('Error guardando la configuración. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStages(SocraticConfigAdapter.getDefaultStages());
    setHasChanges(false);
    setSelectedStageId(null);
  };

  const handleApplyPreset = (presetId: string) => {
    const currentStages = stages.length > 0 ? stages : SocraticConfigAdapter.getDefaultStages();
    const modifiedStages = SocraticPresetManager.applyPreset(presetId, currentStages);
    setStages(modifiedStages);
    setHasChanges(true);
    setSelectedStageId(null);
  };

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) {
      alert('Por favor, ingresa un nombre para el preset');
      return;
    }

    try {
      setIsSaving(true);
      
      // Crear configuración personalizada
      const presetConfig = {
        id: `custom_${Date.now()}`,
        name: newPresetName,
        description: 'Preset personalizado creado por el usuario',
        icon: '⭐',
        targetAudience: 'Personalizado',
        stages: stages
      };

      // Guardar como nueva configuración en BD
      const response = await fetch('/api/admin/llm/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: `preset_${presetConfig.id}`,
          description: `Preset personalizado: ${newPresetName}`,
          parameters: JSON.stringify(presetConfig),
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Error creando preset personalizado');
      }

      console.log(`✅ Preset "${newPresetName}" guardado exitosamente`);
      setNewPresetName('');
      setShowCreatePreset(false);
      alert(`Preset "${newPresetName}" guardado exitosamente`);
      
    } catch (error) {
      console.error('❌ Error creando preset:', error);
      alert('Error creando el preset. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStage = stages.find(stage => stage.id === selectedStageId);

  return (
    <div className="w-full space-y-6">
      {/* Header inspirado en el wizard */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🏛️</span>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">
          Timeline Socrático Visual
        </h3>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Configura las etapas conversacionales basadas en el método socrático tradicional. 
          El filósofo adaptará su comportamiento según la etapa y el ritmo del usuario.
        </p>
      </div>

      {/* Timeline */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-purple-400">⚡</span>
            Etapas del Diálogo Socrático
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Haz clic en una etapa para configurarla. Las etapas flexibles se adaptan al ritmo del usuario.
            <br />
            <span className="text-xs text-slate-500">
              {stages.length} etapas configuradas • Incluye bienvenida inicial
            </span>
          </p>
        </CardHeader>
        <CardContent>
          {stages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-2">🏛️</div>
              <p className="text-slate-400">Cargando etapas del diálogo socrático...</p>
            </div>
          ) : (
            <>
              {/* Desktop Timeline */}
              <div className="hidden lg:flex gap-6 overflow-x-auto pb-4">
                {stages.map((stage, index) => (
                  <TimelineStage
                    key={stage.id}
                    stage={stage}
                    isSelected={selectedStageId === stage.id}
                    isFirst={index === 0}
                    isLast={index === stages.length - 1}
                    onClick={() => setSelectedStageId(stage.id)}
                  />
                ))}
              </div>

              {/* Mobile/Tablet Timeline - Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 lg:hidden gap-4">
                {stages.map((stage, index) => (
                  <TimelineStage
                    key={stage.id}
                    stage={stage}
                    isSelected={selectedStageId === stage.id}
                    isFirst={index === 0}
                    isLast={index === stages.length - 1}
                    onClick={() => setSelectedStageId(stage.id)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
        
        {/* Action Buttons */}
        <div className="border-t border-slate-700 p-4 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            {hasChanges ? (
              <span className="text-yellow-400">⚠️ Tienes cambios sin guardar</span>
            ) : (
              <span>✅ Configuración guardada</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSaving}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar por defecto
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Timeline
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Presets Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            Presets de Diálogo
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Aplica estilos predefinidos para diferentes audiencias y contextos
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Presets predefinidos */}
            {SocraticPresetManager.getAllPresets().map(preset => (
              <div
                key={preset.id}
                className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:bg-slate-600 transition-colors cursor-pointer"
                onClick={() => handleApplyPreset(preset.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{preset.icon}</span>
                  <h3 className="font-semibold text-white">{preset.name}</h3>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  {preset.description}
                </p>
                <p className="text-slate-400 text-xs">
                  Para: {preset.targetAudience}
                </p>
              </div>
            ))}

            {/* Crear nuevo preset */}
            <div
              className="bg-slate-700 border-2 border-dashed border-slate-500 rounded-lg p-4 hover:bg-slate-600 transition-colors cursor-pointer flex flex-col items-center justify-center"
              onClick={() => setShowCreatePreset(true)}
            >
              <Plus className="w-8 h-8 text-slate-400 mb-2" />
              <h3 className="font-semibold text-white mb-1">Crear Preset</h3>
              <p className="text-slate-400 text-xs text-center">
                Guarda el timeline actual como preset personalizado
              </p>
            </div>
          </div>

          {/* Modal para crear preset */}
          {showCreatePreset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Crear Preset Personalizado
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="presetName" className="text-white">
                      Nombre del Preset
                    </Label>
                    <Input
                      id="presetName"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Ej: Mi estilo personal"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="text-white text-sm font-medium mb-1">
                      Configuración actual:
                    </h4>
                    <p className="text-slate-300 text-xs">
                      {stages.length} etapas configuradas
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreatePreset(false);
                        setNewPresetName('');
                      }}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreatePreset}
                      disabled={!newPresetName.trim() || isSaving}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSaving ? 'Guardando...' : 'Crear Preset'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info sobre flexibilidad */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
          <span className="text-pink-400">💡</span>
          Acerca de las Etapas Flexibles
        </h4>
        <p className="text-slate-300 text-sm">
          Las etapas marcadas con ⚡ son flexibles y se adaptan al ritmo del usuario. 
          El LLM entenderá que el usuario puede avanzar más rápido o más lento, 
          y ajustará su comportamiento según el contexto del debate.
        </p>
      </div>

      {/* Modal de Configuración */}
      {selectedStage && (
        <StageConfigPanel
          stage={selectedStage}
          isOpen={true}
          onClose={() => setSelectedStageId(null)}
          onSave={handleStageUpdate}
        />
      )}
    </div>
  );
}; 