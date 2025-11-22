import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { DeviceCapabilities } from '../types';

interface DeviceStatusIndicatorProps {
  capabilities: DeviceCapabilities;
  onRequestPermissions: () => void;
  className?: string;
}

const DeviceStatusIndicator = ({ 
  capabilities, 
  onRequestPermissions,
  className = '' 
}: DeviceStatusIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const hasIssues = !capabilities.hasCamera || 
                     !capabilities.hasMicrophone || 
                     capabilities.cameraPermission === 'denied' || 
                     capabilities.microphonePermission === 'denied' ||
                     !capabilities.browserSupported;
    
    setShowWarning(hasIssues);
    if (hasIssues) {
      setIsExpanded(true);
    }
  }, [capabilities]);

  const getPermissionIcon = (permission: 'granted' | 'denied' | 'prompt') => {
    switch (permission) {
      case 'granted': return { icon: 'Check', color: 'text-green-400' };
      case 'denied': return { icon: 'X', color: 'text-red-400' };
      case 'prompt': return { icon: 'AlertCircle', color: 'text-yellow-400' };
      default: return { icon: 'HelpCircle', color: 'text-gray-400' };
    }
  };

  const getOverallStatus = () => {
    if (!capabilities.browserSupported) return { status: 'error', message: 'Navegador no soportado' };
    if (capabilities.cameraPermission === 'denied' || capabilities.microphonePermission === 'denied') {
      return { status: 'error', message: 'Permisos denegados' };
    }
    if (capabilities.cameraPermission === 'granted' && capabilities.microphonePermission === 'granted') {
      return { status: 'success', message: 'Todo listo' };
    }
    return { status: 'warning', message: 'Configuración requerida' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      {/* Status Indicator Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-black/50 backdrop-blur-sm border border-cyan-400/20 text-white hover:bg-black/70 ${
          showWarning ? 'animate-pulse' : ''
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            overallStatus.status === 'success' ? 'bg-green-400' :
            overallStatus.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <Icon name="Settings" size={16} />
          <span className="text-xs">{overallStatus.message}</span>
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
        </div>
      </Button>

      {/* Expanded Status Panel */}
      {isExpanded && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm rounded-lg border border-cyan-400/20 p-4 min-w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Estado de Dispositivos</h4>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/60 hover:text-white"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            {/* Camera Status */}
            <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded">
              <div className="flex items-center space-x-2">
                <Icon name="Video" size={16} className="text-white/80" />
                <span className="text-sm text-white/80">Cámara</span>
              </div>
              <div className="flex items-center space-x-2">
                {capabilities.hasCamera ? (
                  <>
                    <Icon 
                      name={getPermissionIcon(capabilities.cameraPermission).icon} 
                      size={16} 
                      className={getPermissionIcon(capabilities.cameraPermission).color} 
                    />
                    <span className={`text-xs ${getPermissionIcon(capabilities.cameraPermission).color}`}>
                      {capabilities.cameraPermission === 'granted' ? 'Activa' : 
                       capabilities.cameraPermission === 'denied' ? 'Denegada' : 'Pendiente'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-red-400">No disponible</span>
                )}
              </div>
            </div>

            {/* Microphone Status */}
            <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded">
              <div className="flex items-center space-x-2">
                <Icon name="Mic" size={16} className="text-white/80" />
                <span className="text-sm text-white/80">Micrófono</span>
              </div>
              <div className="flex items-center space-x-2">
                {capabilities.hasMicrophone ? (
                  <>
                    <Icon 
                      name={getPermissionIcon(capabilities.microphonePermission).icon} 
                      size={16} 
                      className={getPermissionIcon(capabilities.microphonePermission).color} 
                    />
                    <span className={`text-xs ${getPermissionIcon(capabilities.microphonePermission).color}`}>
                      {capabilities.microphonePermission === 'granted' ? 'Activo' : 
                       capabilities.microphonePermission === 'denied' ? 'Denegado' : 'Pendiente'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-red-400">No disponible</span>
                )}
              </div>
            </div>

            {/* Browser Support */}
            <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded">
              <div className="flex items-center space-x-2">
                <Icon name="Monitor" size={16} className="text-white/80" />
                <span className="text-sm text-white/80">Navegador</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon 
                  name={capabilities.browserSupported ? "Check" : "X"} 
                  size={16} 
                  className={capabilities.browserSupported ? "text-green-400" : "text-red-400"} 
                />
                <span className={`text-xs ${capabilities.browserSupported ? "text-green-400" : "text-red-400"}`}>
                  {capabilities.browserSupported ? 'Soportado' : 'No soportado'}
                </span>
              </div>
            </div>

            {/* Request Permissions Button */}
            {(capabilities.cameraPermission !== 'granted' || capabilities.microphonePermission !== 'granted') && (
              <Button
                variant="default"
                size="sm"
                onClick={onRequestPermissions}
                className="w-full bg-cyan-400 text-black hover:bg-cyan-500"
              >
                Solicitar Permisos
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceStatusIndicator;

