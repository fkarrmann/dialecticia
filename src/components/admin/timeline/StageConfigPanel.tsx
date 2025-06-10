'use client';

import React, { useState, useEffect } from 'react';
import { SocraticStage } from '@/lib/socratic-config-adapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Save, RotateCcw } from 'lucide-react';

interface BehaviorTemplate {
  name: string;
  description: string;
  behavior: string;
}

interface StageConfigPanelProps {
  stage: SocraticStage;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStage: SocraticStage) => void;
  templates?: BehaviorTemplate[];
}

export const StageConfigPanel: React.FC<StageConfigPanelProps> = ({
  stage,
  isOpen,
  onClose,
  onSave,
  templates = []
}) => {
  const [editedStage, setEditedStage] = useState<SocraticStage>(stage);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedStage(stage);
    setHasChanges(false);
  }, [stage]);

  const handleFieldChange = (field: keyof SocraticStage, value: any) => {
    setEditedStage(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editedStage);
    setHasChanges(false);
  };

  const handleReset = () => {
    setEditedStage(stage);
    setHasChanges(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-2xl">{editedStage.icon}</span>
            </div>
            <div>
              <CardTitle className="text-xl text-white">{editedStage.displayName}</CardTitle>
              <p className="text-sm text-slate-400">Configuración de etapa socrática</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Message Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minMessage" className="text-white">Mensaje Inicial</Label>
              <Input
                id="minMessage"
                type="number"
                min="1"
                value={editedStage.minMessage}
                onChange={(e) => handleFieldChange('minMessage', parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="maxMessage" className="text-white">Mensaje Final</Label>
              <Input
                id="maxMessage"
                type="number"
                value={editedStage.maxMessage || ''}
                onChange={(e) => handleFieldChange('maxMessage', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Sin límite"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Intensity */}
          <div>
            <Label className="block mb-2 text-white">Intensidad: {editedStage.intensity}/10</Label>
            <Slider
              value={[editedStage.intensity]}
              onValueChange={([value]) => handleFieldChange('intensity', value)}
              max={10}
              min={1}
              step={1}
              className="[&_[role=slider]]:bg-purple-500"
            />
          </div>

          {/* Configuration Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={editedStage.isFlexible}
                onCheckedChange={(checked) => handleFieldChange('isFlexible', checked)}
              />
              <Label className="text-sm text-white">
                Etapa flexible (se adapta al ritmo del usuario) ⚡
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editedStage.isCyclic}
                onCheckedChange={(checked) => handleFieldChange('isCyclic', checked)}
              />
              <Label className="text-sm text-white">
                Etapa cíclica (puede repetirse) 🔄
              </Label>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white">Descripción</Label>
            <Textarea
              id="description"
              value={editedStage.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="mt-2 bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Behavior - TEXTO LIBRE */}
          <div>
            <Label htmlFor="behavior" className="text-white">Comportamiento del Filósofo (Texto Libre)</Label>
            <Textarea
              id="behavior"
              value={editedStage.behavior}
              onChange={(e) => handleFieldChange('behavior', e.target.value)}
              placeholder="Describe cómo debe comportarse el filósofo en esta etapa..."
              className="mt-2 h-32 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>

        <div className="border-t border-slate-700 p-4 flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={!hasChanges}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetear
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </Card>
    </div>
  );
}; 