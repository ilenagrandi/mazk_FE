import React, { useEffect, useState } from 'react';
import { AICloserState } from '../types';

interface AICloserOrbProps {
  state: AICloserState;
  className?: string;
}

const AICloserOrb = ({ state, className = '' }: AICloserOrbProps) => {
  const [pulseIntensity, setPulseIntensity] = useState(0.8);

  useEffect(() => {
    if (state.isSpeaking) {
      const interval = setInterval(() => {
        setPulseIntensity(prev => prev === 0.8 ? 1.2 : 0.8);
      }, 600);
      return () => clearInterval(interval);
    } else {
      setPulseIntensity(0.8);
    }
  }, [state.isSpeaking]);

  const getOrbStyles = () => {
    let baseClasses = "relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full transition-all duration-500 ease-out";
    
    if (state.isListening) {
      baseClasses += " shadow-[0_0_60px_rgba(34,211,238,0.6)]";
    } else if (state.isSpeaking) {
      baseClasses += " shadow-[0_0_80px_rgba(34,211,238,0.8)]";
    } else if (state.isThinking) {
      baseClasses += " shadow-[0_0_40px_rgba(34,211,238,0.4)]";
    } else {
      baseClasses += " shadow-[0_0_30px_rgba(34,211,238,0.3)]";
    }

    return baseClasses;
  };

  const getSpeakingIndicators = () => {
    if (!state.isSpeaking) return null;

    return (
      <>
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${index * 45}deg) translateY(-80px)`,
              animationDelay: `${index * 0.1}s`,
              animationDuration: '1.2s'
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Speaking Indicators */}
        {getSpeakingIndicators()}
        
        {/* Main Orb */}
        <div className={getOrbStyles()}>
          {/* Outer Glow Ring */}
          <div 
            className="absolute inset-0 rounded-full bg-cyan-400/20 animate-pulse"
            style={{
              transform: `scale(${pulseIntensity})`,
              opacity: state.brightness * 0.6
            }}
          />
          
          {/* Middle Ring */}
          <div 
            className="absolute inset-2 rounded-full bg-cyan-400/40"
            style={{
              opacity: state.brightness * 0.8,
              transform: state.isThinking ? 'rotate(360deg)' : 'none',
              transition: state.isThinking ? 'transform 3s linear infinite' : 'transform 0.5s ease-out'
            }}
          />
          
          {/* Inner Core */}
          <div 
            className="absolute inset-4 rounded-full bg-cyan-400 flex items-center justify-center"
            style={{
              opacity: state.brightness,
              transform: `scale(${state.isSpeaking ? 1.1 : 1})`
            }}
          >
            {/* Core Highlight */}
            <div className="w-8 h-8 bg-white/30 rounded-full blur-sm" />
          </div>
          
          {/* Listening Pulse */}
          {state.isListening && (
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
          )}
        </div>
        
        {/* Emotion Indicator */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="px-3 py-1 bg-black/50 rounded-full text-xs text-white/80 capitalize">
            {state.currentEmotion}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICloserOrb;

