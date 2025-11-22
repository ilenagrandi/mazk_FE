import React, { useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import { TranscriptEntry } from '../types';

interface TranscriptBarProps {
  entries: TranscriptEntry[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  className?: string;
}

const TranscriptBar = ({ entries, isVisible, onToggleVisibility, className = '' }: TranscriptBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && entries.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getSpeakerIcon = (speaker: 'ai' | 'lead') => {
    return speaker === 'ai' ? 'Bot' : 'User';
  };

  const getSpeakerColor = (speaker: 'ai' | 'lead') => {
    return speaker === 'ai' ? 'text-cyan-400' : 'text-white';
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${className}`}>
      {/* Toggle Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggleVisibility}
          className="bg-black/50 hover:bg-black/70 rounded-full p-2 text-white/80 hover:text-white transition-all duration-200"
          title={isVisible ? 'Ocultar Transcript' : 'Mostrar Transcript'}
        >
          <Icon name={isVisible ? 'ChevronUp' : 'ChevronDown'} size={20} />
        </button>
      </div>

      {/* Transcript Panel */}
      <div 
        className={`bg-black/80 backdrop-blur-sm border-b border-cyan-400/20 transition-all duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Icon name="MessageSquare" size={20} className="text-cyan-400" />
              <h3 className="text-white font-medium">Transcript en Vivo</h3>
              <span className="text-xs text-white/60 bg-cyan-400/20 px-2 py-1 rounded-full">
                {entries.length} entradas
              </span>
            </div>
            <div className="text-xs text-white/60">
              Auto-scroll activado
            </div>
          </div>
          
          {/* Transcript Content */}
          <div 
            ref={scrollRef}
            className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-400/20 scrollbar-track-transparent"
          >
            {entries.length === 0 ? (
              <div className="text-center text-white/60 py-4">
                <Icon name="MessageCircle" size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">El transcript aparecerá aquí durante la llamada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`flex-shrink-0 ${getSpeakerColor(entry.speaker)}`}>
                      <Icon name={getSpeakerIcon(entry.speaker)} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-medium ${getSpeakerColor(entry.speaker)}`}>
                          {entry.speaker === 'ai' ? 'AI Closer' : 'Lead'}
                        </span>
                        <span className="text-xs text-white/40">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptBar;

