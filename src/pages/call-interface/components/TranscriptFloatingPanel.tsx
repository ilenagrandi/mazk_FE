import React, { useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface TranscriptEntry {
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: string;
}

interface TranscriptFloatingPanelProps {
  entries: TranscriptEntry[];
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

const TranscriptFloatingPanel: React.FC<TranscriptFloatingPanelProps> = ({
  entries,
  isVisible,
  onClose,
  className,
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, isMinimized]);

  if (!isVisible) return null;

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 z-50 transition-all duration-300',
        isMinimized ? 'w-80' : 'w-96',
        className
      )}
    >
      <div className="bg-zinc-950 border border-cyan-400/30 rounded-lg shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-400/20 to-cyan-600/20 border-b border-cyan-400/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Transcripción en Vivo</h3>
            {entries.length > 0 && (
              <span className="text-xs text-cyan-400 bg-cyan-400/20 px-2 py-0.5 rounded-full">
                {entries.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-cyan-400/20 rounded transition-colors text-cyan-400"
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div
            ref={scrollRef}
            className="h-96 overflow-y-auto p-4 space-y-3 bg-zinc-900/50"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#06b6d4 transparent',
            }}
          >
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Esperando transcripción...</p>
                <p className="text-xs mt-2 text-gray-600">
                  La transcripción aparecerá aquí cuando comience la llamada
                </p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-lg p-3 transition-all',
                    entry.speaker === 'agent'
                      ? 'bg-cyan-400/10 border-l-2 border-cyan-400 ml-4'
                      : 'bg-zinc-800/50 border-l-2 border-gray-500 mr-4'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        entry.speaker === 'agent'
                          ? 'text-cyan-400'
                          : 'text-gray-400'
                      )}
                    >
                      {entry.speaker === 'agent' ? '🤖 Agente' : '👤 Cliente'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">{entry.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Minimized view */}
        {isMinimized && (
          <div className="px-4 py-2 bg-zinc-900/50">
            <p className="text-xs text-gray-400">
              {entries.length} {entries.length === 1 ? 'mensaje' : 'mensajes'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptFloatingPanel;

