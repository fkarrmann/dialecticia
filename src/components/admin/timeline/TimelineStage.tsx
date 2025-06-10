'use client';

import React from 'react';
import { SocraticStage } from '@/lib/socratic-config-adapter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineStageProps {
  stage: SocraticStage;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
  onRangeChange?: (minMessage: number, maxMessage: number | null) => void;
}

export const TimelineStage: React.FC<TimelineStageProps> = ({
  stage,
  isSelected,
  isFirst,
  isLast,
  onClick,
  onRangeChange
}) => {
  const getStageColor = (stageName: string): string => {
    const colors = {
      bienvenida: 'bg-slate-700 border-slate-600 text-slate-200',
      provocacion: 'bg-red-900/50 border-red-700 text-red-200',
      definicion: 'bg-blue-900/50 border-blue-700 text-blue-200',
      elenchos: 'bg-purple-900/50 border-purple-700 text-purple-200',
      aporia: 'bg-yellow-900/50 border-yellow-700 text-yellow-200',
      busqueda: 'bg-green-900/50 border-green-700 text-green-200'
    };
    return colors[stageName as keyof typeof colors] || 'bg-slate-700 border-slate-600 text-slate-200';
  };

  const getSelectedColor = (stageName: string): string => {
    const colors = {
      bienvenida: 'bg-slate-600 border-slate-400 shadow-lg shadow-slate-500/20',
      provocacion: 'bg-red-800/70 border-red-500 shadow-lg shadow-red-500/20',
      definicion: 'bg-blue-800/70 border-blue-500 shadow-lg shadow-blue-500/20',
      elenchos: 'bg-purple-800/70 border-purple-500 shadow-lg shadow-purple-500/20',
      aporia: 'bg-yellow-800/70 border-yellow-500 shadow-lg shadow-yellow-500/20',
      busqueda: 'bg-green-800/70 border-green-500 shadow-lg shadow-green-500/20'
    };
    return colors[stageName as keyof typeof colors] || 'bg-slate-600 border-slate-400 shadow-lg shadow-slate-500/20';
  };

  const formatRange = (): string => {
    if (stage.maxMessage === null) {
      return `${stage.minMessage}+`;
    }
    if (stage.minMessage === stage.maxMessage) {
      return `${stage.minMessage}`;
    }
    return `${stage.minMessage}-${stage.maxMessage}`;
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity <= 3) return 'bg-green-500';
    if (intensity <= 6) return 'bg-yellow-500';
    if (intensity <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative">
      {/* Connector Line - Solo en desktop */}
      {!isLast && (
        <div className="hidden lg:block absolute top-1/2 right-0 w-6 h-0.5 bg-slate-600 transform translate-x-full -translate-y-1/2 z-0" />
      )}
      
      {/* Stage Card */}
      <Card 
        className={`
          relative z-10 cursor-pointer transition-all duration-200 hover:scale-105 
          w-full lg:min-w-[200px] lg:max-w-[250px]
          ${isSelected 
            ? `${getSelectedColor(stage.name)} shadow-lg shadow-opacity-30 border-2` 
            : `${getStageColor(stage.name)} border hover:shadow-md`
          }
        `}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header with Icon and Title */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label={stage.displayName}>
                {stage.icon}
              </span>
              <h3 className="font-semibold text-sm leading-tight text-white">
                {stage.displayName}
              </h3>
            </div>
            <div className="flex gap-1">
              {stage.isCyclic && (
                <Badge variant="outline" className="text-xs px-1 py-0 border-slate-500">
                  🔄
                </Badge>
              )}
              {stage.isFlexible && (
                <Badge variant="outline" className="text-xs px-1 py-0 border-pink-500 text-pink-400">
                  ⚡
                </Badge>
              )}
            </div>
          </div>

          {/* Message Range */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs bg-slate-600 text-slate-200 border-slate-500">
              Mensajes {formatRange()}
            </Badge>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-300">Intensidad:</span>
              <div className={`w-2 h-2 rounded-full ${getIntensityColor(stage.intensity)}`} />
              <span className="text-xs font-medium text-white">{stage.intensity}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 line-clamp-2 mb-3">
            {stage.description}
          </p>

          {/* Behavior Preview */}
          <div className="border-t border-slate-600 pt-2">
            <p className="text-xs text-slate-200 line-clamp-3 italic">
              "{stage.behavior}"
            </p>
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 