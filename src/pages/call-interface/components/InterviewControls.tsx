import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { CallControls } from '../types';

interface InterviewControlsProps {
  controls: CallControls;
  isInterviewActive: boolean;
  isPaused: boolean;
  onStartPause: () => void;
  onRequestHelp: () => void;
  onEmergencyExit: () => void;
  className?: string;
}

const InterviewControls = ({ 
  controls, 
  isInterviewActive, 
  isPaused, 
  onStartPause, 
  onRequestHelp, 
  onEmergencyExit,
  className = '' 
}: InterviewControlsProps) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleEmergencyExit = () => {
    if (showExitConfirm) {
      onEmergencyExit();
    } else {
      setShowExitConfirm(true);
      setTimeout(() => setShowExitConfirm(false), 5000);
    }
  };

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3 border border-cyan-400/20">
        {/* Pause/Resume Button - Only shown when call is active */}
        {isInterviewActive && (
          <Button
            variant="outline"
            size="lg"
            onClick={onStartPause}
            disabled={!controls.canPause}
            iconName={isPaused ? "Play" : "Pause"}
            iconPosition="left"
            className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
          >
            {isPaused ? "Reanudar" : "Pausar"}
          </Button>
        )}

        {/* Technical Support */}
        <Button
          variant="ghost"
          size="lg"
          onClick={onRequestHelp}
          disabled={!controls.canRequestHelp}
          iconName="HelpCircle"
          className="text-white/80 hover:text-white hover:bg-white/10 border-white/20"
          title="Solicitar Ayuda Técnica"
        />

        {/* Emergency Exit */}
        {controls.emergencyExitAvailable && (
          <Button
            variant={showExitConfirm ? "outline" : "ghost"}
            size="lg"
            onClick={handleEmergencyExit}
            iconName={showExitConfirm ? "AlertTriangle" : "LogOut"}
            className={`transition-all duration-200 ${
              showExitConfirm 
                ? "border-red-500/50 text-red-400 hover:bg-red-500/10 animate-pulse" 
                : "text-white/60 hover:text-white/80 hover:bg-white/10 border-white/20"
            }`}
            title={showExitConfirm ? "Click de nuevo para confirmar salida" : "Salida de Emergencia"}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewControls;

